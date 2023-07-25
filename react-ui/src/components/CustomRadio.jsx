import Radio from '@mui/material/Radio';
import withStyles from '@mui/styles/withStyles';

const CustomRadio = withStyles((theme) => ({
  root: {
    color: theme.palette.grey[600],
    '&.Mui-checked': {
      color: theme.palette.primary.main,
    },
  },
  checked: {},
  // eslint-disable-next-line react/jsx-props-no-spreading
}))((props) => <Radio color="default" {...props} />);

export default CustomRadio;
