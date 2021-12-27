import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import { useSwrData } from '../../common';
import { ExternalLink, InternalLink } from '../../components';

const useStyles = makeStyles({
  contestName: {
    fontWeight: 'bold',
  },
  heading: {
    lineHeight: '64px',
  },
});

const Home = () => {
  const contests = useSwrData('/contests');

  const classes = useStyles();
  return (
    <Container>
      <Typography className={classes.heading} component="h1" variant="h6">
        Welcome to Vexillology Contests!
      </Typography>
      <p>
        This site is a companion site to the vexillology contests held at
        {' '}
        <ExternalLink href="https://reddit.com/r/vexillology">/r/vexillology</ExternalLink>
        {' '}
        to help
        view all the great entries in one place.
      </p>
      {contests && !!contests.length && (
        <p>
          Feel free to browse the entries in the most recent contest,
          {' '}
          <InternalLink className={classes.contestName} to={`/contests/${contests[0].id}`}>
            {contests[0].name}
          </InternalLink>
          , check out
          {' '}
          <InternalLink to="/contests">older contests</InternalLink>
          , or view the
          {' '}
          <InternalLink to="/hallOfFame">Hall of Fame</InternalLink>
          .
        </p>
      )}
    </Container>
  );
};

export default Home;
