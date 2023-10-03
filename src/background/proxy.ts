import { StorageItems } from '@/utils/enums/StorageItems';
import { getStorageItems, setStorageItems } from '@/utils/helpers/storage';

export const DEFAULT_PROXY_CONFIG = {
  mode: 'fixed_servers',
  rules: {
    proxyForHttps: {
      scheme: 'http',
      host: '192.168.5.251',
      port: 3128,
    },
    bypassList: ['192.168.5.71'],
  },
};

const RESET_PROXY_CONFIG = {
  mode: 'direct', // Set the proxy mode to 'direct' to disable the proxy
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


export function setupProxy(config = DEFAULT_PROXY_CONFIG) {
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

export function stopProxyConnect(config = RESET_PROXY_CONFIG) {
  chrome.proxy.settings.set({ value: config, scope: 'regular' }, function () {
    console.log('Proxy Stop successfully1!');
    chrome.webRequest.onAuthRequired.removeListener(handleAuthRequired);

    setStorageItems({[StorageItems.LoginState]: 0});

    console.log('stopProxyConnect1 successfully1!');
  });
}