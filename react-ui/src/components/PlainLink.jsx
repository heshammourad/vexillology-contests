import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { forwardRef } from 'react';

const useStyles = makeStyles({
  link: {
    textDecoration: 'none',
  },
});

const PlainLink = forwardRef(({ className, children, href }, ref) => {
  const classes = useStyles();
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <a ref={ref} href={href} className={clsx(classes.link, className)}>
      {children}
    </a>
  );
});

PlainLink.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  href: PropTypes.string.isRequired,
};

PlainLink.defaultProps = {
  className: null,
};

export default PlainLink;
