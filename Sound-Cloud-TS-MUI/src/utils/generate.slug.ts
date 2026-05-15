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
export function generateRoomUrl(id: string, name: string): string {
    const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // bỏ dấu tiếng Việt
        .replace(/[^a-z0-9\s-]/g, '')    // chỉ giữ chữ số và dấu gạch
        .trim()
        .replace(/\s+/g, '-');           // space → gạch ngang

    return `/rooms/${id}-${slug}`;
}