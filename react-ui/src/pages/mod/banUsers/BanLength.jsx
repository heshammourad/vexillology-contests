import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import PropTypes from 'prop-types';

const { format } = require('date-fns');

/**
 * Mod input for ban length
 */
function BanLength({
  months,
  setMonths,
  isPermanentBan,
  setIsPermanentBan,
  endDate,
  disabled,
}) {
  return (
    <>
      <Box display="flex" sx={{ alignItems: 'center', marginTop: 10 }}>
        <TextField
          id="banLength"
          variant="outlined"
          size="small"
          type={isPermanentBan ? 'text' : 'number'}
          value={isPermanentBan ? '∞' : months}
          onChange={(event) => event.target.value > 0 && setMonths(event.target.value)}
          style={{ width: 100 }}
          disabled={isPermanentBan || disabled}
        />
        <Typography component="span">&nbsp;&nbsp;months</Typography>
      </Box>

      <FormGroup style={{ margin: '10px 8px' }}>
        <FormControlLabel
          control={(
            <Checkbox
              checked={isPermanentBan}
              onChange={() => setIsPermanentBan((prev) => !prev)}
              disabled={disabled}
            />
          )}
          label="This is a permanent ban"
          sx={{ gap: 1 }}
        />
      </FormGroup>

      <Typography>
        <em>
          {
            // eslint-disable-next-line no-nested-ternary
            isPermanentBan
              ? 'This ban will not expire'
              : endDate
                ? `This ban will expire on ${format(endDate, 'MMM d, yyyy')}`
                : 'Select a contest to get the end date'
          }
        </em>
      </Typography>
    </>
  );
}

export default BanLength;

BanLength.propTypes = {
  disabled: PropTypes.bool.isRequired,
  months: PropTypes.number.isRequired,
  setMonths: PropTypes.func.isRequired,
  isPermanentBan: PropTypes.bool.isRequired,
  setIsPermanentBan: PropTypes.func.isRequired,
  endDate: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.oneOf([null]),
  ]),
};

BanLength.defaultProps = {
  endDate: undefined,
};
