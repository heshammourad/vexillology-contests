import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import PropTypes from 'prop-types';

/**
 * A dialog asking the moderator to confirm or back out of an action.
 */
function ConfirmDialog({
  busy,
  cancelLabel,
  children,
  confirmColor,
  confirmLabel,
  onCancel,
  onConfirm,
  open,
  title,
}) {
  return (
    <Dialog open={open} onClose={busy ? undefined : onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={confirmColor}
          disabled={busy}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ConfirmDialog.propTypes = {
  busy: PropTypes.bool,
  cancelLabel: PropTypes.string,
  children: PropTypes.node.isRequired,
  confirmColor: PropTypes.oneOf(['primary', 'error']),
  confirmLabel: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
};

ConfirmDialog.defaultProps = {
  busy: false,
  cancelLabel: 'Cancel',
  confirmColor: 'primary',
};

export default ConfirmDialog;
