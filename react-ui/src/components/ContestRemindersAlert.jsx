import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import ExternalLink from './ExternalLink';
import InternalLink from './InternalLink';

/**
 * Typography component for list items in the alert
 */
function ListItemTypography({ children }) {
  return (
    <Typography component="li" variant="body2" sx={{ marginBottom: 0.5 }}>
      {children}
    </Typography>
  );
}

ListItemTypography.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Alert component for contest reminders setup
 */
function ContestRemindersAlert({ dismissable = true }) {
  // Start as dismissed, will be updated after localStorage check
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Check localStorage on component mount
    const isDismissed = localStorage.getItem('contestRemindersAlertDismissed') === 'true';
    setDismissed(isDismissed);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('contestRemindersAlertDismissed', 'true');
  };

  if (dismissed && dismissable) {
    return null;
  }

  return (
    <Alert
      severity="info"
      onClose={dismissable ? handleDismiss : undefined}
      sx={{
        margin: 2,
        '& .MuiAlert-message': {
          width: '100%',
        },
      }}
    >
      <Typography variant="body1" sx={{ fontWeight: 'bold', marginBottom: 1 }}>
        IMPORTANT IF YOU WANT / HAVE CONTEST REMINDERS
      </Typography>
      <Typography variant="body2" sx={{ marginBottom: 1 }}>
        Breaking changes on Reddit means our current contest reminders will not
        work. If you would like to receive contest reminders:
      </Typography>
      <Box component="ol" sx={{ margin: 0, paddingLeft: 2 }}>
        <ListItemTypography>
          Make sure &ldquo;Contest reminders&rdquo; is turned on in settings for
          this site (
          <InternalLink to="/profile/settings">
            vexillologycontests.com/profile/settings
          </InternalLink>
          )
        </ListItemTypography>
        <ListItemTypography>
          Go to &ldquo;
          <ExternalLink
            href="https://reddit.com/settings/privacy"
            target="_blank"
          >
            reddit.com/settings/privacy
          </ExternalLink>
          &rdquo;
        </ListItemTypography>
        <ListItemTypography>
          Make sure you are logged in on the same Reddit account as this site.
        </ListItemTypography>
        <ListItemTypography>
          Under &ldquo;Social interactions&rdquo;, click on &ldquo;Who can send
          you chat requests&rdquo; (~4 lines down)
        </ListItemTypography>
        <ListItemTypography>
          Under &ldquo;Always allow chat requests from&rdquo;, where it says
          &ldquo;Enter username&rdquo;, type &ldquo;vexy&rdquo; and hit enter.
        </ListItemTypography>
        <ListItemTypography>
          Confirm you see &ldquo;u/Vexy&rdquo; appear below
        </ListItemTypography>
        <ListItemTypography>Click &ldquo;Done&rdquo;</ListItemTypography>
      </Box>
    </Alert>
  );
}

ContestRemindersAlert.propTypes = {
  dismissable: PropTypes.bool,
};

ContestRemindersAlert.defaultProps = {
  dismissable: true,
};

export default ContestRemindersAlert;
