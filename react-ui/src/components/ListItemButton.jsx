import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import PropTypes from 'prop-types';

const ListItemButton = ({ href, Icon, text }) => (
  <ListItem button component="a" href={href} target="vexillology-contests" disableGutters>
    <ListItemIcon>
      <Icon />
    </ListItemIcon>
    <ListItemText primary={text} />
  </ListItem>
);

ListItemButton.propTypes = {
  href: PropTypes.string.isRequired,
  Icon: PropTypes.node.isRequired,
  text: PropTypes.string.isRequired,
};

export default ListItemButton;
