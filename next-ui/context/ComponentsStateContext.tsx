'use client';

import React, {createContext, useContext, useState, ReactNode} from 'react';

export interface SnackbarState {
  openTimestamp?: number;
  type?: string;
}

export interface ComponentsState {
  redditLogInDialogOpen: boolean;
  snackbar: SnackbarState;
  votingDisabled: boolean;
}

const DEFAULT_STATE: ComponentsState = {
  redditLogInDialogOpen: false,
  snackbar: {},
  votingDisabled: false,
};

type UpdateStateFn = (newStates?: Partial<ComponentsState> | null) => void;

interface ComponentsStateContextType {
  state: ComponentsState;
  updateState: UpdateStateFn;
}

const ComponentsStateContext = createContext<
  ComponentsStateContextType | undefined
>(undefined);

export function ComponentsStateProvider({children}: {children: ReactNode}) {
  const [state, setState] = useState<ComponentsState>(DEFAULT_STATE);

  const updateState: UpdateStateFn = (newStates) => {
    if (newStates === undefined || newStates === null) {
      setState(DEFAULT_STATE);
      return;
    }
    setState((prev) => ({...prev, ...newStates}));
  };

  return (
    <ComponentsStateContext.Provider value={{state, updateState}}>
      {children}
    </ComponentsStateContext.Provider>
  );
}

export function useComponentsState(): [ComponentsState, UpdateStateFn] {
  const context = useContext(ComponentsStateContext);
  if (context === undefined) {
    throw new Error(
      'useComponentsState must be used within a ComponentsStateProvider',
    );
  }
  return [context.state, context.updateState];
}
export default useComponentsState;
