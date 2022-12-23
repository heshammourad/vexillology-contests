import Button from '@material-ui/core/Button';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import AccountCircleOutlinedIcon from '@material-ui/icons/AccountCircleOutlined';
import RedditIcon from '@material-ui/icons/Reddit';
import { nanoid } from 'nanoid';
import { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { getData } from '../api';
import { useAuthState, useSwrData } from '../common';

const LOG_IN_BUTTON_BACKGROUND_COLOR = '#ff4500';

const useStyles = makeStyles((theme) => ({
  accountMenu: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: theme.spacing(1),
    padding: theme.spacing(2),
  },
  logInButton: {
    backgroundColor: LOG_IN_BUTTON_BACKGROUND_COLOR,
    color: '#fff',
    '&:hover': {
      backgroundColor: LOG_IN_BUTTON_BACKGROUND_COLOR,
    },
  },
  username: {
    fontWeight: 'bold',
  },
}));

function AccountMenu() {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef(null);
  const classes = useStyles();

  const { pathname } = useLocation();
  const [{ isLoggedIn, refreshToken, username }, setAuthState] = useAuthState();
  const { webAppClientId = '-SiCGPr5sPG4Xg' } = useSwrData('/init', { allowRefresh: false }) || {};

  const toggleMenu = () => {
    setMenuOpen((prevOpen) => !prevOpen);
  };

  const closeMenu = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }

    setMenuOpen(false);
  };

  const handleRedditClick = async () => {
    if (isLoggedIn) {
      try {
        await getData(`/revokeToken/${refreshToken}`);
      } catch (e) {
        // TODO: Handle error
      } finally {
        setAuthState({});
        setMenuOpen(false);
      }
    } else {
      const nonce = nanoid();
      setAuthState({ nonce });

      const state = window.btoa(JSON.stringify({ [nonce]: { redirectPath: pathname } }));
      let url = 'https://www.reddit.com/api/v1/authorize';
      url += `?client_id=${webAppClientId}`;
      url += '&response_type=code';
      url += `&state=${state}`;
      url += `&redirect_uri=${window.location.origin}/authorizeCallback`;
      url += '&duration=permanent';
      url += '&scope=identity,read,vote';

      window.open(url, '_blank');
      setMenuOpen(false);
    }
  };

  return (
    <>
      <IconButton
        aria-controls={isMenuOpen ? 'accountMenu' : undefined}
        aria-haspopup="true"
        color="inherit"
        onClick={toggleMenu}
        ref={anchorRef}
      >
        {isLoggedIn ? <AccountCircleIcon /> : <AccountCircleOutlinedIcon />}
      </IconButton>
      <Popper
        anchorEl={anchorRef.current}
        disablePortal
        open={isMenuOpen}
        role={undefined}
        transition
      >
        {({ TransitionProps }) => (
          // eslint-disable-next-line react/jsx-props-no-spreading
          <Grow {...TransitionProps}>
            <Paper>
              <ClickAwayListener onClickAway={closeMenu}>
                <div className={classes.accountMenu} id="accountMenu">
                  <Typography component="div" variant="subtitle1">
                    {isLoggedIn ? (
                      <>
                        Logged in as
                        {' '}
                        <span className={classes.username}>{username}</span>
                        .
                      </>
                    ) : (
                      'Log in to vote directly from here.'
                    )}
                  </Typography>
                  <Button
                    className={classes.logInButton}
                    startIcon={<RedditIcon />}
                    variant="contained"
                    onClick={handleRedditClick}
                  >
                    Log
                    {' '}
                    {isLoggedIn ? 'Out' : 'In'}
                  </Button>
                </div>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}

export default AccountMenu;
