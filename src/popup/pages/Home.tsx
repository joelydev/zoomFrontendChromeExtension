import * as React from 'react';
import baseApi from '@/services/baseApi';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { StorageItems } from '@/utils/enums/StorageItems';
import { POPUP_PATH } from '@/utils/constants/popup';
import { Button } from '@mui/material';
import { RTMessages } from '@/utils/enums/RTMessages';
import { getStorageItems, setStorageItems } from '@/utils/helpers/storage';

const drawerWidth = 240;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

export default function PersistentDrawerRight() {
  const [open, setOpen] = React.useState(false);
  const [userName, setUserName] = React.useState("");
  const [proxyInfo, setProxyInfo] = React.useState("");
  const navigate = useNavigate();

  React.useEffect(() => {
    getStorageItems([StorageItems.UserInfo, StorageItems.ServerAddr, StorageItems.ProxyScheme, StorageItems.ProxyServerIp, StorageItems.ProxyPort]).then((items) => {
      setUserName(items.userInfo.name);
      setProxyInfo(items.proxyScheme + '://' + items.proxyServerIp + ':' + items.proxyPort);
      sendBackgroundToSetBaseUrl(items.serverAddr).then(() => {
      });
    });
  }, []);

  const sendBackgroundToSetBaseUrl = async (url: string) => {
    await chrome.runtime.sendMessage({
      type: RTMessages.SetServerAddr,
      data: {
        addr: url
      },
    });
  };

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleLogout = async () => {
    await setStorageItems({
      [StorageItems.AuthToken]: '',
      [StorageItems.UserInfo]: {},
      [StorageItems.ProxyUsername]: '',
      [StorageItems.ProxyPassword]: '',
      [StorageItems.LoginState]: 0
    });
    chrome.browsingData.remove({
      origins: [
        'http://127.0.0.1'
      ]
    }, {
      cookies: true
    }, function () {
      console.log('removed');
    });
    handleProxyStop();
    navigate(POPUP_PATH.signIn);
  };

  const handleProxyStop = async () => {

    // Use Axios to send a GET request with parameters
    const response = await baseApi.get('/api/unregister');
    
    // Check if the response status indicates success (e.g., 200 OK)
    if (response.status === 200) {
      console.log('ip_disable');
    } else {
      console.error('Unexpected response status:', response.status);
      // Handle unexpected response statuses as needed
    }
    chrome.runtime.sendMessage({ type: RTMessages.StopProxyConnect });
  };

  const handleStartRecording = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const streamId = await new Promise((resolve) =>
      chrome.tabCapture.getMediaStreamId(
        { consumerTabId: tab.id },
        (streamId) => resolve(streamId)
      )
    );
    await chrome.runtime.sendMessage({
      type: RTMessages.SetMediaStreamId,
      data: {
        streamId,
        consumerTabId: tab.id,
      },
    });
  };

  const handleStopRecording = () => {
    chrome.runtime.sendMessage({ type: RTMessages.StopRecording });
  };

  return (
    <Box sx={{ display: 'flex', minHeight: 400 }}>
      <AppBar position="fixed">
        <Toolbar sx={{ justifyContent: 'flex-start' }}>
          <IconButton
            color="inherit"
            onClick={handleDrawerOpen}
            sx={{ ...(open && { display: 'none' }), mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
          },
        }}
        variant="temporary"
        anchor="left"
        open={open}
        onClose={handleDrawerClose}
      >
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
      <Box>
        <DrawerHeader />
        <Grid container spacing={2}>
          <Grid item xs={12}>
            {userName && 'User Name: ' + userName}
          </Grid>
          <Grid item xs={12}>
            {proxyInfo && 'Proxy IP: ' + proxyInfo}
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
