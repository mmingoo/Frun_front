import api from './index.js'

export function getNotifications(cursorId, size = 15) {
  return api.get('/api/v1/notification', {
    params: { cursorId: cursorId ?? undefined, size },
  })
}

export function deleteSelectedNotifications(selectedNotificationIds) {
  return api.delete('/api/v1/notification/selected-notification', {
    data: { selectedNotificationIds },
  })
}

export function deleteAllNotifications() {
  return api.delete('/api/v1/notification')
}
