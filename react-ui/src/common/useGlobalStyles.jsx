import makeStyles from '@mui/styles/makeStyles';

const useGlobalStyles = makeStyles({
  '@global': {
    body: {
      minHeight: '100%',
    },
  },
});

export default useGlobalStyles;
