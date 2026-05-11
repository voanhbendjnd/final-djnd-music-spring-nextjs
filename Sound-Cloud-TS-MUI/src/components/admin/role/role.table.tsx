'use client';

import { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Button, IconButton, Pagination, Box, TextField, InputAdornment, Typography,
  CircularProgress, Chip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';
import { useRoles, useDeleteRole } from '@/hooks/use-role';
import { toast } from 'react-toastify';
import RoleModal from './role.modal';
import ConfirmDialog from '../common/confirm.dialog';

const RoleTable = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [dataUpdate, setDataUpdate] = useState<IRole | null>(null);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<number | string | null>(null);

    const { data, isLoading, error } = useRoles({
        current: page,
        pageSize: pageSize,
        filter: searchTerm ? `name~'${searchTerm}'` : '',
        sort: 'updatedAt,desc'
    });

    const deleteRoleMutation = useDeleteRole();

    const handleDelete = (id: number | string) => {
        setIdToDelete(id);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (idToDelete) {
            try {
                await deleteRoleMutation.mutateAsync(idToDelete);
                toast.success("Delete role success");
            } catch (err: any) {
                toast.error(err.message || "Delete role failed");
            } finally {
                setIsConfirmOpen(false);
                setIdToDelete(null);
            }
        }
    };

    if (error) return <Typography color="error">Error loading roles</Typography>;

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                <Typography variant="h5">Role Management</Typography>
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
                    placeholder="Search by name..."
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
                            <TableCell>Description</TableCell>
                            <TableCell>Permissions</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.data?.result && data.data.result.length > 0 ? (
                                data.data.result.map((role: IRole) => (
                                    <TableRow key={role.id}>
                                        <TableCell>{role.id}</TableCell>
                                        <TableCell>{role.name}</TableCell>
                                        <TableCell>{role.description}</TableCell>
                                        <TableCell>
                                            {role.permissions?.length || 0} permissions
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton color="primary" onClick={() => { setDataUpdate(role); setIsOpenModal(true); }}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton color="error" onClick={() => handleDelete(role.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">No data found</TableCell>
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

            <RoleModal
                open={isOpenModal}
                setOpen={setIsOpenModal}
                dataUpdate={dataUpdate}
                setDataUpdate={setDataUpdate}
            />

            <ConfirmDialog
                open={isConfirmOpen}
                title="Delete Role"
                content="Are you sure you want to delete this role?"
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDelete}
                loading={deleteRoleMutation.isPending}
            />
        </Box>
    );
};

export default RoleTable;
