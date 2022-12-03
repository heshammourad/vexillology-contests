import IconButton from '@material-ui/core/IconButton';
import PropTypes from 'prop-types';

function CustomIconButton({
  ariaLabel, href, Icon, innerRef, onClick,
}) {
  let target;
  if (href) {
    target = 'vexillology-contests';
  }
  return (
    <IconButton
      ref={innerRef}
      color="inherit"
      href={href}
      target={target}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <Icon />
    </IconButton>
  );
}

CustomIconButton.propTypes = {
  ariaLabel: PropTypes.string.isRequired,
  href: PropTypes.string,
  Icon: PropTypes.shape({}).isRequired,
  innerRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(HTMLElement) }),
  ]),
  onClick: PropTypes.func,
};

CustomIconButton.defaultProps = {
  href: undefined,
  innerRef: undefined,
  onClick: undefined,
};

export default CustomIconButton;
