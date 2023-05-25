/**
 * Self-attestation checkbox
 */

import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

const useStyles = makeStyles({
  label: {
    marginTop: 9,
  },
  root: {
    alignItems: 'flex-start',
  },
});

function ComplianceCheckbox({
  checked, label, name, onBlur, onChange,
}) {
  const classes = useStyles();
  return (
    <FormControlLabel
      classes={{ label: classes.label, root: classes.root }}
      control={
        <Checkbox id={name} name={name} checked={checked} onBlur={onBlur} onChange={onChange} />
      }
      label={label}
    />
  );
}

ComplianceCheckbox.propTypes = {
  checked: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  onBlur: PropTypes.func,
  onChange: PropTypes.func.isRequired,
};

ComplianceCheckbox.defaultProps = {
  onBlur: () => { },
};

export default ComplianceCheckbox;
