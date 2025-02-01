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

import SectionTitleWithButtons from './SectionTitleWithButtons';
import { BlackTableText, OrangeTableText, RedTableText } from './TableText';
import VotersTable from './VotersTable';

export const ENTRANTS = [
  {
    username: 'joshuauiux',
    contest: 'dq',
    site: 'ban',
    cheating: 21,
    suspicious: 0,
  },
  {
    username: 'WorkingKing',
    contest: 'dq',
    site: 'warning',
    cheating: 4,
    suspicious: 2,
  },
  {
    username: 'TorteApp',
    contest: '',
    site: '',
    cheating: 21,
    suspicious: 1,
  },
  {
    username: 'heshammourad',
    contest: '',
    site: '',
    cheating: 0,
    suspicious: 0,
  },
];

/**
 * The page for moderators to review contest submissions.
 */
function EntrantsTable() {
  const navigate = useNavigate();

  const { contestId, entrantId } = useParams();

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
              <TableCell align="center">Contest</TableCell>
              <TableCell align="center">Site</TableCell>
              <TableCell align="center">Cheating</TableCell>
              <TableCell align="center">Suscipious</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ENTRANTS.map((entrant) => (
              <TableRow
                key={entrant.username}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                onClick={() => handleEntrantSelection(entrant.username)}
                hover
              >
                <TableCell component="th" scope="row">
                  {entrant.username}
                </TableCell>
                {entrant.contest === 'dq' ? (
                  <RedTableText>DQ</RedTableText>
                ) : (
                  <BlackTableText />
                )}
                {
                  // eslint-disable-next-line no-nested-ternary
                  entrant.site === 'ban' ? (
                    <RedTableText>BANNED</RedTableText>
                  ) : entrant.site === 'warning' ? (
                    <OrangeTableText>WARNED</OrangeTableText>
                  ) : (
                    <BlackTableText />
                  )
                }

                <RedTableText>{entrant.cheating}</RedTableText>
                <OrangeTableText>{entrant.suspicious}</OrangeTableText>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

export default EntrantsTable;
