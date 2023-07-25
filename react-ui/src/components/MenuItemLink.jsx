/**
 * Row on vertically stacked menu list
 */

import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import PropTypes from 'prop-types';
import { forwardRef, useMemo } from 'react';
import { Link } from 'react-router-dom';

import types from '../common/types';

function menuItemComponent({ state, to }) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return forwardRef((itemProps, ref) => <Link state={state} to={to} ref={ref} {...itemProps} />);
}

function MenuItemLink({
  Icon, onClick, state, text, to,
}) {
  const renderLink = useMemo(() => menuItemComponent({ state, to }), [to]);

  return (
    <MenuItem button component={to ? renderLink : undefined} onClick={onClick}>
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
  state: PropTypes.shape({}),
  text: PropTypes.string.isRequired,
  to: types.to.isRequired,
};

MenuItemLink.defaultProps = {
  Icon: null,
  onClick: () => {},
  state: {},
};

export default MenuItemLink;
