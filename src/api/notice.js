import api from '.'

export function getNotices(cursorId) {
  const params = {}
  if (cursorId != null) params.cursorId = cursorId
  return api.get('/api/v1/notices', { params })
}

export function getNoticeDetail(noticeId) {
  return api.get(`/api/v1/notices/${noticeId}`)
}
