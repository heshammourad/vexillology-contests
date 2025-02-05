import Box from '@material-ui/core/Box';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

import useSwrContests from '../data/useSwrContests';

const { format, parseISO } = require('date-fns');

const useStyles = makeStyles({
  selector: {
    width: '100%',
    paddingTop: 4,
    paddingBottom: 4,
  },
});

/**
 * @param props
 * @param {string} contestId - Contest primary key
 * @param {function} onChange - useState setter
 */
function ContestSelector({ contestId, onChange, disabled }) {
  const classes = useStyles();
  const { data: contests } = useSwrContests();
  const formattedContest = (name, date) => `${name} (${format(parseISO(date), 'MMM yy')})`;
  const selectedContest = contests.find((c) => c.id === contestId);

  return (
    <Box>
      <Select
        className={classes.selector}
        value={contestId || ''}
        renderValue={() => (!selectedContest
          ? 'Select a contest'
          : formattedContest(selectedContest.name, selectedContest.date))}
        onChange={(event) => onChange(event.target.value)}
        displayEmpty
        defaultValue=""
        disabled={disabled}
      >
        {contests.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {formattedContest(c.name, c.date)}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}

export default ContestSelector;

ContestSelector.propTypes = {
  contestId: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

ContestSelector.defaultProps = {
  contestId: '',
  disabled: false,
};
