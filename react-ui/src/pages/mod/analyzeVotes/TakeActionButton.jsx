import { makeStyles } from '@material-ui/core/styles';
import GavelIcon from '@mui/icons-material/Gavel';
import Fab from '@mui/material/Fab';
import PropTypes from 'prop-types';

const useStyles = makeStyles({});

/**
 * Floating action button to report users
 */
function TakeActionButton({ users, contestId }) {
  if (!users.size) {
    return null;
  }
  return (
    <Fab
      color="secondary"
      variant="extended"
      sx={{
        position: 'absolute',
        bottom: 16,
        right: 16,
      }}
    >
      <GavelIcon sx={{ mr: 1 }} />
      Take action against
      {' '}
      {users.size === 1 ? 'user' : `${users.size} users`}
    </Fab>
  );
}

export default TakeActionButton;

TakeActionButton.propTypes = {
  users: PropTypes.instanceOf(Set).isRequired,
  contestId: PropTypes.string,
};

TakeActionButton.defaultProps = {
  contestId: undefined,
};
