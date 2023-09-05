import { CustomEvents } from '../enums/CustomEvents';

export const emitNativeCustomEvent = (
  type: CustomEvents,
  data?: object
): boolean => {
  const event = new CustomEvent(type, {
    detail: data,
  });
  return window.dispatchEvent(event);
};
