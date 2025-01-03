/**
 * Row on vertically stacked menu list
 */

import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import PropTypes from 'prop-types';
import { forwardRef, useMemo } from 'react';
import { Link } from 'react-router-dom';

import types from '../common/types';

function menuItemComponent({ state, to }) {
  return forwardRef((itemProps, ref) => (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <Link state={state} to={to} ref={ref} {...itemProps} />
  ));
}

/**
 * MenuItemLink component renders a menu item with an optional icon and text.
 * It can be used to navigate to a specified route or trigger a click event.
 *
 * @param {Object} props - The properties object.
 * @param {React.ElementType} props.Icon - The icon component to be displayed.
 * @param {function} props.onClick - The function to be called when the menu item is clicked.
 * @param {boolean} props.selected - Indicates if the menu item is selected.
 * @param {Object} props.state - The state to be passed to the link component.
 * @param {string} props.text - The text to be displayed in the menu item.
 * @param {string} props.to - The route to navigate to when the menu item is clicked.
 *
 * @returns {JSX.Element} The rendered MenuItemLink component.
 */
function MenuItemLink({
  Icon, onClick, selected, state, text, to,
}) {
  const renderLink = useMemo(
    () => (to ? menuItemComponent({ state, to }) : undefined),
    [to],
  );

  return (
    <MenuItem
      button
      component={renderLink}
      onClick={onClick}
      selected={selected}
    >
      {Icon && (
        <ListItemIcon>
          <Icon />
        </ListItemIcon>
      )}
      <ListItemText primary={text} />
    </MenuItem>
  );
}

MenuItemLink.propTypes = {
  Icon: PropTypes.elementType,
  onClick: PropTypes.func,
  selected: PropTypes.bool,
  state: PropTypes.shape({}),
  text: PropTypes.string.isRequired,
  to: types.to,
};

MenuItemLink.defaultProps = {
  Icon: null,
  onClick: () => {},
  selected: false,
  state: {},
  to: null,
};

export default MenuItemLink;
