import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import SectionTitleWithButtons from './SectionTitleWithButtons';
import {
  BlackTableText,
  GreyTableText,
  OrangeTableText,
  RedTableText,
} from './TableText';

const KARMA_THRESHOLD = 20;
const VOTED_THRESHOLD = 20;

export const VOTERS = [
  {
    username: 'joshuauiux',
    age: '>1 yr',
    karma: '104',
    voted: 100,
    status: 'BANNED',
  },
  {
    username: 'Examination-4706',
    age: '26 days',
    karma: '56',
    voted: 100,
    status: 'DQ',
  },
  {
    username: 'VertigoOne',
    age: '>1 yr',
    karma: '>1000',
    voted: 100,
  },
  {
    username: 'TorteApp',
    age: '>1 yr',
    karma: '27',
    voted: 100,
  },
  {
    username: 'heshammourad',
    age: '>1 yr',
    karma: '13',
    voted: 100,
    status: 'DQ',
  },
  {
    username: 'SomeLowVotingAccount',
    age: '>1 yr',
    karma: '301',
    voted: 10,
    status: 'AUTOFILTER',
  },
];

function VotersTable() {
  const navigate = useNavigate();
  const { contestId } = useParams();
  const [showVoter, setShowVoter] = useState(null);

  const buttons = useMemo(
    () => [
      {
        color: 'secondary',
        text: 'SWITCH TO voterS',
        onClick: () => navigate(`/mod/analyze/${contestId}`),
      },
    ],
    [],
  );

  const handleVoterSelection = (v) => setShowVoter(v);

  return (
    <>
      <SectionTitleWithButtons title="Voters" buttons={buttons} />

      <TableContainer component={Paper} sx={{ marginTop: 1 }}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Voter</TableCell>
              <TableCell align="center">Age</TableCell>
              <TableCell align="center">Karma</TableCell>
              <TableCell align="center">% voted</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {VOTERS.map((voter) => (
              <TableRow
                key={voter.username}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                onClick={() => handleVoterSelection(voter.username)}
                hover
              >
                <TableCell component="th" scope="row">
                  {voter.username}
                </TableCell>

                {
                  // eslint-disable-next-line no-nested-ternary
                  voter.age.includes('days') ? (
                    <RedTableText>{voter.age}</RedTableText>
                  ) : voter.age.includes('mo') ? (
                    <OrangeTableText>{voter.age}</OrangeTableText>
                  ) : (
                    <BlackTableText bold center="center">
                      {voter.age}
                    </BlackTableText>
                  )
                }

                {voter.karma < KARMA_THRESHOLD ? (
                  <RedTableText>{voter.karma}</RedTableText>
                ) : (
                  <BlackTableText bold center="center">
                    {voter.karma}
                  </BlackTableText>
                )}

                {voter.voted < VOTED_THRESHOLD ? (
                  <RedTableText>{voter.voted}</RedTableText>
                ) : (
                  <BlackTableText bold center="center">
                    {voter.voted}
                  </BlackTableText>
                )}

                {voter.status === 'BANNED' || voter.status === 'DQ' ? (
                  <RedTableText>{voter.status}</RedTableText>
                ) : (
                  <GreyTableText>{voter.status}</GreyTableText>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

export default VotersTable;
