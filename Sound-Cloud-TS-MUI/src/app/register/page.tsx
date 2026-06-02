'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import {
    Box, Typography, Button, IconButton, InputAdornment,
    TextField, CircularProgress, Alert, Tabs, Tab,
} from '@mui/material';
import {
    Visibility, VisibilityOff,
    EmailOutlined, PersonOutline, LockOutlined,
    AlternateEmailOutlined, CheckCircleOutline,
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/utils/axios-instance';

// ─── Validation ─────────────────────────────────────────────────────────────

const emailSchema = yup.object({
    name: yup.string().min(2, 'Name must be at least 2 characters').required('Name is required'),
    email: yup.string().email('Invalid email address').required('Email is required'),
    password: yup
        .string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], 'Passwords do not match')
        .required('Please confirm your password'),
});

const usernameSchema = yup.object({
    name: yup.string().min(2, 'Name must be at least 2 characters').required('Name is required'),
    username: yup
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username must be at most 20 characters')
        .matches(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores allowed')
        .required('Username is required'),
    password: yup
        .string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], 'Passwords do not match')
        .required('Please confirm your password'),
});

type RegisterMode = 'email' | 'username';

// ─── Password strength ───────────────────────────────────────────────────────

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
    if (!pw) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const levels = [
        { label: 'Weak', color: '#ef4444' },
        { label: 'Fair', color: '#f59e0b' },
        { label: 'Good', color: '#84cc16' },
        { label: 'Strong', color: '#10b981' },
    ];
    return { score, ...levels[score - 1] ?? levels[0] };
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const inputSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '10px',
        bgcolor: 'rgba(255,255,255,0.06)',
        '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
        '&.Mui-focused fieldset': { borderColor: '#ff5500' },
        '&.Mui-error fieldset': { borderColor: '#ef4444' },
    },
    '& .MuiInputBase-input': { color: '#f1f5f9', fontSize: 14 },
    '& .MuiInputLabel-root': { color: '#64748b', fontSize: 14 },
    '& .MuiInputLabel-root.Mui-focused': { color: '#ff5500' },
    '& .MuiInputLabel-root.Mui-error': { color: '#ef4444' },
    '& .MuiFormHelperText-root': { fontSize: 12, mt: 0.5 },
    '& .MuiSvgIcon-root': { color: '#475569' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function RegisterPage() {
    const router = useRouter();
    const [mode, setMode] = useState<RegisterMode>('email');
    const [showPw, setShowPw] = useState(false);
    const [showCpw, setShowCpw] = useState(false);
    const [apiError, setApiError] = useState('');
    const [success, setSuccess] = useState(false);
    const [pwValue, setPwValue] = useState('');

    const { control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
        //@ts-ignore
        resolver: yupResolver(mode === 'email' ? emailSchema : usernameSchema) as any,
        defaultValues: { name: '', email: '', username: '', password: '', confirmPassword: '' },
        mode: 'onTouched',
    });

    const strength = getPasswordStrength(pwValue);

    const handleModeChange = (_: React.SyntheticEvent, newMode: RegisterMode) => {
        setMode(newMode);
        setApiError('');
        reset({ name: '', email: '', username: '', password: '', confirmPassword: '' });
        setPwValue('');
    };

    const onSubmit = async (data: any) => {
        setApiError('');
        try {
            const payload: Record<string, string> = {
                name: data.name,
                password: data.password,
                confirmPassword: data.confirmPassword,
            };
            if (mode === 'email') payload.email = data.email;
            else payload.username = data.username;

            await axiosInstance.post('/api/v1/auth/register', payload);
            setSuccess(true);
            setTimeout(() => router.push('/auth/signin'), 2000);
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                'Registration failed. Please try again.';
            setApiError(msg);
        }
    };

    if (success) {
        return (
            <Box sx={pageWrapSx}>
                <Box sx={cardSx}>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CheckCircleOutline sx={{ fontSize: 56, color: '#ff5500', mb: 2 }} />
                        <Typography sx={{ color: '#f1f5f9', fontWeight: 700, fontSize: 20, mb: 1 }}>
                            Account created!
                        </Typography>
                        <Typography sx={{ color: '#64748b', fontSize: 14 }}>
                            Redirecting you to sign in…
                        </Typography>
                    </Box>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={pageWrapSx}>
            <Box sx={cardSx}>

                {/* Header */}
                <Box sx={{ p: { xs: 3, sm: 4 }, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <Typography sx={{
                        color: '#f1f5f9', fontWeight: 800, fontSize: { xs: 22, sm: 26 },
                        letterSpacing: '-0.02em', mb: 0.5,
                    }}>
                        Create an account
                    </Typography>
                    <Typography sx={{ color: '#475569', fontSize: 13.5 }}>
                        Fill in your details to get started
                    </Typography>
                </Box>

                {/* Body */}
                <Box sx={{ p: { xs: 3, sm: 4 } }}>

                    {/* Mode tabs */}
                    <Tabs
                        value={mode}
                        onChange={handleModeChange}
                        sx={{
                            mb: 3, minHeight: 0,
                            bgcolor: 'rgba(255,255,255,0.06)',
                            borderRadius: '10px', p: '3px',
                            '& .MuiTabs-indicator': { display: 'none' },
                            '& .MuiTab-root': {
                                flex: 1, minHeight: 36, fontSize: 13, fontWeight: 600,
                                color: '#64748b', borderRadius: '8px', textTransform: 'none',
                                transition: 'all 0.15s',
                                '&.Mui-selected': {
                                    color: '#ff5500',
                                    bgcolor: 'rgba(255,85,0,0.08)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                },
                            },
                        }}
                    >
                        <Tab value="email" label="Email" icon={<EmailOutlined sx={{ fontSize: 15 }} />} iconPosition="start" />
                        <Tab value="username" label="Username" icon={<AlternateEmailOutlined sx={{ fontSize: 15 }} />} iconPosition="start" />
                    </Tabs>

                    {/* API error */}
                    {apiError && (
                        <Alert
                            severity="error"
                            onClose={() => setApiError('')}
                            sx={{
                                mb: 2.5, borderRadius: '10px', fontSize: 13,
                                bgcolor: 'rgba(239,68,68,0.1)', color: '#fca5a5',
                                border: '1px solid rgba(239,68,68,0.25)',
                                '& .MuiAlert-icon': { color: '#f87171' },
                            }}
                        >
                            {apiError}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                        {/* Full name */}
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Full name"
                                    fullWidth
                                    autoComplete="name"
                                    error={!!errors.name}
                                    helperText={errors.name?.message}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonOutline sx={{ fontSize: 18 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={inputSx}
                                />
                            )}
                        />

                        {/* Email or Username */}
                        {mode === 'email' ? (
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Email address"
                                        type="email"
                                        fullWidth
                                        autoComplete="email"
                                        error={!!errors.email}
                                        helperText={(errors as any).email?.message}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <EmailOutlined sx={{ fontSize: 18 }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={inputSx}
                                    />
                                )}
                            />
                        ) : (
                            <Controller
                                name="username"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Username"
                                        fullWidth
                                        autoComplete="username"
                                        error={!!(errors as any).username}
                                        helperText={(errors as any).username?.message}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <AlternateEmailOutlined sx={{ fontSize: 18 }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={inputSx}
                                    />
                                )}
                            />
                        )}

                        {/* Password */}
                        <Box>
                            <Controller
                                name="password"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Password"
                                        type={showPw ? 'text' : 'password'}
                                        fullWidth
                                        autoComplete="new-password"
                                        error={!!errors.password}
                                        helperText={errors.password?.message}
                                        onChange={(e) => { field.onChange(e); setPwValue(e.target.value); }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LockOutlined sx={{ fontSize: 18 }} />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton size="small" onClick={() => setShowPw(p => !p)} edge="end" sx={{ color: '#475569' }}>
                                                        {showPw ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={inputSx}
                                    />
                                )}
                            />

                            {/* Strength bar */}
                            {pwValue && (
                                <Box sx={{ mt: 1 }}>
                                    <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                                        {[1, 2, 3, 4].map(i => (
                                            <Box key={i} sx={{
                                                flex: 1, height: 3, borderRadius: 2,
                                                bgcolor: i <= strength.score ? strength.color : 'rgba(255,255,255,0.08)',
                                                transition: 'background 0.2s',
                                            }} />
                                        ))}
                                    </Box>
                                    <Typography sx={{ fontSize: 11, color: strength.color }}>
                                        {strength.label}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Confirm password */}
                        <Controller
                            name="confirmPassword"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Confirm password"
                                    type={showCpw ? 'text' : 'password'}
                                    fullWidth
                                    autoComplete="new-password"
                                    error={!!errors.confirmPassword}
                                    helperText={errors.confirmPassword?.message}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockOutlined sx={{ fontSize: 18 }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setShowCpw(p => !p)} edge="end" sx={{ color: '#475569' }}>
                                                    {showCpw ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={inputSx}
                                />
                            )}
                        />

                        {/* Submit */}
                        <Button
                            type="submit"
                            fullWidth
                            disabled={isSubmitting}
                            sx={{
                                mt: 1, py: 1.4, borderRadius: '10px',
                                background: isSubmitting
                                    ? 'rgba(255,85,0,0.35)'
                                    : '#ff5500',
                                color: '#fff', fontWeight: 700, fontSize: 14,
                                textTransform: 'none', boxShadow: 'none',
                                '&:hover': { background: '#e64d00', boxShadow: '0 4px 20px rgba(255,85,0,0.35)' },
                                '&.Mui-disabled': { color: '#fff' },
                            }}
                        >
                            {isSubmitting
                                ? <><CircularProgress size={16} sx={{ color: '#fff', mr: 1 }} /> Creating account…</>
                                : 'Create account'
                            }
                        </Button>

                        {/* Terms */}
                        <Typography sx={{ fontSize: 12, color: '#475569', textAlign: 'center', lineHeight: 1.6 }}>
                            By registering, you agree to our{' '}
                            <Link href="/terms" style={{ color: '#ff5500' }}>Terms of Service</Link>
                            {' '}and{' '}
                            <Link href="/privacy" style={{ color: '#ff5500' }}>Privacy Policy</Link>.
                        </Typography>
                    </Box>
                </Box>

                {/* Footer */}
                <Box sx={{
                    px: { xs: 3, sm: 4 }, py: 2.5,
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    textAlign: 'center',
                }}>
                    <Typography sx={{ fontSize: 13.5, color: '#64748b' }}>
                        Already have an account?{' '}
                        <Link href="/auth/signin" style={{ color: '#ff5500', fontWeight: 600, textDecoration: 'none' }}>
                            Sign in
                        </Link>
                    </Typography>
                </Box>

            </Box>
        </Box>
    );
}

// ─── Page-level styles ───────────────────────────────────────────────────────

const pageWrapSx = {
    minHeight: '100vh',
    bgcolor: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    p: 2,
};

const cardSx = {
    width: '100%',
    maxWidth: 460,
    bgcolor: '#111',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
};