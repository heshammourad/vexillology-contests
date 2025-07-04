import PropTypes from 'prop-types';
import { createContext, useContext, useMemo } from 'react';

import useSwrAuth from '../../../data/useSwrAuth';

// 5 minutes in milliseconds for deduplication
const DEDUPING_INTERVAL = 300000;

const ContestBansContext = createContext(null);

const useContestBansContext = () => {
  const context = useContext(ContestBansContext);
  if (!context) {
    throw new Error(
      'useContestBansContext must be used within a ContestBansContext.Provider',
    );
  }
  return context;
};

function ContestBansProvider({ contestId, children }) {
  // Fetch contest bans data with 5-minute deduplication
  const {
    data: contestBansData,
    error,
    isLoading,
  } = useSwrAuth(contestId ? `/mod/contestBans?contestId=${contestId}` : null, {
    dedupingInterval: DEDUPING_INTERVAL,
  });

  const value = useMemo(
    () => ({
      userBanStatus: contestBansData?.userBanStatus || {},
      error,
      isLoading,
    }),
    [contestBansData?.userBanStatus, error, isLoading],
  );

  return (
    <ContestBansContext.Provider value={value}>
      {children}
    </ContestBansContext.Provider>
  );
}

ContestBansProvider.propTypes = {
  contestId: PropTypes.string,
  children: PropTypes.node.isRequired,
};

ContestBansProvider.defaultProps = {
  contestId: null,
};

export { ContestBansContext, ContestBansProvider, useContestBansContext };
