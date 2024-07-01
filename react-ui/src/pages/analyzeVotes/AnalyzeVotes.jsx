/* eslint-disable react/forbid-prop-types */
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import PropTypes from 'prop-types';
import {
  useEffect, useMemo, useState,
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

import DeviationFromMean from './DeviationFromMean';
import PearsonsCorrelation from './PearsonsCorrelation';
import UserVsAverage from './UserVsAverage';
import UserVsUser from './UserVsUser';

const useStyles = makeStyles(() => ({
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
  const arrows = title === 'User 1: ' ? 'left-right' : 'up-down';

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

  const entryPositionLookup = useMemo(() => entryAvg
    .reduce((acc, curr, i) => ({ ...acc, [curr.entryId]: i }), {}), [entryAvg]);

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
              <Typography><em>Double-click on an axis to remove the zoom</em></Typography>

            </Box>
            <Box>
              <UserVsAverage {...{
                username, votes, entryAvg, entryUserLookup, entryPositionLookup,
              }}
              />
              <Typography><em>Double-click on an axis to remove the zoom</em></Typography>

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
                username, username2, votes, entryPositionLookup, setUsername2,
              }}
              />
              <Typography><em>Double-click on an axis to remove the zoom</em></Typography>

            </Box>
            <Box>
              <UserVsUser {...{
                username, votes, entryAvg, entryUserLookup, username2, entryPositionLookup,
              }}
              />
              <Typography><em>Double-click on an axis to remove the zoom</em></Typography>
            </Box>

          </Container>
        </PageContainer>

      </ProtectedRoute>
    </>
  );
}

export default AnalyzeVotes;

UserSelector.propTypes = {
  usernames: PropTypes.arrayOf(PropTypes.string).isRequired,
  username: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  setUsername: PropTypes.func.isRequired,
  noVotes: PropTypes.bool.isRequired,
};
