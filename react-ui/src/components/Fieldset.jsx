import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import PropTypes from 'prop-types';

const useStyles = makeStyles((theme) => ({
  root: {
    border: 0,
    display: 'flex',
    flexDirection: 'column',
    margin: 0,
    minWidth: 0,
    padding: 0,
    rowGap: theme.spacing(2),
  },
}));

/**
 * A commonly-styled fieldset component.
 *
 * @param props
 * @param {node} props.children - Form elements.
 * @param {string} [props.className] - Additional CSS classes to apply.
 * @param {boolean} [props.disabled] - Whether the fieldset should be in disabled state.
 */
function Fieldset({ children, className, disabled }) {
  const classes = useStyles();
  return (
    <fieldset className={clsx(classes.root, className)} disabled={disabled}>
      {children}
    </fieldset>
  );
}

Fieldset.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

Fieldset.defaultProps = {
  className: undefined,
  disabled: false,
};

export default Fieldset;
