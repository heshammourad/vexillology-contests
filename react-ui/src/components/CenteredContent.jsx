import Box from '@mui/material/Box';
import PropTypes from 'prop-types';

function CenteredContent({ children }) {
  return (
    <Box display="flex" alignItems="center" justifyContent="center">
      {children}
    </Box>
  );
}

CenteredContent.propTypes = {
  children: PropTypes.node.isRequired,
};

export default CenteredContent;
