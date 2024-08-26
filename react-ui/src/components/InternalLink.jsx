import Link from '@material-ui/core/Link';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';

import types from '../common/types';

/**
 * A hyperlink to an internal page.
 *
 * @param props
 * @param {node} props.children - Content of the link.
 * @param {string} [props.className] - CSS class name to apply.
 * @param {function} [props.onClick] - On click handler.
 * @param {Object} [props.state] - Router state to use on target page.
 * @param {string} [props.to] - Path of page to visit.
 */
function InternalLink({
  children, className, onClick, state, to,
}) {
  return (
    <Link
      className={className}
      component={RouterLink}
      onClick={onClick}
      state={state}
      to={to}
    >
      {children}
    </Link>
  );
}

InternalLink.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
  state: PropTypes.shape({}),
  to: types.to,
};

InternalLink.defaultProps = {
  className: '',
  onClick: undefined,
  state: {},
  to: undefined,
};

export default InternalLink;
