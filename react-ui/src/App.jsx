import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { BrowserRouter as Router, Redirect, Route } from 'react-router-dom';

import { Contest, Contests } from './pages';

import './App.css';

const theme = createMuiTheme();

const App = () => (
  <ThemeProvider theme={theme}>
    <div className="app">
      <Router>
        <Route exact path="/">
          <Redirect to="/contests" />
        </Route>
        <Route exact path="/contests" component={Contests} />
        <Route path="/contests/:contestId" component={Contest} />
      </Router>
    </div>
  </ThemeProvider>
);

export default App;
