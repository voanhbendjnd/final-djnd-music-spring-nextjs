'use client'

import {useRef, useState} from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Typography, Box, InputAdornment, IconButton
} from '@mui/material';
import { Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import axiosInstance from '@/utils/axios-instance';
import { toast } from 'react-toastify';

interface IProps {
    open: boolean;
    onClose: () => void;
    roomId: number;
    onSuccess: () => void;
}

export default function JoinRoomModal({ open, onClose, roomId, onSuccess }: IProps) {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        if (!password.trim()) {
            toast.error("Please enter the password");
            return;
        }

        setLoading(true);
        try {
            const res: any = await axiosInstance.post(`/api/v1/rooms/${roomId}/verify`, { password });

            if (res.data.valid) {
                toast.dark("Access granted!");
                onSuccess();
            } else {
                toast.error("Incorrect password");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to verify password");
        } finally {
            setLoading(false);
        }
    };
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            TransitionProps={{
                onEntered: () => {
                    // Focus sau khi animation xong, không phải ngay lúc mount
                    inputRef.current?.focus();
                }
            }}
            // Chặn keydown không bubble ra ngoài dialog
            onKeyDown={(e) => e.stopPropagation()}
            PaperProps={{
                sx: {
                    bgcolor: '#1a1a1a',
                    color: '#fff',
                    borderRadius: 4,
                    minWidth: 400
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lock sx={{ color: '#ff9800' }} />
                Private Room
            </DialogTitle>

            <DialogContent>
                <Typography variant="body2" color="rgba(255,255,255,0.6)" sx={{ mb: 3 }}>
                    This room is password-protected. Please enter the password to join.
                </Typography>

                <TextField
                    fullWidth
                    autoFocus
                    type={showPassword ? 'text' : 'password'}
                    label="Room Password"
                    variant="filled"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                    InputProps={{
                        disableUnderline: true,
                        sx: {
                            borderRadius: 2,
                            bgcolor: '#1f1f1f',
                            color: '#fff',
                            border: '1px solid transparent',
                            transition: 'all 0.2s ease',

                            '&:hover': {
                                bgcolor: '#262626',
                            },

                            '&.Mui-focused': {
                                bgcolor: '#1f1f1f',
                                border: '1px solid #ff5500',
                            },

                            '& input': {
                                color: '#fff',
                            },

                            '& input:-webkit-autofill': {
                                WebkitBoxShadow: '0 0 0 1000px #1f1f1f inset',
                                WebkitTextFillColor: '#fff',
                                caretColor: '#fff',
                                transition: 'background-color 9999s ease-in-out 0s',
                            },

                            '&:before, &:after': {
                                display: 'none',
                            },
                        },

                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowPassword(!showPassword)}
                                    edge="end"
                                    sx={{
                                        color: 'rgba(255,255,255,0.45)',
                                        transition: 'color 0.2s',

                                        '&:hover': {
                                            color: '#ff5500',
                                            bgcolor: 'transparent',
                                        }
                                    }}
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                    InputLabelProps={{
                        sx: {
                            color: 'rgba(255,255,255,0.45)',

                            '&.Mui-focused': {
                                color: '#ff5500',
                            }
                        }
                    }}
                />
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button
                    onClick={onClose}
                    sx={{ color: 'rgba(255,255,255,0.6)' }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleVerify}
                    disabled={loading}
                    variant="contained"
                    sx={{
                        bgcolor: '#f50',
                        '&:hover': { bgcolor: '#e40' },
                        '&.Mui-disabled': { bgcolor: '#333', color: '#666' }
                    }}
                >
                    {loading ? 'Verifying...' : 'Join Room'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}