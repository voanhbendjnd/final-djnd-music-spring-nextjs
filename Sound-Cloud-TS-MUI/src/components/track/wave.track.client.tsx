// 'use client'
//
// import WaveTrack from './wave.track';
// import TrackLikedProvider from './track-liked-provider';
//
// interface WaveTrackClientProps {
//     comments: IComment[];
// }
//
// export default function WaveTrackClient({ comments }: WaveTrackClientProps) {
//     return (
//         <TrackLikedProvider trackId={Number(window.location.pathname.split('/')[2])}>
//             {(isLiked) => (
//                 <WaveTrack
//                     comments={comments}
//                 />
//             )}
//         </TrackLikedProvider>
//     );
// }
