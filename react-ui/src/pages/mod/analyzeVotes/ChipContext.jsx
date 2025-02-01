import { createContext, useContext } from 'react';

const DEFAULT_CHIPS = {
  hideBadVotes: false,
};

const ChipContext = createContext(null);

const useChipContext = () => {
  const context = useContext(ChipContext);
  if (!context) {
    throw new Error('useParentContext must be used within a ParentProvider');
  }
  return context;
};

export { DEFAULT_CHIPS, ChipContext, useChipContext };
