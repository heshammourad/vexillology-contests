import { makeStyles } from '@material-ui/core/styles';

const useGlobalStyles = makeStyles({
  '@global': {
    body: {
      minHeight: '100%',
    },
  },
});

export default useGlobalStyles;
