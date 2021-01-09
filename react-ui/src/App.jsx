import { BrowserRouter as Router, Redirect, Route } from 'react-router-dom';

import { Contest, Contests } from './pages';

import './App.css';

const App = () => (
  <div className="app">
    <Router>
      <Redirect to="/contests" />
      <Route exact path="/contests" component={Contests} />
      <Route path="/contests/:contestid" component={Contest} />
    </Router>
  </div>
);

export default App;
