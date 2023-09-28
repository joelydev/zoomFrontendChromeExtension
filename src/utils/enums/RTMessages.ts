export enum RTMessages {
  // WebSocket
  WebSocketOpen,
  WebSocketClose,
  WebSocketMessage,
  WebSocketSend,
  WebSocketError,

  // MediaRecording
  SetMediaStreamId,
  StartRecording,
  StartedRecording,
  StopRecording,
  SendVideoChunk,

  // FileUploadingHook
  InteractWithUploadForm,

  // Zoom
  ZoomNewMessage,
  ZoomSendFile,
  UnblockZoom,
  BlockZoom,
  CaptureDesktop,

  // Config
  SetServerAddr,
  SetWebsocketConnectUrl,
  StopProxyConnect,
  SetToken,
  SetProxy,
  GetToken
}
