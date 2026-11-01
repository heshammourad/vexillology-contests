import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { ProtectedRoute } from '../../../components';
import { deleteDataWithResponse } from '../../../data/api';
import useSwrModContests from '../../../data/useSwrModContests';
import useSwrMutation from '../../../data/useSwrMutation';

import ConfirmDialog from './ConfirmDialog';

const LIST_PATH = '/mod/contests';

// parseISO (unlike `new Date()`) reads a date-only "YYYY-MM-DD" string as local midnight
// rather than UTC midnight, so the 1st doesn't roll back a day west of UTC.
const formatMonthYear = (date) => format(parseISO(date), 'MMM yyyy');

const isFutureTimestamp = (timestamp) => !!timestamp && isFuture(new Date(timestamp));

const getStatus = ({ submissionStart, submissionEnd, voteEnd }) => {
  if (isFutureTimestamp(submissionStart)) {
    return 'Upcoming';
  }
  if (isFutureTimestamp(submissionEnd)) {
    return 'Submissions Open';
  }
  if (isFutureTimestamp(voteEnd)) {
    return 'Voting';
  }
  return 'Awaiting Certification';
};

/**
 * Lists the contests a moderator can still manage, with links to add and edit them.
 */
function ModContests() {
  const { data, isLoading } = useSwrModContests();
  const contests = data.contests || [];

  // Stays set after the dialog closes, so its text doesn't go blank during the close animation.
  const [contestToDelete, setContestToDelete] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const { isMutating: isDeleting, trigger: triggerDelete } = useSwrMutation(
    LIST_PATH,
    deleteDataWithResponse,
    contestToDelete && `${LIST_PATH}/${contestToDelete.id}`,
  );

  const openDeleteDialog = (contest) => {
    setContestToDelete(contest);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const deleteContest = async () => {
    setDeleteError(null);
    try {
      await triggerDelete();
      setDeleteDialogOpen(false);
    } catch (err) {
      setDeleteError(
        err?.response?.data || err?.message || 'Failed to delete contest.',
      );
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
          <Button
            component={RouterLink}
            to={`${LIST_PATH}/new`}
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add Contest
          </Button>
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
                        to={`${LIST_PATH}/${contest.id}/edit`}
                        aria-label={`Edit ${contest.name}`}
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      {/* The server also refuses once the contest has entries. */}
                      {isFutureTimestamp(contest.submissionStart) && (
                        <IconButton
                          onClick={() => openDeleteDialog(contest)}
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

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete this contest?"
        confirmLabel={isDeleting ? 'Deleting…' : 'Delete'}
        confirmColor="error"
        busy={isDeleting}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={deleteContest}
      >
        {deleteError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {deleteError}
          </Alert>
        )}
        <Typography variant="body2">
          {`This will permanently delete "${contestToDelete?.name}". This cannot be undone.`}
        </Typography>
      </ConfirmDialog>
    </ProtectedRoute>
  );
}

export default ModContests;
