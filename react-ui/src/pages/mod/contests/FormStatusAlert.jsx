import Alert from '@mui/material/Alert';
import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';

/**
 * A form's submit result. Scrolls itself into view when it changes, since the submit button
 * is at the bottom of a long form.
 */
function FormStatusAlert({ status }) {
  const alertRef = useRef(null);

  useEffect(() => {
    if (status) {
      alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [status]);

  if (!status) {
    return null;
  }
  return (
    <Alert ref={alertRef} severity={status.severity} sx={{ mb: 3 }}>
      {status.text}
    </Alert>
  );
}

FormStatusAlert.propTypes = {
  status: PropTypes.shape({
    severity: PropTypes.oneOf(['error', 'warning', 'info', 'success'])
      .isRequired,
    text: PropTypes.string.isRequired,
  }),
};

FormStatusAlert.defaultProps = {
  status: null,
};

export default FormStatusAlert;
