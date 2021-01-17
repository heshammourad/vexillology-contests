import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { BrowserRouter as Router, Redirect, Route } from 'react-router-dom';
import { SWRConfig } from 'swr';

import { getData } from './api';
import { Contest, Contests, Entry } from './pages';

import './App.css';

const theme = createMuiTheme();

const App = () => (
  <ThemeProvider theme={theme}>
    <SWRConfig value={{ fetcher: getData }}>
      <div className="app">
        <Router>
          <Route exact path="/">
            <Redirect to="/contests" />
          </Route>
          <Route exact path="/contests" component={Contests} />
          <Route exact path="/contests/:contestId" component={Contest} />
          <Route exact path="/contests/:contestId/entry/:entryId" component={Entry} />
        </Router>
      </div>
    </SWRConfig>
  </ThemeProvider>
);

export default App;
