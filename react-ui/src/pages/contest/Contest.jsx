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
import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';

import { getData } from '../../api';
import { ElevationScroll } from '../../components';

import './Contest.css';

const Contest = () => {
  const [contestData, setContestData] = useState({});
  const { contestId } = useParams();

  useEffect(async () => {
    setContestData(await getData(`/contests/${contestId}`));
  }, []);

  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));

  const { name, entries } = contestData;
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
        <Container>
          <Typography className="heading" variant={isSmUp ? 'h3' : 'h5'} component="h1">
            {name}
          </Typography>
          {entries && (
            <Grid container alignItems="center" spacing={2}>
              {entries.map(({ imgurLink }) => (
                <Grid item xs={12} sm={6} lg={4}>
                  <Card>
                    <CardActionArea>
                      <CardMedia component="img" image={imgurLink} />
                    </CardActionArea>
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
