import PermissionTable from '@/components/admin/permission/permission.table';
import { Container } from '@mui/material';

export const metadata = {
    title: 'Permission Management | SoundCloud',
};

const ManagePermissionPage = () => {
    return (
        <div style={{  paddingTop: 10, marginBottom: 100 }}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <PermissionTable />
            </Container>
        </div>
    );
};

export default ManagePermissionPage;
