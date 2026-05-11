'use client';

import { useEffect } from 'react';
import { 
  Modal, Box, Typography, TextField, Button, Grid, 
  FormControl, InputLabel, Select, MenuItem 
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useCreatePermission, useUpdatePermission } from '@/hooks/use-permission';
import { toast } from 'react-toastify';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  apiPath: yup.string().required('API Path is required'),
  method: yup.string().required('Method is required'),
  module: yup.string().required('Module is required'),
}).required();

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    dataUpdate: IPermission | null;
    setDataUpdate: (v: IPermission | null) => void;
}

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const modules = ['USERS', 'ROLES', 'PERMISSIONS', 'TRACKS', 'CATEGORIES', 'AUTH', 'FILES'];

const PermissionModal = (props: IProps) => {
    const { open, setOpen, dataUpdate, setDataUpdate } = props;
    const createPermissionMutation = useCreatePermission();
    const updatePermissionMutation = useUpdatePermission();

    const { control, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: '',
            apiPath: '',
            method: 'GET',
            module: 'USERS'
        }
    });

    useEffect(() => {
        if (dataUpdate) {
            reset({
                name: dataUpdate.name,
                apiPath: dataUpdate.apiPath,
                method: dataUpdate.method,
                module: dataUpdate.module
            });
        } else {
            reset({
                name: '',
                apiPath: '',
                method: 'GET',
                module: 'USERS'
            });
        }
    }, [dataUpdate, reset]);

    const handleClose = () => {
        setOpen(false);
        setDataUpdate(null);
        reset();
    };

    const onSubmit = async (data: any) => {
        try {
            if (dataUpdate) {
                await updatePermissionMutation.mutateAsync({ ...data, id: dataUpdate.id });
                toast.success("Update permission success");
            } else {
                await createPermissionMutation.mutateAsync(data);
                toast.success("Create permission success");
            }
            handleClose();
        } catch (err: any) {
            toast.error(err.message || "Operation failed");
        }
    };

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: 500, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 2
            }}>
                <Typography variant="h6" mb={3}>
                    {dataUpdate ? "Update Permission" : "Add New Permission"}
                </Typography>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} fullWidth label="Permission Name" error={!!errors.name} helperText={errors.name?.message} />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Controller
                                name="apiPath"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} fullWidth label="API Path" error={!!errors.apiPath} helperText={errors.apiPath?.message} placeholder="/api/v1/..." />
                                )}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Method</InputLabel>
                                <Controller
                                    name="method"
                                    control={control}
                                    render={({ field }) => (
                                        <Select {...field} label="Method">
                                            {methods.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                        </Select>
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Module</InputLabel>
                                <Controller
                                    name="module"
                                    control={control}
                                    render={({ field }) => (
                                        <Select {...field} label="Module">
                                            {modules.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                        </Select>
                                    )}
                                />
                            </FormControl>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button type="submit" variant="contained">
                            {dataUpdate ? "Update" : "Create"}
                        </Button>
                    </Box>
                </form>
            </Box>
        </Modal>
    );
};

export default PermissionModal;
