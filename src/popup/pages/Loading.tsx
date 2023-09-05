import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

export default function Loading() {
  return (
    <Box>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        mt={2}
        mb={4}
      >
        <img src="/logo.png" width={150} />
      </Box>
      <Box
        display="flex"
        justifyContent="center"
        alignContent="center"
        height={230}
      >
        <CircularProgress />
      </Box>
    </Box>
  );
}
