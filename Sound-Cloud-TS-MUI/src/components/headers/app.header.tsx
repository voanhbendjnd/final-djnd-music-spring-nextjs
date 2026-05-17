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
import MoreIcon from '@mui/icons-material/MoreVert';
import HomeIcon from '@mui/icons-material/Home';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import SearchIcon from '@mui/icons-material/Search';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import LibraryMusicOutlinedIcon from '@mui/icons-material/LibraryMusicOutlined';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import GroupsIcon from '@mui/icons-material/Groups';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import HistoryIcon from '@mui/icons-material/History';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import { Avatar, Container, useMediaQuery, useTheme, Tooltip } from '@mui/material';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import Image from 'next/image';
import SearchBar from '@/components/search/search-bar';
import { generateProfileUrl } from "@/utils/generate.slug";
import {DiscFull} from "@mui/icons-material";

// ─── Mobile nav items ─────────────────────────────────────────────────────────
// 6 items — hiển thị scrollable horizontal hoặc 2 hàng
// Chọn layout: scrollable horizontal với snap — phổ biến nhất trên music apps

interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
    activeIcon: React.ReactNode;
    protected?: boolean;
}

const NAV_ITEMS: NavItem[] = [
    {
        label: 'Home',
        path: '/',
        icon: <HomeOutlinedIcon sx={{ fontSize: 22 }} />,
        activeIcon: <HomeIcon sx={{ fontSize: 22 }} />,
    },
    {
        label: 'Search',
        path: '/search',
        icon: <SearchOutlinedIcon sx={{ fontSize: 22 }} />,
        activeIcon: <SearchIcon sx={{ fontSize: 22 }} />,
    },
    {
        label: 'Upload',
        path: '/track/upload',
        icon: <CloudUploadOutlinedIcon sx={{ fontSize: 22 }} />,
        activeIcon: <CloudUploadIcon sx={{ fontSize: 22 }} />,
        protected: true,
    },
    {
        label: 'Library',
        path: '/playlist',
        icon: <LibraryMusicOutlinedIcon sx={{ fontSize: 22 }} />,
        activeIcon: <LibraryMusicIcon sx={{ fontSize: 22 }} />,
        protected: true,
    },
    {
        label: 'Rooms',
        path: '/room',
        icon: <GroupsOutlinedIcon sx={{ fontSize: 22 }} />,
        activeIcon: <GroupsIcon sx={{ fontSize: 22 }} />,
    },
    {
        label: 'History',
        path: '/history',
        icon: <HistoryOutlinedIcon sx={{ fontSize: 22 }} />,
        activeIcon: <HistoryIcon sx={{ fontSize: 22 }} />,
        protected: true,
    },
];

// ─── Mobile Nav Item ──────────────────────────────────────────────────────────

function MobileNavItem({
                           item,
                           isActive,
                           onClick,
                       }: {
    item: NavItem;
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <Box
            onClick={onClick}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.4,
                // Chiều rộng cố định — 6 items vừa màn hình 390px
                minWidth: 0,
                flex: '1 1 0',
                py: 0.75,
                cursor: 'pointer',
                position: 'relative',
                WebkitTapHighlightColor: 'transparent',
                // Active top indicator line
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: isActive ? 'translateX(-50%) scaleX(1)' : 'translateX(-50%) scaleX(0)',
                    width: 20,
                    height: 2,
                    bgcolor: '#ff5500',
                    borderRadius: '0 0 2px 2px',
                    transition: 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
                },
                '&:active': { opacity: 0.7 },
            }}
        >
            {/* Icon */}
            <Box
                sx={{
                    color: isActive ? '#ff5500' : 'rgba(255,255,255,0.45)',
                    transition: 'color 0.18s, transform 0.18s',
                    transform: isActive ? 'translateY(-1px)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 0,
                }}
            >
                {isActive ? item.activeIcon : item.icon}
            </Box>

            {/* Label */}
            <Typography
                sx={{
                    fontSize: '0.6rem',
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? '#ff5500' : 'rgba(255,255,255,0.35)',
                    letterSpacing: isActive ? '0.04em' : '0.02em',
                    lineHeight: 1,
                    transition: 'color 0.18s, font-weight 0.18s',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    px: 0.25,
                }}
            >
                {item.label}
            </Typography>
        </Box>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const AppHeader = () => {
    const { data: session } = useSession();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const router = useRouter();
    const pathname = usePathname();

    // ── Scroll-aware header ────────────────────────────────────────────────────
    const [visible, setVisible]   = useState(true);
    const [scrolled, setScrolled] = useState(false);
    const lastScrollY             = useRef(0);
    const ticking                 = useRef(false);

    useEffect(() => {
        const onScroll = () => {
            if (ticking.current) return;
            ticking.current = true;
            requestAnimationFrame(() => {
                const currentY = window.scrollY;
                setScrolled(currentY > 10);
                if (currentY < 10) {
                    setVisible(true);
                } else if (currentY > lastScrollY.current + 4) {
                    setVisible(false);
                } else if (currentY < lastScrollY.current - 4) {
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

    const pages = [{ title: 'Upload', path: "/track/upload" }];

    const handleProtectedNavigation = (path: string) => {
        if (!session) router.push("/auth/signin");
        else router.push(path);
    };

    const handleNavItem = (item: NavItem) => {
        if (item.protected && !session) {
            router.push('/auth/signin');
        } else {
            router.push(item.path);
        }
    };

    const isNavActive = (item: NavItem): boolean => {
        if (item.path === '/') return pathname === '/';
        return pathname?.startsWith(item.path) ?? false;
    };

    // ── Menu state ─────────────────────────────────────────────────────────────
    const [anchorEl,           setAnchorEl]           = React.useState<null | HTMLElement>(null);
    const [libraryAnchorEl,    setLibraryAnchorEl]    = React.useState<null | HTMLElement>(null);
    const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = React.useState<null | HTMLElement>(null);

    const isMenuOpen        = Boolean(anchorEl);
    const isLibraryMenuOpen = Boolean(libraryAnchorEl);
    const isMobileMenuOpen  = Boolean(mobileMoreAnchorEl);

    const handleProfileMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
    const handleLibraryMenuOpen = (e: React.MouseEvent<HTMLElement>) => setLibraryAnchorEl(e.currentTarget);
    const handleMobileMenuClose = () => setMobileMoreAnchorEl(null);
    const handleMenuClose       = () => {
        setAnchorEl(null);
        setLibraryAnchorEl(null);
        handleMobileMenuClose();
    };
    const handleMobileMenuOpen = (e: React.MouseEvent<HTMLElement>) => setMobileMoreAnchorEl(e.currentTarget);

    // ── Menus ──────────────────────────────────────────────────────────────────
    const menuSx = {
        '& .MuiPaper-root': {
            backgroundColor: '#0e0e0e',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        },
        '& .MuiMenuItem-root': {
            color: 'rgba(255,255,255,0.8)',
            fontSize: '0.875rem',
            '&:hover': { backgroundColor: 'rgba(255,85,0,0.08)', color: '#fff' },
        },
    };

    const renderMenu = (
        <Menu
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={isMenuOpen}
            onClose={handleMenuClose}
            sx={menuSx}
        >
            {session?.user?.role === 'SUPER_ADMIN' && (
                <MenuItem onClick={handleMenuClose}>
                    <Link href="/dashboard/user" style={{ textDecoration: 'none', color: 'inherit' }}>Admin</Link>
                </MenuItem>
            )}
            {session && (
                <MenuItem onClick={handleMenuClose}>
                    <Link href={'/profile'} style={{ textDecoration: 'none', color: 'inherit' }}>
                        Profile
                    </Link>
                </MenuItem>
            )}
            <MenuItem onClick={() => { signOut(); handleMenuClose(); }}>Logout</MenuItem>
        </Menu>
    );

    const renderLibraryMenu = (
        <Menu
            anchorEl={libraryAnchorEl}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={isLibraryMenuOpen}
            onClose={handleMenuClose}
            sx={{ ...menuSx, '& .MuiPaper-root': { ...menuSx['& .MuiPaper-root'], minWidth: 200 } }}
        >
            {session?
            <MenuItem onClick={() => { handleProtectedNavigation(generateProfileUrl(session?.user.name!, session?.user.id!)); handleMenuClose(); }}>
                <DiscFull sx={{ color: '#ff5500', mr: 1.5, fontSize: 18 }} /> My Tracks
            </MenuItem> :
            <>
            </>
            }

            <MenuItem onClick={() => { handleProtectedNavigation('/playlist'); handleMenuClose(); }}>
                <LibraryMusicIcon sx={{ color: '#ff5500', mr: 1.5, fontSize: 18 }} /> Liked Playlists
            </MenuItem>
            <MenuItem onClick={() => { handleProtectedNavigation('/like'); handleMenuClose(); }}>
                <FavoriteIcon sx={{ color: '#ff5500', mr: 1.5, fontSize: 18 }} /> Liked Tracks
            </MenuItem>
            <MenuItem onClick={() => { handleProtectedNavigation('/rooms'); handleMenuClose(); }}>
                <GroupsIcon sx={{ color: '#ff5500', mr: 1.5, fontSize: 18 }} /> Listening Room
            </MenuItem>
            <MenuItem onClick={() => { handleProtectedNavigation('/history'); handleMenuClose(); }}>
                <HistoryIcon sx={{ color: '#ff5500', mr: 1.5, fontSize: 18 }} /> History
            </MenuItem>
        </Menu>
    );

    const renderMobileMenu = (
        <Menu
            anchorEl={mobileMoreAnchorEl}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={isMobileMenuOpen}
            onClose={handleMobileMenuClose}
            sx={menuSx}
        >
            <MenuItem onClick={handleProfileMenuOpen}>
                <AccountCircle sx={{ mr: 1 }} /> Profile
            </MenuItem>
        </Menu>
    );

    return (
        <div>
            <Box sx={{ flexGrow: 1 }}>

                {/* ── Desktop Header ─────────────────────────────────────── */}
                <AppBar
                    position="fixed"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
                        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1), background-color 0.25s, backdrop-filter 0.25s, box-shadow 0.25s',
                        backgroundColor: scrolled ? 'rgba(10,10,10,0.82)' : '#030303',
                        backdropFilter: scrolled ? 'blur(14px)' : 'none',
                        boxShadow: scrolled ? '0 1px 0 rgba(255,255,255,0.06)' : 'none',
                    }}
                >
                    <Container>
                        <Toolbar>
                            <Typography
                                variant="h6"
                                noWrap
                                onClick={() => router.push('/')}
                                sx={{
                                    display: { xs: 'none', sm: 'block' },
                                    mr: '50px', cursor: 'pointer',
                                    fontWeight: 700, letterSpacing: '-0.5px',
                                    '&:hover': { color: '#f50' }, transition: 'color 0.2s',
                                }}
                            >
                                DJND Music
                            </Typography>

                            <SearchBar />
                            <Box sx={{ flexGrow: 1 }} />

                            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: '20px' }}>
                                {pages.map((page) => (
                                    <Typography key={page.title}
                                                onClick={() => handleProtectedNavigation(page.path)}
                                                sx={{ cursor: 'pointer', fontSize: '0.9rem', '&:hover': { color: '#f50' }, transition: 'color 0.2s' }}>
                                        {page.title}
                                    </Typography>
                                ))}

                                <Tooltip title="Library & Rooms">
                                    <Typography onClick={handleLibraryMenuOpen}
                                                sx={{
                                                    cursor: 'pointer', fontSize: '0.9rem',
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    '&:hover': { color: '#f50' }, transition: 'color 0.2s',
                                                    fontWeight: isLibraryMenuOpen ? 700 : 400,
                                                    color: isLibraryMenuOpen ? '#f50' : 'inherit',
                                                }}>
                                        Library
                                    </Typography>
                                </Tooltip>

                                {session?.user?.role === 'SUPER_ADMIN' && (
                                    <Typography onClick={() => handleProtectedNavigation('/dashboard/user')}
                                                sx={{ cursor: 'pointer', fontSize: '0.9rem', '&:hover': { color: '#f50' }, transition: 'color 0.2s' }}>
                                        Dashboard
                                    </Typography>
                                )}

                                {session ? (
                                    <Avatar onClick={handleProfileMenuOpen}
                                            sx={{ cursor: 'pointer', width: 40, height: 40, position: 'relative', overflow: 'hidden', border: '2px solid transparent', '&:hover': { borderColor: '#f50' }, transition: 'border-color 0.2s' }}>
                                        {session.user?.avatar ? (
                                            <Image src={session.user.avatar} alt={session.user?.name || 'Avatar'}
                                                   fill sizes="40px" style={{ objectFit: 'cover' }} />
                                        ) : session.user?.name?.charAt(0).toUpperCase()}
                                    </Avatar>
                                ) : (
                                    <Link href="/auth/signin" style={{ textDecoration: 'none', color: 'unset' }}>Login</Link>
                                )}
                            </Box>

                            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
                                <IconButton size="large" onClick={handleMobileMenuOpen} color="inherit">
                                    <MoreIcon />
                                </IconButton>
                            </Box>
                        </Toolbar>
                    </Container>
                </AppBar>

                <Box sx={{ display: { xs: 'none', md: 'block' }, height: '64px' }} />

                {renderMobileMenu}
                {renderMenu}
                {renderLibraryMenu}

                {/* ── Mobile Bottom Navigation ───────────────────────────── */}
                {isMobile && (
                    <Box
                        sx={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            zIndex: 9999,

                            // Glassmorphism dark — nhất quán với footer player
                            bgcolor: 'rgba(8,8,8,0.94)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',

                            // Top border với subtle gradient — thay vì đường thẳng nhàm
                            borderTop: '1px solid rgba(255,255,255,0.07)',

                            // Subtle glow từ trên xuống
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0, left: 0, right: 0,
                                height: 1,
                                background: 'linear-gradient(90deg, transparent 0%, rgba(255,85,0,0.3) 50%, transparent 100%)',
                            },

                            // Safe area cho iPhone X+
                            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'stretch',
                                height: 58,
                                px: 0.5,
                            }}
                        >
                            {/* Profile / Avatar item — special, ở đầu */}
                            <Box
                                onClick={() => router.push(
                                    session
                                        ? '/profile'
                                        : '/auth/signin'
                                )}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 0.4,
                                    flex: '1 1 0',
                                    py: 0.75,
                                    cursor: 'pointer',
                                    position: 'relative',
                                    WebkitTapHighlightColor: 'transparent',
                                    '&:active': { opacity: 0.7 },
                                }}
                            >
                                {session?.user?.avatar ? (
                                    <Avatar
                                        src={session.user.avatar}
                                        sx={{
                                            width: 24, height: 24,
                                            border: pathname?.startsWith('/profile') || pathname?.startsWith('/user')
                                                ? '2px solid #ff5500'
                                                : '2px solid rgba(255,255,255,0.2)',
                                            transition: 'border-color 0.2s',
                                        }}
                                    />
                                ) : (
                                    <AccountCircleOutlinedIcon sx={{ fontSize: 22, color: 'rgba(255,255,255,0.45)' }} />
                                )}
                                <Typography sx={{
                                    fontSize: '0.6rem', fontWeight: 400,
                                    color: 'rgba(255,255,255,0.35)',
                                    textTransform: 'uppercase', letterSpacing: '0.02em',
                                    lineHeight: 1,
                                }}>
                                    {session ? 'Me' : 'Sign in'}
                                </Typography>
                            </Box>

                            {/* Divider mỏng */}
                            <Box sx={{ width: '1px', bgcolor: 'rgba(255,255,255,0.05)', my: 1.5 }} />

                            {/* Nav items */}
                            {NAV_ITEMS.map((item) => (
                                <MobileNavItem
                                    key={item.path}
                                    item={item}
                                    isActive={isNavActive(item)}
                                    onClick={() => handleNavItem(item)}
                                />
                            ))}
                        </Box>
                    </Box>
                )}
            </Box>
        </div>
    );
};

export default AppHeader;