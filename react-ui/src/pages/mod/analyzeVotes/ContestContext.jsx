import PropTypes from 'prop-types';
import { createContext, useContext, useMemo } from 'react';

import useSwrAuth from '../../../data/useSwrAuth';

// 5 minutes in milliseconds for deduplication
const DEDUPING_INTERVAL = 300000;

const ContestContext = createContext(null);

const useContestContext = () => {
  const context = useContext(ContestContext);
  if (!context) {
    throw new Error(
      'useContestContext must be used within a ContestContext.Provider',
    );
  }
  return context;
};

function ContestProvider({ contestId, children }) {
  // Fetch contest bans data with 5-minute deduplication
  const {
    data: contestBansData,
    error: bansError,
    isLoading: bansLoading,
  } = useSwrAuth(contestId ? `/mod/contestBans?contestId=${contestId}` : null, {
    dedupingInterval: DEDUPING_INTERVAL,
    revalidateOnFocus: false,
  });

  // Fetch contest voters data
  const {
    data: contestVotersData,
    error: votersError,
    isLoading: votersLoading,
  } = useSwrAuth(contestId ? `/mod/analyzeVotes/${contestId}/voters` : null, {
    dedupingInterval: DEDUPING_INTERVAL,
    revalidateOnFocus: false,
  });

  const value = useMemo(
    () => ({
      // Contest bans data
      userBanStatus: contestBansData?.userBanStatus || {},
      bansError,
      bansLoading,

      // Contest voters data
      votersData: contestVotersData || {},
      votersError,
      votersLoading,

      // Combined loading state
      isLoading: bansLoading || votersLoading,

      // Combined error state
      error: bansError || votersError,
    }),
    [
      contestBansData?.userBanStatus,
      contestVotersData,
      bansError,
      votersError,
      bansLoading,
      votersLoading,
    ],
  );

  return (
    <ContestContext.Provider value={value}>{children}</ContestContext.Provider>
  );
}

ContestProvider.propTypes = {
  contestId: PropTypes.string,
  children: PropTypes.node.isRequired,
};

ContestProvider.defaultProps = {
  contestId: null,
};

export { ContestContext, ContestProvider, useContestContext };
