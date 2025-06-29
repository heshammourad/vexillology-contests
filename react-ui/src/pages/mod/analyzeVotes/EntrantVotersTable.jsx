import Box from '@material-ui/core/Box';
import Checkbox from '@material-ui/core/Checkbox';
import Typography from '@material-ui/core/Typography';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { CHIPS, useChipContext } from './ChipContext';
import {
  BanStatusTableText,
  ScoreTableText,
  VoteStatusTableText,
} from './TableText';
import TakeActionButton from './TakeActionButton';
import { RUBRIC, VoterBreakdownText } from './VoteBreakdownText';

const VOTER_METRICS = {
  age: 1,
  karma: 20,
  fives: [undefined, 4, 2],
  zero: false,
  history: [2, 2, 2],
};

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
 * Breaks down voter stats for the selected entrant
 */
function EntrantVotersTable() {
  const { entrantId } = useParams();
  const [checkedVoters, setCheckedVoters] = useState(new Set());
  const { chips, setChips } = useChipContext(); // {[field]: bool}

  const handleChip = (event) => {
    const field = event.currentTarget.getAttribute('data-chip');
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
            data-chip={key}
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
              <VoterRow
                key={voter.username}
                voter={voter}
                isEntrant={voter.username === entrantId}
                isChecked={checkedVoters.has(voter.username)}
                handleCheckOne={handleCheckOne}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TakeActionButton users={checkedVoters} />
    </>
  );
}

function VoterRow({
  voter, isEntrant, isChecked, handleCheckOne,
}) {
  const [showVoter, setShowVoter] = useState(false);
  const { chips } = useChipContext(); // {[field]: bool}

  if (chips.hideExcluded && voter.voteStatus === 'exclude') {
    return null;
  }

  if (chips.hideAutofiltered && voter.voteStatus === 'autofilter') {
    return null;
  }

  return (
    <>
      <TableRow
        key={voter.username}
        sx={{
          '&:last-child td, &:last-child th': { border: 0 },
          '& > *': { borderBottom: 'unset' },
        }}
        onClick={() => setShowVoter((prev) => !prev)}
        hover
      >
        <TableCell component="th" scope="row">
          <FormControlLabel
            control={(
              <Checkbox
                style={{ paddingTop: 0, paddingBottom: 0 }}
                checked={isChecked}
                onChange={handleCheckOne}
                name={voter.username}
              />
            )}
            label={`${voter.username}${isEntrant ? ' (entrant)' : ''}`}
          />
        </TableCell>

        <VoteStatusTableText voteStatus={voter.voteStatus} />

        <BanStatusTableText banStatus={voter.banStatus} />

        <ScoreTableText>{voter.score}</ScoreTableText>
      </TableRow>
      <TableRow onClick={() => setShowVoter(false)}>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={showVoter} timeout="auto" unmountOnExit>
            <Box
              sx={{
                display: 'flex',
                height: 300,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#adeefa',
              }}
            >
              <Typography>
                FUTURE SITE OF BOTH USER VS AVERAGE CHARTS
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                marginLeft: '40px',
              }}
            >
              <Box sx={{ marginTop: 6, marginBottom: 6 }}>
                {Object.entries(VOTER_METRICS).map(([key, value]) => (
                  <VoterBreakdownText
                    key={key}
                    text={RUBRIC[key].getText(value)}
                    score={RUBRIC[key].getScore(value)}
                  />
                ))}
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default EntrantVotersTable;

VoterRow.propTypes = {
  voter: PropTypes.shape({
    username: PropTypes.string.isRequired,
    voteStatus: PropTypes.oneOf(['exclude', 'autofilter', '']).isRequired,
    banStatus: PropTypes.oneOf(['ban', 'warn', '']).isRequired,
    score: PropTypes.number,
  }).isRequired,
  isEntrant: PropTypes.bool.isRequired,
  isChecked: PropTypes.bool.isRequired,
  handleCheckOne: PropTypes.func.isRequired,
};
