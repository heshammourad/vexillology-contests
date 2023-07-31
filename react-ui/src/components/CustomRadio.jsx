import Radio from '@mui/material/Radio';
import { styled } from '@mui/material/styles';

const CustomRadio = styled(Radio)(({ theme }) => ({
  color: theme.palette.grey[600],
  '&.Mui-checked': {
    color: theme.palette.primary.main,
  },
}));

export default CustomRadio;
