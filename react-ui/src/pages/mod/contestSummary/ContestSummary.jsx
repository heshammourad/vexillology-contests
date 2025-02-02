import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import format from 'date-fns/format';
import isFuture from 'date-fns/isFuture';

import { ProtectedRoute } from '../../../components';
// eslint-disable-next-line no-restricted-imports
import LoadingContent from '../../../components/LoadingContent';
import useSwrModContestSummary from '../../../data/useSwrModContestSummary';

import EntriesTable from './EntriesTable';

const getErrorMessage = (entries, errorStatus, visibilityLimited, voteEnd) => {
  if (errorStatus === 404) {
    return 'No contest in progress';
  }

  if (visibilityLimited) {
    let message = "Can't view summary during voting window if you're a participant";
    if (voteEnd && isFuture(voteEnd)) {
      message += `. Please return after ${format(
        new Date(voteEnd),
        'MMM d h:mm a',
      )}.`;
    }
    return message;
  }

  if (!entries?.length) {
    return 'No votes yet';
  }

  return null;
};

function ContestSummary() {
  const {
    data: { entries, visibilityLimited, voteEnd } = {},
    error,
    isValidating,
  } = useSwrModContestSummary();
  const errorStatus = error?.response?.status;

  const errorMessage = getErrorMessage(
    entries,
    errorStatus,
    visibilityLimited,
    voteEnd,
  );

  return (
    <ProtectedRoute errorStatus={errorStatus}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          mb: 2,
          mt: 2,
        }}
      >
        <Box>
          <Typography component="h1" variant="h5">
            Contest Summary
          </Typography>
        </Box>
        <LoadingContent loading={isValidating}>
          {errorMessage ? (
            <Typography variant="body2">{errorMessage}</Typography>
          ) : (
            <EntriesTable {...{ entries }} />
          )}
        </LoadingContent>
      </Box>
    </ProtectedRoute>
  );
}

export default ContestSummary;
