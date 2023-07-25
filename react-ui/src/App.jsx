/**
 * Entry-point into the website. Contains theme and routing info.
 */

import CssBaseline from '@mui/material/CssBaseline';
import {
  BrowserRouter, Navigate, Route, Routes,
} from 'react-router-dom';
import { SWRConfig } from 'swr';

import { getData } from './api';
import { AppHelmet, CustomSnackbar, CustomThemeProvider } from './components';
import {
  AuthorizeCallback,
  Contest,
  Contests,
  Entry,
  HallOfFame,
  Home,
  ReviewSubmissions,
  Settings,
  Submission,
} from './pages';

function App() {
  return (
    <>
      <CssBaseline />
      <CustomThemeProvider>
        <SWRConfig
          value={{
            fetcher: (arr) => getData(...arr),
            revalidateOnMount: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
          }}
        >
          <div className="app">
            <BrowserRouter>
              <AppHelmet />
              <Routes>
                <Route exact path="/" element={<Navigate replace to="home" />} />
                <Route exact path="/authorizeCallback" element={<AuthorizeCallback />} />
                <Route exact path="/home" element={<Home />} />
                <Route exact path="/contests" element={<Contests />} />
                <Route exact path="/contests/:contestId" element={<Contest />} />
                <Route exact path="/contests/:contestId/entry/:entryId" element={<Entry />} />
                <Route exact path="/mod/review" element={<ReviewSubmissions />} />
                <Route exact path="/submission" element={<Submission />} />
                <Route
                  exact
                  path="/submit"
                  element={<Navigate replace state={{ defaultTab: 1 }} to="/submission" />}
                />
                <Route exact path="/hallOfFame" element={<HallOfFame />} />
                <Route exact path="/profile/settings" element={<Settings />} />
              </Routes>
            </BrowserRouter>
            <CustomSnackbar />
          </div>
        </SWRConfig>
      </CustomThemeProvider>
    </>
  );
}

export default App;
