import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import format from 'date-fns/format';

import { ProtectedRoute } from '../../../components';
import useSwrModContestSummary from '../../../data/useSwrModContestSummary';

import EntriesTable from './EntriesTable';

function ContestSummary() {
  const { data: { entries, visibilityLimited, voteEnd } = {}, error } = useSwrModContestSummary();

  return (
    <ProtectedRoute errorStatus={error?.response?.status}>
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
        {visibilityLimited && (
          <Typography variant="body2">
            Can&apos;t view summary during voting window if you&apos;re a
            participant
            {voteEnd
              && `. Please return after ${format(
                new Date(voteEnd),
                'MMM d h:mm a',
              )}.`}
          </Typography>
        )}
        {!visibilityLimited
          && (entries?.length ? (
            <EntriesTable {...{ entries }} />
          ) : (
            <div>No votes yet</div>
          ))}
      </Box>
    </ProtectedRoute>
  );
}

export default ContestSummary;
