import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { forwardRef } from 'react';

const useStyles = makeStyles({
  link: {
    textDecoration: 'none',
  },
});

const PlainLink = forwardRef((props, ref) => {
  const classes = useStyles();
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <a ref={ref} {...props} className={clsx(classes.link, props.className)}>
      {props.children}
    </a>
  );
});

PlainLink.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

PlainLink.defaultProps = {
  className: null,
};

export default PlainLink;
