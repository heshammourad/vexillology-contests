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
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import useBanHistoryTransform from '../../../common/useBanHistoryTransform';
import { ProtectedRoute } from '../../../components';
import useSwrAuth from '../../../data/useSwrAuth';

const { format, isFuture } = require('date-fns');

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
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch active bans from API
  const {
    data: activeBansData,
    error: activeBansError,
    isLoading: activeBansLoading,
  } = useSwrAuth('/mod/activeBans');

  // Transform the data to convert date strings to Date objects
  const transformedActiveBans = useBanHistoryTransform(activeBansData);

  return (
    <ProtectedRoute errorStatus={activeBansError?.response?.status}>
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

      {(() => {
        if (activeBansLoading) {
          return <Typography>Loading active bans...</Typography>;
        }
        if (activeBansError) {
          return (
            <Typography color="error">Error loading active bans</Typography>
          );
        }
        if (transformedActiveBans?.users?.length > 0) {
          return transformedActiveBans.users.map(({ username, history }) => (
            <UserBanHistory key={username} {...{ username, history }} />
          ));
        }
        return (
          <Typography className={classes.italics}>No active bans</Typography>
        );
      })()}
    </ProtectedRoute>
  );
}

function SearchResults({ searchTerm }) {
  // Fetch users from API when search term is provided
  const {
    data: searchData,
    error: searchError,
    isLoading,
  } = useSwrAuth(
    searchTerm
      ? `/mod/userBansSearch?searchTerm=${encodeURIComponent(searchTerm)}`
      : null,
  );

  // Transform the data to convert date strings to Date objects
  const transformedData = useBanHistoryTransform(searchData);

  if (!searchTerm) {
    return <SearchMessages text="Search for a user above" />;
  }

  if (isLoading) {
    return <SearchMessages text="Searching for users..." />;
  }

  if (searchError) {
    return <SearchMessages text="Error searching for users" />;
  }

  if (!transformedData?.users || transformedData.users.length === 0) {
    return <SearchMessages text={`No results for "${searchTerm}"`} />;
  }

  return transformedData.users.map(({ username, history }) => (
    <UserBanHistory key={username} username={username} history={history} />
  ));
}

function SearchMessages({ text }) {
  const classes = useStyles();

  return (
    <Box>
      <br />
      <Typography className={classes.italics}>{text}</Typography>
    </Box>
  );
}

function HistoryItem({
  action: {
    actionType,
    createdDate,
    endDate,
    moderator,
    reason,
    lifted,
    liftedDate,
    liftedModerator,
    liftedReason,
    actionId,
  },
  username,
  hideActionButtons,
}) {
  const classes = useStyles();
  const navigate = useNavigate();

  return (
    <Box className={clsx(classes.row, classes.historyItem)}>
      {!hideActionButtons && (
        <Box sx={{ float: 'right' }}>
          <Button
            color="primary"
            onClick={() => navigate(`/mod/banUsers?u=${username}&a=${actionId}`)}
          >
            Edit
          </Button>
        </Box>
      )}
      <Expiration {...{ actionType, endDate }} isLifted={!!lifted} />
      <Typography>
        {`Issued ${format(createdDate, 'MMM d, yyyy')} by ${moderator}`}
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
  if (endDate === null) {
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
  username,
  history = [],
  hideActionButtons,
  actionId,
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
              && (action.endDate === null || isFuture(action.endDate))
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
              {topLevelAction?.reason}
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
          {!hideActionButtons && (
            <Button
              disabled={
                topLevelAction?.actionType === 'ban'
                && topLevelAction?.endDate === null
              }
              color="primary"
              onClick={() => navigate(`/mod/banUsers?u=${username}`)}
            >
              BAN
            </Button>
          )}
        </Box>
      </Box>
      {showHistory
        && history.map((action) => (
          <HistoryItem
            key={action.actionId}
            action={action}
            username={username}
            hideActionButtons={hideActionButtons}
          />
        ))}
    </Box>
  );
}

export default ViewBans;

SearchResults.propTypes = {
  searchTerm: PropTypes.string.isRequired,
};

SearchMessages.propTypes = {
  text: PropTypes.string.isRequired,
};

const actionType = PropTypes.shape({
  createdDate: PropTypes.instanceOf(Date).isRequired,
  startDate: PropTypes.instanceOf(Date).isRequired,
  moderator: PropTypes.string.isRequired,
  contestId: PropTypes.string.isRequired,
  actionType: PropTypes.oneOf(['ban', 'warn']).isRequired,
  endDate: PropTypes.oneOfType([PropTypes.instanceOf(Date)]),
  reason: PropTypes.string.isRequired,
  actionId: PropTypes.string.isRequired,
  lifted: PropTypes.bool,
  liftedDate: PropTypes.instanceOf(Date),
  liftedModerator: PropTypes.string,
  liftedReason: PropTypes.string,
});

HistoryItem.propTypes = {
  action: actionType.isRequired,
  username: PropTypes.string.isRequired,
  hideActionButtons: PropTypes.bool,
};

HistoryItem.defaultProps = {
  hideActionButtons: false,
};

UserBanHistory.propTypes = PropTypes.shape({
  username: PropTypes.string.isRequired,
  history: PropTypes.arrayOf(actionType).isRequired,
  hideActionButtons: PropTypes.bool,
}).isRequired;

Expiration.propTypes = {
  actionType: PropTypes.oneOf(['ban', 'warn']),
  endDate: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.oneOf([null]),
  ]),
  isLifted: PropTypes.bool.isRequired,
  ignorePastBans: PropTypes.bool,
};

Expiration.defaultProps = {
  actionType: undefined,
  endDate: undefined,
  ignorePastBans: false,
};
