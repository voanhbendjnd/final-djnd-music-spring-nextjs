'use client'

import { Container } from "@mui/material";
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import * as React from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { useAllCategories } from "@/hooks/use-category";
import { useCreateTrack, useUploadTempTrack } from '@/hooks/use-track';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import {sendRequest} from "@/utils/api";

function LinearProgressWithLabel(props: LinearProgressProps & { value: number }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress variant="determinate" {...props} />
            </Box>
            <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" sx={{color:'white'}} color="text.secondary">{`${Math.round(
                    props.value,
                )}%`}</Typography>
            </Box>
        </Box>
    );
}

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

interface IProps {
    trackAudio: File | null;
    setValue: (v: number) => void;
    setTrackAudio: (v: File | null) => void;
}

const SecondTabs = (props: IProps) => {
    const { trackAudio, setValue, setTrackAudio } = props;
    const { data: dataAllCategories } = useAllCategories();
    const router = useRouter();

    const [title, setTitle] = React.useState(trackAudio ? trackAudio.name.replace(/\.[^/.]+$/, "") : '');
    const [description, setDescription] = React.useState('');
    const [category, setCategory] = React.useState('');
    const [imgFile, setImgFile] = React.useState<File | null>(null);
    const [imgPreview, setImgPreview] = React.useState('');
    const [progress, setProgress] = React.useState(0);
    const [uploadedFileName, setUploadedFileName] = React.useState('');

    const { mutate: createTrack, isPending: isCreatePending } = useCreateTrack();

    const { mutate: uploadTempTrack, isPending: isUploadPending } = useUploadTempTrack((progressEvent) => {
        if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
        }
    });

    React.useEffect(() => {
        if (trackAudio && !title) {
            setTitle(trackAudio.name.replace(/\.[^/.]+$/, ""));
        }
    }, [trackAudio]);

    // Automatically upload the temp track when component loads
    React.useEffect(() => {
        if (trackAudio && !uploadedFileName && progress === 0) {
            const formData = new FormData();
            formData.append('track', trackAudio);
            uploadTempTrack(formData, {
                onSuccess: (res: any) => {
                    const filename = res?.data ?? res;
                    if (typeof filename === 'string') {
                        setUploadedFileName(filename);
                    }
                },
                onError: () => {
                    toast.error('Có lỗi xảy ra khi upload audio');
                    setProgress(0);
                }
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trackAudio]);

    const categoryOptions = dataAllCategories?.data?.map((item) => {
        return {
            value: item.id.toString(),
            label: item.name,
        };
    }) || [];

    const handleImgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImgFile(file);
            setImgPreview(URL.createObjectURL(file));
        }
    }

    const handleSave = () => {
        if (!trackAudio || !title || !category || !imgFile) {
            toast.error("Please input full information for this track!");
            return;
        }

        if (progress < 100 || !uploadedFileName) {
            toast.error("Please waiting upload file success!");
            return;
        }

        const formData = new FormData();
        formData.append('trackUrl', uploadedFileName);
        formData.append('img', imgFile);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('categoryId', category);

        createTrack(formData, {
            onSuccess: async () => {
                toast.dark('Upload new track success!');
                setTrackAudio(null);
                setValue(0);
                setProgress(0);
                setUploadedFileName('');
                setImgFile(null);
                setImgPreview('');
                setTitle('');
                setDescription('');
                setCategory('');
                try {
                    await sendRequest({
                        url: `/api/revalidate`,
                        method: 'POST',
                        queryParams: {
                            tag: "track-by-profile",
                            secret: "16180339887" // Lưu ý: Nên dùng biến môi trường ở đây
                        }
                    });

                    // QUAN TRỌNG: Làm mới dữ liệu tại Client sau khi xóa cache server
                    router.refresh();

                    // Nếu muốn chuyển trang thì mở comment dòng này
                    // router.push('/dashboard/track');
                } catch (error) {
                    console.error("Revalidate failed", error);
                }
                // router.push('/dashboard/track');
            },
            onError: () => {
                toast.error('Upload failed, try again!');
            }
        });
    };
    const inputStyle = {
        "& .MuiInputLabel-root": {
            color: "#aaa",
        },
        "& .MuiInputLabel-root.Mui-focused": {
            color: "#ff5500",
        },
        "& .MuiInputBase-input": {
            color: "#fff",
        },
        "& .MuiInput-underline:before": {
            borderBottomColor: "#444",
        },
        "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
            borderBottomColor: "#777",
        },
        "& .MuiInput-underline:after": {
            borderBottomColor: "#ff5500",
        },
    };
    return (
        <div>
            {/*<div>*/}
            {/*    <div style={{color:'white'}}>*/}
            {/*        Uploading track: <strong>{trackAudio ? trackAudio.name : "None"}</strong>*/}
            {/*    </div>*/}
            {/*    {progress > 0 && <LinearProgressWithLabel value={progress} />}*/}
            {/*</div>*/}

            <Grid container spacing={3} mt={2}>
                {/* LEFT SIDE */}
                <Grid
                    item
                    xs={12}
                    md={4}
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        flexDirection: "column",
                        gap: "16px",
                    }}
                >
                    <Box
                        sx={{
                            height: { xs: 220, sm: 260, md: 300 },
                            width: "100%",
                            maxWidth: 300,
                            background: "#1e1e1e",
                            border: "1px solid #333",
                            borderRadius: "16px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            overflow: "hidden",
                        }}
                    >
                        {imgPreview ? (
                            <img
                                src={imgPreview}
                                alt="Preview"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        ) : (
                            <Typography sx={{ color: "#777" }}>
                                No Image
                            </Typography>
                        )}
                    </Box>

                    <Button
                        component="label"
                        variant="contained"
                        startIcon={<CloudUploadIcon />}
                        sx={{
                            background: "#ff5500",
                            borderRadius: "999px",
                            px: 3,
                            py: 1,
                            textTransform: "none",
                            fontWeight: 600,
                            '&:hover': {
                                background: "#ff6a1a",
                            }
                        }}
                    >
                        Upload Image
                        <VisuallyHiddenInput
                            type="file"
                            accept="image/*"
                            onChange={handleImgChange}
                        />
                    </Button>
                </Grid>

                {/* RIGHT SIDE */}
                <Grid item xs={12} md={8}>
                    <Box
                        sx={{
                            background: "#121212",
                            border: "1px solid #2a2a2a",
                            borderRadius: "20px",
                            p: { xs: 2, md: 4 },
                        }}
                    >
                        <Typography
                            variant="h5"
                            sx={{
                                color: "#fff",
                                mb: 3,
                                fontWeight: 700,
                                fontSize: { xs: "1.4rem", md: "2rem" }
                            }}
                        >
                            Track Information
                        </Typography>

                        <TextField
                            id="track-title"
                            label="Title"
                            variant="standard"
                            fullWidth
                            margin="dense"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            sx={inputStyle}
                        />

                        <TextField
                            id="track-desc"
                            label="Description"
                            variant="standard"
                            fullWidth
                            margin="dense"
                            multiline
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            sx={{
                                ...inputStyle,
                                mt: 3
                            }}
                        />

                        <TextField
                            id="track-category"
                            select
                            label="Category"
                            fullWidth
                            variant="standard"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            sx={{
                                ...inputStyle,
                                mt: 3
                            }}
                        >
                            {categoryOptions.map((option) => (
                                <MenuItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>

                        {/* PROGRESS */}
                        {progress > 0 && (
                            <Box mt={4}>
                                <Typography
                                    sx={{
                                        color: "#999",
                                        mb: 1,
                                        fontSize: "0.9rem"
                                    }}
                                >
                                    Uploading: {progress}%
                                </Typography>

                                <LinearProgressWithLabel value={progress} />
                            </Box>
                        )}

                        {/* BUTTONS */}
                        <Box
                            sx={{
                                mt: 5,
                                display: "flex",
                                gap: 2,
                                flexWrap: "wrap",
                            }}
                        >
                            <Button
                                variant="outlined"
                                onClick={() => setValue(0)}
                                sx={{
                                    borderColor: "#555",
                                    color: "#fff",
                                    borderRadius: "999px",
                                    px: 4,
                                    py: 1,
                                    textTransform: "none",
                                }}
                            >
                                Back
                            </Button>

                            <Button
                                variant="contained"
                                onClick={handleSave}
                                disabled={
                                    isCreatePending ||
                                    progress < 100 ||
                                    !uploadedFileName
                                }
                                sx={{
                                    background: "#ff5500",
                                    color: "#fff",
                                    borderRadius: "999px",
                                    px: 4,
                                    py: 1,
                                    textTransform: "none",
                                    fontWeight: 700,
                                    '&:hover': {
                                        background: "#ff6a1a",
                                    },
                                    '&.Mui-disabled': {
                                        background: "#333",
                                        color: "#777"
                                    }
                                }}
                            >
                                {isCreatePending ? 'Saving...' : 'Save Track'}
                            </Button>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </div>
    )
}
export default SecondTabs;