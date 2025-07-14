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
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { CHIPS, useChipContext } from './ChipContext';
import { useContestContext } from './ContestContext';
import TableBodyWrapper from './TableBodyWrapper';
import {
  BanStatusTableText,
  ScoreTableText,
  TableTextWrapper,
  VoteStatusTableText,
} from './TableText';
import TakeActionButton from './TakeActionButton';
import { VoterBreakdownText } from './VoteBreakdownText';
import VoterGraph from './VoterGraph';

/**
 * Breaks down voter stats for the selected entrant
 */
function EntrantVotersTable() {
  const [checkedVoters, setCheckedVoters] = useState(new Set());
  const { chips, setChips } = useChipContext(); // {[field]: bool}
  const {
    votersData, votersError, votersLoading, distrustScores, fraudScores,
  } = useContestContext();
  const { entrantId } = useParams();

  const sortedVoters = useMemo(() => {
    const entrantFraud = fraudScores[entrantId];
    return Object.keys(votersData).sort((a, b) => {
      // First compare entrantFraud scores (highest first)
      const fraudScoreA = entrantFraud?.[a]?.score ?? 0;
      const fraudScoreB = entrantFraud?.[b]?.score ?? 0;
      if (fraudScoreA !== fraudScoreB) {
        return fraudScoreB - fraudScoreA; // Descending order
      }

      // Then compare distrustScores (highest first)
      const distrustScoreA = distrustScores[a]?.score ?? 0;
      const distrustScoreB = distrustScores[b]?.score ?? 0;
      if (distrustScoreA !== distrustScoreB) {
        return distrustScoreB - distrustScoreA; // Descending order
      }

      // Finally compare username strings
      return a.localeCompare(b);
    });
  }, [votersData, distrustScores, fraudScores, entrantId]);

  const handleChip = (event) => {
    const field = event.currentTarget.getAttribute('data-chip');
    setChips((prev) => ({ ...prev, [field]: !prev[field] }));
  };
  const handleCheckAll = () => {
    setCheckedVoters(() => new Set());
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
              <TableCell align="center">Voter distrust</TableCell>
              <TableCell align="center">Fraud score</TableCell>
            </TableRow>
          </TableHead>
          <TableBodyWrapper
            error={votersError}
            errorText="Error occurred loading voters"
            loading={votersLoading}
          >
            <TableBody>
              {sortedVoters.map((username) => (
                <VoterRow
                  key={username}
                  username={username}
                  isChecked={checkedVoters.has(username)}
                  handleCheckOne={handleCheckOne}
                />
              ))}
            </TableBody>
          </TableBodyWrapper>
        </Table>
      </TableContainer>
      <TakeActionButton users={checkedVoters} />
    </>
  );
}

// Helper function for voting order text
const getVotingOrderText = (outOfOrderFraud) => {
  if (outOfOrderFraud >= 0.8) {
    return 'Random voting pattern';
  }
  if (outOfOrderFraud >= 0.5) {
    return 'Mixed voting pattern';
  }
  if (outOfOrderFraud >= 0.3) {
    return 'Straight voting pattern';
  }
  return 'Start voting pattern';
};

function VoterRow({ username, isChecked, handleCheckOne }) {
  const {
    bansData,
    bansError,
    bansLoading,
    votersData,
    votersError,
    votersLoading,
    distrustScores,
    distrustScoresError,
    distrustScoresLoading,
    fraudScores,
    fraudScoresError,
    fraudScoresLoading,
  } = useContestContext();
  const { entrantId } = useParams();

  const [showVoter, setShowVoter] = useState(false);
  const { chips } = useChipContext(); // {[field]: bool}

  const isEntrant = username === entrantId;
  const voteStatus = votersData?.[username]?.dq;
  const voterFraudData = fraudScores[entrantId]?.[username];

  if (chips.hideExcluded && voteStatus === 'exclude') {
    return null;
  }

  if (chips.hideAutofiltered && voteStatus === 'autofilter') {
    return null;
  }

  return (
    <>
      <TableRow
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
                name={username}
              />
            )}
            label={`${username}${isEntrant ? ' (entrant)' : ''}`}
          />
        </TableCell>

        <TableTextWrapper loading={votersLoading} error={votersError}>
          <VoteStatusTableText voteStatus={voteStatus} />
        </TableTextWrapper>

        <TableTextWrapper loading={bansLoading} error={bansError}>
          <BanStatusTableText banStatus={bansData[username]} />
        </TableTextWrapper>

        <TableTextWrapper
          loading={distrustScoresLoading}
          error={distrustScoresError}
        >
          <ScoreTableText>{distrustScores[username]?.score}</ScoreTableText>
        </TableTextWrapper>

        <TableTextWrapper loading={fraudScoresLoading} error={fraudScoresError}>
          <ScoreTableText>
            {fraudScores[entrantId]?.[username]?.score}
          </ScoreTableText>
        </TableTextWrapper>
      </TableRow>
      <TableRow onClick={() => setShowVoter(false)}>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={showVoter} timeout="auto" unmountOnExit>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <VoterGraph voterId={username} entrantId={entrantId} />
            </Box>
            <Box
              sx={{
                display: 'flex',
                marginLeft: '40px',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  marginTop: 6,
                  marginBottom: 6,
                  flex: '1 1 50%',
                  paddingRight: 2,
                }}
              >
                <Typography variant="h6" sx={{ marginBottom: 2 }}>
                  Entrant-Voter Fraud Analysis
                </Typography>
                {voterFraudData ? (
                  <>
                    <VoterBreakdownText
                      text={`Voting order: ${getVotingOrderText(
                        voterFraudData.outOfOrderFraud,
                      )}`}
                      score={Math.round(voterFraudData.outOfOrderFraud * 100)}
                    />
                    <VoterBreakdownText
                      text={`Entrant favored: ${voterFraudData.entrantFavoredText}`}
                      score={Math.round(
                        voterFraudData.entrantFavoredFraud * 100,
                      )}
                    />
                    <VoterBreakdownText
                      text={`Historical pattern: ${voterFraudData.historicalText} (H/M/L)`}
                      score={Math.round(voterFraudData.historicalFraud * 100)}
                    />
                  </>
                ) : (
                  <Typography>
                    No fraud data available for this voter
                  </Typography>
                )}
              </Box>
              <Box
                sx={{
                  marginTop: 6,
                  marginBottom: 6,
                  flex: '1 1 50%',
                  paddingLeft: 2,
                }}
              >
                <Typography variant="h6" sx={{ marginBottom: 2 }}>
                  Voter Distrust Analysis
                </Typography>
                {distrustScores[username] ? (
                  <>
                    <VoterBreakdownText
                      text={`Karma: ${distrustScores[username].karmaText}`}
                      score={Math.round(
                        distrustScores[username].karmaDistrust * 100,
                      )}
                    />
                    <VoterBreakdownText
                      text={`Account age: ${distrustScores[username].ageText}`}
                      score={Math.round(
                        distrustScores[username].ageDistrust * 100,
                      )}
                    />
                    <VoterBreakdownText
                      text={`Vote participation: ${distrustScores[username].percentVotedText}`}
                      score={Math.round(
                        distrustScores[username].percentVotedDistrust * 100,
                      )}
                    />
                    <VoterBreakdownText
                      text={`Time between votes: ${distrustScores[username].timeBetweenVotesText}`}
                      score={Math.round(
                        distrustScores[username].timeBetweenVotesDistrust * 100,
                      )}
                    />
                    <VoterBreakdownText
                      text={`Zero ratings: ${distrustScores[username].ratedZerosText}`}
                      score={Math.round(
                        distrustScores[username].ratedZerosDistrust * 100,
                      )}
                    />
                    <VoterBreakdownText
                      text={`Randomness: ${distrustScores[username].randomnessText}`}
                      score={Math.round(
                        distrustScores[username].randomnessDistrust * 100,
                      )}
                    />
                  </>
                ) : (
                  <Typography>
                    No distrust data available for this voter
                  </Typography>
                )}
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
  username: PropTypes.string.isRequired,
  isChecked: PropTypes.bool.isRequired,
  handleCheckOne: PropTypes.func.isRequired,
};
