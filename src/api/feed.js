import api from './index.js'

export function reportPost(runningLogId, reportReason) {
  return api.post(`/api/v1/reports/${runningLogId}`, { reportReason })
}

export function getFeed(cursorId, size = 30) {
  return api.get('/api/v1/running-logs/feed', {
    params: { cursorId: cursorId ?? undefined, size },
  })
}

export function getRunningLogDetail(runningLogId) {
  return api.get(`/api/v1/running-logs/${runningLogId}`)
}

export function updatedRunning(
  runningLogId,
  { runDate, distance, durationMin, durationSec, memo, isPublic, photos },
) {
  const formData = new FormData()

  formData.append('runDate', runDate)
  formData.append('distance', distance)
  formData.append('durationMin', durationMin)
  formData.append('durationSec', durationSec)
  formData.append('memo', memo)
  formData.append('isPublic', isPublic ? 'true' : 'false')

  if (photos && photos.length > 0) {
    photos.forEach((photo) => formData.append('images', photo.file))
  }

  return api.patch('/api/v1/running-logs/${runningLogId}', formData)
}

export function addLike(runningLogId) {
  return api.post(`/api/v1/running-logs/likes/${runningLogId}`)
}

export function cancelLike(runningLogId) {
  return api.delete(`/api/v1/running-logs/likes/${runningLogId}`)
}

export function deleteRunningLog(runningLogId) {
  return api.delete(`/api/v1/running-logs/${runningLogId}`)
}
