import AddIcon from '@mui/icons-material/Add';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import useAuthState from '../../../common/useAuthState';
import {
  FormattedContent,
  InternalLink,
  PrimaryButton,
  ProtectedRoute,
  SpinnerButton,
} from '../../../components';
import { getData, postData, putDataWithResponse } from '../../../data/api';
import useSwrModContest from '../../../data/useSwrModContest';

/**
 * Calculates the default contest month:
 * - If today's day of month > 7: upcoming month
 * - Otherwise: current month
 */
const getDefaultMonth = (now = new Date()) => {
  const day = now.getDate();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed
  if (day > 7) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return `${year}-${String(month + 1).padStart(2, '0')}`;
};

// Contests always run from the 1st of their month.
const getFullDate = (month) => `${month}-01`;

const getMonthLabel = (month) => (month ? format(parseISO(getFullDate(month)), 'MMMM yyyy') : '');

const getCurrentMonth = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

// "YYYY-MM" strings compare correctly as plain strings.
const getPastMonthError = (month) => (month && month < getCurrentMonth()
  ? 'Contest month cannot be in the past.'
  : null);

// Converts a server-returned ISO timestamp into the local "YYYY-MM-DDTHH:mm" string a
// datetime-local input expects.
const toDatetimeLocalValue = (isoString) => {
  if (!isoString) {
    return '';
  }
  const date = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Inverse of toDatetimeLocalValue. A datetime-local input's value has no timezone info, so
// sending it to the server as-is would let it get reinterpreted using the database session's
// timezone instead of the browser's - converting it to a real UTC-aware ISO string here keeps
// what the moderator sees as what actually gets stored.
const toUtcIsoString = (localValue) => (localValue ? new Date(localValue).toISOString() : '');

const getErrorText = (err, fallback) => err?.response?.data || err?.message || fallback;

// Fetches the default schedule/bounds for a month, and (via excludeId) whether another
// contest already occupies it.
const fetchMonthSchedule = (month, authTokens, excludeId) => {
  const query = excludeId
    ? `date=${getFullDate(month)}&excludeId=${excludeId}`
    : `date=${getFullDate(month)}`;
  return getData(`/mod/contestSchedule?${query}`, authTokens);
};

// Checks that the submission/vote windows are in a sensible chronological order and (when
// month bounds are known) that submission end, vote start, and vote end fall within the
// selected month in ET. Submission start is exempt from the month-range check - it's normal
// for submissions to open before the month starts - but it still can't reach back into the
// previous contest's own submission/voting window. Returns a map of field -> message.
const getFieldErrors = ({
  monthStart,
  monthEnd,
  submissionStart,
  submissionEnd,
  voteStart,
  voteEnd,
  previousContestVoteEnd,
  previousContestName,
}) => {
  const errors = {};
  const start = submissionStart && new Date(submissionStart);
  const end = submissionEnd && new Date(submissionEnd);
  const voteStartDate = voteStart && new Date(voteStart);
  const voteEndDate = voteEnd && new Date(voteEnd);
  const monthStartDate = monthStart && new Date(monthStart);
  const monthEndDate = monthEnd && new Date(monthEnd);
  const previousVoteEndDate = previousContestVoteEnd && new Date(previousContestVoteEnd);
  const isInMonth = (value) => !monthStartDate
    || !monthEndDate
    || (value >= monthStartDate && value < monthEndDate);

  if (start && previousVoteEndDate && start < previousVoteEndDate) {
    errors.submissionStart = `Can't be before "${previousContestName}"'s voting window ends.`;
  }

  if (start && end && start >= end) {
    errors.submissionEnd = 'Must be after submission start.';
  } else if (end && !isInMonth(end)) {
    errors.submissionEnd = 'Must fall within the selected month.';
  }

  if (end && voteStartDate && voteStartDate < end) {
    errors.voteStart = 'Must not be before submission end.';
  } else if (voteStartDate && !isInMonth(voteStartDate)) {
    errors.voteStart = 'Must fall within the selected month.';
  }

  if (voteStartDate && voteEndDate && voteStartDate >= voteEndDate) {
    errors.voteEnd = 'Must be after vote start.';
  } else if (voteEndDate && !isInMonth(voteEndDate)) {
    errors.voteEnd = 'Must fall within the selected month.';
  }

  return errors;
};

const MARKDOWN_LINK_PATTERN = /\[([^\]]*)\]\(([^)]+)\)/g;
const SUBMISSION_URL_PATTERN = /vexillologycontests\.com\/submission\b|(?:^|["'(\s])\/submission\b/i;
// The imgur post the rules are usually linked to (lm0yPy7), plus our own rules page - matched
// by URL rather than link text, since a prompt could plausibly mention "rules" for other reasons.
const RULES_URL_PATTERN = /imgur\.com\/(?:a\/)?lm0yPy7\b|\/submission\/rules\b/i;

// Reddit-authored prompts are often copy-pasted in along with things the site already
// shows automatically below the prompt (a rules link, and repeated links back to this
// same submission page) - flag those so a moderator doesn't end up showing them twice.
const getPromptWarnings = (prompt) => {
  let hasRulesLink = false;
  let hasSubmissionLink = false;

  const matches = prompt.matchAll(MARKDOWN_LINK_PATTERN);
  Array.from(matches).forEach(([, , url]) => {
    if (RULES_URL_PATTERN.test(url)) {
      hasRulesLink = true;
    }
    if (SUBMISSION_URL_PATTERN.test(url)) {
      hasSubmissionLink = true;
    }
  });

  const warnings = [];
  if (hasRulesLink) {
    warnings.push('a link to the contest rules');
  }
  if (hasSubmissionLink) {
    warnings.push('a link to the submission page');
  }
  return warnings;
};

function ContestFormLayout({
  title, statusMessage, onSubmit, children,
}) {
  const statusMessageRef = useRef(null);

  useEffect(() => {
    if (statusMessage) {
      statusMessageRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [statusMessage]);

  return (
    <ProtectedRoute>
      <Box sx={{ maxWidth: 800, mx: 'auto', my: 3 }}>
        <Paper sx={{ p: 4 }}>
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            {title}
          </Typography>

          {statusMessage && (
            <Alert
              ref={statusMessageRef}
              severity={statusMessage.severity}
              sx={{ mb: 3 }}
            >
              {statusMessage.text}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={onSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
          >
            {children}
          </Box>
        </Paper>
      </Box>
    </ProtectedRoute>
  );
}

ContestFormLayout.propTypes = {
  title: PropTypes.string.isRequired,
  statusMessage: PropTypes.shape({
    severity: PropTypes.string,
    text: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

ContestFormLayout.defaultProps = {
  statusMessage: null,
};

function TimestampFields({
  submissionStart,
  setSubmissionStart,
  submissionEnd,
  setSubmissionEnd,
  voteStart,
  setVoteStart,
  voteEnd,
  setVoteEnd,
  errors,
  required,
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 2,
      }}
    >
      <TextField
        required={required}
        label="Submission Start"
        type="datetime-local"
        value={submissionStart}
        onChange={(e) => setSubmissionStart(e.target.value)}
        InputLabelProps={{ shrink: true }}
        error={!!errors.submissionStart}
        helperText={errors.submissionStart}
        InputProps={
          errors.submissionStart
            ? {
              endAdornment: (
                <ErrorOutlineIcon color="error" fontSize="small" />
              ),
            }
            : undefined
        }
        fullWidth
      />
      <TextField
        required={required}
        label="Submission End"
        type="datetime-local"
        value={submissionEnd}
        onChange={(e) => setSubmissionEnd(e.target.value)}
        InputLabelProps={{ shrink: true }}
        error={!!errors.submissionEnd}
        helperText={errors.submissionEnd}
        InputProps={
          errors.submissionEnd
            ? {
              endAdornment: (
                <ErrorOutlineIcon color="error" fontSize="small" />
              ),
            }
            : undefined
        }
        fullWidth
      />
      <TextField
        required={required}
        label="Vote Start"
        type="datetime-local"
        value={voteStart}
        onChange={(e) => setVoteStart(e.target.value)}
        InputLabelProps={{ shrink: true }}
        error={!!errors.voteStart}
        helperText={errors.voteStart}
        InputProps={
          errors.voteStart
            ? {
              endAdornment: (
                <ErrorOutlineIcon color="error" fontSize="small" />
              ),
            }
            : undefined
        }
        fullWidth
      />
      <TextField
        required={required}
        label="Vote End"
        type="datetime-local"
        value={voteEnd}
        onChange={(e) => setVoteEnd(e.target.value)}
        InputLabelProps={{ shrink: true }}
        error={!!errors.voteEnd}
        helperText={errors.voteEnd}
        InputProps={
          errors.voteEnd
            ? {
              endAdornment: (
                <ErrorOutlineIcon color="error" fontSize="small" />
              ),
            }
            : undefined
        }
        fullWidth
      />
    </Box>
  );
}

TimestampFields.propTypes = {
  submissionStart: PropTypes.string.isRequired,
  setSubmissionStart: PropTypes.func.isRequired,
  submissionEnd: PropTypes.string.isRequired,
  setSubmissionEnd: PropTypes.func.isRequired,
  voteStart: PropTypes.string.isRequired,
  setVoteStart: PropTypes.func.isRequired,
  voteEnd: PropTypes.string.isRequired,
  setVoteEnd: PropTypes.func.isRequired,
  errors: PropTypes.shape({
    submissionStart: PropTypes.string,
    submissionEnd: PropTypes.string,
    voteStart: PropTypes.string,
    voteEnd: PropTypes.string,
  }),
  required: PropTypes.bool,
};

TimestampFields.defaultProps = {
  errors: {},
  required: false,
};

function PromptField({ prompt, setPrompt }) {
  const warnings = getPromptWarnings(prompt);

  return (
    <Box>
      <TextField
        required
        label="Prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        multiline
        rows={4}
        placeholder="Enter contest prompt or theme..."
        helperText="Supports Reddit markdown."
        fullWidth
      />
      {warnings.length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          This prompt appears to contain
          {' '}
          {warnings.join(' and ')}
          . Both are
          already shown automatically on the submission page (see the preview
          below) - consider removing them from the prompt text so they
          don&apos;t show up twice.
        </Alert>
      )}
      {prompt.trim() && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Preview
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <FormattedContent content={prompt} isMarkdown />
            {/* Always shown below the prompt on the submission page - included here so
                moderators don't duplicate it in the prompt text itself. */}
            <InternalLink to="/submission/rules">
              <Typography component="span" variant="h6">
                Please read the contest rules in full before submitting.
              </Typography>
            </InternalLink>
          </Paper>
        </Box>
      )}
    </Box>
  );
}

PromptField.propTypes = {
  prompt: PropTypes.string.isRequired,
  setPrompt: PropTypes.func.isRequired,
};

function PromptWarningDialog({
  open, warnings, onCancel, onConfirm,
}) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>Prompt may show duplicate links</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          This prompt appears to contain
          {' '}
          {warnings.join(' and ')}
          . These are
          already shown automatically on the submission page, so they&apos;ll
          appear twice if left in the prompt text. Submit anyway?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Go Back</Button>
        <PrimaryButton onClick={onConfirm}>Submit Anyway</PrimaryButton>
      </DialogActions>
    </Dialog>
  );
}

PromptWarningDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  warnings: PropTypes.arrayOf(PropTypes.string).isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

function ScheduleUpdateDialog({
  open, monthLabel, onKeepTimes, onUpdateTimes,
}) {
  return (
    <Dialog open={open} onClose={onKeepTimes}>
      <DialogTitle>
        Update the schedule for
        {monthLabel}
        ?
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          You changed the month. Update the submission and voting window to the
          default schedule for
          {' '}
          {monthLabel}
          , or keep the current times as they
          are?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onKeepTimes}>Keep Current Times</Button>
        <PrimaryButton onClick={onUpdateTimes}>Update Times</PrimaryButton>
      </DialogActions>
    </Dialog>
  );
}

ScheduleUpdateDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  monthLabel: PropTypes.string.isRequired,
  onKeepTimes: PropTypes.func.isRequired,
  onUpdateTimes: PropTypes.func.isRequired,
};

function CreateContestForm() {
  const [{ authTokens }] = useAuthState();
  const navigate = useNavigate();

  const [month, setMonth] = useState(() => getDefaultMonth());
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [categoriesText, setCategoriesText] = useState('');

  const [submissionStart, setSubmissionStart] = useState('');
  const [submissionEnd, setSubmissionEnd] = useState('');
  const [voteStart, setVoteStart] = useState('');
  const [voteEnd, setVoteEnd] = useState('');

  const [monthBounds, setMonthBounds] = useState({
    monthStart: null,
    monthEnd: null,
  });
  const [monthConflict, setMonthConflict] = useState(null);
  const [previousContest, setPreviousContest] = useState({
    name: null,
    voteEnd: null,
  });
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [pendingMonth, setPendingMonth] = useState(null);
  const initializedRef = useRef(false);

  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const applyMonthSchedule = async (monthValue, { overwriteTimes }) => {
    try {
      const schedule = await fetchMonthSchedule(monthValue, authTokens);
      setMonthBounds({
        monthStart: schedule.monthStart,
        monthEnd: schedule.monthEnd,
      });
      setMonthConflict(schedule.existingContestName || null);
      setPreviousContest({
        name: schedule.previousContestName || null,
        voteEnd: schedule.previousContestVoteEnd || null,
      });
      if (overwriteTimes) {
        setSubmissionStart(toDatetimeLocalValue(schedule.submissionStart));
        setSubmissionEnd(toDatetimeLocalValue(schedule.submissionEnd));
        setVoteStart(toDatetimeLocalValue(schedule.voteStart));
        setVoteEnd(toDatetimeLocalValue(schedule.voteEnd));
      }
    } catch (err) {
      // Ignore - moderator can still fill in timestamps manually.
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await applyMonthSchedule(month, { overwriteTimes: true });
      if (!cancelled) {
        initializedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
    // Mount-only: subsequent month changes go through handleMonthChange instead.
  }, []);

  const handleMonthChange = (newMonth) => {
    if (!newMonth || newMonth === month) {
      return;
    }
    if (!initializedRef.current) {
      setMonth(newMonth);
      applyMonthSchedule(newMonth, { overwriteTimes: true });
      return;
    }
    setPendingMonth(newMonth);
    setScheduleDialogOpen(true);
  };

  const handleKeepTimes = () => {
    setMonth(pendingMonth);
    applyMonthSchedule(pendingMonth, { overwriteTimes: false });
    setScheduleDialogOpen(false);
    setPendingMonth(null);
  };

  const handleUpdateTimes = () => {
    setMonth(pendingMonth);
    applyMonthSchedule(pendingMonth, { overwriteTimes: true });
    setScheduleDialogOpen(false);
    setPendingMonth(null);
  };

  const fieldErrors = getFieldErrors({
    ...monthBounds,
    submissionStart,
    submissionEnd,
    voteStart,
    voteEnd,
    previousContestVoteEnd: previousContest.voteEnd,
    previousContestName: previousContest.name,
  });
  const monthErrorMessage = getPastMonthError(month)
    || (monthConflict
      ? `A contest already exists for this month: "${monthConflict}".`
      : null);

  const submitContest = async () => {
    setSubmitting(true);
    setStatusMessage(null);

    const categories = categoriesText
      .split('\n')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const payload = {
      categories: categories.length ? categories : null,
      date: getFullDate(month),
      name: name.trim(),
      prompt: prompt.trim(),
      submissionEnd: toUtcIsoString(submissionEnd) || null,
      submissionStart: toUtcIsoString(submissionStart) || null,
      voteEnd: toUtcIsoString(voteEnd) || null,
      voteStart: toUtcIsoString(voteStart) || null,
    };

    try {
      const response = await postData('/mod/contests', payload, authTokens);
      if (response && (response.status === 200 || response.status === 201)) {
        navigate('/mod/contests');
        return;
      }
      setStatusMessage({
        severity: 'error',
        text: response?.data || 'Failed to create contest. Check server logs.',
      });
    } catch (err) {
      setStatusMessage({
        severity: 'error',
        text: getErrorText(err, 'An error occurred while creating contest.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }

    if (!name.trim() || !month || !prompt.trim()) {
      setStatusMessage({
        severity: 'error',
        text: 'Please fill out all required fields (Contest Name, Month, and Prompt).',
      });
      return;
    }

    if (Object.keys(fieldErrors).length) {
      setStatusMessage({
        severity: 'error',
        text: 'Please fix the highlighted schedule fields.',
      });
      return;
    }

    if (monthErrorMessage) {
      setStatusMessage({ severity: 'error', text: monthErrorMessage });
      return;
    }

    if (getPromptWarnings(prompt).length) {
      setConfirmOpen(true);
      return;
    }

    submitContest();
  };

  const handleConfirmSubmit = () => {
    setConfirmOpen(false);
    submitContest();
  };

  return (
    <ContestFormLayout
      title="Add New Contest"
      statusMessage={statusMessage}
      onSubmit={handleSubmit}
    >
      <TextField
        required
        label="Contest Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. August 2026 Contest"
        fullWidth
      />

      <TextField
        required
        label="Month"
        type="month"
        value={month}
        onChange={(e) => handleMonthChange(e.target.value)}
        InputLabelProps={{ shrink: true }}
        inputProps={{ min: getCurrentMonth() }}
        error={!!monthErrorMessage}
        helperText={monthErrorMessage}
        fullWidth
      />

      <PromptField prompt={prompt} setPrompt={setPrompt} />

      <TextField
        label="Categories (One per line)"
        value={categoriesText}
        onChange={(e) => setCategoriesText(e.target.value)}
        multiline
        rows={4}
        placeholder="Category 1&#10;Category 2, with commas&#10;Category 3"
        helperText="One category per line. Can contain commas."
        fullWidth
      />

      <Typography variant="h6" sx={{ mt: 1 }}>
        Timestamps
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Auto-filled with the standard schedule (America/New_York 12:00 AM
        EST/EDT) for the selected month. Adjust if this contest needs a
        different schedule.
      </Typography>

      <TimestampFields
        {...{
          submissionStart,
          setSubmissionStart,
          submissionEnd,
          setSubmissionEnd,
          voteStart,
          setVoteStart,
          voteEnd,
          setVoteEnd,
        }}
        errors={fieldErrors}
      />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
          mt: 2,
        }}
      >
        <Button onClick={() => navigate('/mod/contests')}>Cancel</Button>
        <SpinnerButton
          type="submit"
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          submitting={submitting}
        >
          Create Contest
        </SpinnerButton>
      </Box>

      <PromptWarningDialog
        open={confirmOpen}
        warnings={getPromptWarnings(prompt)}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
      />

      <ScheduleUpdateDialog
        open={scheduleDialogOpen}
        monthLabel={getMonthLabel(pendingMonth)}
        onKeepTimes={handleKeepTimes}
        onUpdateTimes={handleUpdateTimes}
      />
    </ContestFormLayout>
  );
}

function EditContestForm({ id }) {
  const [{ authTokens }] = useAuthState();
  const navigate = useNavigate();
  const { data, isLoading } = useSwrModContest(id);

  const [initialized, setInitialized] = useState(false);
  const [name, setName] = useState('');
  const [month, setMonth] = useState('');
  const [prompt, setPrompt] = useState('');
  const [submissionStart, setSubmissionStart] = useState('');
  const [submissionEnd, setSubmissionEnd] = useState('');
  const [voteStart, setVoteStart] = useState('');
  const [voteEnd, setVoteEnd] = useState('');
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');

  const [monthBounds, setMonthBounds] = useState({
    monthStart: null,
    monthEnd: null,
  });
  const [monthConflict, setMonthConflict] = useState(null);
  const [previousContest, setPreviousContest] = useState({
    name: null,
    voteEnd: null,
  });
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [pendingMonth, setPendingMonth] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const applyMonthSchedule = async (monthValue, { overwriteTimes }) => {
    try {
      const schedule = await fetchMonthSchedule(monthValue, authTokens, id);
      setMonthBounds({
        monthStart: schedule.monthStart,
        monthEnd: schedule.monthEnd,
      });
      setMonthConflict(schedule.existingContestName || null);
      setPreviousContest({
        name: schedule.previousContestName || null,
        voteEnd: schedule.previousContestVoteEnd || null,
      });
      if (overwriteTimes) {
        setSubmissionStart(toDatetimeLocalValue(schedule.submissionStart));
        setSubmissionEnd(toDatetimeLocalValue(schedule.submissionEnd));
        setVoteStart(toDatetimeLocalValue(schedule.voteStart));
        setVoteEnd(toDatetimeLocalValue(schedule.voteEnd));
      }
    } catch (err) {
      // Ignore - moderator can still fill in / verify the schedule manually.
    }
  };

  useEffect(() => {
    if (initialized || !data?.id) {
      return;
    }
    setName(data.name || '');
    const initialMonth = data.date ? data.date.slice(0, 7) : '';
    setMonth(initialMonth);
    setPrompt(data.prompt || '');
    setSubmissionStart(toDatetimeLocalValue(data.submissionStart));
    setSubmissionEnd(toDatetimeLocalValue(data.submissionEnd));
    setVoteStart(toDatetimeLocalValue(data.voteStart));
    setVoteEnd(toDatetimeLocalValue(data.voteEnd));
    setCategories(data.categories || []);
    setInitialized(true);
    if (initialMonth) {
      applyMonthSchedule(initialMonth, { overwriteTimes: false });
    }
    // Only run once, when the contest data first arrives.
  }, [data, initialized]);

  const handleRemoveCategory = (category) => {
    setCategories((prev) => prev.filter((c) => c.category !== category));
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed || categories.some((c) => c.category === trimmed)) {
      return;
    }
    setCategories((prev) => [...prev, { category: trimmed, used: false }]);
    setNewCategory('');
  };

  const handleMonthChange = (newMonth) => {
    if (!newMonth || newMonth === month) {
      return;
    }
    setPendingMonth(newMonth);
    setScheduleDialogOpen(true);
  };

  const handleKeepTimes = () => {
    setMonth(pendingMonth);
    applyMonthSchedule(pendingMonth, { overwriteTimes: false });
    setScheduleDialogOpen(false);
    setPendingMonth(null);
  };

  const handleUpdateTimes = () => {
    setMonth(pendingMonth);
    applyMonthSchedule(pendingMonth, { overwriteTimes: true });
    setScheduleDialogOpen(false);
    setPendingMonth(null);
  };

  const fieldErrors = getFieldErrors({
    ...monthBounds,
    submissionStart,
    submissionEnd,
    voteStart,
    voteEnd,
    previousContestVoteEnd: previousContest.voteEnd,
    previousContestName: previousContest.name,
  });
  const monthErrorMessage = getPastMonthError(month)
    || (monthConflict
      ? `A contest already exists for this month: "${monthConflict}".`
      : null);

  const submitContest = async () => {
    setSubmitting(true);
    setStatusMessage(null);

    const payload = {
      name: name.trim(),
      date: getFullDate(month),
      prompt: prompt.trim(),
      submissionStart: toUtcIsoString(submissionStart),
      submissionEnd: toUtcIsoString(submissionEnd),
      voteStart: toUtcIsoString(voteStart),
      voteEnd: toUtcIsoString(voteEnd),
      categories: categories.map(({ category }) => category),
    };

    try {
      const response = await putDataWithResponse(
        `/mod/contests/${id}`,
        payload,
        authTokens,
      );
      if (response && (response.status === 200 || response.status === 201)) {
        navigate('/mod/contests');
        return;
      }
      setStatusMessage({
        severity: 'error',
        text: response?.data || 'Failed to update contest. Check server logs.',
      });
    } catch (err) {
      setStatusMessage({
        severity: 'error',
        text: getErrorText(err, 'An error occurred while updating contest.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }

    if (
      !name.trim()
      || !month
      || !prompt.trim()
      || !submissionStart
      || !submissionEnd
      || !voteStart
      || !voteEnd
    ) {
      setStatusMessage({
        severity: 'error',
        text: 'Please fill out all required fields.',
      });
      return;
    }

    if (Object.keys(fieldErrors).length) {
      setStatusMessage({
        severity: 'error',
        text: 'Please fix the highlighted schedule fields.',
      });
      return;
    }

    if (monthErrorMessage) {
      setStatusMessage({ severity: 'error', text: monthErrorMessage });
      return;
    }

    if (getPromptWarnings(prompt).length) {
      setConfirmOpen(true);
      return;
    }

    submitContest();
  };

  const handleConfirmSubmit = () => {
    setConfirmOpen(false);
    submitContest();
  };

  if (isLoading && !initialized) {
    return (
      <ProtectedRoute>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
          <CircularProgress />
        </Box>
      </ProtectedRoute>
    );
  }

  return (
    <ContestFormLayout
      title={`Edit Contest${data.name ? `: ${data.name}` : ''}`}
      statusMessage={statusMessage}
      onSubmit={handleSubmit}
    >
      <TextField
        required
        label="Contest Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
      />

      <TextField
        required
        label="Month"
        type="month"
        value={month}
        onChange={(e) => handleMonthChange(e.target.value)}
        InputLabelProps={{ shrink: true }}
        inputProps={{ min: getCurrentMonth() }}
        error={!!monthErrorMessage}
        helperText={monthErrorMessage}
        fullWidth
      />

      <PromptField prompt={prompt} setPrompt={setPrompt} />

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Categories
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
          {categories.map(({ category, used }) => (used ? (
            <Tooltip
              key={category}
              title="Can't remove: already used in a submission"
            >
              <Chip label={category} />
            </Tooltip>
          ) : (
            <Chip
              key={category}
              label={category}
              onDelete={() => handleRemoveCategory(category)}
            />
          )))}
        </Stack>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="New Category"
            size="small"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCategory();
              }
            }}
          />
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddCategory}
          >
            Add
          </Button>
        </Box>
      </Box>

      <Typography variant="h6" sx={{ mt: 1 }}>
        Timestamps
      </Typography>

      <TimestampFields
        {...{
          submissionStart,
          setSubmissionStart,
          submissionEnd,
          setSubmissionEnd,
          voteStart,
          setVoteStart,
          voteEnd,
          setVoteEnd,
        }}
        errors={fieldErrors}
        required
      />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
          mt: 2,
        }}
      >
        <Button onClick={() => navigate('/mod/contests')}>Cancel</Button>
        <SpinnerButton
          type="submit"
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          submitting={submitting}
        >
          Save Changes
        </SpinnerButton>
      </Box>

      <PromptWarningDialog
        open={confirmOpen}
        warnings={getPromptWarnings(prompt)}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
      />

      <ScheduleUpdateDialog
        open={scheduleDialogOpen}
        monthLabel={getMonthLabel(pendingMonth)}
        onKeepTimes={handleKeepTimes}
        onUpdateTimes={handleUpdateTimes}
      />
    </ContestFormLayout>
  );
}

EditContestForm.propTypes = {
  id: PropTypes.string.isRequired,
};

function ContestForm() {
  const { id } = useParams();
  return id ? <EditContestForm id={id} /> : <CreateContestForm />;
}

export default ContestForm;
