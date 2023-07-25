import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import makeStyles from '@mui/styles/makeStyles';
import PropTypes from 'prop-types';

import types from '../common/types';

const useStyles = makeStyles((theme) => ({
  spinner: {
    marginRight: theme.spacing(2),
  },
}));

function SpinnerButton({
  children, color, disabled, onClick, submitting, variant,
}) {
  const classes = useStyles();
  return (
    <Button color={color} disabled={disabled || submitting} onClick={onClick} variant={variant}>
      {submitting && <CircularProgress className={classes.spinner} size={24} />}
      {children}
    </Button>
  );
}

SpinnerButton.propTypes = {
  children: PropTypes.node.isRequired,
  color: types.color,
  disabled: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  variant: PropTypes.oneOf(['contained', 'outlined', 'text']),
};

SpinnerButton.defaultProps = {
  color: 'default',
  disabled: false,
  submitting: false,
  variant: 'text',
};

export default SpinnerButton;
