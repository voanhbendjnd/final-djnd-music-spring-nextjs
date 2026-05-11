'use client';

import { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Button, IconButton, Pagination, Box, TextField, InputAdornment, Typography,
  CircularProgress, Chip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';
import { usePermissions, useDeletePermission } from '@/hooks/use-permission';
import { toast } from 'react-toastify';
import PermissionModal from './permission.modal';
import ConfirmDialog from '../common/confirm.dialog';

const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
        case 'GET': return 'info';
        case 'POST': return 'success';
        case 'PUT':
        case 'PATCH': return 'warning';
        case 'DELETE': return 'error';
        default: return 'default';
    }
}

const PermissionTable = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [dataUpdate, setDataUpdate] = useState<IPermission | null>(null);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<number | string | null>(null);

    const { data, isLoading, error } = usePermissions({
        current: page,
        pageSize: pageSize,
        filter: searchTerm ? `name~'${searchTerm}' or module~'${searchTerm}'` : '',
        sort: 'updatedAt,desc'
    });

    const deletePermissionMutation = useDeletePermission();

    const handleDelete = (id: number | string) => {
        setIdToDelete(id);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (idToDelete) {
            try {
                await deletePermissionMutation.mutateAsync(idToDelete);
                toast.success("Delete permission success");
            } catch (err: any) {
                toast.error(err.message || "Delete permission failed");
            } finally {
                setIsConfirmOpen(false);
                setIdToDelete(null);
            }
        }
    };

    if (error) return <Typography color="error">Error loading permissions</Typography>;

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                <Typography variant="h5">Permission Management</Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setDataUpdate(null);
                        setIsOpenModal(true);
                    }}
                >
                    Add New
                </Button>
            </Box>

            <Box sx={{ mb: 2 }}>
                <TextField
                    fullWidth
                    placeholder="Search by name or module..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>API Path</TableCell>
                            <TableCell>Method</TableCell>
                            <TableCell>Module</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.data?.result && data.data.result.length > 0 ? (
                                data.data.result.map((permission: IPermission) => (
                                    <TableRow key={permission.id}>
                                        <TableCell>{permission.id}</TableCell>
                                        <TableCell>{permission.name}</TableCell>
                                        <TableCell><code>{permission.apiPath}</code></TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={permission.method} 
                                                color={getMethodColor(permission.method) as any} 
                                                size="small" 
                                            />
                                        </TableCell>
                                        <TableCell>{permission.module}</TableCell>
                                        <TableCell align="right">
                                            <IconButton color="primary" onClick={() => { setDataUpdate(permission); setIsOpenModal(true); }}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton color="error" onClick={() => handleDelete(permission.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">No data found</TableCell>
                                </TableRow>
                            )
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination 
                    count={data?.data?.meta.pages || 0} 
                    page={page} 
                    onChange={(e, v) => setPage(v)} 
                    color="primary" 
                />
            </Box>

            <PermissionModal
                open={isOpenModal}
                setOpen={setIsOpenModal}
                dataUpdate={dataUpdate}
                setDataUpdate={setDataUpdate}
            />

            <ConfirmDialog
                open={isConfirmOpen}
                title="Delete Permission"
                content="Are you sure you want to delete this permission?"
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDelete}
                loading={deletePermissionMutation.isPending}
            />
        </Box>
    );
};

export default PermissionTable;
