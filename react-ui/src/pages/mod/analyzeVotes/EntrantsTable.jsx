import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useMemo } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';

import { UserSelector } from '../../../components';

import { ContestProvider, useContestContext } from './ContestContext';
import SectionTitleWithButtons from './SectionTitleWithButtons';
import TableBodyWrapper from './TableBodyWrapper';
import {
  BanStatusTableText,
  EntriesStatusTableText,
  ScoreTableText,
  TableTextWrapper,
} from './TableText';
import VotersTable from './VotersTable';

/**
 * The page for moderators to review contest submissions.
 */
function EntrantsTableContent() {
  const navigate = useNavigate();

  const { contestId, entrantId } = useParams();

  // Use the contest context
  const {
    entrantsData,
    entrantsError,
    entrantsLoading,
    bansData,
    bansError,
    bansLoading,
    fraudScores,
    fraudScoresError,
    fraudScoresLoading,
  } = useContestContext();

  const entrants = Object.keys(entrantsData).sort();

  const sortedEntrants = Object.keys(entrantsData).sort((a, b) => {
    const scoreA = fraudScores[a]?.highest ?? 0;
    const scoreB = fraudScores[b]?.highest ?? 0;
    return scoreB - scoreA; // Descending order (highest first)
  });

  const handleEntrantSelection = (eId) => navigate(`./${eId}`);

  const buttons = useMemo(
    () => [
      {
        text: 'CLEAR ENTRANT',
        color: 'primary',
        onClick: () => navigate(`/mod/analyze/${contestId}`),
        disabled: !entrantId,
      },
      {
        text: 'SWITCH TO VOTERS',
        color: 'secondary',
        onClick: () => navigate(`/mod/analyze/${contestId}/voters`),
      },
    ],
    [entrantId, contestId],
  );

  if (entrantId === 'voters') {
    return <VotersTable />;
  }

  if (entrantId) {
    return (
      <>
        <SectionTitleWithButtons title="Entrant" buttons={buttons} />
        <UserSelector
          usernames={entrants}
          username={entrantId}
          onChange={handleEntrantSelection}
        />
        <br />
        <Outlet />
      </>
    );
  }

  return (
    <>
      <SectionTitleWithButtons
        title={`Entrants (${sortedEntrants.length})`}
        buttons={buttons}
      />

      <TableContainer component={Paper} sx={{ marginTop: 1 }}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Entrant</TableCell>
              <TableCell align="center">Entry DQs</TableCell>
              <TableCell align="center">Warning status</TableCell>
              <TableCell align="center">Top fraud</TableCell>
            </TableRow>
          </TableHead>
          <TableBodyWrapper
            error={entrantsError}
            errorText="Error occurred loading entrants"
            loading={entrantsLoading}
          >
            <TableBody>
              {sortedEntrants.map((username) => (
                <TableRow
                  key={username}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  onClick={() => handleEntrantSelection(username)}
                  hover
                >
                  <TableCell component="th" scope="row">
                    {username}
                  </TableCell>
                  <EntriesStatusTableText entries={entrantsData[username]} />
                  <TableTextWrapper loading={bansLoading} error={bansError}>
                    <BanStatusTableText banStatus={bansData[username]} />
                  </TableTextWrapper>
                  <TableTextWrapper
                    loading={fraudScoresLoading}
                    error={fraudScoresError}
                  >
                    <ScoreTableText>
                      {fraudScores[username]?.highest || 'ERR'}
                    </ScoreTableText>
                  </TableTextWrapper>
                </TableRow>
              ))}
            </TableBody>
          </TableBodyWrapper>
        </Table>
      </TableContainer>
    </>
  );
}

/**
 * Wrapper component that provides the contest context
 */
function EntrantsTable() {
  const { contestId } = useParams();

  return (
    <ContestProvider contestId={contestId}>
      <EntrantsTableContent />
    </ContestProvider>
  );
}

export default EntrantsTable;
