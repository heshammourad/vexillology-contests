import Switch from '@material-ui/core/Switch';
import { withStyles } from '@material-ui/core/styles';

const CustomSwitch = withStyles((theme) => ({
  switchBase: {
    color: theme.palette.common.white,
    '&$checked': {
      color: theme.palette.vexyOrange.main,
    },
    '&$checked + $track': {
      backgroundColor: theme.palette.vexyOrange.light,
    },
  },
  checked: {},
  track: {},
}))(Switch);

export default CustomSwitch;
