import { DNR_RULESET_ZOOM } from '@/utils/constants/dnr';
import { RTMessages } from '@/utils/enums/RTMessages';
import { StatusCode } from '@/utils/enums/StatusCodes';
import { StorageItems } from '@/utils/enums/StorageItems';
import { WsEvents } from '@/utils/enums/WebSocketEvents';
import { getStorageItems, setStorageItems } from '@/utils/helpers/storage';
import { setupProxy, stopProxyConnect} from './proxy';
import webSocket from './websocket';
import baseApi from '../services/baseApi';
import { formToJSON } from 'axios';

let fetchConfig = {
  baseUrl: '',
  token: '',
};

// chrome.runtime.onInstalled.addListener(() => {
//   // console.log('chrome.runtime.onInstalled.addListener_before_setupProxy');
//   // setupProxy();
// });

chrome.windows.onCreated.addListener(() => {
  console.log('onCreated');
// stopProxyConnect();
// console.log('chrome.runtime.onCreated.addListener_before_setupProxy');
// setupProxy();
});

chrome.runtime.onSuspend.addListener(function () {
  console.log('onSuspend');
// Send a message to your React app to notify it of the browser closing.
// stopProxyConnect();
// chrome.runtime.sendMessage({ event: 'browser_closing' }, function (response) {
//   // Handle the response if needed.
});

chrome.runtime.onSuspendCanceled.addListener(function () {
//   // This event fires when Chrome is about to close but is canceled.
//   // It's a good place to cancel any cleanup tasks if needed.
  console.log('onSuspendCanceled');
//   stopProxyConnect();
});

const stopRecording = async () => {
    const socket = webSocket.getSocket();
  if (!socket) return;
  socket.send(WsEvents.StopRecording);
  stopProxyConnect();
  const response = await baseApi.get('/api/unregister');
  
  // Check if the response status indicates success (e.g., 200 OK)
  if (response.status === 200) {
    console.log('ip_disable');
  } else {
    console.error('Unexpected response status:', response.status);
    // Handle unexpected response statuses as needed
  }
  await setStorageItems({ [StorageItems.RecordingTabId]: 0 });
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  try {
    if (changeInfo.status === 'loading') {
      chrome.declarativeNetRequest.getEnabledRulesets().then((rulesets) => {
        if (rulesets.includes(DNR_RULESET_ZOOM)) {
          chrome.declarativeNetRequest.updateEnabledRulesets({
            disableRulesetIds: [DNR_RULESET_ZOOM],
          });
          chrome.tabs.reload(tabId);
        }
      });
    }

    getStorageItems([StorageItems.RecordingTabId]).then(({ recordingTabId }) => {
      if (recordingTabId === tabId) {
        if (!changeInfo.title) {
        }
        else if (changeInfo.title !== 'zoom.us' && !changeInfo.title.includes("connect") && changeInfo.title !== "Zoom" && !changeInfo.title.includes("Zoom Meeting")  && !changeInfo.title.includes("Zoom") && !changeInfo.title.includes("Connecting...") && !changeInfo.title.includes("Personal Meeting Room")){
          stopRecording();
        }
      }
    });
  } catch (error) {
    // Handle the error here, e.g., log it or display a message to the user.
    console.error('An error occurred:', error);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  getStorageItems([StorageItems.RecordingTabId]).then(({ recordingTabId }) => {
    if (recordingTabId === tabId) {
      setStorageItems({[StorageItems.LoginState]: 0});
      stopRecording();
    }
  });
});

chrome.runtime.onMessage.addListener(({ type, data }, sender, sendResponse) => {
  (async () => {
    switch (type) {
      case RTMessages.SetServerAddr:
        fetchConfig.baseUrl = data.addr;
        console.log('webSocketConfig.wsBaseUrl_before');
        // webSocket.createSocket('aaa');
        break;
      case RTMessages.SetToken:
        fetchConfig.token = data.token;
        break;
      case RTMessages.SetWebsocketConnectUrl:
        console.log('SetWebsocketConnectUrl', data.wsUrl);
        webSocket.createSocket(data.wsUrl);
        // fetchConfig.token = data.wsUrl;
        break;
      case RTMessages.GetToken:
        chrome.runtime.sendMessage({
          type: RTMessages.GetToken,
          data: fetchConfig.token,
        });
        break;
      case RTMessages.SetProxy:
        console.log('RTMessages.SetProxy_called');
        setupProxy();
        break;
      case RTMessages.StopProxyConnect:

        const response = await baseApi.get('/api/unregister');
        
        // Check if the response status indicates success (e.g., 200 OK)
        if (response.status === 200) {
          console.log('ip_disable');
        } else {
          console.error('Unexpected response status:', response.status);
          // Handle unexpected response statuses as needed
        }
        stopProxyConnect();
        break;
      case RTMessages.ZoomNewMessage: {
        const url = `${fetchConfig.baseUrl}/api/chat/msg`;

        console.log('chat_msg_param:', data);
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${fetchConfig.token}`,
          },
          body: JSON.stringify(data),
        })
          .then((response) => response.json())
          .then((res_data) => {
            console.log('Response data:', res_data);
            // Handle the response data here
          })
          .catch((error) => {
            console.error('Error:', error);
            // Handle errors here
          });
        break;
      }

      case RTMessages.ZoomSendFile: {
        console.log('File Transfer', data);
        // const url = `${fetchConfig.baseUrl}/chat/filetransfer`;

        // fetch(url, {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //     "Authorization": `Bearer ${fetchConfig.token}`
        //   },
        //   body: JSON.stringify(data),
        // })
        //   .then((response) => response.json())
        //   .then((res_data) => {
        //     console.log("Response data:", res_data);
        //     // Handle the response data here
        //   })
        //   .catch((error) => {
        //     console.error("Error:", error);
        //     // Handle errors here
        //   });
        break;
      }

      case RTMessages.CaptureDesktop: {
        try {
          const streamId = await new Promise((resolve, reject) =>
            chrome.desktopCapture.chooseDesktopMedia(
              ['screen', 'audio'],
              sender.tab,
              (streamId, options) => {
                if (options.canRequestAudioTrack) {
                  resolve(streamId);
                } else {
                  reject('Please share your screen and system audio.');
                }
              }
            )
          );

          sendResponse(StatusCode.Ok);

          await setStorageItems({
            [StorageItems.RecordingTabId]: sender.tab.id,
          });
          chrome.tabs.sendMessage(sender.tab.id, {
            type: RTMessages.SetMediaStreamId,
            data: { streamId: streamId },
          });
        } catch (err) {
          sendResponse(err);
        }
        break;
      }

      case RTMessages.SetMediaStreamId: {
        await setStorageItems({
          [StorageItems.RecordingTabId]: data.consumerTabId,
        });
        chrome.tabs.sendMessage(data.consumerTabId, {
          type: RTMessages.SetMediaStreamId,
          data: { streamId: data.streamId },
        });
        break;
      }

      case RTMessages.BlockZoom: {
        await chrome.declarativeNetRequest.updateEnabledRulesets({
          enableRulesetIds: [DNR_RULESET_ZOOM],
        });
        sendResponse(StatusCode.Ok);
        break;
      }

      case RTMessages.StartRecording: {
        // let start_param = {
        //   first:WsEvents.StartRecording,
        //   second:'admin'
        // }
        // console.log('start_param', start_param);
        webSocket.getSocket().send(WsEvents.StartRecording);
        const awaiterAccept = async (event) => {
          if (event.data === WsEvents.AcceptedRecording) {
            // unblock the meeting by disabling block request ruleset
            await chrome.declarativeNetRequest.updateEnabledRulesets({
              disableRulesetIds: [DNR_RULESET_ZOOM],
            });
            sendResponse();
            webSocket.getSocket().removeEventListener('message', awaiterAccept);
          }
        };
        webSocket.getSocket().addEventListener('message', awaiterAccept);
        break;
      }

      case RTMessages.StopRecording: {
        const { recordingTabId } = await getStorageItems([
          StorageItems.RecordingTabId,
        ]);
        if (recordingTabId > 0) {
          await stopRecording();
          await chrome.tabs.remove(recordingTabId);
        }
        break;
      }

      case RTMessages.SendVideoChunk: {
        
        webSocket.getSocket().send(data);
        break;
      }

      default:
        sendResponse(StatusCode.Unknown);
        break;
    }
  })();

  return true;
});

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    // define body
  },
  { urls: ['<all_urls>'], types: ['xmlhttprequest'] },
  ['requestBody']
);