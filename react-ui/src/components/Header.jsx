import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';

import AppBarDivided from './AppBarDivided';

const Header = ({ header }) => (
  <AppBarDivided position="static" color="default">
    <Typography variant="h6">{header}</Typography>
  </AppBarDivided>
);

Header.propTypes = {
  header: PropTypes.string.isRequired,
};

export default Header;
