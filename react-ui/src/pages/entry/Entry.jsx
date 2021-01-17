import AppBar from '@material-ui/core/AppBar';
import IconButton from '@material-ui/core/IconButton';
import Toolbar from '@material-ui/core/Toolbar';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import {
  Link as RouterLink, useHistory, useLocation, useParams,
} from 'react-router-dom';

import './Entry.css';

const Entry = () => {
  const { contestId } = useParams();
  const history = useHistory();

  const { state = {} } = useLocation();
  const backProps = {};
  if (state.isFromContest) {
    backProps.onClick = () => history.goBack();
  } else {
    backProps.component = RouterLink;
    backProps.to = `/contests/${contestId}`;
  }
  return (
    <div className="entry">
      <AppBar className="app-bar">
        <Toolbar>
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <IconButton color="inherit" {...backProps}>
            <ArrowBackIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
    </div>
  );
};

export default Entry;
