import api from './index.js'

export function createRunning({
  runDate,
  runTime,
  distance,
  durationMin,
  durationSec,
  memo,
  isPublic,
  photos,
}) {
  // 이미지 파일을 포함하기 위해 multipart/form-data로 전송
  const formData = new FormData()
  formData.append('runDate', runDate)
  if (runTime) formData.append('runTime', runTime)   // 시간은 선택값
  formData.append('distance', distance)
  formData.append('durationMin', durationMin)
  formData.append('durationSec', durationSec)
  formData.append('memo', memo)
  formData.append('isPublic', isPublic ? 'true' : 'false')  // boolean → 문자열 변환
  photos.forEach((photo) => formData.append('images', photo.file))
  return api.post('/api/v1/running-logs', formData)
}

export function getUserRunningLogs(userId, { cursorId, cursorValue, sortType = 'CREATED_AT', size = 15 } = {}) {
  return api.get(`/api/v1/running-logs/users/${userId}/feeds`, {
    params: {
      cursorId: cursorId ?? undefined,      // null이면 첫 페이지
      cursorValue: cursorValue ?? undefined, // 정렬 타입에 따른 커서 값
      sortType,
      size,
    },
  })
}

export function updateRunning(
  runningLogId,
  {
    runDate,
    runTime,
    distance,
    durationMin,
    durationSec,
    memo,
    isPublic,
    keepImageUrls,
    newPhotos,
  },
) {
  const formData = new FormData()
  formData.append('runDate', runDate)
  if (runTime) formData.append('runTime', runTime)
  formData.append('distance', distance)
  formData.append('durationMin', durationMin)
  formData.append('durationSec', durationSec)
  formData.append('memo', memo)
  formData.append('isPublic', isPublic ? 'true' : 'false')
  // 기존 이미지 중 유지할 URL 목록 — 서버가 이 외의 기존 이미지를 삭제
  keepImageUrls.forEach((url) => formData.append('keepImageUrls', url))
  // 새로 추가한 이미지 파일 목록
  newPhotos.forEach((photo) => formData.append('newImages', photo.file))
  return api.patch(`/api/v1/running-logs/${runningLogId}`, formData)
}
