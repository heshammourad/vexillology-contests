import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import makeStyles from '@mui/styles/makeStyles';
import PropTypes from 'prop-types';

const useStyles = makeStyles({
  subheader: {
    margin: '16px auto',
  },
});

function Subheader({ children }) {
  const classes = useStyles();

  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  return (
    <Typography className={classes.subheader} component="h2" variant={isSmUp ? 'h4' : 'h6'}>
      {children}
    </Typography>
  );
}

Subheader.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Subheader;
