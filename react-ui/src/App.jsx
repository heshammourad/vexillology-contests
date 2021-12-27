import CssBaseline from '@material-ui/core/CssBaseline';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { useState } from 'react';
import { BrowserRouter as Router, Redirect, Route } from 'react-router-dom';
import { SWRConfig } from 'swr';

import { getData } from './api';
import { DrawerStateContext } from './common';
import {
  Contest, Contests, Entry, HallOfFame, Home,
} from './pages';

import './App.css';

const theme = createMuiTheme();

const App = () => {
  const [isOpen, setOpen] = useState(false);

  const drawerStateContextValue = {
    isOpen,
    setOpen: (isDrawerOpen) => {
      setOpen(isDrawerOpen);
    },
  };

  return (
    <>
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <SWRConfig
          value={{
            fetcher: getData,
            revalidateOnMount: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
          }}
        >
          <DrawerStateContext.Provider value={drawerStateContextValue}>
            <div className="app">
              <Router>
                <Route exact path="/">
                  <Redirect to="/home" />
                </Route>
                <Route exact path="/home" component={Home} />
                <Route exact path="/contests" component={Contests} />
                <Route exact path="/contests/:contestId" component={Contest} />
                <Route exact path="/contests/:contestId/entry/:entryId" component={Entry} />
                <Route exact path="/hallOfFame" component={HallOfFame} />
              </Router>
            </div>
          </DrawerStateContext.Provider>
        </SWRConfig>
      </ThemeProvider>
    </>
  );
};

export default App;
