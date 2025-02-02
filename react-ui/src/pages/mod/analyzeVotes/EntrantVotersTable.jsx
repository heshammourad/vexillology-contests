/*
SHOW REJECTED VOTES = a third set of average points
https://mui.com/material-ui/react-table/#collapsible-table
Can you add entrant's DQ status somewhere?
*/

/* eslint-disable react/forbid-prop-types */
import Checkbox from '@material-ui/core/Checkbox';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { CHIPS, useChipContext } from './ChipContext';
import {
  BanStatusTableText,
  ScoreTableText,
  VoteStatusTableText,
} from './TableText';
import TakeActionButton from './TakeActionButton';

export const ENTRANT_VOTERS = [
  {
    username: 'joshuauiux',
    voteStatus: 'exclude',
    banStatus: 'ban',
    score: null,
  },
  {
    username: 'Examination-4706',
    voteStatus: 'exclude',
    banStatus: 'ban',
    score: 97,
  },
  {
    username: 'Taco-Man123',
    voteStatus: 'exclude',
    banStatus: 'warn',
    score: 81,
  },
  {
    username: 'TorteApp',
    voteStatus: '',
    banStatus: '',
    score: 47,
  },
  {
    username: 'heshammourad',
    voteStatus: '',
    banStatus: '',
    score: 13,
  },
  {
    username: 'LowVotingAcct',
    voteStatus: 'autofilter',
    banStatus: '',
    score: 10,
  },
];

/**
 * The page for moderators to review contest submissions.
 */
function EntrantVotersTable() {
  const { entrantId } = useParams();
  const [checkedVoters, setCheckedVoters] = useState(new Set());
  const [showVoter, setShowVoter] = useState('');
  const { chips, setChips } = useChipContext();

  const handleChip = (event) => {
    const field = event.currentTarget.getAttribute('data-id');
    setChips((prev) => ({ ...prev, [field]: !prev[field] }));
  };
  const handleCheckAll = () => {
    setCheckedVoters((prev) => (prev.size ? new Set() : new Set(ENTRANT_VOTERS.map((v) => v.username))));
  };
  const handleCheckOne = (event) => {
    event.stopPropagation();
    setCheckedVoters((prev) => {
      const newSet = new Set(prev); // Create a new Set
      if (event.target.checked) {
        newSet.add(event.target.name);
      } else {
        newSet.delete(event.target.name);
      }
      return newSet;
    });
  };

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ marginBottom: 1 }}>
        {Object.keys(CHIPS).map((key) => (
          <Chip
            key={key}
            data-id={key}
            color={CHIPS[key].color}
            label={CHIPS[key].label}
            variant={chips[key] ? 'filled' : 'outlined'}
            onClick={handleChip}
          />
        ))}
      </Stack>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>
                <Checkbox
                  style={{ padding: '0 8px 0 0' }}
                  onClick={handleCheckAll}
                  checked={!!checkedVoters.size}
                />
                Voter
              </TableCell>
              <TableCell align="center">Vote status</TableCell>
              <TableCell align="center">Site ban</TableCell>
              <TableCell align="center">Cheat score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ENTRANT_VOTERS.map((voter) => (
              <TableRow
                key={voter.username}
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
                  backgroundColor: voter.username === entrantId && '#e3f1ff',
                }}
                onClick={() => setShowVoter(voter.username)}
                hover
              >
                <TableCell component="th" scope="row">
                  <FormControlLabel
                    control={(
                      <Checkbox
                        style={{ paddingTop: 0, paddingBottom: 0 }}
                        checked={checkedVoters.has(voter.username)}
                        onChange={handleCheckOne}
                        name={voter.username}
                      />
                    )}
                    label={`${voter.username}${
                      voter.username === entrantId ? ' (entrant)' : ''
                    }`}
                  />
                </TableCell>

                <VoteStatusTableText voteStatus={voter.voteStatus} />

                <BanStatusTableText banStatus={voter.banStatus} />

                <ScoreTableText>{voter.score}</ScoreTableText>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TakeActionButton users={checkedVoters} />
      {/* {!!checkedVoters.size && (
      <Fab
        color="secondary"
        variant="extended"
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
        }}
      >
        <GavelIcon sx={{ mr: 1 }} />
        Take action against
        {' '}
        {checkedVoters.size === 1 ? 'user' : `${checkedVoters.size} users`}
      </Fab>
      )} */}
    </>
  );
}

export default EntrantVotersTable;

EntrantVotersTable.propTypes = {};
