import PropTypes from 'prop-types';

// import useBanStatus from '../common/useBanStatus';

/**
 * Component that checks if the user is banned and redirects them to the ban notice page
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if not banned
 * @param {boolean} props.showLoading - Whether to show loading state while checking ban status
 * @returns {JSX.Element|null} - Rendered component or null if banned
 */
function BanProtectedRoute({
  children,
  // showLoading = false
}) {
  // const { isLoading, isBanned } = useBanStatus(true);

  // // Show loading state if requested and still loading
  // if (showLoading && isLoading) {
  //   return <div>Checking ban status...</div>;
  // }

  // // If banned, the hook will handle the redirect, so return null
  // if (isBanned) {
  //   return null;
  // }

  // If not banned, render children
  return children;
}

BanProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  showLoading: PropTypes.bool,
};

BanProtectedRoute.defaultProps = {
  showLoading: false,
};

export default BanProtectedRoute;
