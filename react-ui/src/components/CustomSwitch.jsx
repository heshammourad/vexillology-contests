import Switch from '@material-ui/core/Switch';
import { withStyles } from '@material-ui/core/styles';

const CustomSwitch = withStyles({
  switchBase: {
    color: '#fff',
    '&$checked': {
      color: '#1a73e8',
    },
    '&$checked + $track': {
      backgroundColor: '#4285f4',
    },
  },
  checked: {},
  track: {},
})(Switch);

export default CustomSwitch;
