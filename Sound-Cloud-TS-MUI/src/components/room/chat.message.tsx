// Thêm vào đầu file, sau các imports
import dayjs from 'dayjs';
import {RoomChatMessage} from "@/hooks/use-room-socket";
import {Avatar, Box} from "@mui/material";
import Typography from "@mui/material/Typography";

// ─── Chat Message Item ────────────────────────────────────────────────────────


export default function ChatMessage({ msg, isSelf }: { msg: RoomChatMessage; isSelf: boolean }) {
    const timeStr = msg.sendAt
        ? dayjs(msg.sendAt).format('HH:mm')
        : '';

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: isSelf ? 'row-reverse' : 'row',
            alignItems: 'flex-end',
            gap: 1,
            mb: 1.5,
        }}>
            {/* Avatar */}
            <Avatar
                src={msg.senderAvatar || undefined}
                sx={{
                    width: 28,
                    height: 28,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    bgcolor: isSelf ? '#ff5500' : '#2a2a2a',
                    border: isSelf ? '1.5px solid rgba(255,85,0,0.4)' : '1.5px solid #333',
                    flexShrink: 0,
                    alignSelf: 'flex-start',
                    mt: 0.25,
                }}
            >
                {/* Fallback: chữ cái đầu */}
                {!msg.senderAvatar && msg.senderName?.charAt(0).toUpperCase()}
            </Avatar>

            {/* Bubble + meta */}
            <Box sx={{
                maxWidth: '72%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isSelf ? 'flex-end' : 'flex-start',
                gap: 0.3,
            }}>
                {/* Sender name + time */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    flexDirection: isSelf ? 'row-reverse' : 'row',
                }}>
                    <Typography sx={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: isSelf ? '#ff5500' : 'rgba(255,255,255,0.5)',
                        letterSpacing: '-0.01em',
                    }}>
                        {isSelf ? 'You' : msg.senderName}
                    </Typography>
                    {timeStr && (
                        <Typography sx={{
                            fontSize: '0.6rem',
                            color: 'rgba(255,255,255,0.2)',
                            letterSpacing: '0.01em',
                        }}>
                            {timeStr}
                        </Typography>
                    )}
                </Box>

                {/* Bubble */}
                <Box sx={{
                    bgcolor: isSelf
                        ? 'rgba(255,85,0,0.15)'
                        : 'rgba(255,255,255,0.05)',
                    border: isSelf
                        ? '1px solid rgba(255,85,0,0.25)'
                        : '1px solid rgba(255,255,255,0.07)',
                    px: 1.5,
                    py: 0.85,
                    borderRadius: isSelf
                        ? '12px 4px 12px 12px'
                        : '4px 12px 12px 12px',
                    wordBreak: 'break-word',
                }}>
                    <Typography sx={{
                        fontSize: '0.83rem',
                        color: isSelf ? '#fff' : 'rgba(255,255,255,0.85)',
                        lineHeight: 1.45,
                    }}>
                        {msg.content}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}

