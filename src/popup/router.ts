import { RouteObject, createMemoryRouter, redirect } from 'react-router-dom';

import baseApi from '@/services/baseApi';
import { POPUP_PATH } from '@/utils/constants/popup';

import App from './App';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Loading from './pages/Loading';
import ServerInfo from './pages/ServerInfo';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import { AUTH_HEADER } from '@/config';

const routes: RouteObject[] = [
  {
    path: '/',
    Component: App,
    loader: async ({ request }) => {
      const url = new URL(request.url);

      if (!baseApi.defaults.baseURL) {
        if (url.pathname !== POPUP_PATH.serverInfo) {
          return redirect(POPUP_PATH.serverInfo);
        }
        return true;
      }

      if (baseApi.defaults.headers.common[AUTH_HEADER]) {
        return true;
      } else {
        if (url.pathname !== POPUP_PATH.signIn) {
          return redirect(POPUP_PATH.signIn);
        }
        return true;
      }
    },
    children: [
      { path: POPUP_PATH.home, Component: Home },
      { path: POPUP_PATH.serverInfo, Component: ServerInfo },
      { path: POPUP_PATH.signIn, Component: SignIn },
      { path: POPUP_PATH.signUp, Component: SignUp },
      { path: POPUP_PATH.forgotPassword, Component: ForgotPassword },
      { path: POPUP_PATH.loading, Component: Loading },
    ],
  },
];

const router = createMemoryRouter(routes, {
  initialEntries: [POPUP_PATH.home],
});

export default router;
