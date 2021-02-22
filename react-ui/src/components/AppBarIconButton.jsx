import IconButton from '@material-ui/core/IconButton';
import PropTypes from 'prop-types';

const AppBarIconButton = ({
  ariaLabel, href, Icon, onClick,
}) => {
  let target;
  if (href) {
    target = 'vexillology-contests';
  }
  return (
    <IconButton
      color="inherit"
      href={href}
      target={target}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <Icon />
    </IconButton>
  );
};

AppBarIconButton.propTypes = {
  ariaLabel: PropTypes.string.isRequired,
  href: PropTypes.string,
  Icon: PropTypes.shape({}).isRequired,
  onClick: PropTypes.func,
};

AppBarIconButton.defaultProps = {
  href: undefined,
  onClick: undefined,
};

export default AppBarIconButton;
