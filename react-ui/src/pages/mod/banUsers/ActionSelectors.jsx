import Typography from '@material-ui/core/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
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

const ACTION_TYPES = {
  ban: 'Ban',
  warn: 'Warn',
};

function ActionSelectorForOneUser({ isBan, setIsBan, isNewAction }) {
  return (
    <>
      <Typography>
        <b>Ban or warn?</b>
      </Typography>

      <FormControl sx={{ ml: '16px' }}>
        <RadioGroup
          row
          aria-labelledby="ban-or-warning-radio-buttons-group"
          name="ban-or-warning-radio-buttons-group"
          defaultValue={isBan ? 'ban' : 'warn'}
          sx={{
            marginTop: 2,
            marginBottom: 2,
            gap: 2,
          }}
        >
          {Object.keys(ACTION_TYPES).map((key) => (
            <FormControlLabel
              key={key}
              value={key}
              control={<Radio onClick={() => setIsBan(key === 'ban')} />}
              label={ACTION_TYPES[key]}
              disabled={!isNewAction}
              sx={{ gap: 1 }}
            />
          ))}
        </RadioGroup>
      </FormControl>
    </>
  );
}

function ActionSelectorForMultipleUsers({
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

export { ActionSelectorForMultipleUsers, ActionSelectorForOneUser };

ActionSelectorForMultipleUsers.propTypes = {
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

ActionSelectorForOneUser.propTypes = {
  isBan: PropTypes.bool.isRequired,
  setIsBan: PropTypes.func.isRequired,
  isNewAction: PropTypes.bool.isRequired,
};
