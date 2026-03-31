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

export function getUserRunningLogs(userId, cursorId, size = 12) {
  return api.get(`/api/v1/running-logs/users/${userId}/feeds`, {
    params: { cursorId, size },
  })
}

export function updateRunning(runningLogId, { runDate, runTime, distance, durationMin, durationSec, memo, isPublic, keepImageUrls, newPhotos }) {
  const formData = new FormData()
  formData.append('runDate', runDate)
  if (runTime) formData.append('runTime', runTime)
  formData.append('distance', distance)
  formData.append('durationMin', durationMin)
  formData.append('durationSec', durationSec)
  formData.append('memo', memo)
  formData.append('isPublic', isPublic ? 'true' : 'false')
  keepImageUrls.forEach((url) => formData.append('keepImageUrls', url))
  newPhotos.forEach((photo) => formData.append('newImages', photo.file))
  return api.patch(`/api/v1/running-logs/${runningLogId}`, formData)
}
