import AppBar from '@material-ui/core/AppBar';
import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import IconButton from '@material-ui/core/IconButton';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import PropTypes from 'prop-types';
import { Link as RouterLink, Redirect } from 'react-router-dom';

import { ElevationScroll } from '../../components';

import './Contest.css';

const Contest = ({ contestName }) => {
  if (!contestName) {
    return <Redirect to="/contests" />;
  }
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
      <Container className="heading">
        <Typography variant={isSmUp ? 'h3' : 'h5'} component="h1">
          {contestName}
        </Typography>
      </Container>
    </div>
  );
};

Contest.propTypes = {
  contestName: PropTypes.string,
};

Contest.defaultProps = {
  contestName: null,
};

export default Contest;
