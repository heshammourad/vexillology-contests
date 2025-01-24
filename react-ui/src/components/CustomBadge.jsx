/**
 * Dot overlaid on top-right of icon (i.e. notification circle)
 */

import Badge from '@material-ui/core/Badge';
import PropTypes from 'prop-types';

/**
 * CustomBadge component that wraps children with a Badge component.
 *
 * @param {Object} props - The properties object.
 * @param {React.ReactNode} props.children - The content to be wrapped by the Badge.
 * @param {boolean} props.invisible - If true, the badge will be invisible.
 * @param {string} props.overlap - Whether the content the badge will overlap
 * is circular or rectangular.
 *
 * @returns {JSX.Element} The rendered Badge component.
 */
function CustomBadge({ children, invisible, overlap }) {
  return (
    <Badge
      {...{
        color: 'primary',
        invisible,
        overlap,
        variant: 'dot',
      }}
    >
      {children}
    </Badge>
  );
}

CustomBadge.propTypes = {
  children: PropTypes.node.isRequired,
  invisible: PropTypes.bool,
  overlap: PropTypes.oneOf(['circular', 'rectangular']),
};

CustomBadge.defaultProps = {
  invisible: false,
  overlap: 'rectangular',
};

export default CustomBadge;
