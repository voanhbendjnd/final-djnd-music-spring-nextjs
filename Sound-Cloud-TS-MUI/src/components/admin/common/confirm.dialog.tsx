import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
} from '@mui/material';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    content: string;
    onClose: () => void;
    onConfirm: () => void;
    loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    title,
    content,
    onClose,
    onConfirm,
    loading = false,
}) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText>{content}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit" disabled={loading}>
                    Cancel
                </Button>
                <Button onClick={onConfirm} color="error" variant="contained" disabled={loading} autoFocus>
                    {loading ? 'Processing...' : 'Delete'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
