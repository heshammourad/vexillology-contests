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
  OrangeTableText,
  RedTableText,
  TableTextWrapper,
} from './TableText';
import VotersTable from './VotersTable';

export const ENTRANTS = [
  {
    username: 'joshuauiux',
    entryStatus: 'dq',
    banStatus: 'ban',
    cheating: 21,
    suspicious: 0,
  },
  {
    username: 'WorkingKing',
    entryStatus: 'dq',
    banStatus: 'warn',
    cheating: 4,
    suspicious: 2,
  },
  {
    username: 'TorteApp',
    entryStatus: null,
    banStatus: '',
    cheating: 21,
    suspicious: 1,
  },
  {
    username: 'heshammourad',
    entryStatus: null,
    banStatus: '',
    cheating: 0,
    suspicious: 0,
  },
];

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
  } = useContestContext();

  const voters = ENTRANTS.map((e) => e.username);

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
          usernames={voters}
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
      <SectionTitleWithButtons title="Entrant" buttons={buttons} />

      <TableContainer component={Paper} sx={{ marginTop: 1 }}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Entrant</TableCell>
              <TableCell align="center">Entry DQs</TableCell>
              <TableCell align="center">Warning status</TableCell>
              <TableCell align="center">Cheating</TableCell>
              <TableCell align="center">Suspicious</TableCell>
            </TableRow>
          </TableHead>
          <TableBodyWrapper
            error={entrantsError}
            errorText="Error occurred loading entrants"
            loading={entrantsLoading}
          >
            <TableBody>
              {Object.entries(entrantsData).map(([username, entries]) => (
                <TableRow
                  key={username}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  onClick={() => handleEntrantSelection(username)}
                  hover
                >
                  <TableCell component="th" scope="row">
                    {username}
                  </TableCell>
                  <EntriesStatusTableText entries={entries} />
                  <TableTextWrapper loading={bansLoading} error={bansError}>
                    <BanStatusTableText banStatus={bansData[username]} />
                  </TableTextWrapper>
                  <RedTableText>0</RedTableText>
                  <OrangeTableText>0</OrangeTableText>
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
