'use client';

import * as React from 'react';
import { 
  Box, Drawer, List, ListItem, ListItemButton, 
  ListItemIcon, ListItemText, Divider, Toolbar 
} from '@mui/material';
import {
    People as PeopleIcon,
    Security as SecurityIcon,
    Key as KeyIcon,
    MusicNote as MusicIcon,
    Category as CategoryIcon,
    Dashboard as DashboardIcon, Lyrics
} from '@mui/icons-material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const drawerWidth = 240;

const menuItems = [
  { text: 'Users', icon: <PeopleIcon />, path: '/dashboard/user' },
  { text: 'Roles', icon: <SecurityIcon />, path: '/dashboard/role' },
  { text: 'Permissions', icon: <KeyIcon />, path: '/dashboard/permission' },
  { text: 'Tracks', icon: <MusicIcon />, path: '/dashboard/track' },
  { text: 'Categories', icon: <CategoryIcon />, path: '/dashboard/category' },
    { text: 'Comments', icon: <Lyrics/>, path: '/dashboard/comment' },

];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <Link href={item.path} style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
                  <ListItemButton selected={pathname === item.path}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </Link>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
}
