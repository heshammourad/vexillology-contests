import Chip from '@material-ui/core/Chip';
import Collapse from '@material-ui/core/Collapse';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { makeStyles, useTheme, withStyles } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import UndoIcon from '@material-ui/icons/Undo';
import Alert from '@material-ui/lab/Alert';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import clsx from 'clsx';
import format from 'date-fns/format';
import isToday from 'date-fns/isToday';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { markdown } from 'snudown-js';
import useSWRMutation from 'swr/mutation';

import { putData } from '../../api';
import {
  useAuthState, useFormState, useSnackbarState, useSwrData,
} from '../../common';
import snackbarTypes from '../../common/snackbarTypes';
import { HtmlWrapper, RedditUserAttribution, SubmissionButton } from '../../components';

const API_PATH = '/mod/reviewSubmissions';

const useStyles = makeStyles((theme) => ({
  actions: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    rowGap: theme.spacing(2),
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
    [theme.breakpoints.down('xs')]: {
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
    [theme.breakpoints.down('sm')]: {
      padding: 0,
      width: 0,
    },
  },
  usernameCell: {
    whiteSpace: 'nowrap',
    width: 172,
    [theme.breakpoints.down('sm')]: {
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
    '&.Mui-selected': {
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
  const date = new Date(time);
  const formatPattern = isToday(date) ? 'h:mm a' : 'MMM d';
  return format(date, formatPattern);
};

const updateSubmissions = (currentData, response) => {
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

  return {
    ...currentData,
    submissions: currentData.submissions.reduce((acc, cur) => {
      if (cur.id !== response.id) {
        acc.push(cur);
      } else {
        acc.push({ ...cur, ...response });
      }
      return acc;
    }, []),
    userBreakdown,
  };
};

function Row({
  submission: {
    category,
    description,
    id,
    modifiedBy,
    name: entryName,
    rejectionReason,
    submissionStatus,
    submissionTime,
    url,
    user,
  },
  userBreakdown: { approved, submitted },
}) {
  const [{ accessToken, refreshToken }] = useAuthState();
  const authTokens = { accessToken, refreshToken };

  const updateCache = useSwrData(API_PATH)[1];
  // eslint-disable-next-line max-len
  const { isMutating, trigger } = useSWRMutation([API_PATH, authTokens], (_, { arg }) => putData(API_PATH, arg, authTokens));
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

  const submit = () => {
    const validForm = validateForm(null, true);
    if (!validForm) {
      return;
    }

    const body = { id, rejectionReason: formState.reason.value, status: action };
    trigger(body, {
      revalidate: false,
      populateCache: (response, data) => {
        if (!response) {
          showError();
          return data;
        }

        setOpen(false);
        updateSnackbarState(snackbarTypes.REVIEW_SUBMISSION_SUCCESS);

        const newSubmissions = updateSubmissions(data, response);
        updateCache(newSubmissions);
        return newSubmissions;
      },
      onError: showError,
    });
  };

  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isSmBreakpoint = useMediaQuery(theme.breakpoints.only('sm'));
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));

  const redditUserAttribution = <RedditUserAttribution showUsernameOnly user={`/u/${user}`} />;
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
      <div>
        <Typography component="div" variant="subtitle2">
          Username
        </Typography>
        {redditUserAttribution}
      </div>
      <div>
        <Typography component="div" variant="subtitle2">
          Description
        </Typography>
        <div className={classes.description}>
          <HtmlWrapper html={markdown(description)} />
        </div>
      </div>
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

  return (
    <>
      <TableRow className={classes.mainRow}>
        <TableCell className={classes.entryName}>
          <Typography component="span" variant="subtitle2">
            {entryName}
          </Typography>
        </TableCell>
        <TableCell className={classes.usernameCell}>
          {!open && isMdUp && redditUserAttribution}
        </TableCell>
        <TableCell align="center" className={classes.previewImage}>
          {isSmUp && (
            <div className={classes.imageContainer}>
              {!open && <img className={classes.image} alt="" src={url} />}
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
                <img className={classes.expandedImage} alt="" src={url} />
                {isSmBreakpoint && fields}
              </Grid>
              {!isSmBreakpoint && (
                <Grid item xs={12} md={4} className={classes.fields}>
                  {fields}
                </Grid>
              )}
              <Grid item xs={12} sm={6} md={4} className={classes.actions}>
                <ToggleButtonGroup
                  aria-label="review action"
                  exclusive
                  onChange={handleActionChange}
                  value={action}
                >
                  {submissionStatus !== 'approved' && (
                    <EntryActionButton aria-label="approve entry" value="approved">
                      <CheckIcon fontSize="small" />
                      &nbsp;Approve
                    </EntryActionButton>
                  )}
                  {getNonPendingEntryActionButton()}
                  {submissionStatus !== 'rejected' && (
                    <EntryActionButton aria-label="reject entry" value="rejected">
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
                <SubmissionButton
                  color="primary"
                  variant="contained"
                  onClick={submit}
                  submitting={isMutating}
                >
                  Submit
                </SubmissionButton>
              </Grid>
            </Grid>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

Row.propTypes = {
  submission: PropTypes.shape({
    category: PropTypes.string,
    description: PropTypes.string,
    id: PropTypes.string,
    modifiedBy: PropTypes.string,
    name: PropTypes.string,
    rejectionReason: PropTypes.string,
    submissionStatus: PropTypes.oneOf(['approved', 'pending', 'rejected']),
    submissionTime: PropTypes.string,
    url: PropTypes.string,
    user: PropTypes.string,
  }).isRequired,
  userBreakdown: PropTypes.shape({
    approved: PropTypes.number,
    submitted: PropTypes.number,
  }).isRequired,
};

export default Row;
