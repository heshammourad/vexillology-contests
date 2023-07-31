/**
 * Small selectable bubble
 * Checkmark and filled if selected
 */

import Chip from '@material-ui/core/Chip';
import CheckIcon from '@material-ui/icons/Check';
import PropTypes from 'prop-types';

function FilterChip({
  disabled, label, onClick, selected,
}) {
  let icon = null;
  let variant = 'outlined';
  if (selected) {
    icon = <CheckIcon fontSize="small" />;
    variant = 'default';
  }
  return (
    <Chip
      {...{
        color: 'primary',
        disabled,
        icon,
        label,
        onClick,
        variant,
      }}
    />
  );
}

FilterChip.propTypes = {
  disabled: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
};

FilterChip.defaultProps = {
  disabled: false,
};

export default FilterChip;
