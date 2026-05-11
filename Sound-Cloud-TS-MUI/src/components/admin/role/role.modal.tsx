'use client';

import { useEffect, useState } from 'react';
import {
    Modal, Box, Typography, TextField, Button, Grid,
    Checkbox, FormControlLabel, FormGroup, Divider, CircularProgress
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useCreateRole, useUpdateRole } from '@/hooks/use-role';
import { useAllPermissions } from '@/hooks/use-permission';
import { toast } from 'react-toastify';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  description: yup.string().required('Description is required'),
}).required();

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    dataUpdate: IRole | null;
    setDataUpdate: (v: IRole | null) => void;
}

const RoleModal = (props: IProps) => {
    const { open, setOpen, dataUpdate, setDataUpdate } = props;
    const createRoleMutation = useCreateRole();
    const updateRoleMutation = useUpdateRole();
    const { data: permissionsData, isLoading: isLoadingPermissions } = useAllPermissions();
    
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

    const allPermissionIds = permissionsData?.data?.map(p => p.id) || [];
    const isAllSelected = allPermissionIds.length > 0 && selectedPermissions.length === allPermissionIds.length;

    const { control, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: { name: '', description: '' }
    });

    useEffect(() => {
        if (dataUpdate) {
            reset({
                name: dataUpdate.name,
                description: dataUpdate.description
            });
            setSelectedPermissions(dataUpdate.permissions?.map(p => p.id) || []);
        } else {
            reset({ name: '', description: '' });
            setSelectedPermissions([]);
        }
    }, [dataUpdate, reset]);

    const handleClose = () => {
        setOpen(false);
        setDataUpdate(null);
        reset();
    };

    const handleTogglePermission = (id: number) => {
        setSelectedPermissions(prev => 
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleToggleAll = () => {
        if (isAllSelected) {
            setSelectedPermissions([]);
        } else {
            setSelectedPermissions(allPermissionIds);
        }
    };

    const onSubmit = async (data: any) => {
        try {
            const payload = {
                ...data,
                permissions: selectedPermissions.map(id => ({ id }))
            };
            if (dataUpdate) {
                await updateRoleMutation.mutateAsync({ ...payload, id: dataUpdate.id });
                toast.success("Update role success");
            } else {
                await createRoleMutation.mutateAsync(payload);
                toast.success("Create role success");
            }
            handleClose();
        } catch (err: any) {
            toast.error(err.message || "Operation failed");
        }
    };

    // Group permissions by module
    const groupedPermissions = permissionsData?.data?.reduce((acc: any, p: IPermission) => {
        if (!acc[p.module]) acc[p.module] = [];
        acc[p.module].push(p);
        return acc;
    }, {}) || {};

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: 800, maxHeight: '90vh', overflowY: 'auto', bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 2
            }}>
                <Typography variant="h6" mb={3}>
                    {dataUpdate ? "Update Role" : "Add New Role"}
                </Typography>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} fullWidth label="Role Name" error={!!errors.name} helperText={errors.name?.message} />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} fullWidth label="Description" error={!!errors.description} helperText={errors.description?.message} />
                                )}
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 1 }}>
                                <Typography variant="subtitle1" fontWeight="bold">Permissions</Typography>
                                <FormControlLabel
                                    control={
                                        <Checkbox 
                                            checked={isAllSelected} 
                                            indeterminate={selectedPermissions.length > 0 && selectedPermissions.length < allPermissionIds.length}
                                            onChange={handleToggleAll} 
                                        />
                                    }
                                    label="Select All"
                                />
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            
                            {isLoadingPermissions ? <CircularProgress /> : (
                                <Box sx={{ maxHeight: 400, overflowY: 'auto', pr: 1 }}>
                                    {Object.keys(groupedPermissions).map((module) => (
                                        <Box key={module} sx={{ mb: 3 }}>
                                            <Typography variant="subtitle2" color="primary" sx={{ mb: 1, textTransform: 'uppercase', fontWeight: 'bold' }}>
                                                {module}
                                            </Typography>
                                            <Grid container spacing={1}>
                                                {groupedPermissions[module].map((p: IPermission) => (
                                                    <Grid item xs={12} sm={6} md={4} key={p.id}>
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox 
                                                                    checked={selectedPermissions.includes(p.id)} 
                                                                    onChange={() => handleTogglePermission(p.id)} 
                                                                />
                                                            }
                                                            label={
                                                                <Box>
                                                                    <Typography variant="body2">{p.name}</Typography>
                                                                    <Typography variant="caption" color="text.secondary">{p.method} {p.apiPath}</Typography>
                                                                </Box>
                                                            }
                                                        />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                            <Divider sx={{ mt: 1, opacity: 0.5 }} />
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={createRoleMutation.isPending || updateRoleMutation.isPending}>
                            {dataUpdate ? "Update" : "Create"}
                        </Button>
                    </Box>
                </form>
            </Box>
        </Modal>
    );
};

export default RoleModal;
