import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import format from 'date-fns/format';
import isFuture from 'date-fns/isFuture';
import parseISO from 'date-fns/parseISO';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import useAuthState from '../../../common/useAuthState';
import { PrimaryButton, ProtectedRoute } from '../../../components';
import { deleteDataWithResponse } from '../../../data/api';
import useSwrModContests from '../../../data/useSwrModContests';

// parseISO (unlike `new Date()`) parses a date-only "YYYY-MM-DD" string as local midnight
// rather than UTC midnight, so this doesn't roll the 1st of the month back a day in
// negative-offset timezones.
const formatMonthYear = (date) => format(parseISO(date), 'MMM yyyy');

// A contest is "upcoming" while its submission window hasn't opened yet - the same
// condition the server uses to allow renaming/deleting it.
const isUpcoming = ({ submissionStart }) => {
  if (!submissionStart) {
    return false;
  }
  return isFuture(new Date(submissionStart));
};

const getStatus = ({ submissionStart, submissionEnd, voteEnd }) => {
  if (submissionStart && isFuture(new Date(submissionStart))) {
    return 'Upcoming';
  }
  if (submissionEnd && isFuture(new Date(submissionEnd))) {
    return 'Submissions Open';
  }
  if (voteEnd && isFuture(new Date(voteEnd))) {
    return 'Voting';
  }
  return 'Awaiting Certification';
};

function DeleteContestDialog({
  contest, deleting, error, onCancel, onConfirm,
}) {
  return (
    <Dialog open={!!contest} onClose={onCancel}>
      <DialogTitle>Delete this contest?</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography variant="body2">
          This will permanently delete &quot;
          {contest?.name}
          &quot;. This cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={deleting}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={deleting}
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

DeleteContestDialog.propTypes = {
  contest: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }),
  deleting: PropTypes.bool.isRequired,
  error: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

DeleteContestDialog.defaultProps = {
  contest: null,
  error: null,
};

function ModContests() {
  const [{ authTokens }] = useAuthState();
  const { data, isLoading, mutate } = useSwrModContests();
  const contests = data.contests || [];

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleCancelDelete = () => {
    if (deleting) {
      return;
    }
    setDeleteTarget(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteDataWithResponse(
        `/mod/contests/${deleteTarget.id}`,
        authTokens,
      );
      setDeleteTarget(null);
      mutate();
    } catch (err) {
      setDeleteError(
        err?.response?.data || err?.message || 'Failed to delete contest.',
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ProtectedRoute>
      <Box sx={{ maxWidth: 900, mx: 'auto', my: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
          }}
        >
          <Typography component="h1" variant="h5">
            Contests
          </Typography>
          <PrimaryButton
            component={RouterLink}
            to="/mod/contests/new"
            startIcon={<AddIcon />}
          >
            Add Contest
          </PrimaryButton>
        </Box>

        {!isLoading && !contests.length && (
          <Typography color="text.secondary">
            No current or upcoming contests.
          </Typography>
        )}

        {contests.length > 0 && (
          <TableContainer component={Paper}>
            <Table aria-label="contests">
              <TableHead>
                <TableRow>
                  <TableCell>Month</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contests.map((contest) => (
                  <TableRow key={contest.id}>
                    <TableCell>{formatMonthYear(contest.date)}</TableCell>
                    <TableCell>{contest.name}</TableCell>
                    <TableCell>{getStatus(contest)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        component={RouterLink}
                        to={`/mod/contests/${contest.id}/edit`}
                        aria-label={`Edit ${contest.name}`}
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      {isUpcoming(contest) && (
                        <IconButton
                          onClick={() => setDeleteTarget(contest)}
                          aria-label={`Delete ${contest.name}`}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <DeleteContestDialog
        contest={deleteTarget}
        deleting={deleting}
        error={deleteError}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </ProtectedRoute>
  );
}

export default ModContests;
