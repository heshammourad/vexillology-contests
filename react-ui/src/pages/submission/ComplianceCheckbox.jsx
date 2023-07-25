/**
 * Self-attestation checkbox
 */

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import makeStyles from '@mui/styles/makeStyles';
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
  onBlur: () => {},
};

export default ComplianceCheckbox;
