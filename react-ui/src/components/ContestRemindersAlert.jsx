import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

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
        <Typography component="li" variant="body2" sx={{ marginBottom: 0.5 }}>
          Make sure &ldquo;Contest reminders&rdquo; is turned on in settings for
          this site (
          <Link
            href="/profile/settings"
            underline="hover"
            sx={{ color: 'inherit' }}
          >
            click here
          </Link>
          )
        </Typography>
        <Typography component="li" variant="body2" sx={{ marginBottom: 0.5 }}>
          Go to &ldquo;
          <Link
            href="https://reddit.com/settings/privacy"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ color: 'inherit' }}
          >
            reddit.com/settings/privacy
          </Link>
          &rdquo; (
          <Link
            href="https://reddit.com/settings/privacy"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ color: 'inherit' }}
          >
            click here
          </Link>
          )
        </Typography>
        <Typography component="li" variant="body2" sx={{ marginBottom: 0.5 }}>
          Make sure you are logged in on the same Reddit account as this site.
        </Typography>
        <Typography component="li" variant="body2" sx={{ marginBottom: 0.5 }}>
          Under &ldquo;Social interactions&rdquo;, click on &ldquo;Who can send
          you chat requests&rdquo; (~4 lines down)
        </Typography>
        <Typography component="li" variant="body2" sx={{ marginBottom: 0.5 }}>
          Under &ldquo;Always allow chat requests from&rdquo;, where it says
          &ldquo;Enter username&rdquo;, type &ldquo;vexy&rdquo; and hit enter.
        </Typography>
        <Typography component="li" variant="body2" sx={{ marginBottom: 0.5 }}>
          Confirm you see &ldquo;u/Vexy&rdquo; appear below
        </Typography>
        <Typography component="li" variant="body2" sx={{ marginBottom: 0.5 }}>
          Click &ldquo;Done&rdquo;
        </Typography>
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
