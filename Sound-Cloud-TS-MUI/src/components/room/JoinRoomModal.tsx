'use client'

import { useRef, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Typography,
    Box,
    InputAdornment,
    IconButton,
    useMediaQuery,
    useTheme,
    Fade,
    Stack
} from '@mui/material';
import {
    Lock,
    Visibility,
    VisibilityOff
} from '@mui/icons-material';

import axiosInstance from '@/utils/axios-instance';
import { toast } from 'react-toastify';

interface IProps {
    open: boolean;
    onClose: () => void;
    roomId: number;
    onSuccess: () => void;
}

export default function JoinRoomModal({
                                          open,
                                          onClose,
                                          roomId,
                                          onSuccess
                                      }: IProps) {

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleVerify = async () => {
        if (!password.trim()) {
            toast.error('Please enter the password');
            return;
        }

        setLoading(true);

        try {
            const res: any = await axiosInstance.post(
                `/api/v1/rooms/${roomId}/verify`,
                { password }
            );

            if (res.data.valid) {
                toast.dark('Access granted!');
                onSuccess();
            } else {
                toast.error('Incorrect password');
            }

        } catch (error) {
            console.error(error);
            toast.error('Failed to verify password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={isMobile}
            maxWidth="xs"
            fullWidth
            TransitionComponent={Fade}
            TransitionProps={{
                timeout: 250,
                onEntered: () => {
                    inputRef.current?.focus();
                }
            }}
            onKeyDown={(e) => e.stopPropagation()}
            PaperProps={{
                sx: {
                    overflow: 'hidden',
                    bgcolor: '#111',
                    color: '#fff',
                    borderRadius: isMobile ? 0 : 5,
                    border: isMobile
                        ? 'none'
                        : '1px solid rgba(255,255,255,0.06)',

                    background: `
                        radial-gradient(circle at top right, rgba(255,85,0,0.12), transparent 35%),
                        radial-gradient(circle at bottom left, rgba(255,255,255,0.03), transparent 30%),
                        #111
                    `,

                    boxShadow: isMobile
                        ? 'none'
                        : '0 24px 80px rgba(0,0,0,0.7)',
                }
            }}
        >

            {/* HEADER */}
            <DialogTitle
                sx={{
                    px: { xs: 3, sm: 4 },
                    pt: { xs: 5, sm: 4 },
                    pb: 2
                }}
            >
                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                >

                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',

                            background: `
                                linear-gradient(
                                    135deg,
                                    rgba(255,85,0,0.25),
                                    rgba(255,85,0,0.08)
                                )
                            `,

                            border: '1px solid rgba(255,85,0,0.25)',

                            boxShadow: '0 10px 30px rgba(255,85,0,0.18)'
                        }}
                    >
                        <Lock
                            sx={{
                                color: '#ff5500',
                                fontSize: 28
                            }}
                        />
                    </Box>

                    <Box>
                        <Typography
                            sx={{
                                fontSize: {
                                    xs: '1.45rem',
                                    sm: '1.7rem'
                                },
                                fontWeight: 800,
                                letterSpacing: '-0.03em'
                            }}
                        >
                            Private Room
                        </Typography>

                        <Typography
                            sx={{
                                color: 'rgba(255,255,255,0.45)',
                                fontSize: '0.92rem',
                                mt: 0.5
                            }}
                        >
                            Password required to continue
                        </Typography>
                    </Box>

                </Stack>
            </DialogTitle>

            {/* CONTENT */}
            <DialogContent
                sx={{
                    px: { xs: 3, sm: 4 },
                    pb: 2
                }}
            >

                <Box
                    sx={{
                        p: 2,
                        mb: 3,
                        borderRadius: 3,

                        bgcolor: 'rgba(255,255,255,0.03)',

                        border: '1px solid rgba(255,255,255,0.05)'
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            color: 'rgba(255,255,255,0.62)',
                            lineHeight: 1.7
                        }}
                    >
                        This listening session is protected by a room password.
                        Enter the correct password to join everyone in real-time.
                    </Typography>
                </Box>

                <TextField
                    fullWidth
                    autoFocus
                    inputRef={inputRef}
                    type={showPassword ? 'text' : 'password'}
                    label="Room Password"
                    variant="filled"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleVerify();
                        }
                    }}
                    InputProps={{
                        disableUnderline: true,

                        sx: {
                            height: 58,

                            borderRadius: 3,

                            bgcolor: '#1a1a1a',

                            color: '#fff',

                            border: '1px solid rgba(255,255,255,0.06)',

                            transition: 'all 0.2s ease',

                            '&:hover': {
                                bgcolor: '#202020',
                                borderColor: 'rgba(255,255,255,0.12)',
                            },

                            '&.Mui-focused': {
                                bgcolor: '#1a1a1a',
                                borderColor: '#ff5500',
                                boxShadow: '0 0 0 4px rgba(255,85,0,0.12)'
                            },

                            '& input': {
                                color: '#fff',
                                fontWeight: 500,
                                letterSpacing: '0.03em',
                            },

                            '& input:-webkit-autofill': {
                                WebkitBoxShadow:
                                    '0 0 0 1000px #1a1a1a inset',

                                WebkitTextFillColor: '#fff',

                                caretColor: '#fff',

                                transition:
                                    'background-color 9999s ease-in-out 0s',
                            },

                            '&:before, &:after': {
                                display: 'none',
                            },
                        },

                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    edge="end"
                                    sx={{
                                        color: 'rgba(255,255,255,0.38)',

                                        transition: 'all 0.2s ease',

                                        '&:hover': {
                                            color: '#ff5500',
                                            bgcolor: 'transparent',
                                            transform: 'scale(1.05)'
                                        }
                                    }}
                                >
                                    {showPassword
                                        ? <VisibilityOff />
                                        : <Visibility />
                                    }
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                    InputLabelProps={{
                        sx: {
                            color: 'rgba(255,255,255,0.42)',

                            '&.Mui-focused': {
                                color: '#ff5500',
                            }
                        }
                    }}
                />

            </DialogContent>

            {/* ACTIONS */}
            <DialogActions
                sx={{
                    px: { xs: 3, sm: 4 },
                    pb: { xs: 4, sm: 4 },
                    pt: 1,

                    flexDirection: isMobile ? 'column' : 'row',
                    gap: 1.5
                }}
            >

                <Button
                    fullWidth={isMobile}
                    onClick={onClose}
                    disabled={loading}
                    sx={{
                        height: 48,

                        borderRadius: 3,

                        color: 'rgba(255,255,255,0.6)',

                        border: '1px solid rgba(255,255,255,0.08)',

                        bgcolor: 'rgba(255,255,255,0.02)',

                        fontWeight: 600,

                        '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.05)',
                            borderColor: 'rgba(255,255,255,0.12)'
                        }
                    }}
                >
                    Cancel
                </Button>

                <Button
                    fullWidth={isMobile}
                    onClick={handleVerify}
                    disabled={loading}
                    variant="contained"
                    disableElevation
                    sx={{
                        height: 48,

                        borderRadius: 3,

                        bgcolor: '#ff5500',

                        fontWeight: 700,

                        letterSpacing: '0.02em',

                        transition: 'all 0.2s ease',

                        '&:hover': {
                            bgcolor: '#e64d00',
                            transform: 'translateY(-1px)'
                        },

                        '&:active': {
                            transform: 'translateY(0)'
                        },

                        '&.Mui-disabled': {
                            bgcolor: '#2b2b2b',
                            color: '#666'
                        }
                    }}
                >
                    {loading ? 'Verifying...' : 'Join Room'}
                </Button>

            </DialogActions>
        </Dialog>
    );
}