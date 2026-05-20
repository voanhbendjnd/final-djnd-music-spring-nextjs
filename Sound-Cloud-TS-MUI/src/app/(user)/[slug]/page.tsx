import { sendRequest } from "@/utils/api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Metadata, ResolvingMetadata } from "next";
import { Container } from "@mui/material";
import ProfileTrackList from "@/components/profile/ProfileTrackList";
import { redirect } from "next/navigation";
import ProfileHeader from "@/components/profile/profile.header";
import ProfileTrackListPublic from "@/components/profile/profile.track.list";

type Props = { params: { slug: string } };

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const userId = params.slug.split("-")[0];
    const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/profiles/user/${userId}`,
        method: "GET",
    });
    const profile = res?.data;
    return {
        title: profile?.name ? `${profile.name} — Profile` : "User Profile",
        description: `Listen to tracks by ${profile?.name ?? "this artist"} on DJND Music`,
        openGraph: {
            title: profile?.name,
            description: `${profile?.name}'s profile`,
            images: [
                profile?.backgroundUrl ||
                "https://github.com/voanhbendjnd/sharing-host-files/blob/master/DjndMusic/images/genshin-impact-lumine-5k-8k-1920x1080-5163.jpg?raw=true",
            ],
            type: "profile",
        },
    };
}

const UserProfilePage = async ({ params }: Props) => {
    const slug = params.slug;
    const userId = slug.split("-")[0];

    if (!userId || isNaN(Number(userId))) redirect("/");

    const session = await getServerSession(authOptions);
    const isOwnProfile = Number(session?.user?.id) === Number(userId);
    console.log("owner???", isOwnProfile);

    // Parallel fetch: profile + initial tracks + follow stats
    const [profileRes, tracksRes, followingRes, followersRes] = await Promise.all([
        sendRequest<IBackendRes<any>>({
            url: `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/profiles/user/${userId}`,
            method: "GET",
            headers: {
                ...(session?.access_token && {
                    Authorization: `Bearer ${session.access_token}`,
                }),
            },
            nextOption: { cache: "no-store" },
        }),
        sendRequest<IBackendRes<IModelPaginate<ITrack>>>({
            url: `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks/users/${userId}`,
            method: "GET",
            queryParams: { page: 1, size: 5, sort: "createdAt,desc" },
            headers: {
                ...(session?.access_token && {
                    Authorization: `Bearer ${session.access_token}`,
                }),
            },
            nextOption: { next: { tags: ["track-by-profile"] } },
        }),
        sendRequest<IBackendRes<IModelPaginate<any>>>({
            url: `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/follows/followings`,
            method: "GET",
            queryParams: { page: 1, size: 1 },
            headers: {
                ...(session?.access_token && {
                    Authorization: `Bearer ${session.access_token}`,
                }),
            },
            nextOption: { cache: "no-store" },
        }),
        sendRequest<IBackendRes<IModelPaginate<any>>>({
            url: `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/follows/followers`,
            method: "GET",
            queryParams: { page: 1, size: 1 },
            headers: {
                ...(session?.access_token && {
                    Authorization: `Bearer ${session.access_token}`,
                }),
            },
            nextOption: { cache: "no-store" },
        }),
    ]);

    const profile = profileRes?.data;
    if (!profile) redirect("/");

    const initialTracks = tracksRes?.data?.result ?? [];
    const meta = tracksRes?.data?.meta;
    const initialTotal = meta?.total ?? 0;
    const initialHasMore = meta ? meta.page < meta.pages : false;

    const followStats = {
        following: followingRes?.data?.meta?.total ?? 0,
        followers: followersRes?.data?.meta?.total ?? 0,
        tracks: initialTotal,
    };

    return (
        <Container>
            <div style={{ backgroundColor: "#121212", minHeight: "100vh" }}>
                {/* Profile header — client component for editing */}
                <ProfileHeader
                    profile={profile}
                    isOwnProfile={isOwnProfile}
                    followStats={followStats}
                    userId={userId}
                />

                {/* Track list with tabs */}
                <Container maxWidth="lg" sx={{ mt: 0 }}>
                    <ProfileTrackListPublic
                        userId={userId}
                        initialTracks={initialTracks}
                        initialTotal={initialTotal}
                        initialHasMore={initialHasMore}
                    />
                </Container>
            </div>
        </Container>

    );
};

export default UserProfilePage;