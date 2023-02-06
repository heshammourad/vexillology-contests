import Button from '@material-ui/core/Button';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import { useAuthState, useRedditLogIn } from '../common';

function ProtectedRoute({ children }) {
  const [{ isLoggedIn }] = useAuthState();
  const navigate = useNavigate();
  const sendUserToAuthUrl = useRedditLogIn();

  if (!isLoggedIn) {
    return (
      <>
        <div>You must be logged in to access this page</div>
        <Button
          onClick={() => {
            navigate('/');
          }}
          color="primary"
        >
          Return home
        </Button>
        <Button onClick={sendUserToAuthUrl} color="primary" autoFocus>
          Log In
        </Button>
      </>
    );
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
