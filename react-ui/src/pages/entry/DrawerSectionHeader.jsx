import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

const useStyles = makeStyles({
  sectionHeader: {
    color: '#5f6368',
    fontSize: '.6875rem',
    fontWeight: 500,
    letterSpacing: '.07272727em',
    lineHeight: '1rem',
    padding: '14px 0',
    textTransform: 'uppercase',
  },
});

function DrawerSectionHeader({ children }) {
  const classes = useStyles();

  return <div className={classes.sectionHeader}>{children}</div>;
}

DrawerSectionHeader.propTypes = {
  children: PropTypes.string.isRequired,
};

export default DrawerSectionHeader;
