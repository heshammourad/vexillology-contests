/**
 * User account
 * Settings and log out (if moderator: submission review)
 */

import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Divider from '@material-ui/core/Divider';
import Grow from '@material-ui/core/Grow';
import IconButton from '@material-ui/core/IconButton';
import ListItemText from '@material-ui/core/ListItemText';
import MenuList from '@material-ui/core/MenuList';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import { makeStyles } from '@material-ui/core/styles';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import AccountCircleOutlinedIcon from '@material-ui/icons/AccountCircleOutlined';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import PlaylistAddCheckIcon from '@material-ui/icons/PlaylistAddCheck';
import RedditIcon from '@material-ui/icons/Reddit';
import SettingsIcon from '@material-ui/icons/Settings';
import { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { getData } from '../api';
import { useAuthState, useRedditLogIn, useSwrData } from '../common';
import types from '../common/types';

import CustomBadge from './CustomBadge';
import MenuItemLink from './MenuItemLink';

const useStyles = makeStyles((theme) => ({
  accountMenu: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: theme.spacing(1),
    padding: theme.spacing(2),
    width: 300,
  },
  popper: {
    zIndex: 1,
  },
  username: {
    fontWeight: 'bold',
  },
}));

function AccountMenu({ color }) {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef(null);
  const { pathname } = useLocation();
  const classes = useStyles();

  const [{ isLoggedIn, refreshToken, username }, setAuthState] = useAuthState();
  const sendUserToAuthUrl = useRedditLogIn();

  const {
    data: { moderator, submissionsToReview },
  } = useSwrData('/init');

  const toggleMenu = () => {
    setMenuOpen((prevOpen) => !prevOpen);
  };

  const closeMenu = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }

    setMenuOpen(false);
  };

  const handleListKeyDown = (event) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      setMenuOpen(false);
    }
  };

  const handleAuthenticationAction = async () => {
    setMenuOpen(false);
    if (isLoggedIn) {
      try {
        await getData(`/revokeToken/${refreshToken}`);
      } finally {
        setAuthState({});
      }
    } else {
      sendUserToAuthUrl();
    }
  };

  const reviewSubmissionsIcon = () => (
    <CustomBadge invisible={!submissionsToReview}>
      <PlaylistAddCheckIcon />
    </CustomBadge>
  );

  return (
    <>
      <IconButton
        aria-controls={isMenuOpen ? 'accountMenu' : undefined}
        aria-haspopup="true"
        color={color}
        onClick={toggleMenu}
        ref={anchorRef}
      >
        <CustomBadge invisible={!submissionsToReview}>
          {isLoggedIn ? <AccountCircleIcon /> : <AccountCircleOutlinedIcon />}
        </CustomBadge>
      </IconButton>
      <Popper
        anchorEl={anchorRef.current}
        className={classes.popper}
        disablePortal
        open={isMenuOpen}
        placement="bottom-end"
        role={undefined}
        transition
      >
        {({ TransitionProps }) => (
          // eslint-disable-next-line react/jsx-props-no-spreading
          <Grow {...TransitionProps}>
            <Paper>
              <ClickAwayListener onClickAway={closeMenu}>
                <MenuList
                  className={classes.accountMenu}
                  autoFocusItem={isMenuOpen}
                  id="accountMenu"
                  onKeyDown={handleListKeyDown}
                >
                  {isLoggedIn ? (
                    <>
                      <ListItemText
                        primary={(
                          <>
                            Logged in as
                            {' '}
                            <span className={classes.username}>{username}</span>
                          </>
                        )}
                      />
                      <Divider />
                      <MenuItemLink
                        Icon={SettingsIcon}
                        state={{ back: pathname }}
                        text="Settings"
                        to="/profile/settings"
                      />
                      {moderator && (
                        <MenuItemLink
                          Icon={reviewSubmissionsIcon}
                          state={{ back: pathname }}
                          text="Review Submissions"
                          to="/mod/review"
                        />
                      )}
                      <MenuItemLink
                        Icon={ExitToAppIcon}
                        onClick={handleAuthenticationAction}
                        text="Log Out"
                      />
                    </>
                  ) : (
                    <MenuItemLink
                      Icon={RedditIcon}
                      onClick={handleAuthenticationAction}
                      text="Log In"
                    />
                  )}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}

AccountMenu.propTypes = {
  color: types.color,
};

AccountMenu.defaultProps = {
  color: 'default',
};

export default AccountMenu;
