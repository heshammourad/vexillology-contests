import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';

import types from '../common/types';

function ListItemLink({
  className, onClick, primary, to,
}) {
  const renderLink = React.useMemo(
    () => React.forwardRef((itemProps, ref) => (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <Link to={to} ref={ref} {...itemProps} />
    )),
    [to],
  );

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
};

ListItemLink.defaultProps = {
  className: null,
  onClick: () => {},
};

export default ListItemLink;
