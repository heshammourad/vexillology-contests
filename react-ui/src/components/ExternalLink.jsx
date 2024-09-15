import Link from '@material-ui/core/Link';
import PropTypes from 'prop-types';

import types from '../common/types';

function ExternalLink({
  children, className, color, href, target,
}) {
  return (
    <Link
      className={className}
      color={color}
      href={href}
      rel="noopener noreferrer"
      target={target}
    >
      {children}
    </Link>
  );
}

ExternalLink.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  color: types.color,
  href: PropTypes.string.isRequired,
  target: PropTypes.string,
};

ExternalLink.defaultProps = {
  className: undefined,
  color: 'primary',
  target: 'vexillology-contests',
};

export default ExternalLink;
