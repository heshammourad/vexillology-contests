import Radio from '@material-ui/core/Radio';
import { withStyles } from '@material-ui/core/styles';

const CustomRadio = withStyles({
  root: {
    color: '#5f6368',
    '&$checked': {
      color: '#1a73e8',
    },
  },
  checked: {},
  // eslint-disable-next-line react/jsx-props-no-spreading
})((props) => <Radio color="default" {...props} />);

export default CustomRadio;
