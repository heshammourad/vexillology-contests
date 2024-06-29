/* eslint-disable react/forbid-prop-types */
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import PropTypes, { object, string } from 'prop-types';
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
import CompareVotes from './CompareVotes';
import DeviationFromMean from './DeviationFromMean';
import PearsonsCorrelation from './PearsonsCorrelation';

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

function UserSelector({
  username, noVotes, setUsername, usernames, title,
}) {
  const classes = useStyles(0);
  const arrows = title === 'User: ' ? 'left-right' : 'up-down';

  return (
    <Box className={classes.sideBySide}>
      <Typography>{title}</Typography>
      <Select
        className={classes.selector}
        value={username}
        disabled={noVotes}
        renderValue={(selected) => {
          if (noVotes) {
            return <em>No votes recorded</em>;
          }

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
      <Typography style={{ marginLeft: 10 }}>
        {' '}
        or use
        {' '}
        {arrows}
        {' '}
        arrows
      </Typography>
    </Box>
  );
}

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
  const [username2, setUsername2] = useState('');

  const usernamesAlpha = useMemo(() => userAvg.map((ua) => ua.username), [userAvg]);

  useEffect(() => {
    if (!usernamesAlpha.length) { return; }
    setUsername((prev) => {
      if (prev) {
        if (usernamesAlpha.includes(prev)) { return prev; }
      }
      return usernamesAlpha[0];
    });
    setUsername2((prev) => {
      if (prev) {
        if (usernamesAlpha.includes(prev)) { return prev; }
      }
      return usernamesAlpha[usernamesAlpha.length - 1];
    });
  }, [usernamesAlpha]);

  // eslint-disable-next-line max-len
  const entryUserLookup = useMemo(() => userEntries.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.user }), {}), [userEntries]);

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

          <UserSelector
            title="User: "
            noVotes={!userAvg.length}
            username={username}
            setUsername={setUsername}
            usernames={usernamesAlpha}
          />

          <Container className={classes.sideBySide}>
            <Box>
              <DeviationFromMean {...{
                username, votes, userAvg, entryAvg, setUsername,
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
          <UserSelector
            title="User 2: "
            noVotes={!userAvg.length}
            username={username2}
            setUsername={setUsername2}
            usernames={usernamesAlpha}
          />
          <Container className={classes.sideBySide}>
            <Box>
              <PearsonsCorrelation {...{
                username, username2, votes, entryAvg, setUsername2,
              }}
              />
            </Box>
            <Box>
              <CompareVotes {...{
                username, votes, entryAvg, entryUserLookup, username2,
              }}
              />
            </Box>
          </Container>
        </PageContainer>

      </ProtectedRoute>
    </>
  );
}

export default AnalyzeVotes;

UserSelector.propTypes = {
  usernames: PropTypes.arrayOf(string).isRequired,
  username: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  setUsername: PropTypes.func.isRequired,
  noVotes: PropTypes.bool.isRequired,
};
