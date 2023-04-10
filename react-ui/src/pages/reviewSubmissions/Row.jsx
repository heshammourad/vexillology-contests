import Chip from '@material-ui/core/Chip';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import format from 'date-fns/format';
import isToday from 'date-fns/isToday';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { markdown } from 'snudown-js';

import { HtmlWrapper } from '../../components';

const useStyles = makeStyles((theme) => ({
  chipApproved: {
    backgroundColor: theme.palette.success.light,
  },
  chipPending: {
    backgroundColor: theme.palette.warning.light,
  },
  chipRejected: {
    backgroundColor: theme.palette.error.light,
  },
  expandedImage: {
    maxHeight: 300,
    maxWidth: 400,
  },
  expandedRow: {
    columnGap: theme.spacing(3),
    display: 'flex',
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
}));

const getSubmissionTimeDisplay = (time) => {
  const date = new Date(time);
  const formatPattern = isToday(date) ? 'h:mm a' : 'MMM d';
  return format(date, formatPattern);
};

function Row({
  submission: {
    category, description, name, submissionStatus, submissionTime, url, user,
  },
}) {
  const [open, setOpen] = useState(false);
  const classes = useStyles();

  const handleExpandClick = () => {
    setOpen(!open);
  };

  const getSubmissionStatusDisplay = (status) => {
    let className;
    let label;
    switch (status) {
      case 'approved':
        className = classes.chipApproved;
        label = 'Approved';
        break;
      case 'pending_review':
        className = classes.chipPending;
        label = 'Pending';
        break;
      case 'rejected':
        className = classes.chipRejected;
        label = 'Rejected';
        break;
      default:
        // DO NOTHING
        break;
    }
    return <Chip className={className} label={label} size="small" />;
  };

  // TODO: Add user attribution
  // const userDisplay = `/u/${user}`;

  return (
    <>
      <TableRow className={classes.mainRow}>
        <TableCell>
          <Typography component="span" variant="subtitle2">
            {name}
          </Typography>
        </TableCell>
        <TableCell>
          <div className={classes.imageContainer}>
            {!open && <img className={classes.image} alt="" src={url} />}
          </div>
        </TableCell>
        <TableCell>{getSubmissionStatusDisplay(submissionStatus)}</TableCell>
        <TableCell>{getSubmissionTimeDisplay(submissionTime)}</TableCell>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={handleExpandClick}>
            {open ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell className={classes.expandedTableRow} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <div className={classes.expandedRow}>
              <img className={classes.expandedImage} alt="" src={url} />
              <div className={classes.fields}>
                {category && (
                  <div className={classes.fieldRow}>
                    <Typography component="div" variant="subtitle2">
                      Category
                    </Typography>
                    {category}
                  </div>
                )}
                <div className={classes.fieldRow}>
                  <Typography component="div" variant="subtitle2">
                    Username
                  </Typography>
                  {`/u/${user}`}
                </div>
                <div>
                  <Typography component="div" variant="subtitle2">
                    Description
                  </Typography>
                  <HtmlWrapper html={markdown(description)} />
                </div>
              </div>
            </div>
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
    submissionStatus: PropTypes.oneOf(['approved', 'pending_review', 'rejected']),
    submissionTime: PropTypes.string,
    url: PropTypes.string,
    user: PropTypes.string,
  }).isRequired,
};

export default Row;
