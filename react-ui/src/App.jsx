import CssBaseline from '@material-ui/core/CssBaseline';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import {
  BrowserRouter, Navigate, Route, Routes,
} from 'react-router-dom';
import { SWRConfig } from 'swr';

import { getData } from './api';
import { AppHelmet, CustomSnackbar } from './components';
import {
  AuthorizeCallback, Contest, Contests, Entry, HallOfFame, Home, Settings,
} from './pages';

import './App.css';

const theme = createTheme({
  palette: {
    flagMakerPrint: {
      main: '#ea433e',
    },
    vexyBlue: {
      dark: '#3868c8',
      light: '#a8c5ff',
      main: '#7295fc',
    },
    vexyOrange: {
      dark: '#c10000',
      light: '#ff7c4c',
      main: '#fc471e',
    },
  },
});

function App() {
  return (
    <>
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <SWRConfig
          value={{
            fetcher: (arr) => getData(...arr),
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
                <Route exact path="/authorizeCallback" element={<AuthorizeCallback />} />
                <Route exact path="/home" element={<Home />} />
                <Route exact path="/contests" element={<Contests />} />
                <Route exact path="/contests/:contestId" element={<Contest />} />
                <Route exact path="/contests/:contestId/entry/:entryId" element={<Entry />} />
                <Route exact path="/hallOfFame" element={<HallOfFame />} />
                <Route exact path="/profile/settings" element={<Settings />} />
              </Routes>
            </BrowserRouter>
            <CustomSnackbar />
          </div>
        </SWRConfig>
      </ThemeProvider>
    </>
  );
}

export default App;
