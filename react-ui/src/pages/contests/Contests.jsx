import AppBar from '@material-ui/core/AppBar';
import List from '@material-ui/core/List';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';

import { useSwrData } from '../../common';
import { ListItemLink } from '../../components';

const useStyles = makeStyles({
  list: {
    maxWidth: 512,
  },
});

const Contests = () => {
  const contests = useSwrData('/contests');
  const classes = useStyles();
  return (
    <div>
      <AppBar position="static" color="default">
        <Toolbar>
          <Typography variant="h6">Vexillology Contests</Typography>
        </Toolbar>
      </AppBar>
      {contests && !!contests.length && (
        <div className={classes.list}>
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
