'use client';

import { useState } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, IconButton, Pagination, Box, TextField, InputAdornment, Typography,
    CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import ConfirmDialog from '../common/confirm.dialog';
import {useComments, useDeleteComment} from "@/hooks/use.comment";

const CommentTable = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [dataUpdate, setDataUpdate] = useState<IComment | null>(null);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<number | null>(null);

    const { data, isLoading, error } = useComments({
        current: page,
        pageSize: pageSize,
        filter: searchTerm ? `content~'${searchTerm}'` : '',
        sort: 'updatedAt,desc'
    });
    const deleteCategoryMutation = useDeleteComment();

    const handleDelete = (id: number) => {
        setIdToDelete(id);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (idToDelete) {
            try {
                await deleteCategoryMutation.mutateAsync(idToDelete);
                toast.success("Delete comment success");
            } catch (err: any) {
                toast.error(err.message || "Delete comment failed");
            } finally {
                setIsConfirmOpen(false);
                setIdToDelete(null);
            }
        }
    };

    const handleEdit = (comment: IComment) => {
        setDataUpdate(comment);
        setIsOpenModal(true);
    };

    if (error) return <Typography color="error">Error loading categories</Typography>;

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                <Typography variant="h5">Management Categories</Typography>
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
                            <TableCell>Content</TableCell>
                            <TableCell>Track</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) :
                            data?.result.map((comment: IComment) => (
                                <TableRow key={comment.id}>
                                    <TableCell>{comment.id}</TableCell>
                                    <TableCell>{comment.content}</TableCell>
                                    <TableCell>{comment.track_title}</TableCell>
                                    <TableCell>{comment.user_email}</TableCell>

                                    <TableCell align="right">
                                        <IconButton color="primary" onClick={() => handleEdit(comment)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton color="error" onClick={() => handleDelete(comment.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                    count={data?.meta.pages || 0}
                    page={page}
                    onChange={(e, v) => setPage(v)}
                    color="primary"
                />
            </Box>

            {/*<CategoryModal*/}
            {/*    open={isOpenModal}*/}
            {/*    setOpen={setIsOpenModal}*/}
            {/*    dataUpdate={dataUpdate}*/}
            {/*    setDataUpdate={setDataUpdate}*/}
            {/*/>*/}

            <ConfirmDialog
                open={isConfirmOpen}
                title="Delete Comment"
                content="Are you sure you want to delete this comment?"
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDelete}
                loading={deleteCategoryMutation.isPending}
            />
        </Box>
    );
};

export default CommentTable;
