/**
 * Entry-point into the website. Contains theme and routing info.
 * Modal: https://v5.reactrouter.com/web/example/modal-gallery
 */

import CssBaseline from '@material-ui/core/CssBaseline';
import {
  BrowserRouter, Navigate, Route, Routes, Link,
} from 'react-router-dom';
import { SWRConfig } from 'swr';

import { AppHelmet, CustomSnackbar, CustomThemeProvider } from './components';
import localStorageProvider from './data/LocalStorageProvider';
import { getData } from './data/api';
import {
  AnalyzeVotes,
  AuthorizeCallback,
  Contest,
  Contests,
  EntryModal,
  HallOfFame,
  Home,
  ReviewSubmissions,
  Settings,
  Submission,
} from './pages';
/* eslint-disable no-restricted-imports */
import Mod from './pages/mod/Mod';
import ContestSummary from './pages/mod/contestSummary/ContestSummary';
import ContestRules from './pages/submission/ContestRules';
/* eslint-enable no-restricted-imports */

function App() {
  return (
    <>
      <CssBaseline />
      <CustomThemeProvider>
        <SWRConfig
          value={{
            fetcher: (arr) => getData(...arr),
            provider: localStorageProvider,
            revalidateOnMount: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
          }}
        >
          <div className="app">
            <BrowserRouter>
              <AppHelmet />
              <ModalSwitch />
            </BrowserRouter>
            <CustomSnackbar />
          </div>
        </SWRConfig>
      </CustomThemeProvider>
    </>
  );
}

function ModalSwitch() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Navigate replace to="home" />} />
        <Route path="/authorizeCallback" element={<AuthorizeCallback />} />
        <Route path="/home" element={<Home />} />
        <Route path="/contests" element={<Contests />} />
        <Route path="/contests/:contestId" element={<Contest />}>
          <Route
            path="/contests/:contestId/entry/:entryId"
            element={<EntryModal />}
          />
        </Route>
        <Route path="/mod" element={<Mod />}>
          <Route index element={<ReviewSubmissions />} />
          <Route path="analyze" element={<AnalyzeVotes />}>
            <Route path=":contestId" element={<AnalyzeVotes />} />
          </Route>
          <Route path="contestSummary" element={<ContestSummary />} />
          <Route path="review" element={<ReviewSubmissions />} />
        </Route>
        <Route path="/submission" element={<Submission />}>
          <Route path="/submission/rules" element={<ContestRules />} />
        </Route>
        <Route
          path="/submit"
          element={
            <Navigate replace state={{ defaultTab: 1 }} to="/submission" />
          }
        />
        <Route path="/hallOfFame" element={<HallOfFame />} />
        <Route path="/profile/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>404 not found</h1>
      <p>Please go back or</p>
      <Link to="/">Return Home</Link>
    </div>
  );
}

export default App;
