'use client';

import { useEffect } from 'react';
import { 
  Modal, Box, Typography, TextField, Button, Grid
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCreateCategory, useUpdateCategory } from '@/hooks/use-category';
import { toast } from 'react-toastify';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const schema = yup.object({
  name: yup.string().required('Name is required'),
  description: yup.string().required('Description is required'),
}).required();

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    dataUpdate: ICategory | null;
    setDataUpdate: (v: ICategory | null) => void;
}

const CategoryModal = (props: IProps) => {
    const { open, setOpen, dataUpdate, setDataUpdate } = props;

    const { control, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: '',
            description: '',
        }
    });

    const createMutation = useCreateCategory();
    const updateMutation = useUpdateCategory();

    useEffect(() => {
        if (dataUpdate) {
            reset({
                name: dataUpdate.name,
                description: dataUpdate.description,
            });
        } else {
            reset({
                name: '',
                description: '',
            });
        }
    }, [dataUpdate, reset]);

    const handleClose = () => {
        setOpen(false);
        setDataUpdate(null);
    };

    const onSubmit = async (data: any) => {
        if (dataUpdate) {
            try {
                await updateMutation.mutateAsync({ id: dataUpdate.id, ...data });
                toast.success("Update category success");
                handleClose();
            } catch (err: any) {
                toast.error(err.message || "Update category failed");
            }
        } else {
            try {
                await createMutation.mutateAsync(data);
                toast.success("Create category success");
                handleClose();
            } catch (err: any) {
                toast.error(err.message || "Create category failed");
            }
        }
    };

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                    {dataUpdate ? "Update Category" : "Add New Category"}
                </Typography>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="Name"
                                        error={!!errors.name}
                                        helperText={errors.name?.message}
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
                        <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button onClick={handleClose}>Cancel</Button>
                            <Button 
                                type="submit" 
                                variant="contained" 
                                disabled={createMutation.isPending || updateMutation.isPending}
                            >
                                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};

export default CategoryModal;
