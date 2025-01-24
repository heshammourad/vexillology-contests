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
import RedditIcon from '@material-ui/icons/Reddit';
import SettingsIcon from '@material-ui/icons/Settings';
import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import types from '../common/types';
import useAuthState from '../common/useAuthState';
import useRedditLogIn from '../common/useRedditLogIn';
import { getData } from '../data/api';
import useSwrInit from '../data/useSwrInit';

import CustomBadge from './CustomBadge';
import MenuItemLink from './MenuItemLink';
import ModeratorMenu from './ModeratorMenu';

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

/**
 * AccountMenu component renders a user account menu with options to log in, log out,
 * and access settings.
 *
 * If the user is a moderator, the component also renders a section with moderator actions.
 *
 * @param {Object} props - The component props.
 * @param {string} props.color - The color of the IconButton.
 *
 * @returns {JSX.Element} The rendered AccountMenu component.
 */
function AccountMenu({ color }) {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef(null);
  const { pathname } = useLocation();
  const classes = useStyles();

  const [
    { isLoggedIn, authTokens: { refreshToken } = {}, username },
    setAuthState,
  ] = useAuthState();
  const sendUserToAuthUrl = useRedditLogIn();

  const {
    data: { moderator, submissionsToReview },
  } = useSwrInit();

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

  return (
    <>
      <IconButton
        aria-controls={isMenuOpen ? 'accountMenu' : undefined}
        aria-haspopup="true"
        color={color}
        onClick={toggleMenu}
        ref={anchorRef}
      >
        <CustomBadge overlap="circular" invisible={!submissionsToReview}>
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
                    [
                      <ListItemText
                        key="username"
                        primary={(
                          <>
                            Logged in as
                            {' '}
                            <span className={classes.username}>{username}</span>
                          </>
                        )}
                      />,
                      <Divider key="divider" />,
                      moderator && (
                        <ModeratorSection key="moderator" onClick={closeMenu} />
                      ),
                      <MenuItemLink
                        key="settings"
                        Icon={SettingsIcon}
                        state={{ back: pathname }}
                        text="Settings"
                        to="/profile/settings"
                      />,
                      <MenuItemLink
                        key="logOut"
                        Icon={ExitToAppIcon}
                        onClick={handleAuthenticationAction}
                        text="Log Out"
                      />,
                    ]
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

function ModeratorSection({ onClick }) {
  const {
    data: { submissionsToReview },
  } = useSwrInit();
  const [badgedIcons, setBadgedIcons] = useState([]);

  useEffect(() => {
    if (submissionsToReview > 0) {
      setBadgedIcons((prev) => [...new Set([...prev, 'review'])]);
    } else {
      setBadgedIcons((prev) => prev.filter((icon) => icon !== 'review'));
    }
  }, [submissionsToReview]);

  return (
    <>
      <ListItemText>Mod Pages</ListItemText>
      <ModeratorMenu {...{ badgedIcons, onClick }} sx={{ p: 0 }} />
      <Divider />
    </>
  );
}

ModeratorSection.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default AccountMenu;
