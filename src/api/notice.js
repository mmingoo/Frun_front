import api from '.'

export function getNotices(page = 0) {
  return api.get('/api/v1/notices', { params: { page } })
}

export function getNoticeDetail(noticeId) {
  return api.get(`/api/v1/notices/${noticeId}`)
}
