import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import FacebookIcon from '@material-ui/icons/Facebook';
import TwitterIcon from '@material-ui/icons/Twitter';
import { useLocation } from 'react-router-dom';

import { useSwrData } from '../../common';
import { CustomIconButton, ExternalLink, InternalLink } from '../../components';
import logo from '../../images/logo.png';

const useStyles = makeStyles((theme) => ({
  contestName: {
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: 'transparent',
    bottom: 0,
    color: '#616161',
    position: 'fixed',
    width: '100%',
  },
  footerContent: {
    flexWrap: 'wrap',
    padding: '32px 0',
    [theme.breakpoints.up('sm')]: {
      display: 'flex',
      padding: '64px 0',
    },
  },
  footerLeft: {
    display: 'block',
    textAlign: 'center',
    [theme.breakpoints.up('sm')]: {
      display: 'flex',
      flexGrow: 1,
    },
    '& a': {
      color: '#616161',
      marginLeft: 50,
      '&:first-of-type': {
        [theme.breakpoints.down('xs')]: {
          marginLeft: 0,
        },
      },
    },
  },
  footerLogo: {
    marginBottom: 16,
    justifyContent: 'center',
    [theme.breakpoints.up('sm')]: {
      marginBottom: 0,
      justifyContent: 'flex-start',
    },
  },
  footerSocial: {
    marginTop: 16,
    textAlign: 'center',
    [theme.breakpoints.up('sm')]: {
      marginTop: 0,
      textAlign: 'right',
    },
  },
  heading: {
    lineHeight: '64px',
  },
  logo: {
    marginRight: 12,
    width: 32,
  },
}));

const Home = () => {
  const contests = useSwrData('/contests');
  const location = useLocation();

  const classes = useStyles();
  return (
    <>
      <Container>
        <Typography className={classes.heading} component="h1" variant="h6">
          Welcome to Vexillology Contests!
        </Typography>
        <p>
          This site is a companion site to the vexillology contests held at
          {' '}
          <ExternalLink href="https://reddit.com/r/vexillology">/r/vexillology</ExternalLink>
          {' '}
          to
          help view all the great entries in one place.
        </p>
        {contests && !!contests.length && (
          <p>
            Feel free to browse the entries in the most recent contest,
            {' '}
            <InternalLink
              className={classes.contestName}
              to={{ pathname: `/contests/${contests[0].id}`, state: { back: location.pathname } }}
            >
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
      <footer className={classes.footer}>
        <Divider />
        <Container className={classes.footerContent}>
          <Box alignItems="center" className={classes.footerLeft}>
            <Box alignItems="center" className={classes.footerLogo} display="flex">
              <img alt="" className={classes.logo} src={logo} />
              <Typography component="span" variant="subtitle1">
                Vexillology Contests
              </Typography>
            </Box>
            <InternalLink to="/contests">Contests</InternalLink>
            <InternalLink to="/hallOfFame">Hall of Fame</InternalLink>
          </Box>
          <Box className={classes.footerSocial}>
            <CustomIconButton
              ariaLabel="Visit Vexillology Contests Page on Facebook"
              href="https://www.facebook.com/Vexillology-Contests-108702005212804"
              Icon={FacebookIcon}
            />
            <CustomIconButton
              ariaLabel="Visit VexContests on Twitter"
              href="https://twitter.com/VexContests"
              Icon={TwitterIcon}
            />
          </Box>
        </Container>
      </footer>
    </>
  );
};

export default Home;
