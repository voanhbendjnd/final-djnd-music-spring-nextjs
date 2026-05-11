import { List, Typography } from '@mui/material';
import TrackItem from './TrackItem';

interface IProps {
    tracks: any[];
    currentTrackId: string;
    isPlaying: boolean;
    onPlay: (track: any, index: number) => void;
    onDelete: (trackId: number) => void;
}

const TrackList = ({ tracks, currentTrackId, isPlaying, onPlay, onDelete }: IProps) => {
    if (!tracks || tracks.length === 0) {
        return (
            <div style={{ display: "flex", justifyContent: 'center', color: 'white', padding: '40px 0' }}>
                Not found track
            </div>
        );
    }

    return (
        <List sx={{ bgcolor: '#1a1a1a', borderRadius: 2 }}>
            {tracks.map((track: any, index: number) => (
                <TrackItem
                    key={track.id}
                    track={track}
                    index={index}
                    isCurrent={currentTrackId === track.id.toString()}
                    isPlaying={isPlaying}
                    onPlay={onPlay}
                    onDelete={onDelete}
                />
            ))}
        </List>
    );
};

export default TrackList;
