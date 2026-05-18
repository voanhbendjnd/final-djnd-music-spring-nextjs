import {FollowState} from "@/lib/track.wrapper";

export { };
declare global{
    interface IRequest{
        url: string;
        method: string,
        body?: { [key: string]: any };
        queryParams?: any;
        useCredentials?: boolean;
        headers?: any;
        nextOption?: any;
    }
    interface IBackendRes<T>{
        error?: string | string[];
        message: string;
        statusCode: number | string;
        data?: T;
    }
    interface IModelPaginate<T>{
        meta: {
            page: number;
            pageSize: number;
            pages: number;
            total: number;
        },
        result: T[]
    }

    interface ILoginRes {
        access_token: string;
        refresh_token: string;
        expires_in: number;
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
            avatar: string;
            type:string;
            username: string;
        }
    }
    interface ITrack{
        "id": string;
        "title": string;
        "description": string;
        "category": string;
        "imgUrl": string;
        "trackUrl": string;
        "peaks": string;
        "countLike": number;
        "countPlay": number;
        "isLiked": boolean;
        "waveform_url": string;
        "uploader": {
            "id": string;
            "name": string;
            "avatar":string;
            "countFollowers":number;
            "isFollowed": boolean;
        }
        "createdAt": string;
        "updatedAt": string;
        "isPlaying": boolean;
    }
    interface IUser {
        id: number;
        name: string;
        email: string;
        role: {
            id: number;
            name: string;
        };
        type: string;
        avatar: string;
        status: boolean;
        username: string;
    }
    interface IRole {
        id: number;
        name: string;
        description: string;
        permissions: IPermission[];
    }
    interface IPermission {
        id: number;
        name: string;
        apiPath: string;
        method: string;
        module: string;
    }
    interface ICategory {
        id: number;
        name: string;
        description: string;
    }
    interface IComment {
        id: number;
        createdAt: string;
        updatedAt: string;
        createdBy: string;
        updatedBy: string;
        track_title: string;
        user_email: string;
        likes_count: number;
        content: string;
        moment: number;
        user:{
            id: number;
            role:string;
            avatar:string;
            name:string;
            email:string;
            type:string;
        }
        track:{
            id: number;
            imgUrl:string;
            title:string;
        }
    }
    interface ICreateUser{
        id:number;
        name:string;
        roleId:number;
        email:string;
        status:string;
        management_password:{
            password:string;
            confirm_password:string;
        }
    }
    interface ITrackContext{
        followedUploaders: Record<string, FollowState>;

        toggleFollowUploader: (
            uploaderId: string,
            isFollowed: boolean,
            countFollowers?: number
        ) => void;
        // followedUploaders: Record<string, boolean>;
        // toggleFollowUploader: (uploaderId: string, isFollowed: boolean) => void;
        currentTrack: IShareTrack;
        setCurrentTrack: (track: IShareTrack) => void;
        audioRef: React.MutableRefObject<HTMLAudioElement | null>;
        savedTimes: React.MutableRefObject<Record<string, number>>;
        viewedTracks: Set<string>;
        markTrackAsViewed: (trackId: string) => void;
        currentPlaylist: IPlaylist | null;
        setCurrentPlaylist: (playlist: IPlaylist | null) => void;
        playlistTracks: any[];
        setPlaylistTracks: (tracks: any[]) => void;
        currentTrackIndex: number;
        setCurrentTrackIndex: (index: number) => void;
        playNextTrack: () => void;
        playPreviousTrack: () => void;

        // New playback states
        isShuffle: boolean;
        setIsShuffle: (val: boolean) => void;
        repeatMode: 'none' | 'one' | 'all';
        setRepeatMode: (mode: 'none' | 'one' | 'all') => void;
        playMode: 'queue' | 'dynamic';
        setPlayMode: (mode: 'queue' | 'dynamic') => void;
        queueType?: 'history' | 'playlist' | 'profile' | 'likes' | 'search' | 'trending';
        setQueueType: (type: any) => void;

        shuffledIndexes: number[];
        playedTrackIds: Set<string>;
        addToPlayedTracks: (trackId: string) => void;
    }
    interface IShareTrack extends ITrack{
        isPlaying: boolean;
        isYoutube?: boolean;
    }

    interface IUploader{
        avatar: string;
        name:string;
        id:string;
    }
    interface ISearchResult{
        name: string;
        id: number;
        title: string;
        imgUrl: string;
        trackUrl:string;
    }
    interface IYoutubeSearchResult {
        videoId: string;
        title: string;
        thumbnail: string;
        channel: string;
        duration: number;
    }
    export interface ITrackResponseWrapper {
        meta: {
            total: number;
            page: number;
            pageSize: number;
            pages: number;
        };
        result: ITrack[];
    }
    interface IFallbackHome<T> {
        type: 'local' | 'youtube' | 'empty';
        data: ITrackResponseWrapper[];
    }

    interface ISearchFallbackResponse<T> {
        type: 'local' | 'youtube' | 'empty';
        data: IModelPaginate<ITrack>;
    }
    interface IPlaylist{
        id: number;
        title: string;
        description: string;
        imgUrl: string;
        totalTracks: number;
        isPublic: boolean;
        createdAt: string;
        updatedAt: string;
        createdBy: string;
        userId:string;
        user: {
            id: number;
            name: string;
            avatar: string;
        }
        playlistTracks: IPlaylistTrack[];

        // Long id;
        // String title;
        // Long countPlays;
        // Integer countLikes;
        // String trackUrl;
        // String imgUrl;
        // Uploader uploader;
        //
        // @Getter
        // @Setter
        // public static class Uploader {
        // Long id;
        // String avatar;
        // String role;
        // String name;

    }
    interface IPlaylistTrack{
        id: number;
        title:string;
        countPlays: number;
        countLikes: number;
        trackUrl:string;
        imgUrl:string;
        uploader:IUploader
    }
    interface IUploader{
        id: number;
        avatar: string;
        role:string;
        name:string;
    }
    interface IPlaylistWithTracks{
        id: number;
        title: string;
        totalTracks: number;
        trackIds: number[];
        imgUrl?: string;
        isPublic:boolean;

    }
    interface IAddToPlaylistDTO{
        playlistId: number;
        isAdded: boolean;
    }
    interface ICreatePlaylistDTO{
        title: string;
        description?: string;
        isPublic?: boolean;
        trackIds?: number[];
        imgUrl?: string;
    }

    interface IRoomMeta {
        id: number;
        name: string;
        code: string;           // ← mã phòng 6 ký tự, dùng để tìm kiếm / share
        isPublic: boolean;
        isActive: boolean;
        hostUserId: number;
        hostUserName: string;
        maxListeners: number;
        createdAt: string;
        listenerCount:number;
    }
}