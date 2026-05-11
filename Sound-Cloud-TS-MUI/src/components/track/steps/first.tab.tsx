'use client'
import {useDropzone, FileWithPath} from "react-dropzone";
import './theme.css';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import {useCallback} from "react";
import {toast} from "react-toastify";
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

function InputFileUpload() {
    return (
        <Button
            onClick={(e) =>  e.preventDefault()}
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            style={{color:'#fff', backgroundColor:'#ce4812'}}
            startIcon={<CloudUploadIcon />}
        >
            Upload files
            <VisuallyHiddenInput
                type="file"
                onChange={(event) => console.log(event.target.files)}
                multiple
            />
        </Button>
    );
}
interface IProps {
    setValue: (v: number) => void;
    setTrackAudio: (v: File) => void;
    trackAudio: File | null;
}

const FirstTabs = (props: IProps) => {
    const {setValue, setTrackAudio} = props;
    // const onDrop = useCallback((acceptedFiles : FileWithPath[]) => {
    //     if(acceptedFiles && acceptedFiles[0]){
    //         setTrackAudio(acceptedFiles[0]);
    //         setValue(1);
    //     }
    // }, [setValue, setTrackAudio])
    const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
        const file = acceptedFiles[0];

        if (!file) return;

        if (file.type !== 'audio/mpeg') {
            toast.error("Only upload file .mp3 for track!")
            return;
        }

        setTrackAudio(file);
        setValue(1);
    }, [setValue, setTrackAudio]);
    const {acceptedFiles, getRootProps, getInputProps} = useDropzone({
        onDrop,
        accept:{
            'audio/*':['.mp3', '.m4a', '.flac', '.wav']
        }
    });

    const files = acceptedFiles.map((file: FileWithPath) => (
        <li style={{color:'white'}} key={file.path}>
            {file.path} - {file.size} bytes
        </li>
    ));

    return (
        <section className="container">
            <div {...getRootProps({className: 'dropzone'})}>
                <input {...getInputProps()} />
                <InputFileUpload/>
                <p>Drag or click for upload your track</p>
            </div>
            <aside>
                <h4 style={{color:'white'}}>Files</h4>
                <ul>{files}</ul>
                {/*<h5 style={{color:'white'}}>Only mp3, if you use a file other than an .mp3 file, the track will not be accepted.</h5>*/}
            </aside>
        </section>
    );
}
export default FirstTabs;