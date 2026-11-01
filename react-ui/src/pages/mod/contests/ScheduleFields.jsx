import Box from '@mui/material/Box';
import PropTypes from 'prop-types';

import DateTimeField from './DateTimeField';

// Field name -> label, in display order.
export const SCHEDULE_FIELDS = {
  submissionStart: 'Submission Start',
  submissionEnd: 'Submission End',
  voteStart: 'Vote Start',
  voteEnd: 'Vote End',
};

/**
 * The four timestamps of a contest's submission and voting windows.
 */
function ScheduleFields({ errors, onChange, values }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 2,
      }}
    >
      {Object.entries(SCHEDULE_FIELDS).map(([field, label]) => (
        <DateTimeField
          key={field}
          label={label}
          value={values[field]}
          onChange={(value) => onChange(field, value)}
          error={errors[field]}
        />
      ))}
    </Box>
  );
}

ScheduleFields.propTypes = {
  errors: PropTypes.objectOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  values: PropTypes.objectOf(PropTypes.string).isRequired,
};

export default ScheduleFields;
