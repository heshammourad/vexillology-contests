import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Tooltip from '@material-ui/core/Tooltip';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

import types from '../common/types';

const useStyles = makeStyles((theme) => ({
  spinner: {
    marginRight: theme.spacing(2),
  },
}));

function SpinnerButton({
  children,
  color,
  disabled,
  disabledTooltip,
  onClick,
  submitting,
  variant,
}) {
  const classes = useStyles();

  const content = (
    <Button
      color={color}
      disabled={disabled || submitting}
      onClick={onClick}
      variant={variant}
    >
      {submitting && <CircularProgress className={classes.spinner} size={24} />}
      {children}
    </Button>
  );

  if (!disabled || !disabledTooltip) {
    return content;
  }

  return (
    <Tooltip title={disabledTooltip}>
      <span>{content}</span>
    </Tooltip>
  );
}

SpinnerButton.propTypes = {
  children: PropTypes.node.isRequired,
  color: types.color,
  disabled: PropTypes.bool,
  disabledTooltip: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  variant: PropTypes.oneOf(['contained', 'outlined', 'text']),
};

SpinnerButton.defaultProps = {
  color: 'default',
  disabled: false,
  disabledTooltip: undefined,
  submitting: false,
  variant: 'text',
};

export default SpinnerButton;
