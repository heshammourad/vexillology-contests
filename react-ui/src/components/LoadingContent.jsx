import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import PropTypes from 'prop-types';

/**
 * LoadingContent component displays a loading spinner or the provided children based on the loading
 * state.
 *
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The content to display when not loading.
 * @param {boolean} props.loading - The loading state. If true, a loading spinner is displayed.
 * @returns {JSX.Element} The rendered component.
 */
function LoadingContent({ children, loading }) {
  return loading ? (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <CircularProgress />
    </Box>
  ) : (
    children
  );
}

LoadingContent.propTypes = {
  children: PropTypes.node,
  loading: PropTypes.bool.isRequired,
};

LoadingContent.defaultProps = {
  children: null,
};

export default LoadingContent;
