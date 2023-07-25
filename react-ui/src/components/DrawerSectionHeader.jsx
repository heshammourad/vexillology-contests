import makeStyles from '@mui/styles/makeStyles';
import PropTypes from 'prop-types';

const useStyles = makeStyles((theme) => ({
  sectionHeader: {
    color: theme.palette.grey[700],
    fontSize: '.6875rem',
    fontWeight: 500,
    letterSpacing: '.07272727em',
    lineHeight: '1rem',
    padding: '14px 0',
    textTransform: 'uppercase',
  },
}));

function DrawerSectionHeader({ children }) {
  const classes = useStyles();

  return <div className={classes.sectionHeader}>{children}</div>;
}

DrawerSectionHeader.propTypes = {
  children: PropTypes.string.isRequired,
};

export default DrawerSectionHeader;
