import AppBar from '@material-ui/core/AppBar';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import IconButton from '@material-ui/core/IconButton';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { Link as RouterLink, Redirect, useParams } from 'react-router-dom';

import { getData } from '../../api';
import { ElevationScroll } from '../../components';

import './Contest.css';

const Contest = ({ name }) => {
  if (!name) {
    return <Redirect to="/contests" />;
  }

  const [contestData, setContestData] = useState();
  const { contestId } = useParams();

  useEffect(async () => {
    setContestData(await getData(`/contests/${contestId}`));
  }, []);

  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
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
      <Container>
        <Typography className="heading" variant={isSmUp ? 'h3' : 'h5'} component="h1">
          {name}
        </Typography>
        {contestData
          && contestData.map(({ imgurLink }) => (
            <Card>
              <CardActionArea>
                <CardMedia component="img" image={imgurLink} />
              </CardActionArea>
              <CardContent />
            </Card>
          ))}
      </Container>
    </div>
  );
};

Contest.propTypes = {
  name: PropTypes.string,
};

Contest.defaultProps = {
  name: null,
};

export default Contest;
