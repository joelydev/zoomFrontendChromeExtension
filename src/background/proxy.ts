import { StorageItems } from '@/utils/enums/StorageItems';
import { getStorageItems } from '@/utils/helpers/storage';

export const DEFAULT_PROXY_CONFIG = {
  mode: 'fixed_servers',
  rules: {
    proxyForHttps: {
      scheme: 'http',
      host: '192.168.5.61',
      port: 3128,
    },
    bypassList: ['localhost'],
  },
};


export const handleAuthRequired = async (_, callbackFn) => {
  console.log('handleAuthRequired', callbackFn);
  const { proxyUsername, proxyPassword } = await getStorageItems([StorageItems.ProxyUsername, StorageItems.ProxyPassword]);

  console.log('proxyUsername', proxyUsername);
  console.log('proxyPassword', proxyPassword);
  callbackFn({
    authCredentials: {
      username: proxyUsername || 'invalid',
      password: proxyPassword || 'invalid'
    }
  });
};


export default function setupProxy(config = DEFAULT_PROXY_CONFIG) {
  chrome.proxy.settings.set({ value: config, scope: 'regular' }, function () {
    console.log('Setup proxy successfully3!');

    // set basic HTTP credentials of username and password instead of inputting by chrome <sign in> prompt
    chrome.webRequest.onAuthRequired.removeListener(handleAuthRequired);
    console.log('Setup proxy successfully1!');
    chrome.webRequest.onAuthRequired.addListener(
      handleAuthRequired,
      { urls: ['<all_urls>'] }, ['asyncBlocking']
    );
    console.log('Setup proxy successfully2!');
  });
}
