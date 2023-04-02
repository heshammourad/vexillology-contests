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

function ComplianceCheckbox({ label, name }) {
  const classes = useStyles();
  return (
    <FormControlLabel
      classes={{ label: classes.label, root: classes.root }}
      control={<Checkbox name={name} />}
      label={label}
    />
  );
}

ComplianceCheckbox.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
};

export default ComplianceCheckbox;
