'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    Box, Button, TextField, Container, Typography,
    Paper, CircularProgress, Switch,
    InputAdornment, IconButton, Tooltip, Chip
} from '@mui/material';
import {
    Visibility, VisibilityOff, Lock, Public, Groups,
    RadioButtonChecked, ContentCopy, Refresh, Tag, CheckCircleOutline
} from '@mui/icons-material';
import axiosInstance from '@/utils/axios-instance';
import { toast } from 'react-toastify';

// ─── Validation constants ────────────────────────────────────────────────────
const NAME_MAX = 50;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 32;

/**
 * Room code standard: 6 chars, uppercase A–Z + 2–9
 * Exclude: 0 (→ O), 1 (→ I/L), O, I, L  — same as Discord/Zoom/Notion invite codes
 * Regex: ^[A-HJ-NP-Z2-9]{6}$
 */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const CODE_REGEX = /^[A-HJ-NP-Z2-9]{6}$/;

function generateRoomCode(): string {
    return Array.from({ length: CODE_LENGTH }, () =>
        CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
    ).join('');
}

// ─── Validation ──────────────────────────────────────────────────────────────
interface FormErrors {
    name?: string;
    password?: string;
    code?: string;
}

function validateForm(
    name: string,
    isPublic: boolean,
    password: string,
    code: string,
): FormErrors {
    const errors: FormErrors = {};

    if (!name.trim()) {
        errors.name = 'Room name is required';
    } else if (name.trim().length < 3) {
        errors.name = 'Room name must be at least 3 characters';
    } else if (name.length > NAME_MAX) {
        errors.name = `Room name must be at most ${NAME_MAX} characters`;
    }

    if (!isPublic) {
        if (!password) {
            errors.password = 'Password is required for private rooms';
        } else if (password.length < PASSWORD_MIN) {
            errors.password = `Password must be at least ${PASSWORD_MIN} characters`;
        } else if (password.length > PASSWORD_MAX) {
            errors.password = `Password must be at most ${PASSWORD_MAX} characters`;
        }
    }

    const upperCode = code.toUpperCase();
    if (!upperCode.trim()) {
        errors.code = 'Room code is required';
    } else if (upperCode.length !== CODE_LENGTH) {
        errors.code = `Code must be exactly ${CODE_LENGTH} characters`;
    } else if (!CODE_REGEX.test(upperCode)) {
        errors.code = 'Only A–Z and 2–9 allowed (no 0, 1, I, O, L to avoid confusion)';
    }

    return errors;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function CreateRoomPage() {
    const [name, setName] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [isActive, setIsActive] = useState(true);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [code, setCode] = useState(generateRoomCode);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState<Record<'name' | 'password' | 'code', boolean>>({
        name: false, password: false, code: false,
    });

    const router = useRouter();
    const { data: session } = useSession();

    const errors = validateForm(name, isPublic, password, code);
    const isValid = Object.keys(errors).length === 0;

    const handleBlur = (field: 'name' | 'password' | 'code') =>
        setTouched((prev) => ({ ...prev, [field]: true }));

    const handleRegenerate = () => {
        setCode(generateRoomCode());
        setTouched((prev) => ({ ...prev, code: false }));
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleCodeChange = (raw: string) => {
        // Auto-uppercase, block invalid chars, enforce max length
        const cleaned = raw
            .toUpperCase()
            .replace(/[^A-HJ-NP-Z2-9]/g, '')   // strip chars not in alphabet
            .slice(0, CODE_LENGTH);
        setCode(cleaned);
    };

    const handleCreate = async () => {
        setTouched({ name: true, password: true, code: true });
        if (!isValid) return;

        setLoading(true);
        try {
            const res: any = await axiosInstance.post('/api/v1/rooms', {
                name,
                isPublic,
                isActive,
                code: code.toUpperCase(),
                password: isPublic ? '' : password,
            });
            const roomId = res.data.id;
            toast.dark('Room created! Launching your session...');
            router.push(`/rooms/${roomId}`);
            // ✅ Không setLoading(false) ở đây — giữ loading state cho đến khi navigate xong
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to create room');
            setLoading(false); // ✅ Chỉ reset khi lỗi để user có thể thử lại
        }
    };

    if (!session) {
        return (
            <Container maxWidth="sm" sx={{ py: 10 }}>
                <Typography textAlign="center" color="#fff">
                    Please sign in to create a room.
                </Typography>
            </Container>
        );
    }

    // ─── Styles ───────────────────────────────────────────────────────────────
    const darkInputSx = (hasError: boolean) => ({
        borderRadius: 2,
        bgcolor: '#1a1a1a',
        color: '#fff',
        transition: 'background-color 0.2s',
        outline: hasError ? '1px solid #f44336' : '1px solid transparent',
        '&:hover': { bgcolor: '#252525' },
        '&.Mui-focused': {
            bgcolor: '#1a1a1a',
            outline: hasError ? '1px solid #f44336' : '1px solid #ff5500',
        },
        '& input': { color: '#fff' },
        '& input:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 100px #1a1a1a inset',
            WebkitTextFillColor: '#fff',
            caretColor: '#fff',
            transition: 'background-color 5000s ease-in-out 0s',
        },
    });

    const switchSx = {
        '& .MuiSwitch-switchBase.Mui-checked': { color: '#ff5500' },
        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#ff5500' },
    };

    const ToggleRow = ({
                           icon, label, caption, checked, onChange,
                       }: {
        icon: React.ReactNode; label: string; caption: string;
        checked: boolean; onChange: (v: boolean) => void;
    }) => (
        <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            p: 2, bgcolor: '#1a1a1a', borderRadius: 2,
            border: '1px solid #2a2a2a', transition: 'border-color 0.2s',
            '&:hover': { borderColor: '#444' },
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {icon}
                <Box>
                    <Typography fontWeight={600} fontSize="0.95rem">{label}</Typography>
                    <Typography variant="caption" color="rgba(255,255,255,0.45)">{caption}</Typography>
                </Box>
            </Box>
            <Switch checked={checked} onChange={(e) => onChange(e.target.checked)} sx={switchSx} />
        </Box>
    );

    const codeIsValid = CODE_REGEX.test(code) && code.length === CODE_LENGTH;

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <Container maxWidth="sm" sx={{ py: 10 }}>
            <Paper
                elevation={0}
                sx={{
                    p: 4, bgcolor: '#121212', color: '#fff', borderRadius: 4,
                    border: '1px solid #2a2a2a', boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                }}
            >
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Groups sx={{ color: '#ff5500', mr: 1.5, fontSize: 32 }} />
                    <Typography variant="h4" fontWeight={800} letterSpacing="-0.5px">
                        Start a Jam Session
                    </Typography>
                </Box>
                <Typography color="rgba(255,255,255,0.5)" sx={{ mb: 4, fontSize: '0.9rem' }}>
                    Create a real-time listening room and share the vibe with others.
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                    {/* Room name */}
                    <TextField
                        fullWidth
                        label="Room Name"
                        variant="filled"
                        value={name}
                        onChange={(e) => { if (e.target.value.length <= NAME_MAX + 1) setName(e.target.value); }}
                        onBlur={() => handleBlur('name')}
                        placeholder="e.g. Midnight Chill Vibes"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        error={touched.name && !!errors.name}
                        helperText={
                            <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{touched.name && errors.name ? errors.name : ' '}</span>
                                <span style={{ color: name.length > NAME_MAX ? '#f44336' : 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
                                    {name.length}/{NAME_MAX}
                                </span>
                            </Box>
                        }
                        FormHelperTextProps={{ sx: { color: '#f44336', mx: 0 } }}
                        InputProps={{ disableUnderline: true, sx: darkInputSx(touched.name && !!errors.name) }}
                        InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.45)' } }}
                    />

                    {/* Room Code */}
                    <Box>
                        <TextField
                            fullWidth
                            label="Room Code"
                            variant="filled"
                            value={code}
                            onChange={(e) => handleCodeChange(e.target.value)}
                            onBlur={() => handleBlur('code')}
                            placeholder="e.g. A3BK7R"
                            error={touched.code && !!errors.code}
                            helperText={
                                <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{touched.code && errors.code ? errors.code : 'Shared with others to find this room'}</span>
                                    <span style={{ color: code.length > CODE_LENGTH ? '#f44336' : 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
                                        {code.length}/{CODE_LENGTH}
                                    </span>
                                </Box>
                            }
                            FormHelperTextProps={{ sx: { color: touched.code && errors.code ? '#f44336' : 'rgba(255,255,255,0.35)', mx: 0 } }}
                            inputProps={{
                                style: {
                                    fontFamily: 'monospace',
                                    letterSpacing: '0.35em',
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                },
                                maxLength: CODE_LENGTH,
                            }}
                            InputProps={{
                                disableUnderline: true,
                                sx: {
                                    ...darkInputSx(touched.code && !!errors.code),
                                    // highlight border green khi hợp lệ
                                    outline: touched.code && errors.code
                                        ? '1px solid #f44336'
                                        : codeIsValid
                                            ? '1px solid #4caf5066'
                                            : '1px solid transparent',
                                },
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Tag sx={{ color: codeIsValid ? '#4caf50' : 'rgba(255,255,255,0.3)', fontSize: 18 }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end" sx={{ gap: 0.5 }}>
                                        <Tooltip title={copied ? 'Copied!' : 'Copy code'} placement="top">
                                            <IconButton onClick={handleCopy} size="small" sx={{ color: copied ? '#4caf50' : 'rgba(255,255,255,0.45)' }}>
                                                {copied ? <CheckCircleOutline fontSize="small" /> : <ContentCopy fontSize="small" />}
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Generate new code" placement="top">
                                            <IconButton onClick={handleRegenerate} size="small" sx={{ color: 'rgba(255,255,255,0.45)', '&:hover': { color: '#ff5500' } }}>
                                                <Refresh fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </InputAdornment>
                                ),
                            }}
                            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.45)' } }}
                        />

                        {/* Character chips — visual preview */}
                        <Box sx={{ display: 'flex', gap: 0.75, mt: 1, justifyContent: 'center' }}>
                            {Array.from({ length: CODE_LENGTH }).map((_, i) => {
                                const char = code[i];
                                return (
                                    <Box
                                        key={i}
                                        sx={{
                                            width: 36, height: 40,
                                            borderRadius: 1.5,
                                            border: char
                                                ? '1px solid #ff5500'
                                                : '1px dashed #333',
                                            bgcolor: char ? 'rgba(255,85,0,0.08)' : '#1a1a1a',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontFamily: 'monospace',
                                            fontWeight: 800,
                                            fontSize: '1rem',
                                            color: char ? '#ff5500' : 'transparent',
                                            transition: 'all 0.15s',
                                            letterSpacing: 0,
                                        }}
                                    >
                                        {char || '·'}
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>

                    {/* Public / Private toggle */}
                    <ToggleRow
                        icon={isPublic
                            ? <Public sx={{ color: '#4caf50', mr: 1.5 }} />
                            : <Lock sx={{ color: '#ff9800', mr: 1.5 }} />}
                        label={isPublic ? 'Public Room' : 'Private Room'}
                        caption={isPublic ? 'Anyone can join your session' : 'Only people with the password can join'}
                        checked={isPublic}
                        onChange={setIsPublic}
                    />

                    {/* Password (only when private) */}
                    {!isPublic && (
                        <TextField
                            fullWidth
                            label="Room Password"
                            type={showPassword ? 'text' : 'password'}
                            variant="filled"
                            value={password}
                            onChange={(e) => { if (e.target.value.length <= PASSWORD_MAX + 1) setPassword(e.target.value); }}
                            onBlur={() => handleBlur('password')}
                            error={touched.password && !!errors.password}
                            helperText={
                                <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{touched.password && errors.password ? errors.password : ' '}</span>
                                    <span style={{ color: password.length > PASSWORD_MAX ? '#f44336' : 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
                                        {password.length}/{PASSWORD_MAX}
                                    </span>
                                </Box>
                            }
                            FormHelperTextProps={{ sx: { color: '#f44336', mx: 0 } }}
                            InputProps={{
                                disableUnderline: true,
                                sx: darkInputSx(touched.password && !!errors.password),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            sx={{ color: 'rgba(255,255,255,0.45)' }}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.45)' } }}
                        />
                    )}

                    {/* isActive toggle */}
                    <ToggleRow
                        icon={<RadioButtonChecked sx={{ color: isActive ? '#ff5500' : '#666', mr: 1.5 }} />}
                        label={isActive ? 'Room Active' : 'Room Inactive'}
                        caption={isActive ? 'Room is open and accepting listeners' : 'Room is paused, no one can join'}
                        checked={isActive}
                        onChange={setIsActive}
                    />

                    {/* Submit */}
                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={handleCreate}
                        disabled={loading}
                        disableElevation
                        sx={{
                            mt: 1, height: 56, borderRadius: 2,
                            fontSize: '1rem', fontWeight: 700,
                            textTransform: 'none', letterSpacing: '0.3px',
                            bgcolor: '#ff5500', color: '#fff',
                            transition: 'background-color 0.2s, transform 0.15s',
                            '&:hover': { bgcolor: '#e64d00', transform: 'translateY(-1px)' },
                            '&:active': { transform: 'translateY(0)' },
                            '&.Mui-disabled': { bgcolor: '#2a2a2a', color: '#555' },
                        }}
                    >
                        {loading
                            ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <CircularProgress size={18} sx={{ color: '#888' }} />
                                    <span>Launching Room...</span>
                                </Box>
                            )
                            : 'Create & Launch Room'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}