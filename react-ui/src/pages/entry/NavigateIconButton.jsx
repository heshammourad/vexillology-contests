import IconButton from '@material-ui/core/IconButton';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import PropTypes from 'prop-types';

const useStyles = makeStyles((theme) => ({
  navigateButton: {
    background: 'rgba(66, 66, 66, .54)',
    borderRadius: 28,
    cursor: 'pointer',
    position: 'absolute',
    top: '50%',
    marginTop: -28,
    height: 56,
    width: 56,
  },
  navigateIcon: {
    color: theme.palette.common.white,
  },
}));

function NavigateIconButton({ className, Icon, onClick }) {
  const classes = useStyles();

  return (
    <IconButton
      className={clsx(classes.navigateButton, className)}
      onClick={onClick}
    >
      <Icon className={classes.navigateIcon} fontSize="large" />
    </IconButton>
  );
}

NavigateIconButton.propTypes = {
  className: PropTypes.string,
  Icon: PropTypes.elementType.isRequired,
  onClick: PropTypes.func,
};

NavigateIconButton.defaultProps = {
  className: '',
  onClick: () => {},
};

export default NavigateIconButton;
