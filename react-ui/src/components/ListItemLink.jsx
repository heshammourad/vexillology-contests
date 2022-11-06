import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';

import types from '../common/types';

function listItemComponent({ state, to }) {
  return React.forwardRef((itemProps, ref) => (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <Link state={state} to={to} ref={ref} {...itemProps} />
  ));
}

function ListItemLink({
  className, onClick, primary, state, to,
}) {
  const renderLink = React.useMemo(() => listItemComponent({ state, to }), [to]);

  return (
    <li>
      <ListItem button className={className} component={renderLink} onClick={onClick}>
        <ListItemText primary={primary} />
      </ListItem>
    </li>
  );
}

ListItemLink.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func,
  primary: PropTypes.string.isRequired,
  to: types.to.isRequired,
  state: PropTypes.shape({}),
};

ListItemLink.defaultProps = {
  className: null,
  onClick: () => {},
  state: {},
};

export default ListItemLink;
