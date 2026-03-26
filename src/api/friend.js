import api from './index'

export function getFriendList(cursorname, cursorId, size = 30) {
  return api.get('/api/v1/friend/friend-list', {
    params: { cursorname, cursorId, size },
  })
}
