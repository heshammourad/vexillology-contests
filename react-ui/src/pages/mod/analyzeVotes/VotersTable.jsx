import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Collapse from '@mui/material/Collapse';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useContestContext } from './ContestContext';
import SectionTitleWithButtons from './SectionTitleWithButtons';
import TableBodyWrapper from './TableBodyWrapper';
import {
  BanStatusTableText,
  ScoreTableText,
  TableTextWrapper,
  VoteStatusTableText,
  VoterBreakdownText,
} from './TableText';
import VoterGraph from './VoterGraph';

// Sorting function
const sortData = (data, sortField, sortDirection) => [...data].sort((a, b) => {
  let aValue;
  let bValue;

  switch (sortField) {
    case 'username':
      aValue = a.username.toLowerCase();
      bValue = b.username.toLowerCase();
      break;
    case 'distrustScore':
      aValue = a.distrustScore || 0;
      bValue = b.distrustScore || 0;
      break;
    default:
      return 0;
  }

  if (sortDirection === 'asc') {
    return aValue > bValue ? 1 : -1;
  }
  return aValue < bValue ? 1 : -1;
});

function VotersTable() {
  const navigate = useNavigate();
  const { contestId } = useParams();
  const [sortField, setSortField] = useState('distrustScore');
  const [sortDirection, setSortDirection] = useState('desc');
  // Use the contest context for all data
  const {
    votersData, votersError, votersLoading, distrustScores,
  } = useContestContext();

  const buttons = useMemo(
    () => [
      {
        color: 'secondary',
        text: 'SWITCH TO ENTRANTS',
        onClick: () => navigate(`/mod/analyze/${contestId}`),
      },
    ],
    [navigate, contestId],
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort the data
  const sortedVotersData = useMemo(
    () => sortData(
      Object.entries(votersData).map(([username, values]) => ({
        username,
        ...values,
        distrustScore: distrustScores[username]?.score || 0,
      })),
      sortField,
      sortDirection,
    ),
    [votersData, distrustScores, sortField, sortDirection],
  );

  return (
    <>
      <SectionTitleWithButtons title="Voters" buttons={buttons} />

      <TableContainer component={Paper} sx={{ marginTop: 1 }}>
        <Table sx={{ minWidth: 650 }} aria-label="sortable table">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'username'}
                  direction={sortField === 'username' ? sortDirection : 'asc'}
                  onClick={() => handleSort('username')}
                >
                  Voter
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Vote status</TableCell>
              <TableCell align="center">Ban status</TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={sortField === 'distrustScore'}
                  direction={
                    sortField === 'distrustScore' ? sortDirection : 'asc'
                  }
                  onClick={() => handleSort('distrustScore')}
                >
                  Voter distrust
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBodyWrapper
            error={votersError}
            errorText="Error occurred loading voters"
            loading={votersLoading}
          >
            <TableBody>
              {sortedVotersData.map((voter) => (
                <VoterRow
                  key={voter.username}
                  username={voter.username}
                  voteStatus={voter.dq}
                />
              ))}
            </TableBody>
          </TableBodyWrapper>
        </Table>
      </TableContainer>
    </>
  );
}

function VoterRow({ username, voteStatus }) {
  const {
    bansData,
    bansError,
    bansLoading,
    distrustScores,
    distrustScoresError,
    distrustScoresLoading,
  } = useContestContext();

  const [showVoter, setShowVoter] = useState(false);

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
          {username}
        </TableCell>

        <TableTextWrapper loading={false} error={false}>
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
      </TableRow>
      <TableRow onClick={() => setShowVoter(false)}>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
          <Collapse in={showVoter} timeout="auto" unmountOnExit>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <VoterGraph voterId={username} />
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: 6,
                marginBottom: 6,
              }}
            >
              <Box
                sx={{
                  flex: '1 1 100%',
                  maxWidth: '600px',
                  textAlign: 'center',
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

VoterRow.propTypes = {
  username: PropTypes.string.isRequired,
  voteStatus: PropTypes.string,
};

VoterRow.defaultProps = {
  voteStatus: undefined,
};

export default VotersTable;
