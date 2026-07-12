import Typography from '@material-ui/core/Typography';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import PropTypes from 'prop-types';
import { useState } from 'react';

const EDIT_TYPES = {
  edit: () => 'Edit (only use for typos)',
  lift: (actionText) => `Lift (the ${actionText} will no longer be active)`,
  pardon: (actionText) => `Pardon (only for mistaken identity, purges the ${actionText} from history)`,
};

function EditTypeSelector({ isBan, editType, setEditType }) {
  const actionText = isBan ? 'ban' : 'warning';
  const [initialEditType] = useState(editType);
  return (
    <>
      <Typography>
        <b>{`How do you want to edit this ${actionText}?`}</b>
      </Typography>

      <FormControl>
        <RadioGroup
          aria-labelledby="edit-type-radio-buttons"
          name="edit-type-radio-buttons"
          defaultValue={initialEditType}
          sx={{
            marginLeft: 2,
            marginTop: 2,
            marginBottom: 2,
          }}
        >
          {Object.keys(EDIT_TYPES).map((key) => (
            <FormControlLabel
              key={key}
              value={key}
              control={<Radio onClick={() => setEditType(key)} />}
              label={EDIT_TYPES[key](actionText)}
              sx={{ gap: 1 }}
            />
          ))}
        </RadioGroup>
      </FormControl>
    </>
  );
}

export default EditTypeSelector;

EditTypeSelector.propTypes = {
  isBan: PropTypes.bool.isRequired,
  editType: PropTypes.oneOf(['edit', 'lift', 'pardon']).isRequired,
  setEditType: PropTypes.func.isRequired,
};
