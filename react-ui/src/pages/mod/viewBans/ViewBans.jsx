import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import SearchIcon from '@mui/icons-material/Search';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ProtectedRoute } from '../../../components';

const {
  format, isFuture, endOfMonth, addMonths,
} = require('date-fns');

const SEARCH_STATUSES = {
  noSearchTerm: 'noSearchTerm',
  failedSearch: 'failedSearch',
  successfulSearch: 'successfulSearch',
};
const SEARCH_STATUS = SEARCH_STATUSES.successfulSearch;

export const SEARCH_RESULTS = [
  {
    username: 'ASmallEye',
    history: [
      {
        startDate: new Date(2024, 7, 29),
        moderator: 'TorteApp',
        contestId: 'sep23',
        actionType: 'ban',
        endDate: 'never',
        reason: 'Syke',
        actionId: 'as1',
        lifted: false,
      },
      {
        startDate: new Date(2024, 6, 20),
        moderator: 'TorteApp',
        contestId: '',
        actionType: 'ban',
        endDate: new Date(2024, 7, 31),
        reason: 'Voted with alt account again',
        actionId: 'as3',
        lifted: true,
        liftedDate: new Date(2024, 6, 30),
        liftedModerator: 'TorteApp',
        liftedReason: 'Contrition',
      },
      {
        startDate: new Date(2024, 5, 2),
        moderator: 'TorteApp',
        contestId: '',
        actionType: 'warn',
        endDate: 'never',
        reason: 'Voted with alt account',
        actionId: 'as4',
        lifted: false,
      },
    ],
  },
];

export const BANNED_USERS = [
  {
    username: 'joshuauiux',
    history: [
      {
        startDate: new Date(2024, 11, 17),
        moderator: 'TorteApp',
        contestId: '',
        actionType: 'ban',
        endDate: 'never',
        reason: 'Created 40 fake accounts to boost score in Jan 25 contest.',
        actionId: 'as5',
        lifted: false,
      },
    ],
  },
  {
    username: 'WorkingKing',
    history: [
      {
        startDate: new Date(2024, 11, 17),
        moderator: 'bakonydraco',
        contestId: '',
        actionType: 'ban',
        endDate: endOfMonth(addMonths(new Date(), 3)),
        reason: 'Created 3 fake accounts to boost score in Jan 25 contest.',
        lifted: false,
      },
    ],
  },
];

const useStyles = makeStyles({
  banRed: {
    color: '#EB0000',
  },
  neutralGrey: {
    color: '#898989',
  },
  historyItem: {
    marginLeft: '20px',
  },
  italics: {
    fontStyle: 'italic',
  },
  searchBar: {
    minWidth: '50%',
  },
  sectionHeader: {
    maxWidth: 'fit-content',
    borderBottom: '1px solid #000',
    fontWeight: 'lighter',
  },
  row: {
    borderBottom: '1px solid #ccc',
    padding: '8px 0 8px 0',
    '&:last-child': {
      borderBottom: 'none', // Remove border for the last item
    },
  },
  warnOrange: {
    color: '#EB7D00',
  },
});

/**
 * The page for moderators to manage bans
 */
function ViewBans() {
  const classes = useStyles();
  const error = {};
  const [searchTerm, setSearchTerm] = useState('');

  // FOR DEV PURPOSES ONLY
  useEffect(() => {
    setSearchTerm(
      // eslint-disable-next-line no-nested-ternary
      SEARCH_STATUS === SEARCH_STATUSES.noSearchTerm
        ? ''
        : SEARCH_STATUS === SEARCH_STATUSES.failedSearch
          ? 'quoix'
          : 'asmall',
    );
  }, [SEARCH_STATUS]);

  return (
    <ProtectedRoute errorStatus={error?.response?.status}>
      <br />
      <br />
      <br />

      <h1 className={classes.sectionHeader}>Search for user</h1>

      <FormControl sx={{ marginBottom: 1, minWidth: '33%' }} variant="outlined">
        <InputLabel htmlFor="search">Enter username</InputLabel>
        <OutlinedInput
          sx={{ minWidth: '50%' }}
          id="search"
          type="text"
          endAdornment={(
            <InputAdornment position="end">
              <IconButton
                aria-label="search"
                // onClick={handleClickShowPassword}
                edge="end"
              >
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          )}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <FormHelperText>Case insensitive</FormHelperText>
      </FormControl>

      <SearchResults {...{ searchTerm }} />

      <br />

      <h1 className={classes.sectionHeader}>Active bans</h1>

      {BANNED_USERS.map(({ username, history }) => (
        <UserBanHistory key={username} {...{ username, history }} showBanButton />
      ))}
    </ProtectedRoute>
  );
}

function SearchResults({ searchTerm }) {
  const classes = useStyles();

  if (!searchTerm) {
    return (
      <Box>
        <br />
        <Typography className={classes.italics}>
          Search for a user above
        </Typography>
      </Box>
    );
  }
  if (SEARCH_STATUS === SEARCH_STATUSES.failedSearch) {
    return (
      <Box>
        <br />
        <Typography className={classes.italics}>
          {`No results for "${searchTerm}"`}
        </Typography>
      </Box>
    );
  }
  return SEARCH_RESULTS.map(({ username, history }) => (
    <UserBanHistory key={username} {...{ username, history }} showBanButton />
  ));
}

function HistoryItem({
  action: {
    actionType,
    startDate,
    endDate,
    moderator,
    reason,
    lifted,
    liftedDate,
    liftedModerator,
    liftedReason,
  },
}) {
  const classes = useStyles();

  return (
    <Box className={clsx(classes.row, classes.historyItem)}>
      <Box sx={{ float: 'right' }}>
        <Button color="primary">Edit</Button>
      </Box>
      <Expiration {...{ actionType, endDate }} isLifted={!!lifted} />
      <Typography>
        {`Issued ${format(startDate, 'MMM d, yyyy')} by ${moderator}`}
      </Typography>
      <Typography className={classes.italics}>{reason}</Typography>
      {!!lifted && (
        <>
          <Typography>
            {`Lifted ${format(
              liftedDate,
              'MMM d, yyyy',
            )} by ${liftedModerator}`}
          </Typography>
          <Typography className={classes.italics}>
            {liftedReason || 'No reason given'}
          </Typography>
        </>
      )}
    </Box>
  );
}

function Expiration({
  actionType, endDate, isLifted, ignorePastBans,
}) {
  const classes = useStyles();
  const prefix = isLifted ? '(LIFTED) ' : '';
  if (!actionType) {
    return (
      <Typography className={classes.neutralGrey} component="span">
        <b>NO ACTIVE BANS</b>
      </Typography>
    );
  }
  if (actionType === 'warn') {
    return (
      <Typography
        className={isLifted ? classes.neutralGrey : classes.warnOrange}
        component="span"
      >
        <b>
          {prefix}
          WARNING
        </b>
      </Typography>
    );
  }
  if (endDate === 'never') {
    return (
      <Typography
        className={isLifted ? classes.neutralGrey : classes.banRed}
        component="span"
      >
        <b>
          {prefix}
          PERMANENT BAN
        </b>
      </Typography>
    );
  }
  const inTheFuture = isFuture(endDate);
  if (!inTheFuture) {
    if (ignorePastBans) {
      return (
        <Typography className={classes.neutralGrey} component="span">
          <b>NO ACTIVE BANS</b>
        </Typography>
      );
    }
    return (
      <Typography className={classes.neutralGrey} component="span">
        <b>
          {prefix}
          BAN EXPIRED
          {' '}
          {format(endDate, 'MMM d, yyyy').toUpperCase()}
        </b>
      </Typography>
    );
  }
  return (
    <Typography
      className={isLifted ? classes.neutralGrey : classes.banRed}
      component="span"
    >
      <b>
        {prefix}
        BANNED UNTIL
        {' '}
        {format(endDate, 'MMM d, yyyy').toUpperCase()}
      </b>
    </Typography>
  );
}

export function UserBanHistory({
  username, history, showBanButton, actionId,
}) {
  const classes = useStyles();
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);

  // Report most recent active ban. Otherwise, report on most recent warning
  const topLevelAction = useMemo(
    () => (actionId
      ? history.find((a) => a.actionId === actionId)
      : history.reduce((topLevel, action) => {
        if (topLevel.actionType === 'ban') {
          return topLevel;
        }
        if (
          action.actionType === 'ban'
              && (action.endDate === 'never' || isFuture(action.endDate))
              && !action.lifted
        ) {
          return action;
        }
        if (topLevel.actionType === 'warn') {
          return topLevel;
        }
        if (action.actionType === 'warn' && !action.lifted) {
          return action;
        }
        return topLevel;
      }, {})),
    [actionId, history],
  );

  return (
    <Box className={classes.row}>
      <Box display="flex">
        <Box sx={{ flex: 1, alignSelf: 'center' }}>
          <Box>
            <Typography component="span">
              <b>
                {username}
                {' '}
                -
              </b>
              {' '}
            </Typography>
            <Expiration
              actionType={topLevelAction?.actionType}
              endDate={topLevelAction?.endDate}
              isLifted={!!topLevelAction?.lifted}
              ignorePastBans
            />
          </Box>
          {topLevelAction?.reason && (
            <Typography className={classes.italics}>
              {topLevelAction.reason}
            </Typography>
          )}
        </Box>
        <Box>
          <Button
            color="secondary"
            onClick={() => setShowHistory((prev) => !prev)}
            disabled={!history.length}
          >
            {/* eslint-disable-next-line no-nested-ternary */}
            {history.length
              ? !showHistory
                ? 'History'
                : 'Hide'
              : 'No history'}
          </Button>
          {showBanButton && (
            <Button
              disabled={
                topLevelAction.actionType === 'ban'
                && topLevelAction.endDate === 'never'
              }
              color="primary"
              onClick={() => navigate('/mod/banUsers')}
            >
              BAN
            </Button>
          )}
        </Box>
      </Box>
      {showHistory
        && history.map((action) => (
          <HistoryItem key={action.actionId} action={action} />
        ))}
    </Box>
  );
}

export default ViewBans;

SearchResults.propTypes = {
  searchTerm: PropTypes.string.isRequired,
};

const actionType = PropTypes.shape({
  startDate: PropTypes.instanceOf(Date).isRequired,
  moderator: PropTypes.string.isRequired,
  contestId: PropTypes.string.isRequired,
  actionType: PropTypes.oneOf(['ban', 'warn']).isRequired,
  endDate: PropTypes.oneOfType([
    PropTypes.oneOf(['never']),
    PropTypes.instanceOf(Date),
  ]).isRequired,
  reason: PropTypes.string.isRequired,
  actionId: PropTypes.string.isRequired,
  lifted: PropTypes.bool,
  liftedDate: PropTypes.instanceOf(Date),
  liftedModerator: PropTypes.string,
  liftedReason: PropTypes.string,
});

HistoryItem.propTypes = { ...actionType };

UserBanHistory.propTypes = PropTypes.shape({
  username: PropTypes.string.isRequired,
  history: PropTypes.arrayOf(actionType).isRequired,
  showBanButton: PropTypes.bool,
}).isRequired;

Expiration.propTypes = {
  actionType: PropTypes.oneOf(['ban', 'warn']).isRequired,
  endDate: PropTypes.oneOfType([
    PropTypes.oneOf(['never']),
    PropTypes.instanceOf(Date),
  ]).isRequired,
  isLifted: PropTypes.bool.isRequired,
  ignorePastBans: PropTypes.bool,
};

Expiration.defaultProps = {
  ignorePastBans: false,
};
