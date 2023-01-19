import Link from '@material-ui/core/Link';
import PropTypes from 'prop-types';

function ExternalLink({
  children, className, href, target,
}) {
  return (
    <Link className={className} href={href} rel="noopener noreferrer" target={target}>
      {children}
    </Link>
  );
}

ExternalLink.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  href: PropTypes.string.isRequired,
  target: PropTypes.string,
};

ExternalLink.defaultProps = {
  className: undefined,
  target: 'vexillology-contests',
};

export default ExternalLink;
