import { ZoomChatTypes } from '../enums/zoom';

export interface ZoomChatMessage {
  id: string;
  message: string;
  order: number;
  sender?: string;
  receiver?: string;
  private?: boolean;
}

export interface ZoomChatFile {
  id: string;
  filename: string;
  sender?: string;
  receiver?: string;
  private?: boolean;
  data?: string | ArrayBuffer;
}

export type ZoomChat = ZoomChatMessage &
  ZoomChatFile & {
    type: ZoomChatTypes;
  };
