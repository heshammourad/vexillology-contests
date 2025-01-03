import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import PropTypes from 'prop-types';

import types from '../common/types';

import AppBarDivided from './AppBarDivided';
import RouterLinkIconButton from './RouterLinkIconButton';

const useStyles = makeStyles((theme) => ({
  title: {
    marginLeft: theme.spacing(1.5),
  },
}));

/**
 * Header component that renders an AppBar with a title and a back button.
 *
 * @param {Object} props - The component props.
 * @param {string} props.appBarClassName - The class name for the AppBar component.
 * @param {React.ReactNode} props.children - The title to render in the AppBar.
 * @param {string} props.className - The class name for the title.
 * @param {string} props.position - The position of the AppBar component.
 * @param {string} props.to - The destination URL for the back button.
 *
 * @returns {JSX.Element} The rendered Header component.
 */
function Header({
  appBarClassName, children, className, position, to,
}) {
  const classes = useStyles();
  return (
    <AppBarDivided
      className={appBarClassName}
      color="default"
      disableGutters
      position={position}
    >
      <RouterLinkIconButton to={to} />
      <Typography
        className={clsx(classes.title, className)}
        component="div"
        variant="h6"
      >
        {children}
      </Typography>
    </AppBarDivided>
  );
}

Header.propTypes = {
  appBarClassName: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  position: PropTypes.string.isRequired,
  to: types.to.isRequired,
};

Header.defaultProps = {
  appBarClassName: undefined,
  className: undefined,
};

export default Header;
