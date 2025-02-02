import Box from '@material-ui/core/Box';
import PropTypes from 'prop-types';

import { SpinnerButton } from '../../components';

/**
 * ContestResutlsNotCertified component displays a message indicating that the contest results are
 * being prepared and provides a button to refresh the results.
 *
 * @param {Object} props - The component props.
 * @param {boolean} props.isValidating - Indicates if the data is currently being fetched.
 * @param {Function} props.mutate - Function to trigger the refresh of the contest results.
 *
 * @returns {JSX.Element} The rendered component.
 */
function ContestResutlsNotCertified({ isValidating, mutate }) {
  return (
    <>
      <Box marginBottom={2}>
        We are working on getting the contest results ready! Please check again
        soon.
      </Box>
      <SpinnerButton
        color="primary"
        disabled={isValidating}
        onClick={mutate}
        submitting={isValidating}
        variant="contained"
      >
        Refresh
      </SpinnerButton>
    </>
  );
}

ContestResutlsNotCertified.propTypes = {
  isValidating: PropTypes.bool,
  mutate: PropTypes.func.isRequired,
};

ContestResutlsNotCertified.defaultProps = {
  isValidating: false,
};

export default ContestResutlsNotCertified;
