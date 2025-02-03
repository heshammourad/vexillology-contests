/*
TO-DO

Is lifting a ban a separate actionType?
*/

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import Paper from '@mui/material/Paper';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import PropTypes from 'prop-types';
import { useState } from 'react';

import { ProtectedRoute, ContestSelector } from '../../../components';
import SectionTitleWithButtons from '../analyzeVotes/SectionTitleWithButtons';
import { BANNED_USERS, UserBanHistory } from '../viewBans/ViewBans';

const { format, addMonths, endOfMonth } = require('date-fns');

const BAN_ORIGINS = {
  newIndividual: 'newIndividual',
  editIndividual: 'editIndividual',
  fromContest: 'fromContest',
};
const BAN_ORIGIN = BAN_ORIGINS.editIndividual;

const USER_STATUSES = {
  newIndividual: BANNED_USERS[0],
  editIndividual: BANNED_USERS[0],
  fromContest: BANNED_USERS,
};

const useStyles = makeStyles({
  italics: {
    fontStyle: 'italic',
  },
  sectionHeader: {
    maxWidth: 'fit-content',
    borderBottom: '1px solid #000',
    fontWeight: 'lighter',
  },
  selector: {
    width: '100%',
    paddingTop: 4,
    paddingBottom: 4,
  },
});

/**
 * The page for moderators to create / edit a ban / warning
 */
function BanUsers() {
  const classes = useStyles();
  const error = {};

  const [contestId, setContestId] = useState('');
  const [months, setMonths] = useState(1);
  const [actionType, setActionType] = useState('ban');
  const [banIssueDate, setBanIssueDate] = useState(new Date());
  const [isPermanentBan, setIsPermanentBan] = useState(false);

  const [dqVoters, setDqVoters] = useState(new Set());
  const [removeEntrants, setRemoveEntrants] = useState(new Set());
  const [warnUsers, setWarnUsers] = useState(new Set());
  const [banUsers, setBanUsers] = useState(new Set());

  const usernames = USER_STATUSES.fromContest.map((u) => u.username);

  const sectionHeader = () => {
    if (BAN_ORIGIN === BAN_ORIGINS.newIndividual) {
      return `Ban ${USER_STATUSES.newIndividual.username}`;
    }
    if (BAN_ORIGIN === BAN_ORIGINS.editIndividual) {
      return `Edit ban on ${USER_STATUSES.editIndividual.username}`;
    }
    if (USER_STATUSES.fromContest.length > 2) {
      return `Take action on ${USER_STATUSES.fromContest.length} users`;
    }
    return `Take action on ${USER_STATUSES.fromContest[0].username}`;
  };

  const isBan = (BAN_ORIGIN !== BAN_ORIGINS.fromContest && actionType === 'ban')
    || (BAN_ORIGIN === BAN_ORIGINS.fromContest && !!banUsers.size);

  const banExpiryDate = endOfMonth(addMonths(banIssueDate, months));

  return (
    <ProtectedRoute errorStatus={error?.response?.status}>
      <br />
      <br />
      <br />
      <h1 className={classes.sectionHeader}>{sectionHeader}</h1>

      {BAN_ORIGIN === BAN_ORIGINS.fromContest ? (
        <BanMultipleUsers
          {...{
            dqVoters,
            setDqVoters,
            removeEntrants,
            setRemoveEntrants,
            warnUsers,
            setWarnUsers,
            banUsers,
            setBanUsers,
            usernames,
          }}
        />
      ) : (
        <Box sx={{ backgroundColor: '#ddd', padding: '8px' }}>
          <UserBanHistory
            username={USER_STATUSES[BAN_ORIGIN].username}
            history={USER_STATUSES[BAN_ORIGIN].history}
          />
        </Box>
      )}

      <h1 className={classes.sectionHeader}>
        {BAN_ORIGIN === BAN_ORIGINS.editIndividual ? 'Edit' : 'New'}
        {' '}
        ban/warning
      </h1>

      <Typography>
        <b>Warn or ban?</b>
      </Typography>

      <FormControl sx={{ ml: '16px' }}>
        <RadioGroup
          row
          aria-labelledby="ban-or-warning-radio-buttons-group"
          name="ban-or-warning-radio-buttons-group"
          defaultValue="ban"
        >
          <FormControlLabel
            value="warn"
            control={<Radio onClick={() => setActionType('warn')} />}
            label="Warn"
          />
          <FormControlLabel
            // disabled={BAN_ORIGIN !== BAN_ORIGINS.editIndividual}
            value="ban"
            control={<Radio onClick={() => setActionType('ban')} />}
            label="Ban"
          />
        </RadioGroup>
      </FormControl>

      <Separator />

      {isBan && (
        <>
          <Typography>
            <b>Ban length</b>
          </Typography>
          <Box display="flex" sx={{ alignItems: 'center' }}>
            <TextField
              id="banLength"
              variant="outlined"
              size="small"
              type={isPermanentBan ? 'text' : 'number'}
              value={isPermanentBan ? '∞' : months}
              onChange={(event) => setMonths(event.target.value)}
              style={{ width: 100 }}
              disabled={isPermanentBan}
            />
            <Typography component="span">&nbsp;&nbsp;months</Typography>

            <FormControl sx={{ ml: '16px' }}>
              <RadioGroup
                row
                aria-labelledby="demo-row-radio-buttons-group-label"
                name="row-radio-buttons-group"
                defaultValue="today"
              >
                <FormControlLabel
                  disabled={isPermanentBan}
                  value="today"
                  control={
                    <Radio onClick={() => setBanIssueDate(new Date())} />
                  }
                  label="from today"
                />
                <FormControlLabel
                  disabled={
                    isPermanentBan || BAN_ORIGIN !== BAN_ORIGINS.editIndividual
                  }
                  value="issue"
                  control={(
                    <Radio
                      onClick={() => setBanIssueDate(
                        USER_STATUSES.editIndividual.action.issueDate,
                      )}
                    />
                  )}
                  label="from the issue date"
                />
              </RadioGroup>
            </FormControl>
          </Box>

          <FormGroup style={{ margin: '8px 0' }}>
            <FormControlLabel
              control={(
                <Checkbox
                  checked={isPermanentBan}
                  onChange={() => setIsPermanentBan((prev) => !prev)}
                />
              )}
              label="This is a permanent ban"
            />
          </FormGroup>

          <Typography className={classes.italics}>
            {isPermanentBan
              ? 'This ban will not expire'
              : `This ban will expire on ${format(
                banExpiryDate,
                'MMM d, yyyy',
              )}`}
          </Typography>

          <Separator />
        </>
      )}

      <Typography>
        <b>{`${actionType === 'ban' ? 'Ban' : 'Warning'} reason`}</b>
      </Typography>

      <Box sx={{ width: '100%' }}>
        <TextField id="reason" variant="outlined" multiline fullWidth />
      </Box>

      <Separator />

      <SectionTitleWithButtons
        title={
          BAN_ORIGIN === BAN_ORIGINS.fromContest
            ? 'Contest'
            : 'Contest (optional)'
        }
        buttons={
          BAN_ORIGIN === BAN_ORIGINS.fromContest
            ? []
            : [
              {
                text: 'Clear contest',
                disabled: !contestId,
                onClick: () => setContestId(null),
              },
            ]
        }
      />

      <Box>
        <ContestSelector
          contestId={contestId}
          onChange={setContestId}
          disabled={BAN_ORIGINS.fromContest}
        />
      </Box>

      <Separator />

      {/* eslint-disable-next-line max-len */}
      <Typography>
        <b>EXCEPTIONAL CIRCUMSTANCES</b>
      </Typography>

      <FormControlLabel
        control={<Checkbox />}
        label={`This ${actionType} replaces the previous ${actionType}`}
      />
      <FormHelperText>
        {`The original ${actionType} will be deleted and replaced with this ban / warning.
        Use when correcting a mistake or typo, eg.`}
      </FormHelperText>

      <br />
      <Button color="primary" variant="outlined">
        Pardon user
      </Button>
      <FormHelperText>
        {`A pardon deletes all history of this ${actionType}.
        ${
          actionType === 'ban'
            ? ' In most cases, lift the current ban instead'
            : ''
        }`}
      </FormHelperText>

      <br />
      <br />

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          color="secondary"
          variant="contained"
          style={{ color: 'white', width: '30%' }}
        >
          Save
        </Button>
      </Box>
    </ProtectedRoute>
  );
}

function BanMultipleUsers({
  dqVoters,
  setDqVoters,
  removeEntrants,
  setRemoveEntrants,
  warnUsers,
  setWarnUsers,
  banUsers,
  setBanUsers,
  usernames,
}) {
  const handleCheckAll = (event) => {
    let fn;
    switch (event.target.id) {
      case 'dq':
        fn = setDqVoters;
        break;
      case 'remove':
        fn = setRemoveEntrants;
        break;
      case 'warn':
        fn = setWarnUsers;
        break;
      case 'ban':
        fn = setBanUsers;
        break;
      default:
        return;
    }
    fn((prev) => (prev.size ? new Set() : new Set(usernames)));
  };

  const handleCheckOne = (event) => {
    let fn;
    switch (event.target.id) {
      case 'dq':
        fn = setDqVoters;
        break;
      case 'remove':
        fn = setRemoveEntrants;
        break;
      case 'warn':
        fn = setWarnUsers;
        break;
      case 'ban':
        fn = setBanUsers;
        break;
      default:
        return;
    }
    fn((prev) => {
      const newSet = new Set(prev); // Create a new Set
      if (event.target.checked) {
        newSet.add(event.target.name);
      } else {
        newSet.delete(event.target.name);
      }
      return newSet;
    });
  };

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell align="center">
              <Checkbox
                style={{ padding: '0 8px 0 0' }}
                onClick={handleCheckAll}
                checked={!!dqVoters.size}
                id="dq"
              />
              Exclude votes
            </TableCell>
            <TableCell align="center">
              <Checkbox
                style={{ padding: '0 8px 0 0' }}
                onClick={handleCheckAll}
                checked={!!removeEntrants.size}
                id="remove"
              />
              DQ entries
            </TableCell>
            <TableCell align="center">
              <Checkbox
                style={{ padding: '0 8px 0 0' }}
                onClick={handleCheckAll}
                checked={!!warnUsers.size}
                id="warn"
              />
              Warn
            </TableCell>
            <TableCell align="center">
              <Checkbox
                style={{ padding: '0 8px 0 0' }}
                onClick={handleCheckAll}
                checked={!!banUsers.size}
                id="ban"
              />
              Ban
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {usernames.map((u) => (
            <TableRow
              key={u}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {u}
              </TableCell>
              <TableCell align="center">
                <FormControlLabel
                  control={(
                    <Checkbox
                      style={{ paddingTop: 0, paddingBottom: 0 }}
                      checked={dqVoters.has(u)}
                      onChange={handleCheckOne}
                      name={u}
                      id="dq"
                    />
                  )}
                />
              </TableCell>
              <TableCell align="center">
                <FormControlLabel
                  control={(
                    <Checkbox
                      style={{ paddingTop: 0, paddingBottom: 0 }}
                      checked={removeEntrants.has(u)}
                      onChange={handleCheckOne}
                      name={u}
                      id="remove"
                    />
                  )}
                />
              </TableCell>
              <TableCell align="center">
                <FormControlLabel
                  control={(
                    <Checkbox
                      style={{ paddingTop: 0, paddingBottom: 0 }}
                      checked={warnUsers.has(u)}
                      onChange={handleCheckOne}
                      name={u}
                      id="warn"
                    />
                  )}
                />
              </TableCell>
              <TableCell align="center">
                <FormControlLabel
                  control={(
                    <Checkbox
                      style={{ paddingTop: 0, paddingBottom: 0 }}
                      checked={banUsers.has(u)}
                      onChange={handleCheckOne}
                      name={u}
                      id="ban"
                    />
                  )}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function Separator() {
  return (
    <>
      <br />
      <hr />
      <br />
    </>
  );
}

export default BanUsers;

BanMultipleUsers.propTypes = {
  dqVoters: PropTypes.instanceOf(Set).isRequired,
  setDqVoters: PropTypes.func.isRequired,
  removeEntrants: PropTypes.instanceOf(Set).isRequired,
  setRemoveEntrants: PropTypes.func.isRequired,
  warnUsers: PropTypes.instanceOf(Set).isRequired,
  setWarnUsers: PropTypes.func.isRequired,
  banUsers: PropTypes.instanceOf(Set).isRequired,
  setBanUsers: PropTypes.func.isRequired,
  usernames: PropTypes.arrayOf(PropTypes.string).isRequired,
};
