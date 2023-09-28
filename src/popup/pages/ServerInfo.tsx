import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { POPUP_PATH } from '@/utils/constants/popup';
import { StorageItems } from '@/utils/enums/StorageItems';
import { getStorageItems, setStorageItems } from '@/utils/helpers/storage';
import baseApi from '@/services/baseApi';
import { RTMessages } from '@/utils/enums/RTMessages';

export default function ServerInfo() {
  const navigate = useNavigate();
  const [addr, setAddr] = useState('');
  useEffect(() => {
    getStorageItems([StorageItems.ServerAddr]).then(async (items) => {
      const storedAddr = items.serverAddr;
      setAddr(storedAddr);
      baseApi.defaults.baseURL = storedAddr;
      await sendBackgroundToSetBaseUrl(storedAddr);
    });
  }, []);

  const handleChangeServerAddr = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAddr(e.target.value);
    },
    []
  );

  const handleSaveServerInfo = useCallback(async () => {
    baseApi.defaults.baseURL = addr;
    // setTimeout(() => {
    //   navigate(POPUP_PATH.signIn);
    // }, 0);
    console.log('handlessaveUrl_addr:', addr);
    console.log('11111111111111');
    await setStorageItems({ [StorageItems.ServerAddr]: addr }); // comment for @panda
    console.log('222222222222');
    // sendBackgroundToSetProxy();
    console.log('3333333333333333');
    sendBackgroundToSetBaseUrl(addr);
    console.log('44444444444444444');


  }, [addr]);

  const sendBackgroundToSetProxy = async () => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: RTMessages.SetProxy,
      }, (response) => {
        console.log(888888888888)
        resolve(true)
      });
    })
  };

  const sendBackgroundToSetBaseUrl = async (url: string) => {
    return new Promise((resolve, reject) => {

      console.log("sendBackgroundToSetBaseUrl_IN");
      chrome.runtime.sendMessage({
        type: RTMessages.SetServerAddr,
        data: {
          addr: url
        },
      }, (response) => {
        console.log(888888888888)
        resolve(true)
      });
      console.log("sendBackgroundToSetBaseUrl_END");
    })
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        mt={2}
        mb={4}
      >
        <img src="/logo.png" width={150} />
      </Box>
      <Typography component="h1" variant="h5">
        Welcome
      </Typography>
      <Box sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="server-addr"
          label="Server Address"
          name="server-addr"
          value={addr}
          onChange={handleChangeServerAddr}
          autoFocus
        />
        <Button
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          onClick={handleSaveServerInfo}
        >
          Save
        </Button>
        <Link
          href="#"
          variant="body2"
          onClick={() => navigate(POPUP_PATH.signIn)}
        >
          Already have a correct info? Sign in
        </Link>
      </Box>
    </Box>
  );
}
