import { StorageItems } from '../enums/StorageItems';

export type LocalStorage = { [key in StorageItems]?: any };

export const getStorageItems = (
  keys: StorageItems[] = []
): Promise<LocalStorage> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result: LocalStorage) => resolve(result));
  });
};

export const setStorageItems = (pairs: LocalStorage): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.set(pairs, () => resolve());
  });
};
