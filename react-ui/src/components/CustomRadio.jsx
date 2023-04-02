import Radio from '@material-ui/core/Radio';
import { withStyles } from '@material-ui/core/styles';

const CustomRadio = withStyles((theme) => ({
  root: {
    color: theme.palette.grey[600],
    '&$checked': {
      color: theme.palette.primary.main,
    },
  },
  checked: {},
  // eslint-disable-next-line react/jsx-props-no-spreading
}))((props) => <Radio color="default" {...props} />);

export default CustomRadio;
