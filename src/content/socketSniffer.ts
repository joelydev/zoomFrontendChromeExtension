import { CustomEvents } from '@/utils/enums/CustomEvents';
import { RTMessages } from '@/utils/enums/RTMessages';

function initSocketSniffer() {
  const logWebSocketTraffic = (type: RTMessages, data: any) => {
    const event = new CustomEvent(CustomEvents.WsData, {
      detail: { type, data },
    });
    window.dispatchEvent(event);
  };

  window.addEventListener(CustomEvents.WsDisable, () => {
    OrigWebSocket.prototype.send = () => void 0;
  });

  const OrigWebSocket = window.WebSocket;
  const callWebSocket = OrigWebSocket.apply.bind(OrigWebSocket);
  const addEventListener = OrigWebSocket.prototype.addEventListener;
  const wsAddEventListener = addEventListener.call.bind(addEventListener);

  window.WebSocket = function WebSocket(...args) {
    const ws: WebSocket = !(this instanceof WebSocket)
      ? callWebSocket(this, args)
      : args.length === 1
        ? new OrigWebSocket(args[0])
        : args.length >= 2
          ? new OrigWebSocket(args[0], args[1])
          : {};
    wsAddEventListener(ws, 'open', (event) => {
      logWebSocketTraffic(RTMessages.WebSocketOpen, event);
    });

    wsAddEventListener(ws, 'message', (event) => {
      logWebSocketTraffic(RTMessages.WebSocketMessage, event);
    });

    wsAddEventListener(ws, 'close', (event) => {
      logWebSocketTraffic(RTMessages.WebSocketClose, event);
    });

    return ws;
  }.bind(WebSocket);

  window.WebSocket.prototype = OrigWebSocket.prototype;
  window.WebSocket.prototype.constructor = window.WebSocket;

  const send = OrigWebSocket.prototype.send;
  const wsSend = send.call.bind(send);

  OrigWebSocket.prototype.send = function (data) {
    try {
      const payload = JSON.parse(data.toString());
      if (payload?.body?.fileName) {
        logWebSocketTraffic(RTMessages.ZoomSendFile, payload.body);
      }
    } catch (err) {
      logWebSocketTraffic(RTMessages.WebSocketError, err);
    }
    return wsSend(this, data);
  };
}

initSocketSniffer();
