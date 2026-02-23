import {Platform} from 'react-native';

const API_PORT = '3000';

const IOS_HOSTS = ['localhost'];
const ANDROID_HOSTS = ['localhost', '10.0.2.2'];

export const API_BASE_URLS = (
  Platform.OS === 'android' ? ANDROID_HOSTS : IOS_HOSTS
).map(host => `http://${host}:${API_PORT}/api`);

export const API_BASE_URL = API_BASE_URLS[0];
