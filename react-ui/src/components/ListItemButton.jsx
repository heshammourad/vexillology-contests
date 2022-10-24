import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import PropTypes from 'prop-types';

function ListItemButton({ href, Icon, text }) {
  return (
    <ListItem button component="a" href={href} target="vexillology-contests" disableGutters>
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
  text: PropTypes.string.isRequired,
};

export default ListItemButton;
