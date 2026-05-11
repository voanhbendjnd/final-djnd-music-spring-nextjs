'use client'
import {Alert, Avatar, Box, Button, Divider, Grid, Snackbar, TextField, Typography} from "@mui/material";
import LockIcon from '@mui/icons-material/Lock';
import GitHubIcon from '@mui/icons-material/GitHub';
import GoogleIcon from '@mui/icons-material/Google';
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';

import { useState } from "react";
import {signIn} from "next-auth/react";
import {ArrowBack, ArrowBackRounded, Facebook} from "@mui/icons-material";
import Link from "next/link";
import {redirect, useRouter} from "next/navigation";

const AuthSignIn = (props: any) => {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const [isErrorUsername, setIsErrorUsername] = useState<boolean>(false);
    const [isErrorPassword, setIsErrorPassword] = useState<boolean>(false);
    const [openMessage, setOpenMessage] = useState<boolean>(false);
    const [resMessage, setResMessage] = useState<string>("");
    const [errorUsername, setErrorUsername] = useState<string>("");
    const [errorPassword, setErrorPassword] = useState<string>("");


    const handleSubmit = async () => {
        setIsErrorUsername(false);
        setIsErrorPassword(false);
        setErrorUsername("");
        setErrorPassword("");

        if (!username) {
            setIsErrorUsername(true);
            setErrorUsername("Username is not empty.")
            return;
        }
        if (!password) {
            setIsErrorPassword(true);
            setErrorPassword("Password is not empty.")
            return;
        }
        const res = await signIn("credentials", {
            username: username,
            password: password,
            redirect:false
        })
        if(!res?.error){
           router.push("/")
        }
        else{
            setOpenMessage(true)
            setResMessage(res.error);
        }
    }
    const isValid = username.trim() !== "" && password.trim() !== "";
    return (
        <Box
            sx={{
                bgcolor: "#121212",
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Box
                sx={{
                    width: 400,
                    bgcolor: "#1c1c1c",
                    borderRadius: 2,
                    p: 4,
                    color: "#fff",
                    boxShadow: "0 0 20px rgba(0,0,0,0.5)",
                }}
            >
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                    Sign in or create an account
                </Typography>

                <Typography sx={{ color: "#aaa", fontSize: 13, mb: 3 }}>
                    By clicking Continue, you agree to Terms of Use and Privacy Policy.
                </Typography>

                {/* SOCIAL BUTTONS */}
                <Button
                    fullWidth
                    sx={{
                        mb: 1.5,
                        bgcolor: "#1877f2",
                        color: "#fff",
                        textTransform: "none",
                        fontWeight: 500,

                        "&:hover": { bgcolor: "#166fe0" },
                    }}
                    onClick={() => signIn("facebook", { callbackUrl: "/" })}

                >
                    <Facebook sx={{ fontSize: 18, mr: 1 }} />
                    <span style={{marginTop:3}}>
                        Continue with Facebook

                    </span>
                </Button>

                <Button
                    fullWidth
                    sx={{
                        mb: 1.5,
                        bgcolor: "#333",
                        color: "#fff",
                        textTransform: "none",
                        "&:hover": { bgcolor: "#444" },
                    }}
                    onClick={() => signIn("google", { callbackUrl: "/" })}
                >
                    <GoogleIcon sx={{ fontSize: 18, mr: 1 }} />
                    <span style={{marginTop:3}}>
                                            Continue with Google
                    </span>
                </Button>

                <Button
                    fullWidth
                    sx={{
                        mb: 2,
                        bgcolor: "#000",
                        color: "#fff",
                        textTransform: "none",
                        "&:hover": { bgcolor: "#111" },
                    }}
                    onClick={() => signIn("github", { callbackUrl: "/" })}
                >
                    <GitHubIcon sx={{ fontSize: 18, mr: 1 }} />
                    <span style={{marginTop:3}}>
                                            Continue with Github
                    </span>
                </Button>

                <Typography sx={{ color: "#aaa", mb: 1 }}>
                    Sign in with email
                </Typography>

                {/* INPUT */}
                <TextField
                    fullWidth
                    placeholder="Your email address"
                    variant="outlined"
                    sx={{
                        mb: 2,
                        input: {
                            color: "#fff",
                        },
                        "& .MuiOutlinedInput-root": {
                            bgcolor: "#2a2a2a",

                            "& fieldset": {
                                borderColor: "#444",
                            },

                            "&:hover fieldset": {
                                borderColor: "#666",
                            },

                            "&.Mui-focused": {
                                bgcolor: "#2a2a2a", // 🔥 giữ màu khi focus
                            },

                            "&.Mui-focused fieldset": {
                                borderColor: "#f50",
                            },

                            // 🔥 FIX autofill trắng
                            "& input:-webkit-autofill": {
                                WebkitBoxShadow: "0 0 0 1000px #2a2a2a inset",
                                WebkitTextFillColor: "#fff",
                                transition: "background-color 9999s ease-in-out 0s",
                            },
                        },
                    }}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <TextField
                    fullWidth
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    sx={{
                        mb: 2,
                        input: {
                            color: "#fff",
                        },
                        "& .MuiOutlinedInput-root": {
                            bgcolor: "#2a2a2a",

                            "& fieldset": {
                                borderColor: "#444",
                            },

                            "&:hover fieldset": {
                                borderColor: "#666",
                            },

                            "&.Mui-focused": {
                                bgcolor: "#2a2a2a", // 🔥 giữ màu khi focus
                            },

                            "&.Mui-focused fieldset": {
                                borderColor: "#c94300",
                            },

                            // 🔥 FIX autofill trắng
                            "& input:-webkit-autofill": {
                                WebkitBoxShadow: "0 0 0 1000px #2a2a2a inset",
                                WebkitTextFillColor: "#fff",
                                transition: "background-color 9999s ease-in-out 0s",
                            },
                        },
                    }}
                    onChange={(e) => setPassword(e.target.value)}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <Visibility style={{color:'white'}} /> : <VisibilityOff style={{color:'white'}} />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                {/* LOGIN BUTTON */}
                <Button
                    fullWidth
                    disabled={!isValid}
                    sx={{
                        mt: 1,
                        bgcolor: isValid ? "#f50" : "#555",   // 🔥 cam khi hợp lệ
                        color: isValid ? "#fff" : "#999",
                        textTransform: "none",
                        fontWeight: 600,
                        cursor: isValid ? "pointer" : "not-allowed",

                        "&:hover": {
                            bgcolor: isValid ? "#a84502" : "#555",
                        },
                    }}
                    onKeyDown={(e)=>{
                        if(e.key === "Enter" && isValid){
                            handleSubmit()
                        }
                    }}
                    onClick={handleSubmit}

                >
                    Continue
                </Button>

                <Typography sx={{ mt: 2, color: "#4ea1ff", fontSize: 13 }}>
                    <Link href={'/'} style={{textDecoration:'none', color:'white'}}>Back to home?</Link>
                </Typography>
            </Box>
        </Box>

    )
}

export default AuthSignIn;
