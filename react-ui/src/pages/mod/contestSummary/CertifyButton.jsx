import isFuture from 'date-fns/isFuture';
import PropTypes from 'prop-types';

import snackbarTypes from '../../../common/snackbarTypes';
import useSnackbarState from '../../../common/useSnackbarState';
import { SpinnerButton } from '../../../components';
import { putData } from '../../../data/api';
import useSwrMutation from '../../../data/useSwrMutation';

function CertifyButton({ contestId, resultsCertified, voteEnd }) {
  const { isMutating, trigger } = useSwrMutation(
    '/mod/contestSummary',
    putData,
    '/mod/manageContest',
  );
  const updateSnackbarState = useSnackbarState();

  const showError = () => {
    updateSnackbarState(snackbarTypes.CERTIFY_RESULTS_ERROR);
  };

  const handleCertifyResults = async () => {
    const payload = { id: contestId, resultsCertified: !resultsCertified };
    trigger(payload, {
      optimisticData: (current) => ({
        ...current,
        resultsCertified: !resultsCertified,
      }),
      revalidate: false,
      populateCache: (response, current) => {
        if (!response) {
          showError();
          return current;
        }

        updateSnackbarState(snackbarTypes.CERTIFY_RESULTS_SUCCESS);
        return { ...current, resultsCertified: !resultsCertified };
      },
      onError: showError,
    });
  };

  return (
    <SpinnerButton
      color="primary"
      disabled={voteEnd && isFuture(new Date(voteEnd))}
      disabledTooltip="Can't certify results before voting window closes"
      onClick={handleCertifyResults}
      submitting={isMutating}
      variant="contained"
    >
      {resultsCertified ? 'Decertify Results' : 'Certify Results'}
    </SpinnerButton>
  );
}

CertifyButton.propTypes = {
  contestId: PropTypes.string.isRequired,
  resultsCertified: PropTypes.bool,
  voteEnd: PropTypes.string,
};

CertifyButton.defaultProps = {
  resultsCertified: false,
  voteEnd: null,
};

export default CertifyButton;
