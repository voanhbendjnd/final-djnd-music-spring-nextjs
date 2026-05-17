'use client'

import { useState, useRef } from 'react';
import WaveTrack from '@/components/track/wave.track';
import CommentSection from '@/components/track/comment.section';
import { Container } from '@mui/material';
import { useSession } from 'next-auth/react';

interface IProps {
    track: ITrack;
    comments: IComment[];
}

export default function TrackDetailClient({ track, comments }: IProps) {
    const { data: session } = useSession();

    // ✅ State cho preview comment trên waveform
    const [previewMoment, setPreviewMoment] = useState<number | null>(null);
    const [isInputFocused, setIsInputFocused] = useState(false);

    const previewUser = session?.user ? {
        name: session.user.name || 'You',
        avatar: session.user.avatar,
    } : null;

    return (
        <div style={{ backgroundColor: '#121212', minHeight: '100vh' }}>
            <div style={{ background: '#121212' }}>
                <Container>
                    <WaveTrack
                        comments={comments}
                        track={track}
                        // ✅ Truyền preview state xuống
                        previewMoment={isInputFocused ? previewMoment : null}
                        previewUser={isInputFocused ? previewUser : null}
                    />
                </Container>
            </div>

            <Container sx={{ mt: 3 }}>
                <CommentSection
                    uploader={track}
                    comments={comments}
                    trackId={String(track.id)}
                    // ✅ Callbacks để sync preview
                    onInputFocus={(momentAtFocus) => {
                        setPreviewMoment(momentAtFocus);
                        setIsInputFocused(true);
                    }}
                    onInputBlur={() => {
                        setIsInputFocused(false);
                    }}
                    onCommentPosted={() => {
                        setPreviewMoment(null);
                        setIsInputFocused(false);
                    }}
                />
            </Container>
        </div>
    );
}