/**
 * Users: Check submission status
 * Mod: review and approval
 */

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import UndoIcon from '@mui/icons-material/Undo';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import makeStyles from '@mui/styles/makeStyles';
import withStyles from '@mui/styles/withStyles';
import clsx from 'clsx';
import format from 'date-fns/format';
import isToday from 'date-fns/isToday';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

import { putData } from '../api';
import { useFormState, useSnackbarState, useSwrMutation } from '../common';
import snackbarTypes from '../common/snackbarTypes';
import types from '../common/types';

import Fieldset from './Fieldset';
import RedditMarkdown from './RedditMarkdown';
import RedditUserAttribution from './RedditUserAttribution';
import SpinnerButton from './SpinnerButton';

const useStyles = makeStyles((theme) => ({
  actions: {
    flexShrink: 0,
  },
  description: {
    maxHeight: 300,
    overflowY: 'auto',
  },
  entryName: {
    width: 172,
    [theme.breakpoints.up('md')]: {
      width: 200,
    },
  },
  expandedImage: {
    maxHeight: 300,
    maxWidth: '100%',
  },
  expandedRow: {
    margin: '0 16px 16px 16px',
  },
  expandedTableRow: {
    padding: 0,
  },
  expandIconCell: {
    width: 48,
  },
  fields: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: theme.spacing(1),
  },
  image: {
    maxHeight: 50,
  },
  imageContainer: {
    height: 50,
  },
  mainRow: {
    '& > *': {
      borderBottom: 'unset',
    },
  },
  modifiedBy: {
    fontStyle: 'italic',
  },
  previewImage: {
    width: 140,
    [theme.breakpoints.down('sm')]: {
      padding: 0,
      width: 0,
    },
  },
  statusChip: {
    textTransform: 'capitalize',
    '&$approved': {
      backgroundColor: theme.palette.success.light,
    },
    '&$pending': {
      backgroundColor: theme.palette.warning.light,
    },
    '&$rejected': {
      backgroundColor: theme.palette.error.light,
    },
  },
  statusChipCell: {
    width: 114,
  },
  submissionStatus: {
    fontWeight: 'bold',
  },
  submissionTime: {
    whiteSpace: 'nowrap',
    width: 72,
    [theme.breakpoints.down('md')]: {
      padding: 0,
      width: 0,
    },
  },
  usernameCell: {
    whiteSpace: 'nowrap',
    width: 172,
    [theme.breakpoints.down('md')]: {
      padding: 0,
      width: 0,
    },
  },
  // Dummy classes
  /* eslint-disable mui-unused-classes/unused-classes */
  approved: {},
  pending: {},
  rejected: {},
  /* eslint-enable mui-unused-classes/unused-classes */
}));

const EntryActionButton = withStyles((theme) => ({
  root: {
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
    flexBasis: '50%',
    flexGrow: 1,
    '&.Mui-disabled': {
      borderColor: theme.palette.grey[300],
    },
    '&.Mui-selected:not(.Mui-disabled)': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.common.white,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
    },
    '&:hover': {
      backgroundColor: '#fce9e7',
    },
  },
}))(ToggleButton);

const getSubmissionTimeDisplay = (time) => {
  try {
    const date = new Date(time);
    const formatPattern = isToday(date) ? 'h:mm a' : 'MMM d';
    return format(date, formatPattern);
  } catch (e) {
    return null;
  }
};

const updateSubmissions = (currentData, response) => {
  const newData = {
    ...currentData,
    submissions: currentData.submissions.reduce((acc, cur) => {
      if (cur.id !== response.id) {
        acc.push(cur);
      } else {
        acc.push({ ...cur, ...response });
      }
      return acc;
    }, []),
  };

  if (currentData.userBreakdown) {
    const { submissionStatus, user } = currentData.submissions.find(({ id }) => id === response.id);
    let difference = 0;
    if (submissionStatus !== 'approved' && response.submissionStatus === 'approved') {
      difference = 1;
    } else if (submissionStatus === 'approved' && response.submissionStatus !== 'approved') {
      difference = -1;
    }
    let { userBreakdown } = currentData;
    if (difference) {
      const changedUserBreakdown = userBreakdown[user];
      const approved = (changedUserBreakdown.approved ?? 0) + difference;
      userBreakdown = { ...userBreakdown, [user]: { ...changedUserBreakdown, approved } };
    }

    newData.userBreakdown = userBreakdown;
  }

  return newData;
};

/**
 * A table row containing information about a user submission for a contest. Used both by users to
 * see their own submissions, and by moderators to review submissions.
 *
 * @param props
 * @param {boolean} props.moderator - Whether to display to a moderator or a regular user. Affects
 *  whether moderator controls are displayed.
 * @param {string} [props.submission.category]
 * @param {string} props.submission.description
 * @param {id} props.submission.id
 * @param {string} props.submission.imagePath - URL path of the submission image
 * @param {string} [props.submission.modifiedBy] - The moderator who last modified the submission
 *  status.
 * @param {string} props.submission.name
 * @param {string} [props.submission.rejectionReason] - The reason provided by the moderator when
 *  setting the status to rejected.
 * @param {string} [props.submission.submissionStatus] - One of `pending`, `approved`, or
 *  `rejected`.
 * @param {string} [props.submission.submissionTime]
 * @param {string} [props.submission.user] - Username of the submitter.
 * @param {number} [props.userBreakdown.approved] - Number of approved entries by the submitting
 *  user.
 * @param {number} [props.userBreakdown.submitted] - Number of submitted entries by the submitting
 *  user.
 */
function SubmissionRow({
  moderator,
  submission: {
    category,
    description,
    id,
    imagePath,
    modifiedBy,
    name: entryName,
    rejectionReason,
    submissionStatus,
    submissionTime,
    user,
  },
  userBreakdown: { approved, submitted },
}) {
  const { isMutating: isMutatingReview, trigger: triggerReview } = useSwrMutation(
    '/mod/reviewSubmissions',
    putData,
  );
  const { isMutating: isMutatingUser, trigger: triggerUser } = useSwrMutation(
    '/submission',
    putData,
  );
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(null);
  const [formState, updateFormState, resetFormState] = useFormState(['reason']);
  const updateSnackbarState = useSnackbarState();

  const classes = useStyles();
  const theme = useTheme();

  useEffect(() => {
    setAction(submissionStatus === 'approved' ? 'pending' : 'approved');
  }, [submissionStatus]);

  useEffect(() => {
    resetFormState();
    updateFormState('reason', 'value', rejectionReason);
  }, [rejectionReason]);

  const actionRejected = action === 'rejected';
  const submissionRejected = submissionStatus === 'rejected';
  const submissionWithdrawn = submissionStatus === 'withdrawn';

  const validateForm = (value, forceValidate = false) => {
    const actualValue = value ?? formState.reason.value;
    const message = !actualValue && actionRejected ? 'Rejection reason is required' : '';
    if (forceValidate || formState.reason.touch) {
      updateFormState('reason', 'error', message);
    }
    return !message;
  };

  useEffect(() => {
    validateForm();
  }, [action]);

  const handleExpandClick = () => {
    setOpen(!open);
  };

  const handleActionChange = (e, newAction) => {
    if (newAction) {
      setAction(newAction);
    }
  };

  const handleFieldChange = ({ target: { name, value } }) => {
    updateFormState(name, 'touch', true);
    updateFormState(name, 'value', value);
    validateForm(value);
  };

  const showError = () => {
    updateSnackbarState(snackbarTypes.REVIEW_SUBMISSION_ERROR);
  };

  const triggerOptions = {
    revalidate: false,
    populateCache: (response, data) => {
      if (!response) {
        showError();
        return data;
      }

      setOpen(false);
      updateSnackbarState(snackbarTypes.REVIEW_SUBMISSION_SUCCESS);

      return updateSubmissions(data, response);
    },
    onError: showError,
  };

  const moderatorSubmit = () => {
    const validForm = validateForm(null, true);
    if (!validForm) {
      return;
    }

    const body = { id, rejectionReason: formState.reason.value, status: action };
    triggerReview(body, triggerOptions);
  };

  const userSubmit = () => {
    const body = { id, submissionStatus: submissionWithdrawn ? 'pending' : 'withdrawn' };
    triggerUser(body, triggerOptions);
  };

  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isSmBreakpoint = useMediaQuery(theme.breakpoints.only('sm'));
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));

  const redditUserAttribution = <RedditUserAttribution showUsernameOnly user={user} />;
  const fields = (
    <>
      {category && (
        <div>
          <Typography component="div" variant="subtitle2">
            Category
          </Typography>
          {category}
        </div>
      )}
      {moderator && (
        <div>
          <Typography component="div" variant="subtitle2">
            Username
          </Typography>
          {redditUserAttribution}
        </div>
      )}
      <div>
        <Typography component="div" variant="subtitle2">
          Description
        </Typography>
        <div className={classes.description}>
          <RedditMarkdown text={description} />
        </div>
      </div>
      {!moderator && submissionRejected && (
        <div>
          <Typography component="div" variant="subtitle2">
            Rejection Reason
          </Typography>
          {formState.reason.value}
        </div>
      )}
    </>
  );

  const getNonPendingEntryActionButton = () => {
    let label;
    switch (submissionStatus) {
      case 'approved':
        label = 'Unapprove';
        break;
      case 'rejected':
        label = 'Unreject';
        break;
      default:
        return null;
    }
    return (
      <EntryActionButton aria-label={`${label} entry`} value="pending">
        <UndoIcon fontSize="small" />
        &nbsp;
        {label}
      </EntryActionButton>
    );
  };

  const getSubmitAlert = () => {
    let message;
    let severity;
    if (approved >= 2) {
      message = 'This user already has 2 or more approved entries!';
      severity = 'error';
    } else if (submitted > 2) {
      message = 'This user has more than 2 submissions.';
      severity = 'warning';
    }
    return message ? <Alert severity={severity}>{message}</Alert> : null;
  };

  const dropFields = moderator && isSmBreakpoint;

  return (
    <>
      <TableRow className={classes.mainRow}>
        <TableCell className={classes.entryName}>
          <Typography component="span" variant="subtitle2">
            {entryName}
          </Typography>
        </TableCell>
        <TableCell className={classes.usernameCell}>
          {moderator && !open && isMdUp && redditUserAttribution}
        </TableCell>
        <TableCell align="center" className={classes.previewImage}>
          {isSmUp && (
            <div className={classes.imageContainer}>
              {!open && <img className={classes.image} alt="" src={imagePath} />}
            </div>
          )}
        </TableCell>
        <TableCell align="center" className={classes.submissionTime}>
          {isMdUp && getSubmissionTimeDisplay(submissionTime)}
        </TableCell>
        <TableCell align="center" className={classes.statusChipCell}>
          <Chip
            className={clsx(classes.statusChip, classes[submissionStatus])}
            label={submissionStatus}
            size="small"
          />
        </TableCell>
        <TableCell align="right" className={classes.expandIconCell}>
          <IconButton aria-label="expand row" size="small" onClick={handleExpandClick}>
            {open ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell className={classes.expandedTableRow} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit className={classes.expandedRow}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <img className={classes.expandedImage} alt="" src={imagePath} />
                {dropFields && fields}
              </Grid>
              {!dropFields && (
                <Grid item xs={12} sm={6} md={4} className={classes.fields}>
                  {fields}
                </Grid>
              )}
              <Grid item xs={12} sm={6} md={4}>
                <Fieldset className={classes.actions}>
                  {moderator ? (
                    <>
                      <ToggleButtonGroup
                        aria-label="review action"
                        exclusive
                        onChange={handleActionChange}
                        value={action}
                      >
                        {submissionStatus !== 'approved' && (
                          <EntryActionButton
                            aria-label="approve entry"
                            disabled={submissionWithdrawn}
                            value="approved"
                          >
                            <CheckIcon fontSize="small" />
                            &nbsp;Approve
                          </EntryActionButton>
                        )}
                        {getNonPendingEntryActionButton()}
                        {submissionStatus !== 'rejected' && (
                          <EntryActionButton
                            aria-label="reject entry"
                            disabled={submissionWithdrawn}
                            value="rejected"
                          >
                            <CloseIcon fontSize="small" />
                            &nbsp;Reject
                          </EntryActionButton>
                        )}
                      </ToggleButtonGroup>
                      {modifiedBy && (
                        <Alert severity="info">
                          {'Set to '}
                          <span className={classes.submissionStatus}>{submissionStatus}</span>
                          {' by '}
                          <span className={classes.modifiedBy}>{modifiedBy}</span>
                        </Alert>
                      )}
                      <TextField
                        id="reason"
                        name="reason"
                        color="secondary"
                        variant="filled"
                        disabled={!actionRejected}
                        multiline
                        maxRows={6}
                        minRows={6}
                        label="Reason"
                        required={actionRejected}
                        helperText={formState.reason.error}
                        error={!!formState.reason.error}
                        value={formState.reason.value ?? ''}
                        onChange={handleFieldChange}
                      />
                      {getSubmitAlert()}
                      <SpinnerButton
                        color="primary"
                        variant="contained"
                        onClick={moderatorSubmit}
                        disabled={submissionWithdrawn}
                        submitting={isMutatingReview}
                      >
                        Submit
                      </SpinnerButton>
                    </>
                  ) : (
                    <>
                      {submissionStatus === 'approved' && (
                        <Alert severity="warning">
                          This flag is approved. If you re-submit it later, it will need to be
                          reviewed again by a moderator.
                        </Alert>
                      )}
                      <SpinnerButton
                        color="primary"
                        variant="contained"
                        onClick={userSubmit}
                        submitting={isMutatingUser}
                      >
                        {submissionWithdrawn ? 'Re-Submit' : 'Withdraw'}
                        {' '}
                        Entry
                      </SpinnerButton>
                    </>
                  )}
                </Fieldset>
              </Grid>
            </Grid>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

SubmissionRow.propTypes = {
  moderator: PropTypes.bool,
  submission: types.submission.isRequired,
  userBreakdown: types.userBreakdown.isRequired,
};

SubmissionRow.defaultProps = {
  moderator: false,
};

export default SubmissionRow;
