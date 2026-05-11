'use client';

import { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Button, IconButton, Pagination, Box, TextField, InputAdornment, Typography,
  CircularProgress, Chip
} from '@mui/material';
import { 
    Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, 
    Add as AddIcon, CloudDownload as DownloadIcon, CloudUpload as UploadIcon 
} from '@mui/icons-material';
import { useUsers, useDeleteUser, useExportUsers, useImportUsers } from '@/hooks/use-user';
import { toast } from 'react-toastify';
import UserModal from './user.modal';
import ConfirmDialog from '../common/confirm.dialog';

const UserTable = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [dataUpdate, setDataUpdate] = useState<IUser | null>(null);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [userIdToDelete, setUserIdToDelete] = useState<number | string | null>(null);

    const { data, isLoading, error } = useUsers({
        current: page,
        pageSize: pageSize,
        filter: searchTerm ? `email~'${searchTerm}' or name~'${searchTerm}'` : '',
        sort: 'updatedBy,desc'
    });

    const deleteUserMutation = useDeleteUser();
    const exportUsersMutation = useExportUsers();
    const importUsersMutation = useImportUsers();

    const handleDelete = (id: number | string) => {
        setUserIdToDelete(id);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (userIdToDelete) {
            try {
                await deleteUserMutation.mutateAsync(userIdToDelete);
                toast.success("Delete user success");
            } catch (err: any) {
                toast.error(err.message || "Delete user failed");
            } finally {
                setIsConfirmOpen(false);
                setUserIdToDelete(null);
            }
        }
    };

    const handleExport = async () => {
        try {
            await exportUsersMutation.mutateAsync();
            toast.success("Export success");
        } catch (err) {
            toast.error("Export failed");
        }
    };

    const handleImport = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            importUsersMutation.mutate(file, {
                onSuccess: (res: any) => {
                    toast.success(res.message || "Import success");
                },
                onError: (err: any) => {
                    toast.error(err.message || "Import failed");
                }
            });
        }
    };

    if (error) return <Typography color="error">Error loading users</Typography>;

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                <Typography variant="h5">User Management</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
                        Import
                        <input type="file" hidden onChange={handleImport} accept=".xlsx, .xls" />
                    </Button>
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>
                        Export
                    </Button>
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
            </Box>

            <Box sx={{ mb: 2 }}>
                <TextField
                    fullWidth
                    placeholder="Search by name or email..."
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
                            <TableCell>Email</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Status</TableCell>
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
                                data.data.result.map((user: IUser) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.id}</TableCell>
                                        <TableCell>{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Chip label={user.role?.name || 'N/A'} color="primary" size="small" />
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={user.status ? "Active" : "Inactive"}
                                                color={user.status ? "success" : "default"} 
                                                variant="outlined"
                                                size="small" 
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton color="primary" onClick={() => { setDataUpdate(user); setIsOpenModal(true); }}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton color="error" onClick={() => handleDelete(user.id)}>
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

            <UserModal
                open={isOpenModal}
                setOpen={setIsOpenModal}
                dataUpdate={dataUpdate}
                setDataUpdate={setDataUpdate}
            />

            <ConfirmDialog
                open={isConfirmOpen}
                title="Delete User"
                content="Are you sure you want to delete this user? This action cannot be undone."
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDelete}
                loading={deleteUserMutation.isPending}
            />
        </Box>
    );
};

export default UserTable;
