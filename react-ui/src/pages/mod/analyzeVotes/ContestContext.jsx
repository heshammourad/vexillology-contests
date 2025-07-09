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

// Abstract hook for fetching contest analysis data
const useContestAnalysisData = (contestId, endpoint) => useSwrAuth(contestId ? `/mod/analyzeVotes/${contestId}/${endpoint}` : null, {
  dedupingInterval: DEDUPING_INTERVAL,
  revalidateOnFocus: false,
});

function ContestProvider({ contestId, children }) {
  // Fetch contest bans data with 5-minute deduplication
  const {
    data: bansData,
    error: bansError,
    isLoading: bansLoading,
  } = useSwrAuth(contestId ? `/mod/contestBans?contestId=${contestId}` : null, {
    dedupingInterval: DEDUPING_INTERVAL,
    revalidateOnFocus: false,
  });

  // Fetch contest entries analysis
  const {
    data: entriesData,
    error: entriesError,
    isLoading: entriesLoading,
  } = useContestAnalysisData(contestId, 'entries');

  // Fetch contest voters analysis
  const {
    data: votersData,
    error: votersError,
    isLoading: votersLoading,
  } = useContestAnalysisData(contestId, 'voters');

  // Fetch contest voter patterns analysis
  const {
    data: voterPatternsData,
    error: voterPatternsError,
    isLoading: voterPatternsLoading,
  } = useContestAnalysisData(contestId, 'voterPatterns');

  // Fetch contest voting matrix analysis
  const {
    data: votingMatrixData,
    error: votingMatrixError,
    isLoading: votingMatrixLoading,
  } = useContestAnalysisData(contestId, 'votingMatrix');

  const value = useMemo(
    () => ({
      // Contest bans data
      bansData: bansData || {},
      bansError,
      bansLoading,

      // Contest entries analysis
      entriesData: entriesData || {},
      entriesError,
      entriesLoading,
      numberOfEntries: Object.keys(entriesData || {}).length,

      // Contest voters analysis
      votersData: votersData || {},
      votersError,
      votersLoading,

      // Contest voter patterns analysis
      voterPatternsData: voterPatternsData || {},
      voterPatternsError,
      voterPatternsLoading,

      // Contest voting matrix analysis
      votingMatrixData: votingMatrixData || [],
      votingMatrixError,
      votingMatrixLoading,

      // Combined loading state
      isLoading:
        bansLoading
        || entriesLoading
        || votersLoading
        || voterPatternsLoading
        || votingMatrixLoading,

      // Combined error state
      error:
        bansError
        || entriesError
        || votersError
        || voterPatternsError
        || votingMatrixError,
    }),
    [
      bansData,
      entriesData,
      votersData,
      voterPatternsData,
      votingMatrixData,
      bansError,
      entriesError,
      votersError,
      voterPatternsError,
      votingMatrixError,
      bansLoading,
      entriesLoading,
      votersLoading,
      voterPatternsLoading,
      votingMatrixLoading,
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
