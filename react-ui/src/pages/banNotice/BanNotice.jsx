import Container from '@material-ui/core/Container';
import { makeStyles } from '@material-ui/core/styles';
import format from 'date-fns/format';

import useBanStatus from '../../common/useBanStatus';
import { AppBarDivided, ExternalLink } from '../../components';

const useStyles = makeStyles(() => ({
  centerText: {
    textAlign: 'center',
  },
}));

function BanNotice() {
  const classes = useStyles();
  const { activeBan, isLoading } = useBanStatus(false); // No redirect on ban page

  console.log('ab: ', ab);

  // Get the most recent active ban
  const isPermanentBan = activeBan?.endDate === null;
  const banExpiry = activeBan?.endDate
    ? format(new Date(activeBan.endDate), 'MMMM d, yyyy')
    : '';

  if (isLoading) {
    return (
      <>
        <AppBarDivided color="default" position="sticky" />
        <Container className={classes.centerText}>
          <br />
          <br />
          <h3>Loading ban information...</h3>
        </Container>
      </>
    );
  }

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
        {activeBan?.reason && (
          <p>
            <strong>Reason:</strong>
            {' '}
            {activeBan.reason}
          </p>
        )}
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

export default BanNotice;
