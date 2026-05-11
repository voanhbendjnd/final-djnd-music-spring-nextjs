import { Container } from '@mui/material';
import CommentTable from "@/components/admin/comment/comment.table";

export const metadata = {
    title: 'Comment Management | SoundCloud',
};

const ManageCommentPage = () => {
    return (
        <div style={{ paddingTop: 10,  marginBottom: 100 }}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <CommentTable />
            </Container>
        </div>
    );
};

export default ManageCommentPage;
