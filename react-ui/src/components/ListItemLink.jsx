import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';

const ListItemLink = ({ onClick, primary, to }) => {
  const renderLink = React.useMemo(
    () => React.forwardRef((itemProps, ref) => (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <Link to={to} ref={ref} {...itemProps} />
    )),
    [to],
  );

  return (
    <li>
      <ListItem button component={renderLink} onClick={onClick}>
        <ListItemText primary={primary} />
      </ListItem>
    </li>
  );
};

ListItemLink.propTypes = {
  onClick: PropTypes.func,
  primary: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
};

ListItemLink.defaultProps = {
  onClick: () => {},
};

export default ListItemLink;
