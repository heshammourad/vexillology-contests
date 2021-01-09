import AppBar from '@material-ui/core/AppBar';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import { useEffect, useState } from 'react';

import { getData } from '../../api';

const Contests = () => {
  const [contests, setContests] = useState(null);
  useEffect(async () => {
    setContests(await getData('/contests'));
  }, []);
  return (
    <>
      <AppBar position="static" color="transparent">
        <Toolbar>
          <Typography variant="h6">Vexillology Contests</Typography>
        </Toolbar>
      </AppBar>
      {contests && !!contests.length && (
        <Grid xs={2}>
          <List>
            {contests.map(({ date, name }) => (
              <ListItem button>
                <ListItemText primary={`${format(parseISO(date), 'MMM yy')} - ${name}`} />
              </ListItem>
            ))}
          </List>
        </Grid>
      )}
    </>
  );
};

export default Contests;
