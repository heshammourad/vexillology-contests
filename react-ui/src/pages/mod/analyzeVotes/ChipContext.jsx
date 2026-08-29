import PropTypes from 'prop-types';
import {
  createContext, useContext, useMemo, useState,
} from 'react';

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

function ChipProvider({ children }) {
  const [chips, setChips] = useState(
    Object.fromEntries(
      Object.entries(CHIPS).map(([key, value]) => [key, value.defaultValue]),
    ),
  );

  const value = useMemo(() => ({ chips, setChips }), [chips]);

  return <ChipContext.Provider value={value}>{children}</ChipContext.Provider>;
}

ChipProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export {
  CHIPS, ChipContext, ChipProvider, useChipContext,
};
