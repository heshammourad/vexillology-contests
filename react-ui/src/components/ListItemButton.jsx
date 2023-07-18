/**
 * Displaying row with external site in vertically stacked list
 */

import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import PropTypes from 'prop-types';

function ListItemButton({
  href, Icon, target, text,
}) {
  return (
    <ListItem button component="a" href={href} target={target} disableGutters>
      <ListItemIcon>
        <Icon />
      </ListItemIcon>
      <ListItemText primary={text} />
    </ListItem>
  );
}

ListItemButton.propTypes = {
  href: PropTypes.string.isRequired,
  Icon: PropTypes.elementType.isRequired,
  target: PropTypes.string,
  text: PropTypes.string.isRequired,
};

ListItemButton.defaultProps = {
  target: 'vexillology-contests',
};

export default ListItemButton;
