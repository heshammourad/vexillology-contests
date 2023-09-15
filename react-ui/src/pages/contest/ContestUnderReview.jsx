/**
 * Displayed between submission and voting, which can be delayed
 */

import Box from '@material-ui/core/Box';
import PropTypes from 'prop-types';

import {
  SpinnerButton,
} from '../../components';

function ContestUnderReview({ isValidating, mutate }) {
  return (
    <>
      <Box marginBottom={2}>
        We are working on getting the contest ready! Please check again soon.
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

ContestUnderReview.propTypes = {
  isValidating: PropTypes.bool,
  mutate: PropTypes.func.isRequired,
};

ContestUnderReview.defaultProps = {
  isValidating: false,
};

export default ContestUnderReview;
