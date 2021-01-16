import AppBar from '@material-ui/core/AppBar';
import List from '@material-ui/core/List';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import { useEffect, useState } from 'react';

import { getData } from '../../api';
import { ListItemLink } from '../../components';

import './Contests.css';

const Contests = () => {
  const [contests, setContests] = useState();
  useEffect(async () => {
    setContests(await getData('/contests'));
  }, []);
  return (
    <div className="contests">
      <AppBar position="static" color="default">
        <Toolbar>
          <Typography variant="h6">Vexillology Contests</Typography>
        </Toolbar>
      </AppBar>
      {contests && !!contests.length && (
        <div className="list">
          <List>
            {contests.map(({ date, id, name }) => (
              <ListItemLink
                key={id}
                primary={`${format(parseISO(date), 'MMM yy')} - ${name}`}
                to={`/contests/${id}`}
              />
            ))}
          </List>
        </div>
      )}
    </div>
  );
};

export default Contests;
