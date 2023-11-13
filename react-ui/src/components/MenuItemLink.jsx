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
  // eslint-disable-next-line react/jsx-props-no-spreading
  return forwardRef((itemProps, ref) => <Link state={state} to={to} ref={ref} {...itemProps} />);
}

function MenuItemLink({
  Icon, onClick, state, text, to,
}) {
  const renderLink = to ? useMemo(() => menuItemComponent({ state, to }), [to]) : undefined;

  return (
    <MenuItem button component={renderLink} onClick={onClick}>
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
  to: types.to,
};

MenuItemLink.defaultProps = {
  Icon: null,
  onClick: () => {},
  state: {},
  to: null,
};

export default MenuItemLink;
