import Container from '@material-ui/core/Container';
import { makeStyles } from '@material-ui/core/styles';

import { AppBarDivided, ExternalLink } from '../../components';

const useStyles = makeStyles(() => ({
  centerText: {
    textAlign: 'center',
  },
}));

function Banned() {
  const classes = useStyles();
  const isPermanentBan = true;
  const banExpiry = '';

  return (
    <>
      <AppBarDivided color="default" position="sticky" />
      <Container className={classes.centerText}>
        <br />
        <br />
        <h3>
          {isPermanentBan
            ? 'You have been permanently banned from participating in vexillologycontests.com'
            : `You have been banned from vexillologycontests.com until ${banExpiry}`}
        </h3>
        <p>
          If you believe this ban to be in error, you may contact the
          {' '}
          <ExternalLink href="https://www.reddit.com/message/compose?to=r/vexillology">
            /r/vexillology mods
          </ExternalLink>
          .
        </p>
      </Container>
    </>
  );
}

export default Banned;
