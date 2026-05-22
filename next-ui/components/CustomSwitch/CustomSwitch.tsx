'use client';

import Switch, {SwitchProps} from '@mui/material/Switch';
import {styled} from '@mui/material/styles';

const CustomSwitch = styled(Switch)(({theme}) => ({
  '& .MuiSwitch-switchBase': {
    color: theme.palette.common.white,
    '&.Mui-checked': {
      color: theme.palette.primary.main,
    },
    '&.Mui-checked + .MuiSwitch-track': {
      backgroundColor: theme.palette.primary.light,
      opacity: 0.5,
    },
  },
}));

export default CustomSwitch;
export type {SwitchProps as CustomSwitchProps};
