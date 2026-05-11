'use client'
import {Container} from "@mui/material";
import UploadPage from "@/app/(user)/track/upload/page";
import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import FirstTabs from "@/components/track/steps/first.tab";
import SecondTabs from "@/components/track/steps/second.tab";
import {Info, MusicNote} from "@mui/icons-material";
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}
function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

const UploadTabs = () => {
    const [value, setValue] = React.useState(0);
    const [trackAudio, setTrackAudio] = React.useState<File | null>(null);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <Box
            sx={{
                width: '100%',
                mt: 5,
                mb: 10,
                borderRadius: '24px',
                overflow: 'hidden',
                background:
                    'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
                border: '1px solid #2a2a2a',
                boxShadow: '0 10px 40px rgba(0,0,0,0.45)',
            }}
        >
            {/* HEADER */}
            <Box
                sx={{
                    px: { xs: 2, md: 4 },
                    pt: { xs: 3, md: 4 },
                    pb: 2,
                }}
            >
                <Box
                    sx={{
                        color: '#fff',
                        fontSize: {
                            xs: '1.5rem',
                            md: '2rem',
                        },
                        fontWeight: 800,
                        mb: 1,
                    }}
                >
                    Upload Track
                </Box>

                <Box
                    sx={{
                        color: '#888',
                        fontSize: '0.95rem',
                    }}
                >
                    Upload your music and share it with everyone.
                </Box>
            </Box>

            {/* TABS */}
            <Box
                sx={{
                    px: { xs: 1, md: 3 },
                    borderBottom: '1px solid #222',
                }}
            >
                <Tabs
                    value={value}
                    onChange={handleChange}
                    variant="fullWidth"
                    TabIndicatorProps={{
                        style: {
                            backgroundColor: '#ff5500',
                            height: 3,
                            borderRadius: 999,
                        },
                    }}
                    sx={{
                        '& .MuiTabs-flexContainer': {
                            gap: 1,
                        },
                    }}
                >
                    <Tab
                        icon={<MusicNote />}
                        iconPosition="start"
                        label="Tracks"
                        {...a11yProps(0)}
                        disabled={value !== 0}
                        sx={{
                            color: '#999',
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            minHeight: 64,
                            borderRadius: '14px 14px 0 0',

                            '&.Mui-selected': {
                                color: '#fff',
                                background: '#1c1c1c',
                            },

                            '&.Mui-disabled': {
                                color: '#666',
                            },
                        }}
                    />

                    <Tab
                        icon={<Info />}
                        iconPosition="start"
                        label="Basic Information"
                        {...a11yProps(1)}
                        disabled={value !== 1}
                        sx={{
                            color: '#999',
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            minHeight: 64,
                            borderRadius: '14px 14px 0 0',

                            '&.Mui-selected': {
                                color: '#fff',
                                background: '#1c1c1c',
                            },

                            '&.Mui-disabled': {
                                color: '#666',
                            },
                        }}
                    />
                </Tabs>
            </Box>

            {/* CONTENT */}
            <Box
                sx={{
                    minHeight: 450,
                    background: '#121212',
                }}
            >
                <CustomTabPanel value={value} index={0}>
                    <FirstTabs
                        setValue={setValue}
                        setTrackAudio={setTrackAudio}
                        trackAudio={trackAudio}
                    />
                </CustomTabPanel>

                <CustomTabPanel value={value} index={1}>
                    <SecondTabs
                        setValue={setValue}
                        trackAudio={trackAudio}
                        setTrackAudio={setTrackAudio}
                    />
                </CustomTabPanel>
            </Box>
        </Box>
    );
}
export default UploadTabs;