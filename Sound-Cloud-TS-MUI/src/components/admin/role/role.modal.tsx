'use client';

import { useEffect, useState } from 'react';
import { Modal, Box, Typography, TextField, Button, Checkbox, Divider, CircularProgress, Chip, IconButton } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useCreateRole, useUpdateRole } from '@/hooks/use-role';
import { useAllPermissions } from '@/hooks/use-permission';
import { toast } from 'react-toastify';
import CloseIcon from '@mui/icons-material/Close';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';

const schema = yup.object({
    name: yup.string().required('Role name is required'),
    description: yup.string().required('Description is required'),
}).required();

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    dataUpdate: IRole | null;
    setDataUpdate: (v: IRole | null) => void;
}

// Color map per module
const MODULE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    default: { bg: 'rgba(99,102,241,0.12)', text: '#818cf8', border: 'rgba(99,102,241,0.3)' },
};
const PALETTE = [
    { bg: 'rgba(99,102,241,0.12)', text: '#818cf8', border: 'rgba(99,102,241,0.3)' },
    { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.3)' },
    { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
    { bg: 'rgba(239,68,68,0.12)', text: '#f87171', border: 'rgba(239,68,68,0.3)' },
    { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
    { bg: 'rgba(168,85,247,0.12)', text: '#c084fc', border: 'rgba(168,85,247,0.3)' },
    { bg: 'rgba(236,72,153,0.12)', text: '#f472b6', border: 'rgba(236,72,153,0.3)' },
    { bg: 'rgba(20,184,166,0.12)', text: '#2dd4bf', border: 'rgba(20,184,166,0.3)' },
];

const METHOD_COLORS: Record<string, string> = {
    GET: '#34d399',
    POST: '#60a5fa',
    PUT: '#fbbf24',
    PATCH: '#fbbf24',
    DELETE: '#f87171',
};

const RoleModal = (props: IProps) => {
    const { open, setOpen, dataUpdate, setDataUpdate } = props;
    const createRoleMutation = useCreateRole();
    const updateRoleMutation = useUpdateRole();
    const { data: permissionsData, isLoading: isLoadingPermissions } = useAllPermissions();

    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

    const allPermissionIds = permissionsData?.data?.map((p: IPermission) => p.id) || [];
    const isAllSelected = allPermissionIds.length > 0 && selectedPermissions.length === allPermissionIds.length;
    const isSomeSelected = selectedPermissions.length > 0 && selectedPermissions.length < allPermissionIds.length;

    const { control, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: { name: '', description: '' }
    });

    useEffect(() => {
        if (dataUpdate) {
            reset({ name: dataUpdate.name, description: dataUpdate.description });
            setSelectedPermissions(dataUpdate.permissions?.map(p => p.id) || []);
        } else {
            reset({ name: '', description: '' });
            setSelectedPermissions([]);
        }
    }, [dataUpdate, reset]);

    const handleClose = () => {
        setOpen(false);
        setDataUpdate(null);
        reset();
    };

    const handleTogglePermission = (id: number) => {
        setSelectedPermissions(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleToggleAll = () => {
        setSelectedPermissions(isAllSelected ? [] : allPermissionIds);
    };

    const handleToggleModule = (moduleIds: number[]) => {
        const allModuleSelected = moduleIds.every(id => selectedPermissions.includes(id));
        if (allModuleSelected) {
            setSelectedPermissions(prev => prev.filter(id => !moduleIds.includes(id)));
        } else {
            // @ts-ignore
            setSelectedPermissions(prev => [...new Set([...prev, ...moduleIds])]);
        }
    };

    const onSubmit = async (data: any) => {
        try {
            const payload = { ...data, permissions: selectedPermissions.map(id => ({ id })) };
            if (dataUpdate) {
                await updateRoleMutation.mutateAsync({ ...payload, id: dataUpdate.id });
                toast.success("Role updated successfully");
            } else {
                await createRoleMutation.mutateAsync(payload);
                toast.success("Role created successfully");
            }
            handleClose();
        } catch (err: any) {
            toast.error(err.message || "Operation failed");
        }
    };

    const groupedPermissions = permissionsData?.data?.reduce((acc: Record<string, IPermission[]>, p: IPermission) => {
        if (!acc[p.module]) acc[p.module] = [];
        acc[p.module].push(p);
        return acc;
    }, {}) || {};

    const modules = Object.keys(groupedPermissions);
    const moduleColorMap: Record<string, typeof PALETTE[0]> = {};
    modules.forEach((m, i) => { moduleColorMap[m] = PALETTE[i % PALETTE.length]; });

    const isPending = createRoleMutation.isPending || updateRoleMutation.isPending;

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: { xs: '95vw', md: 960 },
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#0f1117',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                fontFamily: "'Sora', sans-serif",
            }}>

                {/* ── HEADER ── */}
                <Box sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    px: 3.5, py: 2.5,
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, transparent 60%)',
                    flexShrink: 0,
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            width: 36, height: 36, borderRadius: '10px',
                            bgcolor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <ShieldOutlinedIcon sx={{ color: '#818cf8', fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 16, lineHeight: 1.2, fontFamily: 'inherit' }}>
                                {dataUpdate ? 'Edit Role' : 'Create New Role'}
                            </Typography>
                            <Typography sx={{ color: '#64748b', fontSize: 12, fontFamily: 'inherit' }}>
                                {dataUpdate ? `Editing: ${dataUpdate.name}` : 'Define permissions for this role'}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={handleClose} size="small" sx={{ color: '#64748b', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* ── BODY (split panel) ── */}
                <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

                    {/* LEFT — Role Info */}
                    <Box sx={{
                        width: 280, flexShrink: 0,
                        borderRight: '1px solid rgba(255,255,255,0.07)',
                        p: 3, display: 'flex', flexDirection: 'column', gap: 2.5,
                        bgcolor: '#0a0d14',
                    }}>
                        <Typography sx={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'inherit' }}>
                            Role Details
                        </Typography>

                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <Box>
                                    <Typography sx={{ color: '#64748b', fontSize: 12, mb: 0.8, fontFamily: 'inherit' }}>Role Name *</Typography>
                                    <input
                                        {...field}
                                        placeholder="e.g. Content Editor"
                                        style={{
                                            width: '100%', boxSizing: 'border-box',
                                            background: 'rgba(255,255,255,0.04)',
                                            border: errors.name ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 8, padding: '10px 12px',
                                            color: '#fff', fontSize: 14,
                                            fontFamily: "'Sora', sans-serif",
                                            outline: 'none', transition: 'border 0.2s',
                                        }}
                                        onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.6)'; }}
                                        onBlur={e => { e.target.style.borderColor = errors.name ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)'; field.onBlur(); }}
                                    />
                                    {errors.name && <Typography sx={{ color: '#f87171', fontSize: 11, mt: 0.5 }}>{errors.name.message}</Typography>}
                                </Box>
                            )}
                        />

                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <Box>
                                    <Typography sx={{ color: '#64748b', fontSize: 12, mb: 0.8, fontFamily: 'inherit' }}>Description *</Typography>
                                    <textarea
                                        {...field}
                                        placeholder="Briefly describe this role's purpose..."
                                        rows={4}
                                        style={{
                                            width: '100%', boxSizing: 'border-box',
                                            background: 'rgba(255,255,255,0.04)',
                                            border: errors.description ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 8, padding: '10px 12px',
                                            color: '#fff', fontSize: 14, resize: 'vertical',
                                            fontFamily: "'Sora', sans-serif",
                                            outline: 'none', transition: 'border 0.2s',
                                        }}
                                        onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.6)'; }}
                                        onBlur={e => { e.target.style.borderColor = errors.description ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)'; field.onBlur(); }}
                                    />
                                    {errors.description && <Typography sx={{ color: '#f87171', fontSize: 11, mt: 0.5 }}>{errors.description.message}</Typography>}
                                </Box>
                            )}
                        />

                        {/* Summary */}
                        <Box sx={{
                            mt: 'auto', p: 2,
                            bgcolor: 'rgba(99,102,241,0.08)',
                            border: '1px solid rgba(99,102,241,0.2)',
                            borderRadius: '10px',
                        }}>
                            <Typography sx={{ color: '#94a3b8', fontSize: 11, mb: 1, fontFamily: 'inherit' }}>SELECTED</Typography>
                            <Typography sx={{ color: '#818cf8', fontSize: 28, fontWeight: 800, lineHeight: 1, fontFamily: 'inherit' }}>
                                {selectedPermissions.length}
                            </Typography>
                            <Typography sx={{ color: '#64748b', fontSize: 12, fontFamily: 'inherit' }}>
                                of {allPermissionIds.length} permissions
                            </Typography>

                            {/* Mini progress bar */}
                            <Box sx={{ mt: 1.5, height: 4, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                                <Box sx={{
                                    height: '100%', borderRadius: 2,
                                    bgcolor: '#818cf8',
                                    width: `${allPermissionIds.length ? (selectedPermissions.length / allPermissionIds.length) * 100 : 0}%`,
                                    transition: 'width 0.3s ease',
                                }} />
                            </Box>
                        </Box>
                    </Box>

                    {/* RIGHT — Permissions */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                        {/* Permissions header */}
                        <Box sx={{
                            px: 3, py: 2,
                            borderBottom: '1px solid rgba(255,255,255,0.07)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            flexShrink: 0,
                        }}>
                            <Typography sx={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'inherit' }}>
                                Permissions — {modules.length} modules
                            </Typography>
                            <Box
                                onClick={handleToggleAll}
                                sx={{
                                    display: 'flex', alignItems: 'center', gap: 1,
                                    cursor: 'pointer', px: 1.5, py: 0.8, borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    bgcolor: 'rgba(255,255,255,0.03)',
                                    transition: 'all 0.15s',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.2)' },
                                    userSelect: 'none',
                                }}
                            >
                                {isAllSelected
                                    ? <CheckBoxIcon sx={{ color: '#818cf8', fontSize: 16 }} />
                                    : isSomeSelected
                                        ? <IndeterminateCheckBoxIcon sx={{ color: '#818cf8', fontSize: 16 }} />
                                        : <CheckBoxOutlineBlankIcon sx={{ color: '#64748b', fontSize: 16 }} />
                                }
                                <Typography sx={{ color: isAllSelected ? '#818cf8' : '#94a3b8', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                                    {isAllSelected ? 'Deselect All' : 'Select All'}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Scrollable permission list */}
                        <Box sx={{ flex: 1, overflowY: 'auto', p: 3,
                            '&::-webkit-scrollbar': { width: 4 },
                            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                            '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
                        }}>
                            {isLoadingPermissions ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                    <CircularProgress size={28} sx={{ color: '#818cf8' }} />
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                    {modules.map((module) => {
                                        const perms: IPermission[] = groupedPermissions[module];
                                        const moduleIds = perms.map(p => p.id);
                                        const selectedCount = moduleIds.filter(id => selectedPermissions.includes(id)).length;
                                        const isModuleAll = selectedCount === moduleIds.length;
                                        const isModuleSome = selectedCount > 0 && selectedCount < moduleIds.length;
                                        const color = moduleColorMap[module];

                                        return (
                                            <Box key={module} sx={{
                                                border: '1px solid rgba(255,255,255,0.07)',
                                                borderRadius: '12px',
                                                overflow: 'hidden',
                                                transition: 'border-color 0.2s',
                                                ...(selectedCount > 0 && { borderColor: color.border }),
                                            }}>
                                                {/* Module header */}
                                                <Box
                                                    onClick={() => handleToggleModule(moduleIds)}
                                                    sx={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        px: 2, py: 1.5, cursor: 'pointer',
                                                        bgcolor: selectedCount > 0 ? color.bg : 'rgba(255,255,255,0.02)',
                                                        transition: 'background 0.2s',
                                                        '&:hover': { bgcolor: color.bg },
                                                        userSelect: 'none',
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        {isModuleAll
                                                            ? <CheckBoxIcon sx={{ color: color.text, fontSize: 18 }} />
                                                            : isModuleSome
                                                                ? <IndeterminateCheckBoxIcon sx={{ color: color.text, fontSize: 18 }} />
                                                                : <CheckBoxOutlineBlankIcon sx={{ color: '#475569', fontSize: 18 }} />
                                                        }
                                                        <Typography sx={{
                                                            color: selectedCount > 0 ? color.text : '#94a3b8',
                                                            fontSize: 13, fontWeight: 700,
                                                            textTransform: 'uppercase', letterSpacing: '0.06em',
                                                            fontFamily: 'inherit',
                                                        }}>
                                                            {module}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{
                                                        px: 1.2, py: 0.3, borderRadius: '20px',
                                                        bgcolor: selectedCount > 0 ? color.bg : 'rgba(255,255,255,0.04)',
                                                        border: `1px solid ${selectedCount > 0 ? color.border : 'rgba(255,255,255,0.08)'}`,
                                                    }}>
                                                        <Typography sx={{
                                                            color: selectedCount > 0 ? color.text : '#64748b',
                                                            fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                                                        }}>
                                                            {selectedCount}/{moduleIds.length}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                {/* Permissions grid */}
                                                <Box sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                                    gap: 0,
                                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                                }}>
                                                    {perms.map((p: IPermission, idx: number) => {
                                                        const isChecked = selectedPermissions.includes(p.id);
                                                        return (
                                                            <Box
                                                                key={p.id}
                                                                onClick={() => handleTogglePermission(p.id)}
                                                                sx={{
                                                                    display: 'flex', alignItems: 'flex-start', gap: 1.2,
                                                                    px: 2, py: 1.5, cursor: 'pointer',
                                                                    bgcolor: isChecked ? `${color.bg}` : 'transparent',
                                                                    borderRight: (idx % 3 !== 2) ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                                                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                                    transition: 'background 0.15s',
                                                                    '&:hover': { bgcolor: isChecked ? color.bg : 'rgba(255,255,255,0.03)' },
                                                                    userSelect: 'none',
                                                                }}
                                                            >
                                                                <Box sx={{ mt: 0.3, flexShrink: 0 }}>
                                                                    {isChecked
                                                                        ? <CheckBoxIcon sx={{ color: color.text, fontSize: 15 }} />
                                                                        : <CheckBoxOutlineBlankIcon sx={{ color: '#334155', fontSize: 15 }} />
                                                                    }
                                                                </Box>
                                                                <Box sx={{ minWidth: 0 }}>
                                                                    <Typography sx={{
                                                                        color: isChecked ? '#e2e8f0' : '#64748b',
                                                                        fontSize: 12.5, fontWeight: 600, lineHeight: 1.3,
                                                                        fontFamily: 'inherit', transition: 'color 0.15s',
                                                                    }}>
                                                                        {p.name}
                                                                    </Typography>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.4, flexWrap: 'wrap' }}>
                                                                        <Typography sx={{
                                                                            fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                                                                            color: METHOD_COLORS[p.method] || '#94a3b8',
                                                                        }}>
                                                                            {p.method}
                                                                        </Typography>
                                                                        <Typography sx={{
                                                                            fontSize: 10, color: '#334155', fontFamily: "'JetBrains Mono', monospace",
                                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120,
                                                                        }}>
                                                                            {p.apiPath}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                            </Box>
                                                        );
                                                    })}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* ── FOOTER ── */}
                <Box sx={{
                    display: 'flex', justifyContent: 'flex-end', gap: 1.5,
                    px: 3.5, py: 2.5,
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                    bgcolor: '#0a0d14',
                    flexShrink: 0,
                }}>
                    <button
                        onClick={handleClose}
                        style={{
                            padding: '9px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.04)', color: '#94a3b8',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            fontFamily: "'Sora', sans-serif", transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)'; (e.target as HTMLButtonElement).style.color = '#fff'; }}
                        onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.target as HTMLButtonElement).style.color = '#94a3b8'; }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={isPending}
                        style={{
                            padding: '9px 24px', borderRadius: 8, border: 'none',
                            background: isPending ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #818cf8)',
                            color: '#fff', fontSize: 13, fontWeight: 700,
                            cursor: isPending ? 'not-allowed' : 'pointer',
                            fontFamily: "'Sora', sans-serif",
                            boxShadow: isPending ? 'none' : '0 4px 15px rgba(99,102,241,0.35)',
                            transition: 'all 0.15s',
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}
                    >
                        {isPending && <CircularProgress size={13} sx={{ color: '#fff' }} />}
                        {dataUpdate ? 'Save Changes' : 'Create Role'}
                    </button>
                </Box>
            </Box>
        </Modal>
    );
};

export default RoleModal;