import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import useSwrAuth from '../../../data/useSwrAuth';

import SectionTitleWithButtons from './SectionTitleWithButtons';
import {
  BanStatusTableText,
  BlackTableText,
  OrangeTableText,
  RedTableText,
  VoteStatusTableText,
} from './TableText';

const KARMA_THRESHOLD = 20;
const VOTED_THRESHOLD = 20;

// Helper function to format age from days
const formatAge = (ageInDays) => {
  if (ageInDays < 30) {
    return `${Math.round(ageInDays)} days`;
  }
  if (ageInDays < 365) {
    const months = Math.round(ageInDays / 30);
    return `${months} mo`;
  }
  return '>1 yr';
};

// Helper function to format karma
const formatKarma = (karma) => {
  if (karma > 1000) {
    return '>1000';
  }
  if (!karma) {
    return 'unk';
  }
  return karma.toString();
};

// Sorting function
const sortData = (data, sortField, sortDirection) => [...data].sort((a, b) => {
  let aValue;
  let bValue;

  switch (sortField) {
    case 'age':
      aValue = parseFloat(a.ageInDays);
      bValue = parseFloat(b.ageInDays);
      break;
    case 'karma':
      aValue = a.karma;
      bValue = b.karma;
      break;
    case 'votePercentage':
      aValue = parseFloat(a.votePercentage);
      bValue = parseFloat(b.votePercentage);
      break;
    case 'username':
      aValue = a.username.toLowerCase();
      bValue = b.username.toLowerCase();
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
  const [sortField, setSortField] = useState('username');
  const [sortDirection, setSortDirection] = useState('asc');
  // Fetch voters data using proper authentication
  const {
    data: { voters: votersData = [] },
    error,
    isLoading,
  } = useSwrAuth(`/mod/analyzeVotes/${contestId}/voters`);

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

  const handleVoterSelection = (v) => {
    // TODO: Implement voter selection functionality
    // eslint-disable-next-line no-unused-vars
    const selectedVoter = v;
  };

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
    () => sortData(votersData, sortField, sortDirection),
    [votersData, sortField, sortDirection],
  );

  if (isLoading) {
    return (
      <>
        <SectionTitleWithButtons title="Voters" buttons={buttons} />
        <div>Loading voters data...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <SectionTitleWithButtons title="Voters" buttons={buttons} />
        <div>Error loading voters data. Please try again.</div>
      </>
    );
  }

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
              <TableCell align="center">
                <TableSortLabel
                  active={sortField === 'age'}
                  direction={sortField === 'age' ? sortDirection : 'asc'}
                  onClick={() => handleSort('age')}
                >
                  Age
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={sortField === 'karma'}
                  direction={sortField === 'karma' ? sortDirection : 'asc'}
                  onClick={() => handleSort('karma')}
                >
                  Karma
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={sortField === 'votePercentage'}
                  direction={
                    sortField === 'votePercentage' ? sortDirection : 'asc'
                  }
                  onClick={() => handleSort('votePercentage')}
                >
                  % voted
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Vote status</TableCell>
              <TableCell align="center">Site ban</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedVotersData.map((voter) => (
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
                  voter.ageInDays < 30 ? (
                    <RedTableText>{formatAge(voter.ageInDays)}</RedTableText>
                  ) : voter.ageInDays < 365 ? (
                    <OrangeTableText>
                      {formatAge(voter.ageInDays)}
                    </OrangeTableText>
                  ) : (
                    <BlackTableText bold center>
                      {formatAge(voter.ageInDays)}
                    </BlackTableText>
                  )
                }

                {voter.karma < KARMA_THRESHOLD ? (
                  <RedTableText>{formatKarma(voter.karma)}</RedTableText>
                ) : (
                  <BlackTableText bold center>
                    {formatKarma(voter.karma)}
                  </BlackTableText>
                )}

                {voter.votePercentage < VOTED_THRESHOLD ? (
                  <RedTableText>{voter.votePercentage}</RedTableText>
                ) : (
                  <BlackTableText bold center>
                    {voter.votePercentage}
                  </BlackTableText>
                )}

                <VoteStatusTableText voteStatus={voter.voteStatus} />

                <BanStatusTableText banStatus={voter.banStatus} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

export default VotersTable;
