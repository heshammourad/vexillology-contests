import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
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
    minWidth: '60%',
    paddingTop: 4,
    paddingBottom: 4,
    marginLeft: 8,
  },
  sideBySide: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
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

  const [username, setUsername] = useState('');
  const usernames = useMemo(() => userAvg.map((ua) => ua.username), [userAvg]);

  // eslint-disable-next-line max-len
  const entryUserLookup = useMemo(() => userEntries.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.user }), {}), [userEntries]);

  const handleKeyUp = useCallback(({ key }) => {
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      setUsername((prev) => {
        const index = usernames.indexOf(prev);
        if (key === 'ArrowLeft') {
          return usernames[index - 1] || usernames[usernames.length - 1];
        }
        return usernames[index + 1] || usernames[0];
      });
    }
  }, [usernames]);

  useEffect(() => {
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyUp]);

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
          <Box className={classes.sideBySide}>
            <Typography>Contest: </Typography>
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
          </Box>

          <Box className={classes.sideBySide}>
            <Typography>User: </Typography>
            <Select
              className={classes.selector}
              value={username}
              renderValue={(selected) => {
                if (!selected) {
                  return <em>Loading...</em>;
                }

                return selected;
              }}
              onChange={(event) => setUsername(event.target.value)}
            >
              {usernames.map((u) => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </PageContainer>

      </ProtectedRoute>
      <Container className={classes.sideBySide}>
        <Box>
          <DeviationFromMean {...{
            username, votes, userAvg, entryAvg, setUsername, usernames,
          }}
          />
        </Box>
        <Box>
          <CompareAverages {...{
            username, votes, entryAvg, entryUserLookup,
          }}
          />
        </Box>
      </Container>
    </>
  );
}

export default AnalyzeVotes;
