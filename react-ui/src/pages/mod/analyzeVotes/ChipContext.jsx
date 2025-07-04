import { createContext, useContext } from 'react';

const CHIPS = {
  hideExcluded: {
    label: 'Hide excluded votes',
    defaultValue: false,
    color: 'error',
  },
  hideAutofiltered: {
    label: 'Hide autofiltered votes',
    defaultValue: false,
    color: 'error',
  },
  showRejected: {
    label: 'Show rejected votes in chart',
    defaultValue: false,
    color: 'primary',
  },
};

const ChipContext = createContext(null);

const useChipContext = () => {
  const context = useContext(ChipContext);
  if (!context) {
    throw new Error(
      'useChipContext must be used within a ChipContext.Provider',
    );
  }
  return context;
};

export { CHIPS, ChipContext, useChipContext };
