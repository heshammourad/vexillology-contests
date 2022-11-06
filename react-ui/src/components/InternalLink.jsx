import Link from '@material-ui/core/Link';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';

import types from '../common/types';

function InternalLink({
  children, className, state, to,
}) {
  return (
    <Link className={className} component={RouterLink} state={state} to={to}>
      {children}
    </Link>
  );
}

InternalLink.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  state: PropTypes.shape({}),
  to: types.to.isRequired,
};

InternalLink.defaultProps = {
  className: '',
  state: {},
};

export default InternalLink;
