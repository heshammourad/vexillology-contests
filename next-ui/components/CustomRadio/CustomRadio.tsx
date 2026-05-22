'use client';

import Radio, {RadioProps} from '@mui/material/Radio';
import {styled} from '@mui/material/styles';

const StyledRadio = styled(Radio)(({theme}) => ({
  color: theme.palette.grey[600],
  '&.Mui-checked': {
    color: theme.palette.primary.main,
  },
}));

export default function CustomRadio(props: RadioProps) {
  return <StyledRadio color="default" {...props} />;
}

export type {RadioProps as CustomRadioProps};
