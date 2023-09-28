import React from 'react';
import ReactDOM from 'react-dom';
import { RouterProvider } from 'react-router-dom';

import baseApi from '@/services/baseApi';
import { StorageItems } from '@/utils/enums/StorageItems';
import { getStorageItems, setStorageItems } from '@/utils/helpers/storage';
import { AUTH_HEADER } from '@/config';
import { RTMessages } from '@/utils/enums/RTMessages';


const { authToken, serverAddr } = await getStorageItems([
  StorageItems.AuthToken,
  StorageItems.ServerAddr,
]);

if (serverAddr) {
  baseApi.defaults.baseURL = `${serverAddr}`;
  console.log('popup_StorageItems.serverAddr,', serverAddr);
  console.log('x.AuthToken,', authToken);
  if (authToken) {
    baseApi.defaults.headers.common[AUTH_HEADER] = authToken;

    try {
      await baseApi.get('/account', {
        headers: {
          Authorization: authToken
        }
      });
    } catch (err) {
      await setStorageItems({ [StorageItems.AuthToken]: '' });
      baseApi.defaults.headers.common[AUTH_HEADER] = '';
    }
  }
}

/**
 * Warning: Don't import router statically
 *
 * static import will cause unexpected behaviors in loader of react-router-dom
 */
const router = (await import('./router')).default;

const root = document.createElement('div');
document.body.appendChild(root);

ReactDOM.render(<RouterProvider router={router} />, root);
