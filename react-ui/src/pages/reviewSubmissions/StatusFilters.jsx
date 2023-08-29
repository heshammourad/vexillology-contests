import { makeStyles } from '@material-ui/core/styles';
import capitalize from 'lodash/capitalize';
import PropTypes from 'prop-types';

import { FilterChip } from '../../components';

const STATUSES = ['pending', 'approved', 'rejected', 'withdrawn'];

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    '& > *': {
      margin: theme.spacing(0.5),
    },
    marginBottom: theme.spacing(2),
  },
}));

/** Chips to filter submissions by status.
 *
 * @param props
 * @param {boolean} disabled - Disable the filter chips.
 * @param {function} onChipClick - Handler for chip click action.
 * @param {Object} selectedChips - Boolean values indicating which chips are currently selected.
 * @param {Object} submissionStatusCounts - Number values indicating count of each status.
 */
function StatusFilters({
  disabled, onChipClick, selectedChips, submissionStatusCounts,
}) {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      {STATUSES.map((status) => (
        <FilterChip
          key={status}
          disabled={disabled}
          label={`${capitalize(status)} (${submissionStatusCounts[status] ?? 0})`}
          onClick={onChipClick(status)}
          selected={selectedChips[status] ?? false}
        />
      ))}
    </div>
  );
}

const statusShape = (type) => PropTypes.shape(
  STATUSES.reduce((acc, cur) => {
    acc[cur] = type;
    return acc;
  }, {}),
);

StatusFilters.propTypes = {
  disabled: PropTypes.bool,
  onChipClick: PropTypes.func.isRequired,
  selectedChips: statusShape(PropTypes.bool),
  submissionStatusCounts: statusShape(PropTypes.number),
};

StatusFilters.defaultProps = {
  disabled: false,
  selectedChips: {},
  submissionStatusCounts: {},
};

export default StatusFilters;
