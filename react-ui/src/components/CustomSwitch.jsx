import Switch from '@material-ui/core/Switch';
import { withStyles } from '@material-ui/core/styles';

const CustomSwitch = withStyles((theme) => ({
  switchBase: {
    color: theme.palette.common.white,
    '&$checked': {
      color: theme.palette.primary.main,
    },
    '&$checked + $track': {
      backgroundColor: theme.palette.primary.light,
    },
  },
  checked: {},
  track: {},
}))(Switch);

export default CustomSwitch;
