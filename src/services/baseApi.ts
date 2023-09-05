import axios from 'axios';

const baseApi = axios.create({
  withCredentials: true,
});

baseApi.interceptors.response.use((res) => res.data);

export default baseApi;
