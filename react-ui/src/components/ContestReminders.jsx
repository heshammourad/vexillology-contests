import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
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
 * Alert content component that can be used in both dialog and alert
 */
function ContestRemindersContent() {
  return (
    <>
      <Typography variant="body1" sx={{ fontWeight: 'bold', marginBottom: 1 }}>
        IF YOU WANT / HAVE CONTEST REMINDERS
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
    </>
  );
}

/**
 * Dialog version of contest reminders alert
 */
function ContestRemindersDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check localStorage on component mount
    const isDismissed = localStorage.getItem('contestRemindersAlertDismissed') === 'true';
    if (!isDismissed) {
      setOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('contestRemindersAlertDismissed', 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={handleDismiss} maxWidth="md" fullWidth>
      <DialogTitle>IMPORTANT</DialogTitle>
      <DialogContent>
        <ContestRemindersContent />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDismiss} color="primary">
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Alert version of contest reminders alert
 */
function ContestRemindersAlert() {
  return (
    <Alert
      severity="info"
      sx={{
        margin: 2,
        '& .MuiAlert-message': {
          width: '100%',
        },
      }}
    >
      <ContestRemindersContent />
    </Alert>
  );
}

export { ContestRemindersDialog, ContestRemindersAlert };
