"use client";
import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MailIcon from '@mui/icons-material/Mail';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MoreIcon from '@mui/icons-material/MoreVert';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Avatar, Container, useMediaQuery, useTheme } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import Image from 'next/image';
import SearchBar from '@/components/search/search-bar';
import { generateProfileUrl } from "@/utils/generate.slug";

const AppHeader = () => {
    const { data: session } = useSession();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const router = useRouter();

    // ── Scroll-aware header ────────────────────────────────────────────────────
    // Logic: ẩn khi scroll xuống, hiện khi scroll lên (giống SoundCloud)
    const [visible, setVisible]     = useState(true);
    const [scrolled, setScrolled]   = useState(false); // true = đã rời khỏi top → đổi style
    const lastScrollY               = useRef(0);
    const ticking                   = useRef(false);

    useEffect(() => {
        const onScroll = () => {
            if (ticking.current) return;
            ticking.current = true;

            requestAnimationFrame(() => {
                const currentY = window.scrollY;

                setScrolled(currentY > 10);

                if (currentY < 10) {
                    // Đầu trang → luôn hiện
                    setVisible(true);
                } else if (currentY > lastScrollY.current + 4) {
                    // Đang scroll XUỐNG (threshold 4px tránh jitter)
                    setVisible(false);
                } else if (currentY < lastScrollY.current - 4) {
                    // Đang scroll LÊN
                    setVisible(true);
                }

                lastScrollY.current = currentY;
                ticking.current = false;
            });
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (session?.error === "RefreshAccessTokenError") {
            signOut({ callbackUrl: "/auth/signin", redirect: true });
        }
    }, [session]);

    // ── Nav ────────────────────────────────────────────────────────────────────
    const pages = [
        { title: 'Playlists', path: '/playlist' },
        { title: "Like",      path: '/like' },
        { title: 'Upload',    path: "/track/upload" },
    ];

    const handleProtectedNavigation = (path: string) => {
        if (!session) router.push("/auth/signin");
        else          router.push(path);
    };

    // ── Menu state ─────────────────────────────────────────────────────────────
    const [anchorEl,           setAnchorEl]           = React.useState<null | HTMLElement>(null);
    const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = React.useState<null | HTMLElement>(null);

    const isMenuOpen       = Boolean(anchorEl);
    const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

    const handleProfileMenuOpen  = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
    const handleMobileMenuClose  = () => setMobileMoreAnchorEl(null);
    const handleMenuClose        = () => { setAnchorEl(null); handleMobileMenuClose(); };
    const handleMobileMenuOpen   = (e: React.MouseEvent<HTMLElement>) => setMobileMoreAnchorEl(e.currentTarget);

    // ── Menus ──────────────────────────────────────────────────────────────────
    const menuId = 'primary-search-account-menu';
    const renderMenu = (
        <Menu
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            id={menuId}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={isMenuOpen}
            onClose={handleMenuClose}
            sx={{
                '& .MuiPaper-root': {
                    backgroundColor: '#121212',
                    color: '#fff',
                    border: '1px solid #333'
                },
                '& .MuiMenuItem-root': {
                    color: '#fff',
                    '&:hover': { backgroundColor: '#1f1f1f' }
                }
            }}
        >
            {session?.user?.role === 'SUPER_ADMIN' && (
                <MenuItem>
                    <Link href="/dashboard/user" style={{ textDecoration: 'none', color: '#fff' }}>
                        Admin
                    </Link>
                </MenuItem>
            )}
            {session && (
                <MenuItem>
                    <Link
                        href={generateProfileUrl(session.user?.name, session.user?.id!)}
                        style={{ textDecoration: 'none', color: '#fff' }}
                    >
                        Profile
                    </Link>
                </MenuItem>
            )}
            <MenuItem onClick={() => { signOut(); handleMenuClose(); }}>
                Logout
            </MenuItem>
        </Menu>
    );

    const mobileMenuId = 'primary-search-account-menu-mobile';
    const renderMobileMenu = (
        <Menu
            anchorEl={mobileMoreAnchorEl}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            id={mobileMenuId}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={isMobileMenuOpen}
            onClose={handleMobileMenuClose}
        >
            <MenuItem>
                <IconButton size="large" color="inherit">
                    <Badge badgeContent={4} color="error"><MailIcon /></Badge>
                </IconButton>
                <p>Messages</p>
            </MenuItem>
            <MenuItem>
                <IconButton size="large" color="inherit">
                    <Badge badgeContent={17} color="error"><NotificationsIcon /></Badge>
                </IconButton>
                <p>Notifications</p>
            </MenuItem>
            <MenuItem onClick={handleProfileMenuOpen}>
                <IconButton size="large" color="inherit">
                    <AccountCircle />
                </IconButton>
                <p>Profile</p>
            </MenuItem>
        </Menu>
    );

    return (
        <div>
            <Box sx={{ flexGrow: 1 }}>

                {/* ── Desktop Header ─────────────────────────────────────── */}
                <AppBar
                    position="fixed"          // ← fixed thay vì static
                    sx={{
                        display: { xs: 'none', md: 'block' },

                        // Scroll-aware: trượt lên/xuống bằng transform (GPU-accelerated)
                        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
                        transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.25s ease, backdrop-filter 0.25s ease, box-shadow 0.25s ease',

                        // Khi đã scroll: đổi sang nền mờ kiểu glassmorphism
                        backgroundColor: scrolled
                            ? 'rgba(10, 10, 10, 0.82)'
                            : '#030303',
                        backdropFilter: scrolled ? 'blur(14px)' : 'none',
                        boxShadow: scrolled
                            ? '0 1px 0 rgba(255,255,255,0.06)'
                            : 'none',
                    }}
                >
                    <Container>
                        <Toolbar>
                            <Typography
                                variant="h6"
                                noWrap
                                component="div"
                                onClick={() => router.push('/')}
                                sx={{
                                    display: { xs: 'none', sm: 'block' },
                                    marginRight: '50px',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    letterSpacing: '-0.5px',
                                    '&:hover': { color: '#f50' },
                                    transition: 'color 0.2s'
                                }}
                            >
                                DJND Music
                            </Typography>

                            <SearchBar />

                            <Box sx={{ flexGrow: 1 }} />

                            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: '20px' }}>
                                {pages.map((page) => (
                                    <Typography
                                        key={page.title}
                                        onClick={() => handleProtectedNavigation(page.path)}
                                        sx={{
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            '&:hover': { color: '#f50' },
                                            transition: 'color 0.2s'
                                        }}
                                    >
                                        {page.title}
                                    </Typography>
                                ))}

                                {session?.user?.role === 'SUPER_ADMIN' && (
                                    <Typography
                                        onClick={() => handleProtectedNavigation('/dashboard/user')}
                                        sx={{
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            '&:hover': { color: '#f50' },
                                            transition: 'color 0.2s'
                                        }}
                                    >
                                        Dashboard
                                    </Typography>
                                )}

                                {session ? (
                                    <Avatar
                                        onClick={handleProfileMenuOpen}
                                        sx={{
                                            cursor: 'pointer',
                                            width: 40,
                                            height: 40,
                                            position: 'relative',
                                            overflow: 'hidden',
                                            border: '2px solid transparent',
                                            '&:hover': { borderColor: '#f50' },
                                            transition: 'border-color 0.2s'
                                        }}
                                    >
                                        {session.user?.avatar ? (
                                            <Image
                                                src={session.user.avatar}
                                                alt={session.user?.name || 'User Avatar'}
                                                fill
                                                sizes="40px"
                                                style={{ objectFit: 'cover' }}
                                            />
                                        ) : (
                                            session.user?.name?.charAt(0).toUpperCase()
                                        )}
                                    </Avatar>
                                ) : (
                                    <Link href="/auth/signin" style={{ textDecoration: 'none', color: 'unset' }}>
                                        Login
                                    </Link>
                                )}
                            </Box>

                            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
                                <IconButton
                                    size="large"
                                    aria-controls={mobileMenuId}
                                    aria-haspopup="true"
                                    onClick={handleMobileMenuOpen}
                                    color="inherit"
                                >
                                    <MoreIcon />
                                </IconButton>
                            </Box>
                        </Toolbar>
                    </Container>
                </AppBar>

                {/*
                  * Spacer: bù chiều cao header khi dùng position="fixed"
                  * để nội dung bên dưới không bị header che mất
                  */}
                <Box sx={{ display: { xs: 'none', md: 'block' }, height: '64px' }} />

                {renderMobileMenu}
                {renderMenu}

                {/* ── Mobile Bottom Navigation ───────────────────────────── */}
                {isMobile && (
                    <Box
                        sx={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 60,
                            bgcolor: '#111',
                            display: 'flex',
                            justifyContent: 'space-around',
                            alignItems: 'center',
                            borderTop: '1px solid #333',
                            zIndex: 9999
                        }}
                    >
                        <IconButton onClick={() => router.push('/')} sx={{ color: '#fff', '&:hover': { color: '#f50' } }}>
                            <HomeIcon />
                        </IconButton>
                        <IconButton onClick={() => router.push('/search')} sx={{ color: '#fff', '&:hover': { color: '#f50' } }}>
                            <SearchIcon />
                        </IconButton>
                        <IconButton
                            onClick={() => router.push(session ? '/track/upload' : '/auth/signin')}
                            sx={{ color: '#fff', '&:hover': { color: '#f50' } }}
                        >
                            <CloudUploadIcon />
                        </IconButton>
                        <IconButton onClick={() => router.push('/playlist')} sx={{ color: '#fff', '&:hover': { color: '#f50' } }}>
                            <LibraryMusicIcon />
                        </IconButton>
                        <IconButton
                            onClick={() => router.push(
                                session
                                    ? generateProfileUrl(session.user.name!, session.user.id!)
                                    : '/auth/signin'
                            )}
                            sx={{ color: '#fff', '&:hover': { color: '#f50' } }}
                        >
                            {session?.user?.avatar ? (
                                <Avatar src={session.user.avatar} sx={{ width: 28, height: 28 }} />
                            ) : (
                                <AccountCircleIcon />
                            )}
                        </IconButton>
                    </Box>
                )}
            </Box>
        </div>
    );
};

export default AppHeader;