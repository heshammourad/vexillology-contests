import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import types from '../common/types';

import AppBarDivided from './AppBarDivided';
import ArrowBackButton from './ArrowBackButton';

const useStyles = makeStyles((theme) => ({
  title: {
    marginLeft: theme.spacing(1.5),
  },
}));

function Header({
  children, className, position, to,
}) {
  const classes = useStyles();
  return (
    <AppBarDivided color="default" disableGutters position={position}>
      <ArrowBackButton to={to} />
      <Typography className={clsx(classes.title, className)} component="div" variant="h6">
        {children}
      </Typography>
    </AppBarDivided>
  );
}

Header.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  position: PropTypes.string.isRequired,
  to: types.to.isRequired,
};

Header.defaultProps = {
  className: undefined,
};

export default Header;
