'use client';

import { useState } from 'react';
import {
    Box, Typography, Button, IconButton, CircularProgress, Chip, Tooltip,
    InputAdornment, TextField, Pagination
} from '@mui/material';
import {
    Edit as EditIcon, Delete as DeleteIcon,
    Search as SearchIcon, Add as AddIcon,
    ShieldOutlined as ShieldIcon,
    KeyOutlined as KeyIcon,
} from '@mui/icons-material';
import { useRoles, useDeleteRole } from '@/hooks/use-role';
import { toast } from 'react-toastify';
import RoleModal from './role.modal';
import ConfirmDialog from '../common/confirm.dialog';

const METHOD_COLORS: Record<string, string> = {
    GET: '#34d399', POST: '#60a5fa', PUT: '#fbbf24',
    PATCH: '#fbbf24', DELETE: '#f87171',
};

const ROLE_BADGE_COLORS = [
    { bg: 'rgba(99,102,241,0.15)', text: '#818cf8', border: 'rgba(99,102,241,0.3)' },
    { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' },
    { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
    { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: 'rgba(239,68,68,0.3)' },
    { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
    { bg: 'rgba(168,85,247,0.15)', text: '#c084fc', border: 'rgba(168,85,247,0.3)' },
];

const RoleTable = () => {
    const [page, setPage] = useState(1);
    const [pageSize] = useState(9);
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [dataUpdate, setDataUpdate] = useState<IRole | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<number | string | null>(null);
    const [roleNameToDelete, setRoleNameToDelete] = useState('');

    const { data, isLoading, error } = useRoles({
        current: page,
        pageSize,
        filter: searchTerm ? `name~'${searchTerm}'` : '',
        sort: 'updatedAt,desc'
    });

    const deleteRoleMutation = useDeleteRole();

    const handleDelete = (id: number | string, name: string) => {
        setIdToDelete(id);
        setRoleNameToDelete(name);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!idToDelete) return;
        try {
            await deleteRoleMutation.mutateAsync(idToDelete);
            toast.success("Role deleted successfully");
        } catch (err: any) {
            toast.error(err.message || "Delete failed");
        } finally {
            setIsConfirmOpen(false);
            setIdToDelete(null);
        }
    };

    const roles: IRole[] = data?.data?.result || [];
    const meta = data?.data?.meta;

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: '#0a0d14',
            fontFamily: "'Sora', sans-serif",
            p: { xs: 2, md: 3.5 },
        }}>

            {/* ── PAGE HEADER ── */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                            <Box sx={{
                                width: 40, height: 40, borderRadius: '12px',
                                bgcolor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <ShieldIcon sx={{ color: '#818cf8', fontSize: 22 }} />
                            </Box>
                            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 22, fontFamily: 'inherit', letterSpacing: '-0.02em' }}>
                                Role Management
                            </Typography>
                        </Box>
                        <Typography sx={{ color: '#475569', fontSize: 13, ml: '56px', fontFamily: 'inherit' }}>
                            {meta?.total ?? 0} roles · manage access control
                        </Typography>
                    </Box>

                    <button
                        onClick={() => { setDataUpdate(null); setIsOpenModal(true); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 20px', borderRadius: 10, border: 'none',
                            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                            color: '#fff', fontSize: 13, fontWeight: 700,
                            cursor: 'pointer', fontFamily: "'Sora', sans-serif",
                            boxShadow: '0 4px 15px rgba(99,102,241,0.35)',
                        }}
                    >
                        <AddIcon sx={{ fontSize: 18 }} />
                        New Role
                    </button>
                </Box>

                {/* Search bar */}
                <Box sx={{ mt: 3, position: 'relative', maxWidth: 400 }}>
                    <SearchIcon sx={{
                        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                        color: '#475569', fontSize: 18, zIndex: 1,
                    }} />
                    <input
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                        placeholder="Search roles..."
                        style={{
                            width: '100%', boxSizing: 'border-box',
                            padding: '10px 14px 10px 40px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 10, color: '#fff', fontSize: 13,
                            fontFamily: "'Sora', sans-serif", outline: 'none',
                            transition: 'border 0.2s',
                        }}
                        onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.5)'; }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                    />
                </Box>
            </Box>

            {/* ── ROLE CARDS GRID ── */}
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress sx={{ color: '#818cf8' }} />
                </Box>
            ) : error ? (
                <Box sx={{ textAlign: 'center', py: 10 }}>
                    <Typography sx={{ color: '#f87171', fontFamily: 'inherit' }}>Failed to load roles</Typography>
                </Box>
            ) : roles.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 10 }}>
                    <ShieldIcon sx={{ fontSize: 48, color: '#1e293b', mb: 2 }} />
                    <Typography sx={{ color: '#475569', fontFamily: 'inherit' }}>No roles found</Typography>
                </Box>
            ) : (
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                    gap: 2,
                }}>
                    {roles.map((role: IRole, index: number) => {
                        const color = ROLE_BADGE_COLORS[index % ROLE_BADGE_COLORS.length];
                        const permCount = role.permissions?.length || 0;

                        // Group permissions by module for preview
                        const moduleGroups: Record<string, IPermission[]> = {};
                        role.permissions?.forEach(p => {
                            if (!moduleGroups[p.module]) moduleGroups[p.module] = [];
                            moduleGroups[p.module].push(p);
                        });
                        const moduleNames = Object.keys(moduleGroups).slice(0, 4);
                        const extraModules = Object.keys(moduleGroups).length - 4;

                        return (
                            <Box
                                key={role.id}
                                sx={{
                                    bgcolor: '#0f1117',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                    borderRadius: '14px',
                                    p: 2.5,
                                    display: 'flex', flexDirection: 'column', gap: 2,
                                    transition: 'all 0.2s',
                                    cursor: 'default',
                                    '&:hover': {
                                        borderColor: color.border,
                                        boxShadow: `0 4px 30px ${color.bg}`,
                                        transform: 'translateY(-2px)',
                                    },
                                }}
                            >
                                {/* Card header */}
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Box sx={{
                                            display: 'inline-flex', alignItems: 'center', gap: 0.8,
                                            px: 1.2, py: 0.4, borderRadius: '6px',
                                            bgcolor: color.bg, border: `1px solid ${color.border}`,
                                            mb: 1,
                                        }}>
                                            <ShieldIcon sx={{ color: color.text, fontSize: 13 }} />
                                            <Typography sx={{ color: color.text, fontSize: 11, fontWeight: 700, fontFamily: 'inherit', letterSpacing: '0.05em' }}>
                                                ROLE #{role.id}
                                            </Typography>
                                        </Box>
                                        <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: 'inherit', letterSpacing: '-0.01em' }}>
                                            {role.name}
                                        </Typography>
                                        <Typography sx={{ color: '#475569', fontSize: 12, mt: 0.3, fontFamily: 'inherit', lineHeight: 1.5 }}>
                                            {role.description || '—'}
                                        </Typography>
                                    </Box>

                                    {/* Actions */}
                                    <Box sx={{ display: 'flex', gap: 0.5, ml: 1, flexShrink: 0 }}>
                                        <Tooltip title="Edit role" arrow>
                                            <IconButton
                                                size="small"
                                                onClick={() => { setDataUpdate(role); setIsOpenModal(true); }}
                                                sx={{
                                                    color: '#64748b', width: 30, height: 30,
                                                    '&:hover': { color: '#818cf8', bgcolor: 'rgba(99,102,241,0.12)' },
                                                }}
                                            >
                                                <EditIcon sx={{ fontSize: 15 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete role" arrow>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(role.id, role.name)}
                                                sx={{
                                                    color: '#64748b', width: 30, height: 30,
                                                    '&:hover': { color: '#f87171', bgcolor: 'rgba(239,68,68,0.12)' },
                                                }}
                                            >
                                                <DeleteIcon sx={{ fontSize: 15 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Box>

                                {/* Divider */}
                                <Box sx={{ height: '1px', bgcolor: 'rgba(255,255,255,0.05)' }} />

                                {/* Permissions summary */}
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                        <KeyIcon sx={{ color: '#334155', fontSize: 14 }} />
                                        <Typography sx={{ color: '#475569', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'inherit' }}>
                                            {permCount} permissions
                                        </Typography>
                                    </Box>

                                    {/* Module badges */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                                        {permCount === 0 ? (
                                            <Typography sx={{ color: '#334155', fontSize: 11, fontFamily: 'inherit', fontStyle: 'italic' }}>
                                                No permissions assigned
                                            </Typography>
                                        ) : (
                                            <>
                                                {moduleNames.map((mod, i) => (
                                                    <Tooltip
                                                        key={mod}
                                                        title={`${moduleGroups[mod].length} permission${moduleGroups[mod].length > 1 ? 's' : ''}: ${moduleGroups[mod].map(p => p.name).join(', ')}`}
                                                        arrow
                                                        placement="top"
                                                    >
                                                        <Box sx={{
                                                            px: 1, py: 0.35, borderRadius: '5px',
                                                            bgcolor: ROLE_BADGE_COLORS[i % ROLE_BADGE_COLORS.length].bg,
                                                            border: `1px solid ${ROLE_BADGE_COLORS[i % ROLE_BADGE_COLORS.length].border}`,
                                                            cursor: 'default',
                                                        }}>
                                                            <Typography sx={{
                                                                color: ROLE_BADGE_COLORS[i % ROLE_BADGE_COLORS.length].text,
                                                                fontSize: 10.5, fontWeight: 700,
                                                                fontFamily: 'inherit', letterSpacing: '0.04em',
                                                            }}>
                                                                {mod}
                                                                <span style={{ opacity: 0.7, marginLeft: 4 }}>
                                                                    ×{moduleGroups[mod].length}
                                                                </span>
                                                            </Typography>
                                                        </Box>
                                                    </Tooltip>
                                                ))}
                                                {extraModules > 0 && (
                                                    <Box sx={{
                                                        px: 1, py: 0.35, borderRadius: '5px',
                                                        bgcolor: 'rgba(255,255,255,0.04)',
                                                        border: '1px solid rgba(255,255,255,0.08)',
                                                    }}>
                                                        <Typography sx={{ color: '#64748b', fontSize: 10.5, fontWeight: 700, fontFamily: 'inherit' }}>
                                                            +{extraModules} more
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            )}

            {/* ── PAGINATION ── */}
            {meta && meta.pages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                        count={meta.pages}
                        page={page}
                        onChange={(_, v) => setPage(v)}
                        sx={{
                            '& .MuiPaginationItem-root': {
                                color: '#475569', fontFamily: 'inherit', fontSize: 13,
                                borderColor: 'rgba(255,255,255,0.08)',
                                '&:hover': { bgcolor: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.3)', color: '#818cf8' },
                                '&.Mui-selected': { bgcolor: 'rgba(99,102,241,0.2)', borderColor: 'rgba(99,102,241,0.4)', color: '#818cf8' },
                            },
                        }}
                    />
                </Box>
            )}

            {/* ── MODALS ── */}
            <RoleModal
                open={isOpenModal}
                setOpen={setIsOpenModal}
                dataUpdate={dataUpdate}
                setDataUpdate={setDataUpdate}
            />
            <ConfirmDialog
                open={isConfirmOpen}
                title="Delete Role"
                content={`Are you sure you want to delete "${roleNameToDelete}"? This action cannot be undone.`}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDelete}
                loading={deleteRoleMutation.isPending}
            />
        </Box>
    );
};

export default RoleTable;