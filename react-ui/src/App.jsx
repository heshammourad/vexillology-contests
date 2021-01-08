import { BrowserRouter as Router, Redirect, Route } from 'react-router-dom';

import { Contests } from './pages';

import './App.css';

const App = () => (
  <div className="app">
    <Router>
      <Redirect to="/contests" />
      <Route exact path="/contests" component={Contests} />
    </Router>
  </div>
);

export default App;
