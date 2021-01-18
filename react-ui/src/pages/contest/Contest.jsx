/* eslint-disable no-console */
import AppBar from '@material-ui/core/AppBar';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardMedia from '@material-ui/core/CardMedia';
import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import LazyLoad from 'react-lazyload';
import { Link as RouterLink, useParams, useRouteMatch } from 'react-router-dom';

import { useSwrData } from '../../common';
import { ElevationScroll } from '../../components';

import './Contest.css';

const Contest = () => {
  const { contestId } = useParams();
  const contest = useSwrData(`/contests/${contestId}`) || {};

  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  const match = useRouteMatch();

  const { name, entries } = contest;
  return (
    <div className="contest">
      <CssBaseline />
      <ElevationScroll>
        <AppBar color="default">
          <Toolbar>
            <IconButton component={RouterLink} to="/contests">
              <ArrowBackIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      </ElevationScroll>
      <Toolbar />
      {name && (
        <Container fixed>
          <Typography className="heading" variant={isSmUp ? 'h3' : 'h5'} component="h1">
            {name}
          </Typography>
          {entries && (
            <Grid container spacing={2}>
              {entries.map(({ id, imgurLink }) => (
                <Grid key={id} item xs={12} sm={6} lg={4}>
                  <Card id={id}>
                    <RouterLink
                      to={{ pathname: `${match.url}/entry/${id}`, state: { isFromContest: true } }}
                    >
                      <CardActionArea>
                        <LazyLoad height={600} offset={600} resize>
                          <CardMedia component="img" image={imgurLink} />
                        </LazyLoad>
                      </CardActionArea>
                    </RouterLink>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      )}
    </div>
  );
};

export default Contest;
