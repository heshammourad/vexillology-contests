import {
  Box,
  CircularProgress,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';

// Shared table structure wrapper
function TableStateWrapper({ children }) {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={100} align="center">
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={4}
            gap={2}
          >
            {children}
          </Box>
        </TableCell>
      </TableRow>
    </TableBody>
  );
}

// Abstract loading component
function LoadingState({ text = 'Loading data...' }) {
  return (
    <>
      <CircularProgress size={40} />
      <Typography variant="body2" color="text.secondary">
        {text}
      </Typography>
    </>
  );
}

// Abstract error component
function ErrorState({ text = 'An error occurred while loading data.' }) {
  return (
    <>
      <Typography variant="h6" color="error" gutterBottom>
        Error
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center">
        {text}
      </Typography>
    </>
  );
}

function TableBodyWrapper({
  children,
  error,
  loading,
  loadingText = 'Loading data...',
  errorText = 'An error occurred while loading data.',
}) {
  if (loading) {
    return (
      <TableStateWrapper>
        <LoadingState text={loadingText} />
      </TableStateWrapper>
    );
  }

  if (error) {
    return (
      <TableStateWrapper>
        <ErrorState text={errorText} />
      </TableStateWrapper>
    );
  }

  return children;
}

TableStateWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};

LoadingState.propTypes = {
  text: PropTypes.string,
};

LoadingState.defaultProps = {
  text: 'Loading data...',
};

ErrorState.propTypes = {
  text: PropTypes.string,
};

ErrorState.defaultProps = {
  text: 'An error occurred while loading data.',
};

TableBodyWrapper.propTypes = {
  children: PropTypes.node,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  loading: PropTypes.bool,
  loadingText: PropTypes.string,
  errorText: PropTypes.string,
};

TableBodyWrapper.defaultProps = {
  children: null,
  error: null,
  loading: false,
  loadingText: 'Loading data...',
  errorText: 'An error occurred while loading data.',
};

export default TableBodyWrapper;
