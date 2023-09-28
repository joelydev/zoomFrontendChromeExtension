import {stopProxyConnect} from './proxy';

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

  // Handle WebSocket connection close event
  skt.addEventListener('close', function (event) {
    console.log('WebSocket connection closed and Stop Proxy Connect:', event);
    //stopProxyConnect();
    
  });

  // Handle incoming WebSocket messages
  skt.addEventListener('message', function (event) {
    console.log('Incoming WebSocket message:', event.data);
  });
};

const createSocket = (socketUrl: string) => {
  
  const wsUrl = socketUrl.replace("http://", "ws://") + "/api/ws";
  console.log('socket_wsUrl', wsUrl);

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
