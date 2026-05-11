// import WaveTrackClient from '@/components/track/wave.track.client';
import { Container } from "@mui/material";
import { sendRequest } from "@/utils/api";
import CommentSection from "@/components/track/comment.section";
import { redirect } from "next/navigation";
import type { Metadata, ResolvingMetadata } from 'next'
import WaveTrack from "@/components/track/wave.track";
import {getServerSession} from "next-auth";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";

type Props = {
    params: { slug: string }
    searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    // const safeSlug = encodeURIComponent(params.slug);
    // const audioDecoded = searchParams.audio;
    const id = params.slug.split('-')[0];
    // const audioOriginal = encodeURIComponent(String(audioDecoded));
    const res = await sendRequest<IBackendRes<ITrack>>({
        url: `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks/${id}`,
        method: 'GET',
    })
    const track = res?.data as ITrack;

    return {
        title: track?.title || "Track Detail",
        description: `Listening to ${track?.title}`,
        openGraph: {
            title: track?.title,
            description: track?.description,
            type: 'website',
            images: [`https://github.com/voanhbendjnd/sharing-host-files/blob/master/DjndMusic/images/genshin-impact-lumine-5k-8k-1920x1080-5163.jpg?raw=true`],
        }
    }
}
const DetailTrackPage = async ({ params, searchParams }: {
    params: { slug: string },
    searchParams: { audio?: string, id?: string }
}) => {
    const slug = params?.slug;
    // const fileName = searchParams.audio;
    // const trackIdLast = searchParams.id;
    const id =Number( slug.split('-')[0]);
    // const trackId = Number(slug);
    if (isNaN(id)) {
        redirect('/');
    }
    const resComments = await sendRequest<IBackendRes<IModelPaginate<IComment>>>({
        url: `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks/comments`,
        method: "GET",
        queryParams: {
            page: 1,
            size: 20,
            trackId: id,
            sort: "updatedAt,desc"
        },
        nextOption: {
            cache: 'no-store'
        },

    })
    const session = await getServerSession(authOptions);
    const resDataTrack = await sendRequest<IBackendRes<ITrack>>({
        url: `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks/${id}`,
        method: "GET",
        headers: {
            ...(session?.access_token && {
                Authorization: `Bearer ${session.access_token}`
            }),
        },
        // nextOption: {
        //     next: { tags: ['track-by-profile'] }
        // },
    });
    const track = resDataTrack.data as ITrack;


    // const resDataUploader = await sendRequest<IBackendRes<ITrack>>({
    //     url: `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks/uploader`,
    //     method: "GET",
    //     queryParams: {
    //         trackId: trackId,
    //         lastId: trackIdLast,
    //         trackUrl: fileName,
    //
    //     },
    //     nextOption: {
    //         cache: 'no-store'
    //     },
    //
    // })
    // const uploaderData = resDataUploader?.data as ITrack;

    // if (resDataTrack === undefined) {
    //     redirect('/');
    //
    // }
    // const originalTrackUrl = `https://res.cloudinary.com/dddppjhly/video/upload/${uploaderData.trackUrl}`;
    //
    //
    if (!resDataTrack || (resDataTrack as any).statusCode >= 400) {
        redirect('/');
    }

    // const userUploader = resDataUploader.data as IUploader | undefined;
    const comments = resComments.data?.result ?? [];
    return (
        <div style={{ backgroundColor: '#121212', minHeight: '100vh' }}>
            <div style={{ background: '#121212' }}>
                <Container>
                    <WaveTrack comments={comments}
                        track={track}
                    />
                </Container>
            </div>

            <Container sx={{ mt: 3 }}>
                <CommentSection
                    uploader={track}
                    comments={comments}
                    trackId={String(id)}
                />
            </Container>
        </div>


    )
}

export default DetailTrackPage;