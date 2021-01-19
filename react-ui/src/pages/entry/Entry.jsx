import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Toolbar from '@material-ui/core/Toolbar';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import FlagTwoToneIcon from '@material-ui/icons/FlagTwoTone';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import {
  Link as RouterLink, useHistory, useLocation, useParams,
} from 'react-router-dom';

import { useSwrData } from '../../common';

import './Entry.css';

const Entry = () => {
  const { contestId, entryId } = useParams();
  const { entries = [] } = useSwrData(`/contests/${contestId}`) || {};
  const entry = entries.find(({ id }) => id === entryId);

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
      <AppBar className="app-bar" position="fixed">
        <Toolbar>
          <Box display="flex" flexGrow={1}>
            {/* eslint-disable-next-line react/jsx-props-no-spreading */}
            <IconButton color="inherit" {...backProps}>
              <ArrowBackIcon />
            </IconButton>
          </Box>
          {entry && (
            <>
              <IconButton
                color="inherit"
                href={`https://www.reddit.com${entry.permalink}`}
                target="vexilollogy-contests-reddit"
              >
                <FlagTwoToneIcon />
              </IconButton>
              <IconButton color="inherit">
                <InfoOutlinedIcon />
              </IconButton>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Toolbar />
      {entry && (
        <Box className="flag" display="flex" alignItems="center" justifyContent="center">
          <img src={entry.imgurLink} alt="" />
        </Box>
      )}
    </div>
  );
};

export default Entry;
