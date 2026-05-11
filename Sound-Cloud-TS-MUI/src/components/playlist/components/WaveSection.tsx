import WaveTrack from '@/components/track/wave.track';

interface IProps {
    track: ITrack | null;
}

const WaveSection = ({ track }: IProps) => {
    // Only render waveform when a track is actively playing (UX improvement)
    if (!track?.id || !track.isPlaying) {
        return null;
    }

    return (
        <WaveTrack
            track={track}
            comments={[]}
            isLiked={track.isLiked}
        />
    );
};

export default WaveSection;
