import api from '.'

export function getMypaeInfo() {
  return api.get('/api/v1/users/mypage')
}

export function getFriendPageInfo(userId) {
  return api.get(`/api/v1/users/${userId}/mypage`)
}
