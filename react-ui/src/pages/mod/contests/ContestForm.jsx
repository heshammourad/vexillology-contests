import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import isFuture from 'date-fns/isFuture';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import useFormState from '../../../common/useFormState';
import { ProtectedRoute, SpinnerButton } from '../../../components';
import { postData, putDataWithResponse } from '../../../data/api';
import useSwrModContest from '../../../data/useSwrModContest';
import useSwrModContestSchedule from '../../../data/useSwrModContestSchedule';
import useSwrMutation from '../../../data/useSwrMutation';

import CategoriesField from './CategoriesField';
import ConfirmDialog from './ConfirmDialog';
import FormStatusAlert from './FormStatusAlert';
import PromptField from './PromptField';
import ScheduleFields, { SCHEDULE_FIELDS } from './ScheduleFields';
import {
  getContestDate,
  getCurrentMonth,
  getDefaultMonth,
  getDuplicateLinkWarnings,
  getMonthLabel,
  getPastMonthError,
  getScheduleErrors,
  toDatetimeLocalValue,
  toIsoString,
} from './contestFormUtils';

const FIELDS = ['name', 'month', 'prompt', ...Object.keys(SCHEDULE_FIELDS)];
const LIST_PATH = '/mod/contests';

/**
 * Adds a contest (/mod/contests/new) or edits one (/mod/contests/:id/edit).
 */
function ContestForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: contest,
    error: loadError,
    isValidating: isRefreshingContest,
  } = useSwrModContest(id);
  const [fields, updateField] = useFormState(FIELDS);
  const values = Object.fromEntries(
    FIELDS.map((field) => [field, fields[field].value]),
  );
  const setValue = (field, value) => updateField(field, 'value', value);
  const [categories, setCategories] = useState([]);

  // A new contest starts from the default month and its default schedule; an existing one
  // from its saved values, once they load.
  const [loadedId, setLoadedId] = useState(null);
  const loaded = !id || loadedId === id;
  const [applyDefaultSchedule, setApplyDefaultSchedule] = useState(!id);
  const [pendingMonth, setPendingMonth] = useState(null);
  const [confirmingDuplicateLinks, setConfirmingDuplicateLinks] = useState(false);
  const [status, setStatus] = useState(null);

  const { data: monthSchedule } = useSwrModContestSchedule(values.month, id);
  const { isMutating, trigger } = useSwrMutation(
    LIST_PATH,
    id ? putDataWithResponse : postData,
    id ? `${LIST_PATH}/${id}` : LIST_PATH,
  );

  useEffect(() => {
    if (!id) {
      setValue('month', getDefaultMonth());
    }
  }, [id]);

  // SWR first returns any cached copy of the contest, then refetches it. Wait for the fresh
  // one, so the form can't start from (and save back) values from before an earlier save.
  useEffect(() => {
    if (loaded || contest.id !== id || isRefreshingContest) {
      return;
    }
    setValue('name', contest.name);
    setValue('month', contest.date.slice(0, 7));
    setValue('prompt', contest.prompt || '');
    Object.keys(SCHEDULE_FIELDS).forEach((field) => {
      setValue(field, toDatetimeLocalValue(contest[field]));
    });
    setCategories(contest.categories);
    setLoadedId(id);
  }, [contest, id, isRefreshingContest, loaded]);

  useEffect(() => {
    if (!applyDefaultSchedule || !monthSchedule.submissionStart) {
      return;
    }
    Object.keys(SCHEDULE_FIELDS).forEach((field) => {
      setValue(field, toDatetimeLocalValue(monthSchedule[field]));
    });
    setApplyDefaultSchedule(false);
  }, [monthSchedule, applyDefaultSchedule]);

  // The server only lets a contest change month (and so its id) until submissions open.
  const savedSubmissionStart = contest.submissionStart;
  const submissionsOpened = !!savedSubmissionStart && !isFuture(new Date(savedSubmissionStart));
  const scheduleErrors = getScheduleErrors(values, monthSchedule);
  // Only a move to another month has to be current or upcoming, so a contest awaiting
  // certification after its month ends can still be fixed.
  const monthChanged = values.month !== contest.date?.slice(0, 7);
  const { sameMonthContestName } = monthSchedule;
  const sameMonthError = sameMonthContestName
    ? `A contest already exists for this month: "${sameMonthContestName}".`
    : null;
  const monthError = (monthChanged && getPastMonthError(values.month)) || sameMonthError;
  const duplicateLinkWarnings = getDuplicateLinkWarnings(values.prompt);

  const handleMonthChange = (month) => {
    if (month && month !== values.month) {
      setPendingMonth(month);
    }
  };

  const changeMonth = (useDefaultSchedule) => {
    setValue('month', pendingMonth);
    setApplyDefaultSchedule(useDefaultSchedule);
    setPendingMonth(null);
  };

  const saveContest = async () => {
    setStatus(null);
    try {
      await trigger({
        name: values.name.trim(),
        date: getContestDate(values.month),
        prompt: values.prompt.trim(),
        categories: categories.map(({ category }) => category),
        ...Object.fromEntries(
          Object.keys(SCHEDULE_FIELDS).map((field) => [
            field,
            toIsoString(values[field]),
          ]),
        ),
      });
      navigate(LIST_PATH);
    } catch (err) {
      setStatus({
        severity: 'error',
        text:
          err?.response?.data || err?.message || 'Failed to save the contest.',
      });
    }
  };

  const getSubmitError = () => {
    if (FIELDS.some((field) => !values[field].trim())) {
      return 'Please fill out all required fields.';
    }
    if (Object.keys(scheduleErrors).length) {
      return 'Please fix the highlighted schedule fields.';
    }
    return monthError;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitError = getSubmitError();
    if (submitError) {
      setStatus({ severity: 'error', text: submitError });
      return;
    }
    if (duplicateLinkWarnings.length) {
      setConfirmingDuplicateLinks(true);
      return;
    }
    saveContest();
  };

  if (!loaded) {
    return (
      <ProtectedRoute>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
          {loadError ? (
            <Alert severity="error">
              {loadError.response?.data || 'Failed to load the contest.'}
            </Alert>
          ) : (
            <CircularProgress />
          )}
        </Box>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Box sx={{ maxWidth: 800, mx: 'auto', my: 3 }}>
        <Paper sx={{ p: 4 }}>
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            {id ? `Edit Contest: ${contest.name}` : 'Add New Contest'}
          </Typography>

          <FormStatusAlert status={status} />

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
          >
            <TextField
              required
              label="Contest Name"
              value={values.name}
              onChange={(e) => setValue('name', e.target.value)}
              placeholder="e.g. August 2026 Contest"
              fullWidth
            />

            <TextField
              required
              label="Month"
              type="month"
              value={values.month}
              onChange={(e) => handleMonthChange(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: getCurrentMonth() }}
              disabled={submissionsOpened}
              error={!!monthError}
              helperText={
                monthError
                || (submissionsOpened
                  ? "Can't move to another month once submissions have opened."
                  : null)
              }
              fullWidth
            />

            <PromptField
              duplicateLinkWarnings={duplicateLinkWarnings}
              value={values.prompt}
              onChange={(value) => setValue('prompt', value)}
            />

            <CategoriesField categories={categories} onChange={setCategories} />

            <Box>
              <Typography variant="h6">Schedule</Typography>
              <Typography variant="caption" color="text.secondary">
                A new month fills in the standard schedule (midnight
                America/New_York). Adjust it if this contest needs a different
                one.
              </Typography>
            </Box>
            <ScheduleFields
              values={values}
              errors={scheduleErrors}
              onChange={setValue}
            />

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2,
                mt: 2,
              }}
            >
              <Button onClick={() => navigate(LIST_PATH)}>Cancel</Button>
              <SpinnerButton
                type="submit"
                variant="contained"
                color="primary"
                submitting={isMutating}
              >
                {id ? 'Save Changes' : 'Create Contest'}
              </SpinnerButton>
            </Box>
          </Box>
        </Paper>
      </Box>

      <ConfirmDialog
        open={confirmingDuplicateLinks}
        title="Prompt may show duplicate links"
        cancelLabel="Go Back"
        confirmLabel="Save Anyway"
        onCancel={() => setConfirmingDuplicateLinks(false)}
        onConfirm={() => {
          setConfirmingDuplicateLinks(false);
          saveContest();
        }}
      >
        <Typography variant="body2">
          {`This prompt appears to contain ${duplicateLinkWarnings.join(
            ' and ',
          )}. `}
          The submission page already shows these, so they&apos;ll appear twice
          if left in the prompt. Save anyway?
        </Typography>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!pendingMonth}
        title={`Update the schedule for ${getMonthLabel(pendingMonth)}?`}
        cancelLabel="Keep Current Times"
        confirmLabel="Update Times"
        onCancel={() => changeMonth(false)}
        onConfirm={() => changeMonth(true)}
      >
        <Typography variant="body2">
          {`Use the default schedule for ${getMonthLabel(
            pendingMonth,
          )}, or keep the current times?`}
        </Typography>
      </ConfirmDialog>
    </ProtectedRoute>
  );
}

export default ContestForm;
