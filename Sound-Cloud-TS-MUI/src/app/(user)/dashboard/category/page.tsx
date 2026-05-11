import CategoryTable from '@/components/admin/category/category.table';
import { Container } from '@mui/material';

export const metadata = {
    title: 'Category Management | SoundCloud',
    description: 'Manage genres and track categories.',
};

const ManageCategoryPage = () => {
    return (
        <div style={{ paddingTop: 10,  marginBottom: 100 }}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <CategoryTable />
            </Container>
        </div>
    );
};

export default ManageCategoryPage;
