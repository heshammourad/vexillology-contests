import Switch from '@mui/material/Switch';
import withStyles from '@mui/styles/withStyles';

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
