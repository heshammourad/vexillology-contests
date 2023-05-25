/**
 * Clickable icons for both internal and external links
 */

import IconButton from '@material-ui/core/IconButton';
import PropTypes from 'prop-types';

function CustomIconButton({
  ariaLabel, className, href, Icon, innerRef, onClick, size,
}) {
  let target;
  if (href) {
    target = 'vexillology-contests';
  }
  return (
    <IconButton
      aria-label={ariaLabel}
      className={className}
      color="inherit"
      href={href}
      onClick={onClick}
      ref={innerRef}
      size={size}
      target={target}
    >
      <Icon />
    </IconButton>
  );
}

CustomIconButton.propTypes = {
  ariaLabel: PropTypes.string.isRequired,
  className: PropTypes.string,
  href: PropTypes.string,
  Icon: PropTypes.shape({}).isRequired,
  innerRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(HTMLElement) }),
  ]),
  onClick: PropTypes.func,
  size: PropTypes.oneOf(['small', 'medium']),
};

CustomIconButton.defaultProps = {
  className: undefined,
  href: undefined,
  innerRef: undefined,
  onClick: undefined,
  size: 'medium',
};

export default CustomIconButton;
