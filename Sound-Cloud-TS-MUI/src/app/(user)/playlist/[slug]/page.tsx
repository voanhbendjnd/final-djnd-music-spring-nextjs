import { Container, Typography, Box } from '@mui/material';
import { sendRequest } from '@/utils/api';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import PlaylistDetailClient from '@/components/playlist/PlaylistDetailClient';
import type {Metadata, ResolvingMetadata} from "next";
import {redirect} from "next/navigation";

interface IProps {
    params: {
        slug: string;
    }
}


type Props = {
    params: { slug: string }
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    // const session = await getServerSession(authOptions);
    const playlistId = params.slug.split('-')[0];

    const res = await sendRequest<IBackendRes<IPlaylist>>({
        url: `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/playlists/public/${playlistId}`,
        method: "GET",
        // headers: {
        //     ...(session?.access_token && {
        //         Authorization: `Bearer ${session.access_token}`
        //     }),
        // },
        // nextOption: {
        //     cache: 'no-store'
        // }
    });
    const playlist = res?.data as IPlaylist;
    if(!res || (res as any).statusCode >= 400){
        redirect('/')
    }
    // if(!playlist.isPublic) {
    //
    // }
    return {
        title:('Playlist' + ' ' + playlist.isPublic ? playlist.user?.name + '-' +playlist?.title : 'Private playlist') + ' | DJND Music',
        description:playlist.isPublic ?  `Enjoy with ${playlist?.title}` : 'Private playlist',
        openGraph: {
            title: playlist.isPublic ? playlist?.title : 'Private playlist',
            description:playlist.isPublic ? playlist.description :'Private playlist',
            type: 'website',
            images: [`https://github.com/voanhbendjnd/sharing-host-files/blob/master/DjndMusic/images/genshin-impact-lumine-5k-8k-1920x1080-5163.jpg?raw=true`],
        }
    }
}
const PlaylistDetailPage = async ({ params }: IProps) => {
    const { slug } = params;
    const playlistId = parseInt(slug.split('-')[0]);
    if (isNaN(playlistId)) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: '#121212', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: '#666' }}>Invalid Playlist ID</Typography>
            </Box>
        );
    }

    const session = await getServerSession(authOptions);
    const res = await sendRequest<IBackendRes<IPlaylist>>({
        url: `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/playlists/${playlistId}`,
        method: "GET",
        headers: {
            ...(session?.access_token && {
                Authorization: `Bearer ${session.access_token}`
            }),
        },
        // nextOption: {
        //     next: { tags: ['track-by-playlist'] }
        // },
        nextOption: {
            cache: 'no-store'
        }
    });

    const playlist = res?.data as IPlaylist;
    // if (!res || (res as any).statusCode >= 400) {
    //     redirect('/');
    // }

    if (!playlist || (res as any).statusCode >= 400) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: '#121212', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: '#666' }}>Playlist not found</Typography>
            </Box>
        );
    }

    return (
        <PlaylistDetailClient 
            playlist={playlist} 
            playlistId={playlistId} 
        />
    );
};

export default PlaylistDetailPage;
