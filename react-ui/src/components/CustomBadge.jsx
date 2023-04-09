import Badge from '@material-ui/core/Badge';
import PropTypes from 'prop-types';

function CustomBadge({ children, invisible }) {
  return (
    <Badge color="primary" invisible={invisible} variant="dot">
      {children}
    </Badge>
  );
}

CustomBadge.propTypes = {
  children: PropTypes.node.isRequired,
  invisible: PropTypes.bool,
};

CustomBadge.defaultProps = {
  invisible: false,
};

export default CustomBadge;
