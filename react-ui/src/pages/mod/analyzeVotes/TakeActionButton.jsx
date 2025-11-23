import GavelIcon from '@mui/icons-material/Gavel';
import Fab from '@mui/material/Fab';
import PropTypes from 'prop-types';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * Floating action button to take action against users
 */
function TakeActionButton({ users }) {
  const { contestId } = useParams();
  const navigate = useNavigate();

  if (!users.size) {
    return null;
  }

  const handleClick = () => {
    const usernames = Array.from(users).join(',');
    const searchParams = new URLSearchParams({
      u: usernames,
      ...(contestId && { c: contestId }),
    });

    navigate(`/mod/banUsers?${searchParams.toString()}`);
  };

  return (
    <Fab
      color="secondary"
      variant="extended"
      onClick={handleClick}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1000,
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
};
