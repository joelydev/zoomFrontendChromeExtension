import { CustomEvents } from '@/utils/enums/CustomEvents';
import { RTMessages } from '@/utils/enums/RTMessages';
import { recordTab } from '@/utils/helpers/record';
import { observeDomMutations } from './observer';
import { bufferToBase64 } from '@/utils/helpers/convert';
import { StatusCode } from '@/utils/enums/StatusCodes';
import { REGX_ZOOM_MEETING } from '@/utils/constants/regx';
import { emitNativeCustomEvent } from '@/utils/helpers/event';

/**
 * Observe DOM Mutations to detect changes in UI of target page
 * 
 * For example, new chat message will make a new text node in dom tree of chatbox
 * and this change is included in this mutation for sure.
 */
observeDomMutations();


// forward websocket events from socketSniffer to service worker
window.addEventListener(CustomEvents.WsData, (event: CustomEvent) => {
  if (event.detail?.type) {
    chrome.runtime.sendMessage(event.detail);
  }
});

document.addEventListener('DOMContentLoaded', async () => {
 
  // validate permission when current url is for alive meeting
  if (REGX_ZOOM_MEETING.test(location.href)) {
    document.body.style.display = 'none';

    const res = await chrome.runtime.sendMessage({ type: RTMessages.CaptureDesktop });
    // debugger
    if (res === StatusCode.Ok) {
      // when user enabled capturing with check of system audio, permit to start the meeting
      document.body.style.display = 'block';
    } else {
      // disable websocket to prevent attending meeting without permission
      emitNativeCustomEvent(CustomEvents.WsDisable);

      alert(res);
      location.reload();
    }
  }
});


chrome.runtime.onMessage.addListener(({ type, data }, _, sendResponse) => {
  (async () => {
    if (type === RTMessages.SetMediaStreamId) {
      const recorder = await recordTab(data.streamId, () => {
        chrome.runtime.sendMessage({ type: RTMessages.StopRecording });
      });
      recorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0) {
          const buffer = await event.data.arrayBuffer();
          chrome.runtime.sendMessage({
            type: RTMessages.SendVideoChunk,
            data: bufferToBase64(buffer),
          });
        }
      };
      await chrome.runtime.sendMessage({ type: RTMessages.StartRecording });
      recorder.start(1000);

      sendResponse(StatusCode.Ok);
    }
  })();

  // for asynchronous response
  return true;
});