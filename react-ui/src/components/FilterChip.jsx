/**
 * Small selectable bubble
 * Checkmark and filled if selected
 */

import CheckIcon from '@mui/icons-material/Check';
import Chip from '@mui/material/Chip';
import PropTypes from 'prop-types';

function FilterChip({ label, onClick, selected }) {
  let icon = null;
  let variant = 'outlined';
  if (selected) {
    icon = <CheckIcon fontSize="small" />;
    variant = 'default';
  }
  return <Chip color="primary" icon={icon} label={label} onClick={onClick} variant={variant} />;
}

FilterChip.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
};

export default FilterChip;
