/*
https://mui.com/material-ui/react-table/#collapsible-table
Add (entrant) and background color to the entrant's voter row?
Store chip values in AnalyzeVotes so it stays through navigation?
  https://react.dev/learn/passing-data-deeply-with-context
WTF are the chips even for?
DO NOT USE FLEX for text in line with icons. Use <Stack alignItems="center" direction="row" gap={2}>
*/

/* eslint-disable react/forbid-prop-types */
import Checkbox from '@material-ui/core/Checkbox';
import { makeStyles } from '@material-ui/core/styles';
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

import { useChipContext } from './ChipContext';
import {
  BlackTableText,
  GreyTableText,
  OrangeTableText,
  RedTableText,
  ScoreTableText,
} from './TableText';
import TakeActionButton from './TakeActionButton';

const useStyles = makeStyles({});

export const ENTRANT_VOTERS = [
  {
    username: 'joshuauiux',
    contest: 'dq',
    site: 'ban',
    score: null,
  },
  {
    username: 'Examination-4706',
    contest: 'dq',
    site: 'ban',
    score: 97,
  },
  {
    username: 'Taco-Man123',
    contest: 'dq',
    site: 'warning',
    score: 81,
  },
  {
    username: 'TorteApp',
    contest: '',
    site: '',
    score: 47,
  },
  {
    username: 'heshammourad',
    contest: '',
    site: '',
    score: 13,
  },
  {
    username: 'LowVotingAcct',
    contest: 'autofilter',
    site: '',
    score: 10,
  },
];

/**
 * The page for moderators to review contest submissions.
 */
function EntrantVotersTable() {
  const [checkedVoters, setCheckedVoters] = useState(new Set());
  const [showVoter, setShowVoter] = useState('');
  const { chips, setChips } = useChipContext();

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
      <Stack direction="row" spacing={1}>
        <Chip label="DQ" />
        <Chip label="Autofilter" variant="outlined" />
        <Chip label="Banned" variant="outlined" />
        <Chip label="Warning" variant="outlined" />
        <Chip label="Hide dq votes in chart average" variant="outlined" />
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
              <TableCell align="center">Contest</TableCell>
              <TableCell align="center">Site</TableCell>
              <TableCell align="center">Cheat score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ENTRANT_VOTERS.map((voter) => (
              <TableRow
                key={voter.username}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
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
                    label={voter.username}
                  />
                </TableCell>
                {
                  // eslint-disable-next-line no-nested-ternary
                  voter.contest === 'dq' ? (
                    <RedTableText>DQ</RedTableText>
                  ) : voter.contest === 'autofilter' ? (
                    <GreyTableText>AUTOFILTER</GreyTableText>
                  ) : (
                    <BlackTableText />
                  )
                }
                {
                  // eslint-disable-next-line no-nested-ternary
                  voter.site === 'ban' ? (
                    <RedTableText>BANNED</RedTableText>
                  ) : voter.site === 'warning' ? (
                    <OrangeTableText>WARNED</OrangeTableText>
                  ) : (
                    <BlackTableText />
                  )
                }

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
