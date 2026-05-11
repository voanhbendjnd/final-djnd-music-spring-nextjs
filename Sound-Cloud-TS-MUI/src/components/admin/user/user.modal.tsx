'use client';

import { useEffect } from 'react';
import { 
  Modal, Box, Typography, TextField, Button, Grid, 
  FormControl, InputLabel, Select, MenuItem, FormHelperText 
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useCreateUser, useUpdateUser } from '@/hooks/use-user';
import { useRoles } from '@/hooks/use-role';
import { toast } from 'react-toastify';

const schema = yup.object().shape({
  id: yup.number().optional(),
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().when('id', (id, schema) => {
    return id && id[0] ? schema.notRequired() : schema.required('Password is required').min(6, 'Minimum 6 characters');
  }),
  roleId: yup.number().required('Role is required'),
  status: yup.boolean().default(true),
});

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    dataUpdate: IUser | null;
    setDataUpdate: (v: IUser | null) => void;
}

const UserModal = (props: IProps) => {
    const { open, setOpen, dataUpdate, setDataUpdate } = props;
    const createUserMutation = useCreateUser();
    const updateUserMutation = useUpdateUser();
    const { data: rolesData } = useRoles({ current: 1, pageSize: 100 });

    const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            id: undefined,
            name: '',
            email: '',
            password: '',
            roleId: 0,
            status: true
        }
    });

    useEffect(() => {
        if (dataUpdate) {
            reset({
                id: dataUpdate.id,
                name: dataUpdate.name,
                email: dataUpdate.email,
                roleId: dataUpdate.role?.id,
                status: dataUpdate.status
            });
        } else {
            reset({
                id: undefined,
                name: '',
                email: '',
                password: '',
                roleId: 0,
                status: true
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
                await updateUserMutation.mutateAsync({ ...data, id: dataUpdate.id });
                toast.success("Update user success");
            } else {
                await createUserMutation.mutateAsync({
                    ...data,
                    management_password: {
                        password: data.password,
                        confirm_password: data.password
                    }
                });
                toast.success("Create user success");
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
                    {dataUpdate ? "Update User" : "Add New User"}
                </Typography>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} fullWidth label="Full Name" error={!!errors.name} helperText={errors.name?.message} />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} fullWidth label="Email" error={!!errors.email} helperText={errors.email?.message} disabled={!!dataUpdate} />
                                )}
                            />
                        </Grid>
                        {!dataUpdate && (
                            <Grid item xs={12}>
                                <Controller
                                    name="password"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} fullWidth type="password" label="Password" error={!!errors.password} helperText={errors.password?.message} />
                                    )}
                                />
                            </Grid>
                        )}
                        <Grid item xs={12}>
                            <FormControl fullWidth error={!!errors.roleId}>
                                <InputLabel>Role</InputLabel>
                                <Controller
                                    name="roleId"
                                    control={control}
                                    render={({ field }) => (
                                        <Select {...field} label="Role">
                                            {rolesData?.data?.result.map((role: any) => (
                                                <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                                            ))}
                                        </Select>
                                    )}
                                />
                                <FormHelperText>{errors.roleId?.message}</FormHelperText>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Controller
                                    name="status"
                                    control={control}
                                    render={({ field }) => (
                                        <Select {...field} label="Status" value={field.value ? "true" : "false"} onChange={(e) => field.onChange(e.target.value === "true")}>
                                            <MenuItem value="true">Active</MenuItem>
                                            <MenuItem value="false">Inactive</MenuItem>
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

export default UserModal;
