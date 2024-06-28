import Box from '@material-ui/core/Box';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { makeStyles } from '@material-ui/core/styles';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  Header,
  PageContainer,
  ProtectedRoute,
} from '../../components';
import useContestId from '../../data/useContestId';
import useSwrContests from '../../data/useSwrContests';
import useSwrModAnalyze from '../../data/useSwrModAnalyze';

import CompareAverages from './CompareAverages';
import DeviationFromMean from './DeviationFromMean';

const useStyles = makeStyles((theme) => ({
  selector: {
    minWidth: '50%',
    paddingTop: 4,
    paddingBottom: 4,
    marginTop: 20,
    marginBottom: 20,
  },
}));

/**
 * The page for moderators to review contest submissions.
 */
function AnalyzeVotes() {
  const classes = useStyles();
  const contestId = useContestId();
  const { data: contests } = useSwrContests();
  // eslint-disable-next-line max-len
  const contest = useMemo(() => contests.find((c) => c.id === contestId) || contests[0], [contests, contestId]);
  const navigate = useNavigate();
  const {
    data: {
      votes = [], userAvg = [], entryAvg = [], userEntries = [],
    },
    error,
  } = useSwrModAnalyze(contestId);
  const { state } = useLocation();

  const [username, setUsername] = useState('ethyl3517');

  // const averagesByUser = useMemo(() => userAvg.reduce((acc, curr) => ({ ...acc, [curr.username]: curr.average }), {}), [userAvg]);
  // const averagesByEntry = useMemo(() => entryAvg.reduce((acc, curr) => ({ ...acc, [curr.entryId]: curr.average }), {}), [entryAvg]);

  // const sortedEntries = useMemo(() => userEntries
  //   .sort((a, b) => (b.user - a.user) || b.id - a.id), [userEntries]);

  // const entryPositionLookup = useMemo(() => sortedEntries
  //   .reduce((acc, curr, i) => ({ ...acc, [curr.id]: i }), {}), [sortedEntries]);

  return (
    <>
      <Header position="static" to={state?.back ?? '/home'}>
        Analyze votes
      </Header>
      <ProtectedRoute errorStatus={error?.response?.status}>
        <PageContainer>
          <Select
            className={classes.selector}
            value={contest}
            renderValue={(selected) => {
              if (!selected) {
                return <em>Loading...</em>;
              }

              return selected.name;
            }}
            onChange={(event) => navigate(`/mod/analyze/${event.target.value.id}`)}
          >
            {contests.map((c) => (
              <MenuItem key={c.id} value={c}>
                {c.name}
                {' '}
                (
                {format(parseISO(c.date), 'MMM yy')}
                )
              </MenuItem>
            ))}
          </Select>

          <Box>
            <DeviationFromMean {...{
              username, votes, userAvg, entryAvg, setUsername,
            }}
            />
          </Box>
          <Box>
            <CompareAverages {...{
              username, votes, entryAvg,
            }}
            />
          </Box>

        </PageContainer>
      </ProtectedRoute>
    </>
  );
}

export default AnalyzeVotes;
