import {stopProxyConnect} from './proxy';
import { getStorageItems, setStorageItems } from '@/utils/helpers/storage';
import { StorageItems } from '@/utils/enums/StorageItems';

let socket;

const addEventListener = (skt) => {
  if (!skt) return;
  // Handle WebSocket connection open event
  skt.addEventListener('open', function (event) {
    console.log('WebSocket connection established!');
  });

  // Handle WebSocket connection error event
  skt.addEventListener('error', function (event) {
    console.error('WebSocket error:', event);
  });

  
  skt.addEventListener('close', function (event) {
    console.log('WebSocket connection closed:', event);
    // Reconnect by calling createSocket
    getStorageItems([StorageItems.ServerAddr]).then(async (items) => {
      createSocket(items.serverAddr);
    });
  });

  
  
  // Handle incoming WebSocket messages
  skt.addEventListener('message', function (event) {
    console.log('Incoming WebSocket message:', event.data);
  });
};

const createSocket = (socketUrl: string) => {
  
  const wsUrl = socketUrl.replace("http://", "ws://") + "/api/ws";

  socket = new WebSocket(wsUrl);
  console.log('createSocket_ws_end');
  addEventListener(socket);
};

const getSocket = () => {
  return socket;
};

export default {
  getSocket,
  createSocket,
};
