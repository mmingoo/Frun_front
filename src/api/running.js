import api from './index.js'

export function createRunning({
  runDate,
  distance,
  durationMin,
  durationSec,
  memo,
  isPublic,
  photos,
}) {
  const formData = new FormData()
  formData.append('runDate', runDate)
  formData.append('distance', distance)
  formData.append('durationMin', durationMin)
  formData.append('durationSec', durationSec)
  formData.append('memo', memo)
  formData.append('isPublic', isPublic ? 'true' : 'false')
  photos.forEach((photo) => formData.append('images', photo.file))
  return api.post('/api/v1/running-logs', formData)
}

export function getMyRunningLogs(cursorId, size = 12) {
  return api.get('api/v1/running-logs/my', {
    params: { cursorId, size },
  })
}

export function getFriendRunningLogs(userId, cursorId, size = 12) {
  return api.get(`api/v1/running-logs/user/${userId}`, {
    params: { cursorId, size },
  })
}
