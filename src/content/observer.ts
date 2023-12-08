import { RTMessages } from '@/utils/enums/RTMessages';
import { ZoomChatTypes } from '@/utils/enums/zoom';
import { blobUrlToBase64 } from '@/utils/helpers/convert';
import { ZoomChat } from '@/utils/interfaces/zoom';

async function traverseNode(node: Node, data?: ZoomChat) {
  let updated = { ...data };
  const element = node as HTMLElement;
  const classes = Array.from(element.classList ?? []);
  // if (classes.includes('chat-file-transfer')) {
  //   const element = document.querySelector<HTMLElement>('.chat-file-transfer')!;
  //   element.style.display = 'none';
  // }
  if (classes.includes('new-chat-message__container')) {
    updated.order = Number(element.id.split('chat-message-content-')[1]);
  } else if (classes.includes('new-chat-message__text-box')) {
    updated.type = ZoomChatTypes.Message;
    updated.message = element.textContent;
    updated.id = element.id;
  } else if (classes.includes('chat-item__sender')) {
    updated.sender = element.textContent;
  } else if (classes.includes('chat-item__receiver')) {
    updated.receiver = element.textContent;
  } else if (classes.includes('chat-privately')) {
    updated.private = true;
  } else if (classes.includes('new-chat-message__file-box')) {
    updated.type = ZoomChatTypes.File;
    updated.id = element.id;
  } else if (classes.includes('chat-file-item__name')) {
    updated.filename = element.textContent;
  } else if (classes.includes('chat-image-preview-img')) {
    const img = element as HTMLImageElement;
    updated.data = await blobUrlToBase64(img.src);
    updated.type = ZoomChatTypes.Image;
    updated.filename = img.alt;
  }

  for (const child of node.childNodes) {
    const childUpdated = await traverseNode(child, updated);
    updated = { ...childUpdated };
  }
  return updated;
}

export function observeDomMutations() {
  const observer = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        const data = await traverseNode(addedNode);
        if (data.id) {
          chrome.runtime.sendMessage({
            type: RTMessages.ZoomNewMessage,
            data: data,
          });
        }
      }
    }
  });
  observer.observe(document, { childList: true, subtree: true });

  return observer;
}
