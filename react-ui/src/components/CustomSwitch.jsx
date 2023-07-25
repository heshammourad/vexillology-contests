import Switch from '@mui/material/Switch';
import withStyles from '@mui/styles/withStyles';

const CustomSwitch = withStyles((theme) => ({
  switchBase: {
    color: theme.palette.common.white,
    '&.Mui-checked': {
      color: theme.palette.primary.main,
    },
    '&.Mui-checked + .Mui-track': {
      backgroundColor: theme.palette.primary.light,
    },
  },
  checked: {},
  track: {},
}))(Switch);

export default CustomSwitch;
