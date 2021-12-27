import IconButton from '@material-ui/core/IconButton';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';

const ArrowBackButton = ({
  color, onClick, to, useRouterLink,
}) => (
  <IconButton
    color={color}
    component={useRouterLink ? RouterLink : undefined}
    onClick={onClick}
    to={to}
  >
    <ArrowBackIcon />
  </IconButton>
);

ArrowBackButton.propTypes = {
  color: PropTypes.string,
  onClick: PropTypes.func,
  to: PropTypes.string,
  useRouterLink: PropTypes.bool,
};

ArrowBackButton.defaultProps = {
  color: '',
  onClick: () => {},
  to: '',
  useRouterLink: true,
};

export default ArrowBackButton;
