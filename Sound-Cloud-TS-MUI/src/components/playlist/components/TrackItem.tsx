import { ListItem, ListItemAvatar, Avatar, ListItemText, Box, Typography, IconButton } from '@mui/material';
import { Delete } from '@mui/icons-material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

interface IProps {
    track: any;
    index: number;
    isCurrent: boolean;
    isPlaying: boolean;
    onPlay: (track: any, index: number) => void;
    onDelete: (trackId: number) => void;
}

const TrackItem = ({ track, index, isCurrent, isPlaying, onPlay, onDelete }: IProps) => {
    return (
        <ListItem
            sx={{
                borderBottom: '1px solid #333',
                cursor: 'pointer',
                '&:hover': { bgcolor: '#2a2a2a' },
                bgcolor: isCurrent ? '#2a2a2a' : 'transparent'
            }}
            onClick={() => onPlay(track, index)}
        >
            <ListItemAvatar>
                <Avatar
                    src={track.imgUrl}
                    sx={{ width: 48, height: 48, bgcolor: '#333' }}
                >
                    {track.imgUrl ? '' : track.title.charAt(0)}
                </Avatar>
            </ListItemAvatar>
            <ListItemText
                primary={
                    <Typography sx={{ color: '#fff', fontWeight: isCurrent ? 600 : 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow:' ellipsis'
                    }}>
                        {track.title}
                    </Typography>
                }
                secondary={
                    <Typography sx={{ color: '#999', fontSize: '0.875rem' }}>
                        {track.uploader?.name || 'Unknown'}
                    </Typography>
                }
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ color: '#666', fontSize: '0.875rem',    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow:' ellipsis' }}>
                    {track.countPlays || 0} plays
                </Typography>
                
                <IconButton 
                    size="small"
                    sx={{ color: '#fff', '&:hover': { color: '#f44336' } }} 
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent playing track when clicking delete
                        onDelete(track.id);
                    }}
                >
                    <Delete fontSize="small" />
                </IconButton>

                <IconButton 
                    sx={{ color: '#f50' }} 
                    onClick={(e) => {
                        e.stopPropagation();
                        onPlay(track, index);
                    }}
                >
                    {isCurrent && isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
            </Box>
        </ListItem>
    );
};

export default TrackItem;
