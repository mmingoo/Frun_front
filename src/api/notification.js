import api from './index.js'

export function getNotifications(cursorId, size = 15) {
  return api.get('/api/v1/notification', {
    params: { cursorId: cursorId ?? undefined, size },
  })
}
