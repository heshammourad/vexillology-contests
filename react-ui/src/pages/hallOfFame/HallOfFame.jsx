import Container from '@material-ui/core/Container';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { useTheme, makeStyles } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';

import { useClientWidth, useSwrData } from '../../common';
import { AppBarDivided, ArrowBackButton } from '../../components';

import HallOfFameCard from './HallOfFameCard';

const useStyles = makeStyles({
  container: {
    marginBottom: 32,
  },
});

const HallOfFame = () => {
  const hallOfFame = useSwrData('/hallOfFame');
  const theme = useTheme();
  const clientWidth = useClientWidth();

  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  const imageWidth = Math.min(clientWidth, 960) - (isSmUp ? 48 : 32);

  const classes = useStyles();
  return (
    <>
      <AppBarDivided color="default" position="static">
        <Toolbar>
          <ArrowBackButton to="/" useRouterLink />
          <Typography variant="h6">Hall of Fame</Typography>
        </Toolbar>
      </AppBarDivided>
      {hallOfFame && !!hallOfFame.length && (
        <Container className={classes.container} maxWidth="md">
          {hallOfFame.map((entry) => (
            <HallOfFameCard key={entry.entryId} entry={entry} imageDisplayWidth={imageWidth} />
          ))}
        </Container>
      )}
    </>
  );
};

export default HallOfFame;
