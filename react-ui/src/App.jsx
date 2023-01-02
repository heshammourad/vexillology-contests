import CssBaseline from '@material-ui/core/CssBaseline';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import {
  BrowserRouter, Navigate, Route, Routes,
} from 'react-router-dom';
import { SWRConfig } from 'swr';

import { getData } from './api';
import { AppHelmet } from './components';
import {
  AuthorizeCallback, Contest, Contests, Entry, HallOfFame, Home,
} from './pages';

import './App.css';

const theme = createTheme();

function App() {
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
          <div className="app">
            <AppHelmet />
            <BrowserRouter>
              <Routes>
                <Route exact path="/" element={<Navigate replace to="home" />} />
                <Route exact path="/home" element={<Home />} />
                <Route exact path="/contests" element={<Contests />} />
                <Route exact path="/contests/:contestId" element={<Contest />} />
                <Route exact path="/contests/:contestId/entry/:entryId" element={<Entry />} />
                <Route exact path="/hallOfFame" element={<HallOfFame />} />
                <Route exact path="/authorizeCallback" element={<AuthorizeCallback />} />
              </Routes>
            </BrowserRouter>
          </div>
        </SWRConfig>
      </ThemeProvider>
    </>
  );
}

export default App;
