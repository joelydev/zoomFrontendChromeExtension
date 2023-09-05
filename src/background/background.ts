import { DNR_RULESET_ZOOM } from '@/utils/constants/dnr';
import { RTMessages } from '@/utils/enums/RTMessages';
import { StatusCode } from '@/utils/enums/StatusCodes';
import { StorageItems } from '@/utils/enums/StorageItems';
import { WsEvents } from '@/utils/enums/WebSocketEvents';
import { getStorageItems, setStorageItems } from '@/utils/helpers/storage';
import setupProxy from './proxy';
import webSocket from './websocket';
import baseApi from '../services/baseApi';


let fetchConfig = {
  baseUrl: "",
  token: ""
};

chrome.runtime.onInstalled.addListener(() => {
  // console.log('chrome.runtime.onInstalled.addListener_before_setupProxy');
  // setupProxy();
});

chrome.windows.onCreated.addListener(() => {
  // console.log('chrome.runtime.onCreated.addListener_before_setupProxy');
  // setupProxy();
});

const stopRecording = async () => {
  webSocket.send(WsEvents.StopRecording);
  await setStorageItems({ [StorageItems.RecordingTabId]: 0 });
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    chrome.declarativeNetRequest.getEnabledRulesets().then(rulesets => {
      if (rulesets.includes(DNR_RULESET_ZOOM)) {
        chrome.declarativeNetRequest.updateEnabledRulesets({
          disableRulesetIds: [DNR_RULESET_ZOOM]
        });
        chrome.tabs.reload(tabId);
      }
    });
  }

  getStorageItems([StorageItems.RecordingTabId]).then(({ recordingTabId }) => {
    if (recordingTabId === tabId) {
      stopRecording();
    }
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  getStorageItems([StorageItems.RecordingTabId]).then(({ recordingTabId }) => {
    if (recordingTabId === tabId) {
      stopRecording();
    }
  });
});

chrome.runtime.onMessage.addListener(
  ({ type, data }, sender, sendResponse) => {
    (async () => {
      switch (type) {
        case RTMessages.SetServerAddr:
          fetchConfig.baseUrl = data.addr;
          break;
        case RTMessages.SetToken:
          fetchConfig.token = data.token;
          break;
        case RTMessages.SetProxy:
          console.log('RTMessages.SetProxy_called');
          setupProxy();
          break;
        case RTMessages.ZoomNewMessage: {
          const url = `${fetchConfig.baseUrl}/api/chat/msg`;

          console.log('chat_msg_param:', data);
          fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${fetchConfig.token}`
            },
            body: JSON.stringify(data),
          })
            .then((response) => response.json())
            .then((res_data) => {
              console.log("Response data:", res_data);
              // Handle the response data here
            })
            .catch((error) => {
              console.error("Error:", error);
              // Handle errors here
            });
          break;
        }

        case RTMessages.ZoomSendFile: {
          console.log('File Transfer', data);
          const url = `${fetchConfig.baseUrl}/chat/filetransfer`;

          fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${fetchConfig.token}`
            },
            body: JSON.stringify(data),
          })
            .then((response) => response.json())
            .then((res_data) => {
              console.log("Response data:", res_data);
              // Handle the response data here
            })
            .catch((error) => {
              console.error("Error:", error);
              // Handle errors here
            });
          break;
        }

        case RTMessages.CaptureDesktop: {
          try {
            const streamId = await new Promise((resolve, reject) => chrome.desktopCapture.chooseDesktopMedia(['screen', 'audio'], sender.tab, (streamId, options) => {
              if (options.canRequestAudioTrack) {
                resolve(streamId);
              } else {
                reject('Please share your screen and system audio.');
              }
            }));

            sendResponse(StatusCode.Ok);

            await setStorageItems({ [StorageItems.RecordingTabId]: sender.tab.id });
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
          await setStorageItems({ [StorageItems.RecordingTabId]: data.consumerTabId });
          chrome.tabs.sendMessage(data.consumerTabId, {
            type: RTMessages.SetMediaStreamId,
            data: { streamId: data.streamId },
          });
          break;
        }

        case RTMessages.BlockZoom: {
          await chrome.declarativeNetRequest.updateEnabledRulesets({
            enableRulesetIds: [DNR_RULESET_ZOOM]
          });
          sendResponse(StatusCode.Ok);
          break;
        }

        case RTMessages.StartRecording: {
          webSocket.send(WsEvents.StartRecording);
          const awaiterAccept = async (event) => {
            if (event.data === WsEvents.AcceptedRecording) {
              // unblock the meeting by disabling block request ruleset
              await chrome.declarativeNetRequest.updateEnabledRulesets({
                disableRulesetIds: [DNR_RULESET_ZOOM]
              });
              sendResponse();
              webSocket.removeEventListener('message', awaiterAccept);
            }
          };
          webSocket.addEventListener('message', awaiterAccept);
          break;
        }

        case RTMessages.StopRecording: {
          const { recordingTabId } = await getStorageItems([StorageItems.RecordingTabId]);
          if (recordingTabId > 0) {
            await stopRecording();
            await chrome.tabs.remove(recordingTabId);
          }
          break;
        }

        case RTMessages.SendVideoChunk: {
          webSocket.send(data);
          break;
        }

        default:
          sendResponse(StatusCode.Unknown);
          break;
      }
    })();

    return true;
  }
);

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.type === "saveCSV") {
//     // for utf8 bom 
//     const data = '\uFEFF' + request.data;
//     const blob = new Blob([data], { type: "text/csv;charset=utf-8" });

//     // use BlobReader object to read Blob data
//     const reader = new FileReader();
//     reader.onload = () => {
//       const buffer = reader.result;
//       const blobUrl = `data:${blob.type};base64,${btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''))}`;
//       chrome.downloads.download({
//         url: blobUrl,
//         filename: request.filename,
//         saveAs: true,
//         conflictAction: "uniquify"
//       }, () => {
//         sendResponse({ success: true });
//       });
//     };
//     reader.readAsArrayBuffer(blob);
//     return true;
//   }
// });

chrome.webRequest.onBeforeRequest.addListener(
  function(details) {

    // if (fileInput.files.length > 0) {
    //   const file = fileInput.files[0];
    //   formData.append('file', file);
    // }
    // if (details.method === 'POST' && details.url.startsWith("https://ngxsp.cloud.zoom.us/wc/fileupload")  && details.requestBody.raw) {
    //     const rawDataArray = details.requestBody.raw[0];
    //     const rawDataString = new TextDecoder().decode(rawDataArray.bytes);
    //     console.log("---------chrome.rawDataString--------", rawDataString);
    //     const data = '\uFEFF' + rawDataString;
    //     const blob = new Blob([data], { type: "text/plain;charset=utf-8" });
    //     // use BlobReader object to read Blob data
    //   const reader = new FileReader();
    //   reader.onload = () => {
    //     const buffer = reader.result;
    //     const blobUrl = `data:${blob.type};base64,${btoa(new Uint8Array(rawDataArray.bytes).reduce((data, byte) => data + String.fromCharCode(byte), ''))}`;
    //     chrome.downloads.download({
    //       url: blobUrl,
    //       filename: "66667.txt",
    //       saveAs: true,
    //       conflictAction: "uniquify"
    //     }, () => {
    //       // Response({ success: true });
    //     });
    //   };
    //   reader.readAsArrayBuffer(blob);
    // }
    // Check if the request is related to file upload
    // if (details.method === 'POST' && details.url.startsWith("https://ngxsp.cloud.zoom.us/wc/fileupload")) {
    //   chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    //     chrome.tabs.sendMessage(tabs[0].id, {
    //       type: RTMessages.InteractWithUploadForm 
    //     })
    //   })
    // }
  },
  { urls: ["<all_urls>"], types: ["xmlhttprequest"] },
  ["requestBody"]
);

chrome.webRequest.onCompleted.addListener((details) => {
    },{urls: ["<all_urls>"]}
);

chrome.webRequest.onErrorOccurred.addListener((details)=> {
  }, {urls: ["<all_urls>"]}
);