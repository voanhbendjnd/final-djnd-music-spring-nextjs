import slugify from "slugify";

const slugOptions = {
    lower: true,
    strict: true,
    locale: "vi"
};

export const generateTrackUrl = (track: ITrack) =>
    `/track/${track.id}-${slugify(track.title || "track", slugOptions)}`;


export const generateProfileUrl = (name:string, id:string)=>{
    return (
        `/profile/${id}-${slugify(name || "noname", slugOptions)}`
    )
}

export const generatePlaylistUrl = (title:string, id:string)=>{
    return (
        `/playlist/${id}-${slugify(title || "Playlist title", slugOptions)}`
    )
}

export const generateTrackUrlUp = (id: number, title:string) =>
    `/track/${id}-${slugify(title || "track", slugOptions)}`;
export const generateRoomUrl = (id:string, name:string) =>
    `/track/${id}-${slugify(name || "room", slugOptions)}`;
