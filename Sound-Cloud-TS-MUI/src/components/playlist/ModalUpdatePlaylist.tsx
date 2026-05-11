'use client'

import { useState, useEffect } from 'react';
import {
    Modal, Box, Typography, TextField, Button, Grid,
    Radio, RadioGroup, FormControlLabel, Tabs, Tab, IconButton, Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller } from 'react-hook-form';
import { useUpdatePlaylist } from '@/hooks/use-playlist';
import { toast } from 'react-toastify';

const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '95%', sm: 800 },
    bgcolor: '#1a1a1a',
    color: '#fff',
    boxShadow: 24,
    p: 0,
    borderRadius: 2,
    outline: 'none',
    maxHeight: '90vh',
    overflowY: 'auto'
};

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    playlist: IPlaylist;
}

const ModalUpdatePlaylist = (props: IProps) => {
    const { open, setOpen, playlist } = props;
    const [tabValue, setTabValue] = useState(0);
    const [imgFile, setImgFile] = useState<File | null>(null);
    const [imgPreview, setImgPreview] = useState<string>("");

    const updatePlaylistMutation = useUpdatePlaylist();

    const { control, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            title: playlist.title,
            description: playlist.description || "",
            isPublic: playlist.isPublic
        }
    });

    // Reset form và image preview khi modal mở
    useEffect(() => {
        if (open && playlist) {
            reset({
                title: playlist.title,
                description: playlist.description || "",
                isPublic: playlist.isPublic
            });
            // Set lại ảnh cũ từ playlist
            setImgPreview(playlist.imgUrl || "");
            setImgFile(null);
        }
    }, [open, playlist, reset]);

    // Xử lý preview cho file mới được chọn
    useEffect(() => {
        if (!imgFile) return;

        const objectUrl = URL.createObjectURL(imgFile);
        setImgPreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [imgFile]);

    const handleClose = () => {
        setOpen(false);
        // Reset lại state khi đóng modal
        setImgFile(null);
        setImgPreview("");
    };

    const onSubmit = async (data: any) => {
        const formData = new FormData();
        formData.append('id', playlist.id.toString());
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('isPublic', data.isPublic.toString());

        if (imgFile) {
            formData.append('imgUrl', imgFile);
        }

        try {
            await updatePlaylistMutation.mutateAsync({ formData });
            toast.success("Playlist updated successfully");
            handleClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to update playlist");
        }
    };

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={style}>
                {/* Header Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: '#333', px: 3, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tabs
                        value={tabValue}
                        onChange={(_, v) => setTabValue(v)}
                        TabIndicatorProps={{ style: { backgroundColor: '#f50' } }}
                        sx={{
                            '& .MuiTab-root': {
                                color: '#999',
                                textTransform: 'none',
                                minWidth: 'auto',
                                mr: 3,
                                px: 0,
                                fontWeight: 700,
                                fontSize: '1.1rem'
                            },
                            '& .Mui-selected': { color: '#fff' }
                        }}
                    >
                        <Tab label="Basic info" />
                        <Tab label="Tracks" disabled />
                        <Tab label="Metadata" disabled />
                    </Tabs>
                    <IconButton onClick={handleClose} sx={{ color: '#999' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Box sx={{ p: { xs: 2, md: 4 } }}>
                        <Grid container spacing={4}>
                            {/* Left: Image Upload */}
                            <Grid item xs={12} md={4}>
                                <Box sx={{
                                    aspectRatio: '1/1',
                                    bgcolor: '#222',
                                    position: 'relative',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    mb: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'linear-gradient(135deg, #333 0%, #111 100%)'
                                }}>
                                    {imgPreview ? (
                                        <img
                                            src={imgPreview}
                                            alt="Preview"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    ) : (
                                        <Typography sx={{ color: '#444', fontSize: '4rem' }}>🎵</Typography>
                                    )}
                                    <Button
                                        variant="contained"
                                        component="label"
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            bottom: 16,
                                            bgcolor: 'rgba(0,0,0,0.7)',
                                            color: '#fff',
                                            textTransform: 'none',
                                            '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' }
                                        }}
                                    >
                                        {imgPreview ? 'Change image' : 'Upload image'}
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setImgFile(file);
                                                }
                                            }}
                                        />
                                    </Button>
                                </Box>
                            </Grid>

                            {/* Right: Form Fields */}
                            <Grid item xs={12} md={8}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#ccc', mb: 0.5, display: 'block' }}>
                                            Title <span style={{ color: '#f50' }}>*</span>
                                        </Typography>
                                        <Controller
                                            name="title"
                                            control={control}
                                            rules={{ required: 'Title is required' }}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    variant="outlined"
                                                    size="small"
                                                    error={!!errors.title}
                                                    helperText={errors.title?.message}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            bgcolor: '#2a2a2a',
                                                            color: '#fff',
                                                            '& fieldset': { borderColor: '#444' },
                                                            '&:hover fieldset': { borderColor: '#666' },
                                                            '&.Mui-focused fieldset': { borderColor: '#f50' }
                                                        }
                                                    }}
                                                />
                                            )}
                                        />
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#ccc', mb: 0.5, display: 'block' }}>
                                            Description
                                        </Typography>
                                        <Controller
                                            name="description"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    variant="outlined"
                                                    multiline
                                                    rows={4}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            bgcolor: '#2a2a2a',
                                                            color: '#fff',
                                                            '& fieldset': { borderColor: '#444' },
                                                            '&:hover fieldset': { borderColor: '#666' },
                                                            '&.Mui-focused fieldset': { borderColor: '#f50' }
                                                        }
                                                    }}
                                                />
                                            )}
                                        />
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#ccc', mb: 1, display: 'block' }}>
                                            Privacy:
                                        </Typography>
                                        <Controller
                                            name="isPublic"
                                            control={control}
                                            render={({ field }) => (
                                                <RadioGroup
                                                    value={field.value}
                                                    onChange={(e) => field.onChange(e.target.value === 'true')}
                                                    row
                                                >
                                                    <FormControlLabel
                                                        value={true}
                                                        control={<Radio sx={{ color: '#444', '&.Mui-checked': { color: '#f50' } }} />}
                                                        label={
                                                            <Box>
                                                                <Typography variant="body2">Public</Typography>
                                                                <Typography variant="caption" sx={{ color: '#666' }}>
                                                                    Anyone will be able to listen to this playlist.
                                                                </Typography>
                                                            </Box>
                                                        }
                                                    />
                                                    <FormControlLabel
                                                        value={false}
                                                        control={<Radio sx={{ color: '#444', '&.Mui-checked': { color: '#f50' } }} />}
                                                        label={<Typography variant="body2">Private</Typography>}
                                                    />
                                                </RadioGroup>
                                            )}
                                        />
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>

                    <Divider sx={{ borderColor: '#333' }} />

                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button onClick={handleClose} sx={{ color: '#fff', textTransform: 'none' }}>Cancel</Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={updatePlaylistMutation.isPending}
                            sx={{
                                bgcolor: '#f50',
                                color: '#fff',
                                textTransform: 'none',
                                px: 4,
                                '&:hover': { bgcolor: '#e40' },
                                '&.Mui-disabled': { bgcolor: '#444' }
                            }}
                        >
                            {updatePlaylistMutation.isPending ? "Saving..." : "Save changes"}
                        </Button>
                    </Box>
                </form>
            </Box>
        </Modal>
    );
};

export default ModalUpdatePlaylist;