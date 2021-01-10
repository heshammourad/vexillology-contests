import AppBar from '@material-ui/core/AppBar';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

import { getData } from '../../api';
import { ListItemLink } from '../../components';

const Contests = ({ setContestName }) => {
  const [contests, setContests] = useState(null);
  useEffect(async () => {
    setContestName(null);
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
        <Grid xs={12} md={6}>
          <List>
            {contests.map(({ date, id, name }) => (
              <ListItemLink
                key={id}
                onClick={() => {
                  setContestName(name);
                }}
                primary={`${format(parseISO(date), 'MMM yy')} - ${name}`}
                to={`/contests/${id}`}
              />
            ))}
          </List>
        </Grid>
      )}
    </>
  );
};

Contests.propTypes = {
  setContestName: PropTypes.func.isRequired,
};

export default Contests;
