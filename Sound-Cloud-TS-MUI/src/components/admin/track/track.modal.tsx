'use client';

import { useEffect, useState } from 'react';
import {
    Modal, Box, Typography, TextField, Button, Grid, MenuItem,
    FormControl, InputLabel, Select, FormHelperText
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCreateTrack, useCreateTrackByAdmin, useUpdateTrack } from '@/hooks/use-track';
import { useAllCategories } from '@/hooks/use-category';
import { toast } from 'react-toastify';

const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
};

const schema = yup.object({
    title: yup.string().required('Title is required'),
    description: yup.string().required('Description is required'),
    categoryId: yup.number().required('Category is required'),
}).required();

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    dataUpdate: ITrack | null;
    setDataUpdate: (v: ITrack | null) => void;
}

const TrackModal = (props: IProps) => {
    const { open, setOpen, dataUpdate, setDataUpdate } = props;
    const [imgFile, setImgFile] = useState<File | null>(null);
    const [trackFile, setTrackFile] = useState<File | null>(null);
    const [imgPreview, setImgPreview] = useState<string>("");
    const [trackPreview, setTrackPreview] = useState<string>("");

    const { data: dataAllCategories } = useAllCategories();

    const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            title: '',
            description: '',
            categoryId: 0
        }
    });

    useEffect(() => {
        if (dataAllCategories?.data && dataAllCategories.data.length > 0 && !dataUpdate) {
            setValue('categoryId', dataAllCategories.data[0].id);
        }
    }, [dataAllCategories, dataUpdate, setValue]);

    const createTrackMutation = useCreateTrackByAdmin();
    const updateTrackMutation = useUpdateTrack();

    useEffect(() => {
        if (dataUpdate) {
            const currentCategory = dataAllCategories?.data?.find(c => c.name === dataUpdate.category);

            reset({
                title: dataUpdate.title,
                description: dataUpdate.description,
                categoryId: currentCategory?.id || 0
            });

            setImgPreview(`${dataUpdate.imgUrl}`);
            setTrackPreview(`${dataUpdate.trackUrl}`);
        } else {
            reset({
                title: '',
                description: '',
                categoryId: dataAllCategories?.data?.[0]?.id || 0
            });
            setImgFile(null);
            setTrackFile(null);
            setImgPreview("");
            setTrackPreview("");
        }
    }, [dataUpdate, reset]);

    useEffect(() => {
        if (!imgFile) return;
        const objectUrl = URL.createObjectURL(imgFile);
        setImgPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [imgFile]);

    useEffect(() => {
        if (!trackFile) return;
        const objectUrl = URL.createObjectURL(trackFile);
        setTrackPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [trackFile]);

    const handleClose = () => {
        setOpen(false);
        setDataUpdate(null);
    };

    const onSubmit = async (data: any) => {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('categoryId', data.categoryId.toString());

        if (imgFile) formData.append('img', imgFile);
        if (trackFile) formData.append('trackUrl', trackFile);

        if (dataUpdate) {
            formData.append('id', dataUpdate.id.toString());
            try {
                await updateTrackMutation.mutateAsync(formData);
                toast.success("Update track success");
                handleClose();
            } catch (err: any) {
                toast.error(err.message || "Update track failed");
            }
        } else {
            if (!imgFile || !trackFile) {
                toast.error("Image and Track file are required for new tracks");
                return;
            }
            try {
                await createTrackMutation.mutateAsync(formData);
                toast.success("Create track success");
                handleClose();
            } catch (err: any) {
                toast.error(err.message || "Create track failed");
            }
        }
    };

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                    {dataUpdate ? "Update Track" : "Add New Track"}
                </Typography>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Controller
                                name="title"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="Title"
                                        error={!!errors.title}
                                        helperText={errors.title?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="Description"
                                        multiline
                                        rows={3}
                                        error={!!errors.description}
                                        helperText={errors.description?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth error={!!errors.categoryId}>
                                <InputLabel>Category</InputLabel>
                                <Controller
                                    name="categoryId"
                                    control={control}
                                    render={({ field }) => (
                                        <Select {...field} label="Category">
                                            {dataAllCategories?.data?.map((item) => (
                                                <MenuItem key={item.id} value={item.id}>
                                                    {item.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    )}
                                />
                                <FormHelperText>{errors.categoryId?.message}</FormHelperText>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <Box sx={{ mb: 1, height: 100, width: 100, border: '1px dashed grey', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {imgPreview ? (
                                    <img src={imgPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <Typography variant="caption">No Image</Typography>
                                )}
                            </Box>
                            <Button variant="outlined" component="label" fullWidth size="small">
                                Upload Image
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={(e) => setImgFile(e.target.files?.[0] || null)}
                                />
                            </Button>
                        </Grid>
                        <Grid item xs={6}>
                            <Box sx={{ mb: 1, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {trackPreview ? (
                                    <audio controls src={trackPreview} style={{ width: '100%' }} />
                                ) : (
                                    <Typography variant="caption">No Audio</Typography>
                                )}
                            </Box>
                            <Button variant="outlined" component="label" fullWidth size="small">
                                Upload Track
                                <input
                                    type="file"
                                    hidden
                                    accept="audio/*"
                                    onChange={(e) => setTrackFile(e.target.files?.[0] || null)}
                                />
                            </Button>
                        </Grid>
                        <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button onClick={handleClose}>Cancel</Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={createTrackMutation.isPending || updateTrackMutation.isPending}
                            >
                                {createTrackMutation.isPending || updateTrackMutation.isPending ? "Saving..." : "Save"}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};

export default TrackModal;
