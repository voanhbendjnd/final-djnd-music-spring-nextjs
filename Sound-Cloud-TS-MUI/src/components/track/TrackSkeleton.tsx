import { Box, Skeleton } from "@mui/material";

const TrackSkeleton = () => {
    return (
        <Box sx={{ display: 'flex', mb: 4, pt: 2, pb: 2, borderBottom: '1px solid #333' }}>
            {/* Left Image Skeleton */}
            <Box sx={{ width: 160, height: 160, mr: 2, flexShrink: 0 }}>
                <Skeleton 
                    variant="rectangular" 
                    width="100%" 
                    height="100%" 
                    sx={{ bgcolor: '#333' }}
                />
            </Box>

            {/* Right Content Skeleton */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {/* Play Button Skeleton */}
                        <Skeleton 
                            variant="circular" 
                            width={50} 
                            height={50} 
                            sx={{ mr: 2, bgcolor: '#333' }}
                        />
                        {/* Info Skeleton */}
                        <Box>
                            <Skeleton 
                                variant="text" 
                                width={120} 
                                height={20} 
                                sx={{ bgcolor: '#333', mb: 0.5 }}
                            />
                            <Skeleton 
                                variant="text" 
                                width={200} 
                                height={28} 
                                sx={{ bgcolor: '#333' }}
                            />
                        </Box>
                    </Box>
                    {/* Time Ago Skeleton */}
                    <Skeleton 
                        variant="text" 
                        width={60} 
                        height={20} 
                        sx={{ bgcolor: '#333' }}
                    />
                </Box>

                {/* Waveform Skeleton */}
                <Box sx={{ position: 'relative', flexGrow: 1, my: 1, minHeight: 60 }}>
                    <Skeleton 
                        variant="rectangular" 
                        width="100%" 
                        height={60} 
                        sx={{ bgcolor: '#333' }}
                    />
                </Box>

                {/* Actions Skeleton */}
                <Box sx={{ display: 'flex', gap: 1, pt: 1 }}>
                    <Skeleton variant="rounded" width={80} height={32} sx={{ bgcolor: '#333' }} />
                    <Skeleton variant="rounded" width={80} height={32} sx={{ bgcolor: '#333' }} />
                    <Skeleton variant="rounded" width={80} height={32} sx={{ bgcolor: '#333' }} />
                    <Skeleton variant="rounded" width={80} height={32} sx={{ bgcolor: '#333' }} />
                    <Skeleton variant="rounded" width={40} height={32} sx={{ bgcolor: '#333' }} />
                </Box>
            </Box>
        </Box>
    );
};

export default TrackSkeleton;
