const endpoints = {
  auth: '/login',
  refresh: '/RefreshEndpoint',
  register: '/StartSession',
}

const cookie = {
  name: 'auth_cookie',
  duration: {
    perm: 2592000,
    temp: 600
  }
}

export { endpoints, cookie };
