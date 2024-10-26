import * as React from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Dialog from '@mui/material/Dialog';

function ConfirmationDialog(props) {
  const { onClose, dialogText, open, dialogTitle, ...other } = props;
  const handleEntering = () => {};
  const handleCancel = () => onClose(false);
  const handleOk = () => onClose(true);

  return (
    <Dialog
      sx={{ '& .MuiDialog-paper': { maxWidth: '80vw', maxHeight: '40vh' } }}
      maxWidth="xs"
      TransitionProps={{ onEntering: handleEntering }}
      open={open}
      {...other}
    >
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent dividers>
      {dialogText}
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleOk}>Ok</Button>
      </DialogActions>
    </Dialog>
  );
}

ConfirmationDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  dialogText: PropTypes.string.isRequired,
};

export default ConfirmationDialog;