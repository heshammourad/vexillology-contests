import Box from '@material-ui/core/Box';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

const useStyles = makeStyles({
  selector: {
    width: '100%',
    paddingTop: 4,
    paddingBottom: 4,
  },
});

/**
 * @param props
 * @param {string[]} usernames - Array of usernames
 * @param {string} username - Selected username
 * @param {function} onChange - Setter for selected username
 */
function UserSelector({ usernames, username, onChange }) {
  const classes = useStyles();

  return (
    <Box>
      <Select
        className={classes.selector}
        value={username}
        onChange={(event) => onChange(event.target.value)}
      >
        {usernames.map((u) => (
          <MenuItem key={u} value={u}>
            {u}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}

export default UserSelector;

UserSelector.propTypes = {
  usernames: PropTypes.arrayOf(PropTypes.string).isRequired,
  username: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
