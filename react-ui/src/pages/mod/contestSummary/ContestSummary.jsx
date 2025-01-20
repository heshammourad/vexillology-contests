import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { ProtectedRoute } from '../../../components';
import useSwrModContestSummary from '../../../data/useSwrModContestSummary';

import EntriesTable from './EntriesTable';

function ContestSummary() {
  const {
    data: { entries },
    error,
  } = useSwrModContestSummary();

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
        <Typography component="h1" variant="h5">
          Contest Summary
        </Typography>
        {entries?.length ? (
          <EntriesTable {...{ entries }} />
        ) : (
          <div>No votes yet</div>
        )}
      </Box>
    </ProtectedRoute>
  );
}

export default ContestSummary;
