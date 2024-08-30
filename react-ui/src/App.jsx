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
  AuthorizeCallback,
  Contest,
  Contests,
  EntryModal,
  HallOfFame,
  Home,
  ReviewSubmissions,
  AnalyzeVotes,
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
        <Route path="/mod/review" element={<ReviewSubmissions />} />
        <Route path="/mod/analyze" element={<AnalyzeVotes />} />
        <Route path="/mod/analyze/:contestId" element={<AnalyzeVotes />} />
        <Route path="/submission" element={<Submission />} />
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
