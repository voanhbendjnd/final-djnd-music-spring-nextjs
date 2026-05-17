import { sendRequest } from "@/utils/api";
import ProfileTrackList from "@/components/profile/ProfileTrackList";
import {Container} from "@mui/material";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";
import {Metadata} from "next";
export const metadata:Metadata ={
    title:'My tracks',
    description:'My track page'
}
const ProfilePage = async ({ params }: { params: { slug: string } }) => {
    const slug = params.slug;
    const userId =slug.split('-')[0]
    // Fetch initial tracks server-side
    const session = await getServerSession(authOptions);

    const res = await sendRequest<IBackendRes<IModelPaginate<ITrack>>>({
        url: `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks/users/${userId}`,
        method: "GET",
        queryParams: {
            page: 1,
            size: 5,
            sort: "createdAt,desc"
        },
        headers: {
            // Chỉ gửi nếu có session
            ...(session?.access_token && {
                Authorization: `Bearer ${session.access_token}`
            }),
        },
        nextOption: {
            next: { tags: ['track-by-profile'] }
        },
    });

    const initialTracks = res?.data?.result ?? [];
    const meta = res?.data?.meta;
    const initialTotal = meta?.total ?? 0;
    const initialHasMore = meta ? meta.page < meta.pages : false;

    return (
        <div style={{backgroundColor:'#121212'}}>
            <Container>
                <ProfileTrackList
                    userId={userId}
                    initialTracks={initialTracks}
                    initialTotal={initialTotal}
                    initialHasMore={initialHasMore}
                />
            </Container>
        </div>


    )
}

export default ProfilePage;