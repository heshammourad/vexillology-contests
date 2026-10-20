import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TextField from '@mui/material/TextField';
import PropTypes from 'prop-types';

/**
 * A required date-and-time input in the browser's timezone, showing its error message if any.
 */
function DateTimeField({
  error, label, onChange, value,
}) {
  return (
    <TextField
      required
      label={label}
      type="datetime-local"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      InputLabelProps={{ shrink: true }}
      error={!!error}
      helperText={error}
      InputProps={
        error
          ? { endAdornment: <ErrorOutlineIcon color="error" fontSize="small" /> }
          : undefined
      }
      fullWidth
    />
  );
}

DateTimeField.propTypes = {
  error: PropTypes.string,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
};

DateTimeField.defaultProps = {
  error: null,
};

export default DateTimeField;
