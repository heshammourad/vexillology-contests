/*
TO-DO

Header is hiding top of pages
Fetch search results (with search button)
Fetch history in active ban (and check display)
Do warnings have an expiration?
*/

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
import { useEffect, useState } from 'react';
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

const SEARCH_RESULTS = [
  {
    username: 'ASmallEye',
    history: [
      {
        issueDate: new Date(2024, 7, 29),
        modName: 'TorteApp',
        contestID: '',
        actionType: 'ban',
        expiryDate: 'never',
        reason: 'Syke',
        actionID: 'as1',
      },
      {
        issueDate: new Date(2024, 7, 1),
        modName: 'TorteApp',
        contestID: '',
        actionType: 'ban',
        expiryDate: null,
        reason: 'Ban was reversed due to contrition',
        actionID: 'as2',
      },
      {
        issueDate: new Date(2024, 6, 20),
        modName: 'TorteApp',
        contestID: '',
        actionType: 'ban',
        expiryDate: new Date(2024, 7, 31),
        reason: 'Voted with alt account again',
        actionID: 'as3',
      },
      {
        issueDate: new Date(2024, 5, 2),
        modName: 'TorteApp',
        contestID: '',
        actionType: 'warn',
        expiryDate: null,
        reason: 'Voted with alt account',
        actionID: 'as4',
      },
    ],
  },
];

export const BANNED_USERS = [
  {
    username: 'joshuauiux',
    history: [
      {
        issueDate: new Date(2024, 11, 17),
        modName: 'TorteApp',
        contestID: '',
        actionType: 'ban',
        expiryDate: 'never',
        reason: 'Created 40 fake accounts to boost score in Jan 25 contest.',
        actionID: 'as5',
      },
    ],
  },
  {
    username: 'WorkingKing',
    history: [
      {
        issueDate: new Date(2024, 11, 17),
        modName: 'bakonydraco',
        contestID: '',
        actionType: 'ban',
        expiryDate: endOfMonth(addMonths(new Date(), 3)),
        reason: 'Created 3 fake accounts to boost score in Jan 25 contest.',
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
    // eslint-disable-next-line no-nested-ternary
    setSearchTerm(
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
          helperText="Case insensitive"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <FormHelperText>Case insensitive</FormHelperText>
      </FormControl>

      <SearchResults {...{ searchTerm }} />

      <br />

      <h1 className={classes.sectionHeader}>Active bans</h1>

      {BANNED_USERS.map(({ username, history }) => (
        <UserBanHistory
          key={username}
          {...{ username, history }}
          isActiveBans
          showBanButton
        />
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
    actionType, issueDate, expiryDate, modName, reason,
  },
}) {
  const classes = useStyles();

  return (
    <Box className={clsx(classes.row, classes.historyItem)}>
      <Box sx={{ float: 'right' }}>
        <Button color="primary">Edit</Button>
      </Box>
      <Expiration {...{ actionType, expiryDate }} />
      <Typography>
        {`Issued ${format(issueDate, 'MMM d, yyyy')} by ${modName}`}
      </Typography>
      <Typography className={classes.italics}>{reason}</Typography>
    </Box>
  );
}

function Expiration({ actionType, expiryDate, ignorePastBans }) {
  const classes = useStyles();
  if (!actionType) {
    return (
      <Typography className={classes.neutralGrey} component="span">
        <b>NO ACTIVE BANS</b>
      </Typography>
    );
  }
  if (actionType === 'warn') {
    return (
      <Typography className={classes.warnOrange} component="span">
        <b>WARNING</b>
      </Typography>
    );
  }
  if (expiryDate === 'never') {
    return (
      <Typography className={classes.banRed} component="span">
        <b>PERMANENT BAN</b>
      </Typography>
    );
  }
  if (expiryDate === null) {
    return (
      <Typography className={classes.banRed} component="span">
        <b>BAN LIFTED</b>
      </Typography>
    );
  }
  const inTheFuture = isFuture(expiryDate);
  if (!inTheFuture) {
    if (ignorePastBans) {
      return (
        <Typography className={classes.neutralGrey} component="span">
          <b>NO ACTIVE BANS</b>
        </Typography>
      );
    }
    return (
      <Typography className={classes.banRed} component="span">
        <b>
          BAN EXPIRED
          {format(expiryDate, 'MMM d, yyyy').toUpperCase()}
        </b>
      </Typography>
    );
  }
  return (
    <Typography className={classes.banRed} component="span">
      <b>
        BANNED UNTIL
        {format(expiryDate, 'MMM d, yyyy').toUpperCase()}
      </b>
    </Typography>
  );
}

export function UserBanHistory({
  username,
  history,
  isActiveBans,
  showBanButton,
}) {
  const classes = useStyles();
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);

  // const activeBan = useMemo(() => {
  //   if (!history.length) { return null; }
  //   // const ban = history.find((action) => action.actionType === 'ban' && (action.expiryDate === 'never' || isFuture(action.expiryDate)));
  //   // if (ban) { return ban; }
  //   // return null;
  // }, [history]);

  const mostRecentBan = history[0];

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
              actionType={mostRecentBan?.actionType}
              expiryDate={mostRecentBan?.expiryDate}
              ignorePastBans
            />
          </Box>
          {mostRecentBan && (
            <Typography className={classes.italics}>
              {mostRecentBan.reason}
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
            <Button color="primary" onClick={() => navigate('/mod/banUsers')}>
              {isActiveBans ? 'UNBAN' : 'BAN'}
            </Button>
          )}
        </Box>
      </Box>
      {showHistory
        && history.map((action) => (
          <HistoryItem key={action.actionID} action={action} />
        ))}
    </Box>
  );
}

export default ViewBans;

SearchResults.propTypes = {
  searchTerm: PropTypes.string.isRequired,
};

const actionType = PropTypes.shape({
  issueDate: PropTypes.instanceOf(Date).isRequired,
  modName: PropTypes.string.isRequired,
  contestID: PropTypes.string.isRequired,
  actionType: PropTypes.oneOf(['ban', 'warn']).isRequired,
  expiryDate: PropTypes.oneOfType([
    PropTypes.oneOf(['never', null]),
    PropTypes.instanceOf(Date),
  ]).isRequired,
  reason: PropTypes.string.isRequired,
  actionID: PropTypes.string.isRequired,
});

HistoryItem.propTypes = { ...actionType };

UserBanHistory.propTypes = PropTypes.shape({
  username: PropTypes.string.isRequired,
  history: PropTypes.arrayOf(actionType).isRequired,
  isActiveBans: PropTypes.bool,
  showBanButton: PropTypes.bool,
}).isRequired;

Expiration.propTypes = {
  actionType: PropTypes.oneOf(['ban', 'warn']).isRequired,
  expiryDate: PropTypes.oneOfType([
    PropTypes.oneOf(['never']),
    PropTypes.instanceOf(Date),
  ]),
  ignorePastBans: PropTypes.bool,
};

Expiration.defaultProps = {
  expiryDate: null,
};
