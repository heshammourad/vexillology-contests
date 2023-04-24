import Button from '@material-ui/core/Button';
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
import Alert from '@material-ui/lab/Alert';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import clsx from 'clsx';
import format from 'date-fns/format';
import isToday from 'date-fns/isToday';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { markdown } from 'snudown-js';

import { useFormState } from '../../common';
import { HtmlWrapper, RedditUserAttribution } from '../../components';

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
    maxWidth: 300,
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
  mainRowUser: {
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  previewImage: {
    [theme.breakpoints.down('sm')]: {
      display: 'none',
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
  submissionTime: {
    whiteSpace: 'nowrap',
    [theme.breakpoints.down('sm')]: {
      display: 'none',
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

function Row({
  submission: {
    category,
    description,
    name: entryName,
    submissionStatus,
    submissionTime,
    url,
    user,
  },
  userBreakdown: { approved, submitted },
}) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState('approved');
  const [formState, updateFormState] = useFormState(['reason']);
  const classes = useStyles();
  const theme = useTheme();

  const actionRejected = action === 'rejected';

  const handleExpandClick = () => {
    setOpen(!open);
  };

  const handleActionChange = (e, newAction) => {
    setAction(newAction);
  };

  const submit = () => {};

  const handleFieldChange = ({ target: { name, value } }) => {
    updateFormState(name, 'value', value);
    updateFormState(name, 'error', !value && actionRejected ? 'Rejection reason is required' : '');
  };

  const isSmBreakpoint = useMediaQuery(theme.breakpoints.only('sm'));

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

  const getSubmitMessage = () => {
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
        <TableCell className={classes.mainRowUser}>{!open && redditUserAttribution}</TableCell>
        <TableCell align="center" className={classes.previewImage}>
          <div className={classes.imageContainer}>
            {!open && <img className={classes.image} alt="" src={url} />}
          </div>
        </TableCell>
        <TableCell align="center" className={classes.submissionTime}>
          {getSubmissionTimeDisplay(submissionTime)}
        </TableCell>
        <TableCell align="center">
          <Chip
            className={clsx(classes.statusChip, classes[submissionStatus])}
            label={submissionStatus}
            size="small"
          />
        </TableCell>
        <TableCell align="right">
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
                  <EntryActionButton aria-label="approve entry" value="approved">
                    <CheckIcon fontSize="small" />
                    Approve
                  </EntryActionButton>
                  <EntryActionButton aria-label="reject entry" value="rejected">
                    <CloseIcon fontSize="small" />
                    Reject
                  </EntryActionButton>
                </ToggleButtonGroup>
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
                  value={formState.reason.value}
                  onChange={handleFieldChange}
                />
                {getSubmitMessage()}
                <Button variant="contained" color="primary" onClick={submit}>
                  Submit
                </Button>
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
    name: PropTypes.string,
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
