import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

import types from '../common/types';

const useStyles = makeStyles((theme) => ({
  spinner: {
    marginRight: theme.spacing(2),
  },
}));

function SpinnerButton({
  children, color, onClick, submitting, variant,
}) {
  const classes = useStyles();
  return (
    <Button color={color} disabled={submitting} onClick={onClick} variant={variant}>
      {submitting && <CircularProgress className={classes.spinner} size={24} />}
      {children}
    </Button>
  );
}

SpinnerButton.propTypes = {
  children: PropTypes.node.isRequired,
  color: types.color,
  onClick: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  variant: PropTypes.oneOf(['contained', 'outlined', 'text']),
};

SpinnerButton.defaultProps = {
  color: 'default',
  submitting: false,
  variant: 'text',
};

export default SpinnerButton;
