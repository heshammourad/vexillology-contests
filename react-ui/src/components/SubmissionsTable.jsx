import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableContainer from '@material-ui/core/TableContainer';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

import types from '../common/types';

import SubmissionRow from './SubmissionRow';

const useStyles = makeStyles({
  table: {
    tableLayout: 'fixed',
  },
});

/**
 * A table containing a list of user-submitted contest entries.
 *
 * @param {*} props
 * @param {boolean} props.moderator - Whether this is being shown to a moderator.
 * @param props.submissions - The list of submissions to display
 * @param {Object[]} [props.userBreakdown] - The number of approved and submitted entries for each
 *  user.
 */
function SubmissionsTable({ moderator, submissions, userBreakdown }) {
  if (!submissions?.length) {
    return null;
  }

  const classes = useStyles();
  return (
    <TableContainer component={Paper}>
      <Table className={classes.table} aria-label="submissions" size="small">
        <TableBody>
          {submissions.map((submission) => (
            <SubmissionRow
              key={submission.id}
              moderator={moderator}
              submission={submission}
              userBreakdown={userBreakdown[submission.user] ?? {}}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

SubmissionsTable.propTypes = {
  moderator: PropTypes.bool,
  submissions: PropTypes.arrayOf(types.submission),
  userBreakdown: PropTypes.objectOf(types.userBreakdown),
};

SubmissionsTable.defaultProps = {
  moderator: false,
  submissions: [],
  userBreakdown: {},
};

export default SubmissionsTable;
