/*
TO-DO

Header is hiding top of pages
If new ban: show ban / warning status of each user
If edit ban: show full ban details
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
import { useState } from 'react';

import { ProtectedRoute, ContestSelector } from '../../../components';

const { format, addMonths } = require('date-fns');

const NEW_BAN = true;
const FROM_ACTIVE_CONTEST = true;

const usernames = ['joshuauiux', 'TorteApp'];

const action = 'warning';

const BAN = {
  issueDate: new Date(),
  modName: 'TorteApp',
  contestID: '',
  action: 'ban',
  expiryDate: 'never',
  reason: 'Syke',
  actionID: 'as1',
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
  const [isPermanentBan, setIsPermanentBan] = useState(false);

  const [dqVoters, setDqVoters] = useState(new Set());
  const [removeEntrants, setRemoveEntrants] = useState(new Set());
  const [warnUsers, setWarnUsers] = useState(new Set());
  const [banUsers, setBanUsers] = useState(new Set());

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
    <ProtectedRoute errorStatus={error?.response?.status}>
      <br />
      <br />
      <br />
      <h1 className={classes.sectionHeader}>
        {`${NEW_BAN ? 'Take' : 'Edit'} action against ${
          usernames.length > 1 ? 'users' : 'user'
        }`}
      </h1>

      {FROM_ACTIVE_CONTEST ? (
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
                  DQ votes
                </TableCell>
                <TableCell align="center">
                  <Checkbox
                    style={{ padding: '0 8px 0 0' }}
                    onClick={handleCheckAll}
                    checked={!!removeEntrants.size}
                    id="remove"
                  />
                  Remove entries
                </TableCell>
                <TableCell align="center">
                  <Checkbox
                    style={{ padding: '0 8px 0 0' }}
                    onClick={handleCheckAll}
                    checked={!!warnUsers.size}
                    id="warn"
                  />
                  Issue warning
                </TableCell>
                <TableCell align="center">
                  <Checkbox
                    style={{ padding: '0 8px 0 0' }}
                    onClick={handleCheckAll}
                    checked={!!banUsers.size}
                    id="ban"
                  />
                  Issue ban
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
      ) : (
        <Box sx={{ backgroundColor: '#ddd', padding: '8px' }}>
          {usernames.map((username) => (
            <Typography key={username}>
              <b>{username}</b>
            </Typography>
          ))}
        </Box>
      )}

      <br />

      {action === 'ban' && (
        <>
          <Typography>
            <b>Ban length</b>
          </Typography>
          <Box display="flex" sx={{ alignItems: 'center' }}>
            <TextField
              id="banLength"
              variant="outlined"
              size="small"
              type="number"
              value={months}
              onChange={(event) => setMonths(event.target.value)}
              style={{ width: 100 }}
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
                  value="today"
                  control={<Radio />}
                  label="from today"
                />
                <FormControlLabel
                  disabled={NEW_BAN}
                  value="issue"
                  control={<Radio />}
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
            <FormControlLabel
              disabled={NEW_BAN}
              control={<Checkbox />}
              label="Lift the current ban"
            />
          </FormGroup>

          <Typography className={classes.italics}>
            {isPermanentBan
              ? 'This ban will not expire'
              : `This ban will expire on ${format(
                addMonths(new Date(), months),
                'MMM d, yyyy',
              )}`}
          </Typography>

          <br />
          <hr />
          <br />
        </>
      )}

      <Typography>
        <b>
          {`${
            action === 'ban' ? 'Ban' : 'Warning'
          } reason (please include the contest Month and Year in your reason, eg Jan 25)`}
        </b>
      </Typography>

      <Box sx={{ width: '100%' }}>
        <TextField id="reason" variant="outlined" multiline fullWidth />
      </Box>

      <br />
      <hr />
      <br />

      <Typography>
        <b>Contest</b>
      </Typography>

      <Box>
        <ContestSelector contestId={contestId} onChange={setContestId} />
      </Box>

      <br />
      <hr />
      <br />

      {/* eslint-disable-next-line max-len */}
      <Typography>
        <b>EXCEPTIONAL CIRCUMSTANCES</b>
      </Typography>

      <FormControlLabel
        control={<Checkbox />}
        label={`This ${action} replaces the previous ${action}`}
      />
      <FormHelperText>
        {`The original ${action} will be deleted and replaced with this ban / warning.
        Use when correcting a mistake or typo, eg.`}
      </FormHelperText>

      <br />
      <Button color="primary" variant="outlined">
        Pardon user
      </Button>
      <FormHelperText>
        {`A pardon deletes all history of this ${action}.
        ${
          action === 'ban'
            ? ' In most cases, use “Lift the current ban” under Ban Length.'
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

export default BanUsers;
