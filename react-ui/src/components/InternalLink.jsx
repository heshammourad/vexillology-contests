import Link from '@material-ui/core/Link';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';

const InternalLink = ({ children, to }) => (
  <Link component={RouterLink} to={to}>
    {children}
  </Link>
);

InternalLink.propTypes = {
  children: PropTypes.node.isRequired,
  to: PropTypes.string.isRequired,
};

export default InternalLink;
