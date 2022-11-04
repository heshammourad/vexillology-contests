import Link from '@material-ui/core/Link';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';

import types from '../common/types';

function InternalLink({ children, className, to }) {
  return (
    <Link className={className} component={RouterLink} to={to}>
      {children}
    </Link>
  );
}

InternalLink.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  to: types.to.isRequired,
};

InternalLink.defaultProps = {
  className: '',
};

export default InternalLink;
