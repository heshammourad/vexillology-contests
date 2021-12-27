import Link from '@material-ui/core/Link';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';

const InternalLink = ({ children, className, to }) => (
  <Link className={className} component={RouterLink} to={to}>
    {children}
  </Link>
);

InternalLink.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  to: PropTypes.string.isRequired,
};

InternalLink.defaultProps = {
  className: '',
};

export default InternalLink;
