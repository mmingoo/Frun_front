import api from './index.js'

export function createRunning({ runDate, runTime, distance, durationMin, durationSec, memo, isPublic, photos }) {
  const formData = new FormData()
  formData.append('runDate', `${runDate}T${runTime}`)
  formData.append('distance', distance)
  formData.append('durationMin', durationMin)
  formData.append('durationSec', durationSec)
  formData.append('memo', memo)
  formData.append('isPublic', isPublic)
  photos.forEach((photo) => formData.append('photos', photo.file))
  return api.post('/api/v1/running', formData)
}
