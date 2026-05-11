'use client';

import { useState } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, IconButton, Pagination, Box, TextField, InputAdornment, Typography,
    CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Add as AddIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { useTracks, useDeleteTrack } from '@/hooks/use-track';
import { toast } from 'react-toastify';
import TrackModal from './track.modal';
import { Dialog, DialogTitle, DialogContent, Stack, Divider } from '@mui/material';
import ConfirmDialog from '../common/confirm.dialog';
import { metadata } from "@/app/(user)/page";

const TrackTable = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [dataUpdate, setDataUpdate] = useState<ITrack | null>(null);
    const [viewTrack, setViewTrack] = useState<ITrack | null>(null);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<string | number | null>(null);

    const { data, isLoading, error } = useTracks({
        current: page,
        pageSize: pageSize,
        filter: searchTerm ? `title~'${searchTerm}'` : '',
        sort: 'updatedAt,desc'
    });

    const deleteTrackMutation = useDeleteTrack();

    const handleDelete = (id: string | number) => {
        setIdToDelete(id);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (idToDelete) {
            try {
                await deleteTrackMutation.mutateAsync(idToDelete);
                toast.success("Delete track success");
            } catch (err: any) {
                toast.error(err.message || "Delete track failed");
            } finally {
                setIsConfirmOpen(false);
                setIdToDelete(null);
            }
        }
    };

    const handleEdit = (track: ITrack) => {
        setDataUpdate(track);
        setIsOpenModal(true);
    };

    const handleView = (track: ITrack) => {
        setViewTrack(track);
    };

    if (error) return <Typography color="error">Error loading tracks</Typography>;
    //@ts-ignore
    const tracks = data?.data?.data?.[0]?.result ?? [];
    //@ts-ignore
    const meta = data?.data?.data?.[0]?.meta;
    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                <Typography variant="h5">Management Tracks</Typography>
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
                    placeholder="Search by title..."
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
                            <TableCell>Title</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Uploader</TableCell>
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
                        ) : tracks.map((track) => (
                            <TableRow key={track.id}>
                                <TableCell>{track.id}</TableCell>
                                <TableCell>{track.title}</TableCell>
                                <TableCell>{track.category}</TableCell>
                                <TableCell>{track.uploader?.name}</TableCell>
                                <TableCell align="right">
                                    <IconButton color="info" onClick={() => handleView(track)}>
                                        <ViewIcon />
                                    </IconButton>
                                    <IconButton color="primary" onClick={() => handleEdit(track)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => handleDelete(track.id)}>
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
                    count={meta?.pages || 0}
                    page={page}
                    onChange={(e, v) => setPage(v)}
                    color="primary"
                />
            </Box>

            <TrackModal
                open={isOpenModal}
                setOpen={setIsOpenModal}
                dataUpdate={dataUpdate}
                setDataUpdate={setDataUpdate}
            />

            <Dialog open={!!viewTrack} onClose={() => setViewTrack(null)} fullWidth maxWidth="sm">
                <DialogTitle>Track Details</DialogTitle>
                <DialogContent>
                    {viewTrack && (
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <img
                                    src={`${viewTrack.imgUrl}`}
                                    // src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/files/img-tracks/${viewTrack.imgUrl}`}
                                    alt={viewTrack.title}
                                    style={{ width: 200, height: 200, objectFit: 'cover', borderRadius: 8 }}
                                />
                            </Box>
                            <Divider />
                            <Typography><strong>Title:</strong> {viewTrack.title}</Typography>
                            <Typography><strong>Category:</strong> {viewTrack.category}</Typography>
                            <Typography><strong>Uploader:</strong> {viewTrack.uploader?.name}</Typography>
                            <Typography><strong>Description:</strong> {viewTrack.description}</Typography>
                            <Typography><strong>Plays:</strong> {viewTrack.countPlay}</Typography>
                            <Typography><strong>Likes:</strong> {viewTrack.countLike}</Typography>
                            <Typography><strong>Created At:</strong> {new Date(viewTrack.createdAt).toLocaleString()}</Typography>
                            <Box sx={{ mt: 2 }}>
                                <audio controls src={`${process.env.NEXT_PUBLIC_BE_URL}/api/v1/files/audio-tracks/${viewTrack.trackUrl}`} style={{ width: '100%' }} />
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={isConfirmOpen}
                title="Delete Track"
                content="Are you sure you want to delete this track?"
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDelete}
                loading={deleteTrackMutation.isPending}
            />
        </Box>
    );
};

export default TrackTable;
