import { createContext } from 'react';

const DrawerStateContext = createContext({
  isOpen: false,
  setOpen: () => {},
});

export default DrawerStateContext;
