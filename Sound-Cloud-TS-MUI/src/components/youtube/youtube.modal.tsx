'use client';

import React from 'react';
import { Dialog, DialogContent, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface YouTubePlayerModalProps {
    open: boolean;
    videoId: string | null;
    onClose: () => void;
}

const YouTubePlayerModal: React.FC<YouTubePlayerModalProps> = ({ open, videoId, onClose }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden',
                }
            }}
        >
            <IconButton
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: 'white',
                    zIndex: 10,
                    bgcolor: 'rgba(0,0,0,0.5)',
                    '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.7)',
                    }
                }}
            >
                <CloseIcon />
            </IconButton>

            <DialogContent sx={{ p: 0, height: { xs: '300px', sm: '400px', md: '500px' } }}>
                {videoId ? (
                    <Box
                        component="iframe"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        sx={{
                            width: '100%',
                            height: '100%',
                            display: 'block',
                        }}
                    />
                ) : (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'black', color: 'white' }}>
                        Loading...
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default YouTubePlayerModal;
