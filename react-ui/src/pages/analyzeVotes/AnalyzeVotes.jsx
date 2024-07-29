/* eslint-disable react/forbid-prop-types */
import Box from '@material-ui/core/Box';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Slider from '@material-ui/core/Slider';
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

const useStyles = makeStyles({
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
});

function UserSelector({
  username, noVotes, setUsername, usernames, title,
}) {
  const classes = useStyles();
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
        {` or use ${arrows} arrows`}
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

  const [voteMinimum, setVoteMinimum] = useState(0);
  const [username, setUsername] = useState('');
  const [username2, setUsername2] = useState('');

  const numberOfEntries = Object.keys(entryAvg).length;
  const usernames = useMemo(() => userAvg.map((ua) => ua.username), [userAvg]);

  const handleMinimumSlider = (event, newValue) => {
    setVoteMinimum(newValue);
  };

  const handleMinimumInput = (event) => {
    setVoteMinimum(event.target.value === '' ? 0 : Number(event.target.value));
  };

  const handleMinimumBlur = () => {
    if (voteMinimum < 0) {
      setVoteMinimum(0);
    } else if (voteMinimum > numberOfEntries) {
      setVoteMinimum(numberOfEntries);
    }
  };

  useEffect(() => {
    setVoteMinimum((prev) => Math.min(prev, numberOfEntries));
  }, [numberOfEntries]);

  useEffect(() => {
    if (!usernames.length) { return; }
    setUsername((prev) => {
      if (prev) {
        if (usernames.includes(prev)) { return prev; }
      }
      return usernames[0];
    });
    setUsername2((prev) => {
      if (prev) {
        if (usernames.includes(prev)) { return prev; }
      }
      return usernames[usernames.length - 1];
    });
  }, [usernames]);

  const entryPositionLookup = useMemo(() => entryAvg
    .reduce((acc, curr, i) => ({ ...acc, [curr.entryId]: i }), {}), [entryAvg]);

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
            <Typography>Contest:&nbsp;</Typography>
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
                  {`${c.name} ${format(parseISO(c.date), 'MMM yy')}`}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box className={classes.sideBySide}>
            <Typography style={{ flexShrink: 0, marginRight: 20 }}>Min votes:</Typography>
            <Slider
              value={voteMinimum}
              onChange={handleMinimumSlider}
              step={1}
              min={0}
              max={numberOfEntries}
            />
            <Input
              value={voteMinimum}
              size="small"
              onChange={handleMinimumInput}
              onBlur={handleMinimumBlur}
              inputProps={{
                step: 1,
                min: 0,
                max: numberOfEntries,
                type: 'number',
                'aria-labelledby': 'input-slider',
              }}
              style={{ width: '60px', marginLeft: 20 }}
            />
          </Box>

          <UserSelector
            title="User: "
            noVotes={!userAvg.length}
            username={username}
            setUsername={setUsername}
            usernames={usernames}
          />

          <Box className={classes.sideBySide}>
            <Box>
              <DeviationFromMean {...{
                username, votes, userAvg, entryAvg, setUsername, voteMinimum,
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
          </Box>

          <UserSelector
            title="User 2: "
            noVotes={!userAvg.length}
            username={username2}
            setUsername={setUsername2}
            usernames={usernames}
          />
          <Box className={classes.sideBySide}>
            <Box>
              <PearsonsCorrelation {...{
                username, username2, votes, entryPositionLookup, setUsername2, voteMinimum,
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

          </Box>
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
