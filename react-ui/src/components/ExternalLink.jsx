import Link from '@material-ui/core/Link';
import PropTypes from 'prop-types';

const ExternalLink = ({ children, href }) => (
  <Link href={href} rel="noopener noreferrer" target="vexillology-contests">
    {children}
  </Link>
);

ExternalLink.propTypes = {
  children: PropTypes.node.isRequired,
  href: PropTypes.string.isRequired,
};

export default ExternalLink;
