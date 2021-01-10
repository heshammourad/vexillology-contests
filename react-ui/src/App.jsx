import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { useState } from 'react';
import { BrowserRouter as Router, Redirect, Route } from 'react-router-dom';

import { Contest, Contests } from './pages';

import './App.css';

const theme = createMuiTheme();

const App = () => {
  const [contestName, setContestName] = useState(null);
  return (
    <ThemeProvider theme={theme}>
      <div className="app">
        <Router>
          <Route exact path="/">
            <Redirect to="/contests" />
          </Route>
          <Route
            exact
            path="/contests"
            render={() => <Contests setContestName={setContestName} />}
          />
          <Route path="/contests/:contestid" render={() => <Contest contestName={contestName} />} />
        </Router>
      </div>
    </ThemeProvider>
  );
};

export default App;
