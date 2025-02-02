/*
TO-DO

Header is hiding top of pages
Fetch search results (with search button)
Fetch history in active ban (and check display)
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
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ProtectedRoute } from '../../../components';

const { format } = require('date-fns');

const NO_SEARCH_RESULTS = false;
const SEARCH_RESULTS = NO_SEARCH_RESULTS
  ? []
  : [
    {
      username: 'ASmallEye',
      history: [
        {
          issueDate: new Date(),
          modName: 'TorteApp',
          contestID: '',
          action: 'ban',
          expiryDate: 'never',
          reason: 'Syke',
          actionID: 'as1',
        },
        {
          issueDate: new Date(),
          modName: 'TorteApp',
          contestID: '',
          action: 'ban',
          expiryDate: null,
          reason: 'Ban was reversed due to contrition',
          actionID: 'as2',
        },
        {
          issueDate: new Date(),
          modName: 'TorteApp',
          contestID: '',
          action: 'ban',
          expiryDate: new Date(),
          reason: 'Voted with alt account again',
          actionID: 'as3',
        },
        {
          issueDate: new Date(),
          modName: 'TorteApp',
          contestID: '',
          action: 'warning',
          expiryDate: null,
          reason: 'Voted with alt account',
          actionID: 'as4',
        },
      ],
    },
  ];
const BANNED_USERS = [
  {
    username: 'joshuauiux',
    action: {
      issueDate: new Date(),
      modName: 'TorteApp',
      contestID: '',
      action: 'ban',
      expiryDate: 'never',
      reason: 'Created 40 fake accounts to boost score in Jan 25 contest.',
      actionID: 'as5',
    },
  },
  {
    username: 'WorkingKing',
    action: {
      issueDate: new Date(),
      modName: 'bakonydraco',
      contestID: '',
      action: 'ban',
      expiryDate: new Date(),
      reason: 'Created 3 fake accounts to boost score in Jan 25 contest.',
    },
  },
];

const useStyles = makeStyles({
  banRed: {
    color: '#EB0000',
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
  const [searchTerm, setSearchTerm] = useState('asmall');

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
        />
        <FormHelperText>Case insensitive</FormHelperText>
      </FormControl>

      <SearchResults {...{ searchTerm }} />

      <br />

      <h1 className={classes.sectionHeader}>Active bans</h1>

      {BANNED_USERS.map(({ username, action }) => (
        <BannedUser key={username} {...{ username, action }} />
      ))}
    </ProtectedRoute>
  );
}

function SearchResults({ searchTerm }) {
  const classes = useStyles();

  if (!searchTerm) {
    return (
      <Typography className={classes.italics}>
        Search for a user above
      </Typography>
    );
  }
  if (!SEARCH_RESULTS.length) {
    return (
      <Typography className={classes.italics}>
        {`No results for "${searchTerm}"`}
      </Typography>
    );
  }
  return SEARCH_RESULTS.map(({ username, history }) => (
    <BanHistory key={username} {...{ username, history }} />
  ));
}

function BanHistory({ username, history }) {
  const classes = useStyles();
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();
  return (
    <Box className={classes.row}>
      <Box display="flex" sx={{ alignItems: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <Typography>
            <b>{username}</b>
          </Typography>
        </Box>
        <Button
          color="secondary"
          onClick={() => setShowHistory((prev) => !prev)}
        >
          {!showHistory ? 'History' : 'Hide'}
        </Button>
        <Button color="primary" onClick={() => navigate('/mod/banUsers')}>
          BAN
        </Button>
      </Box>
      {showHistory
        && history.map((action) => (
          <ActionItem key={action.actionID} action={action} />
        ))}
    </Box>
  );
}

function ActionItem({
  action: {
    action, issueDate, expiryDate, modName, reason,
  },
}) {
  const classes = useStyles();

  return (
    <Box className={clsx(classes.row, classes.historyItem)}>
      <Box sx={{ float: 'right' }}>
        <Button color="primary">Edit</Button>
      </Box>
      <Expiration {...{ action, issueDate, expiryDate }} />
      <Typography>
        {`Issued ${format(issueDate, 'MMM d, yyyy')} by ${modName}`}
      </Typography>
      <Typography className={classes.italics}>{reason}</Typography>
    </Box>
  );
}

function Expiration({ action, expiryDate, issueDate }) {
  const classes = useStyles();
  if (action === 'warning') {
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
  return (
    <Typography className={classes.banRed} component="span">
      <b>
        BANNED UNTIL
        {format(issueDate, 'MMM d, yyyy').toUpperCase()}
      </b>
    </Typography>
  );
}

function BannedUser({
  username,
  action: {
    issueDate, modName, contestID, action, expiryDate, reason, actionID,
  },
}) {
  const classes = useStyles();
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState(undefined);

  return (
    <Box className={classes.row}>
      <Box sx={{ float: 'right' }}>
        {/* Should: fill search bar, scroll up, and auto-expand */}
        {/* or should it just open underneath? */}
        <Button
          color="secondary"
          onClick={() => setShowHistory((prev) => !prev)}
        >
          {!showHistory ? 'History' : 'Hide'}
        </Button>
        <Button color="primary">Edit</Button>
      </Box>
      <Box>
        <Typography component="span">
          <b>
            {username}
            {' '}
            -
          </b>
          {' '}
        </Typography>
        <Expiration {...{ action, expiryDate, issueDate }} />
        {showHistory && (
          <Typography>
            {`Issued ${format(issueDate, 'MMM d, yyyy')} by ${modName}`}
          </Typography>
        )}
      </Box>
      <Typography className={classes.italics}>{reason}</Typography>

      {showHistory
        && history?.map(
          (h) => actionID !== h.actionID && (
          <ActionItem key={h.actionID} action={h} />
          ),
        )}
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
  action: PropTypes.oneOf(['ban', 'warning']).isRequired,
  expiryDate: PropTypes.oneOfType([
    PropTypes.oneOf(['never', null]),
    PropTypes.instanceOf(Date),
  ]).isRequired,
  reason: PropTypes.string.isRequired,
  actionID: PropTypes.string.isRequired,
});

ActionItem.propTypes = { ...actionType };

BanHistory.propTypes = PropTypes.shape({
  username: PropTypes.string.isRequired,
  history: PropTypes.arrayOf(actionType),
}).isRequired;

BannedUser.propTypes = PropTypes.shape({
  username: PropTypes.string.isRequired,
  action: actionType,
}).isRequired;

Expiration.propTypes = {
  issueDate: PropTypes.instanceOf(Date).isRequired,
  action: PropTypes.oneOf(['ban', 'warning']).isRequired,
  expiryDate: PropTypes.oneOfType([
    PropTypes.oneOf(['never']),
    PropTypes.instanceOf(Date),
  ]),
};

Expiration.defaultProps = {
  expiryDate: null,
};
