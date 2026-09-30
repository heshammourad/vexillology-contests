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

// Bump the version when the instructions change so the dialog shows again
const DISMISSED_KEY = 'contestRemindersAlertDismissedV2';

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
      <Typography variant="body2" sx={{ marginBottom: 1 }}>
        If you want monthly contest reminders:
      </Typography>
      <Box component="ul" sx={{ margin: 0, paddingLeft: 2 }}>
        <ListItemTypography>
          Go to
          {' '}
          <ExternalLink
            href="https://sh.reddit.com/r/vexillology/comments/1wtm1vg/rvexillology_group_messenger/"
            target="_blank"
          >
            the reminder post on our sub
          </ExternalLink>
        </ListItemTypography>
        <ListItemTypography>
          Make sure you are opted into &ldquo;Receive messages from
          r/vexillology&rdquo;
        </ListItemTypography>
        <ListItemTypography>
          Opt into the &ldquo;/r/vexillology Contest Reminder&rdquo; recurring
          message
        </ListItemTypography>
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
    const isDismissed = localStorage.getItem(DISMISSED_KEY) === 'true';
    if (!isDismissed) {
      setOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
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
