import api from './index.js'

export function toggleLike(postId) {
  return api.post(`/api/v1/feed/${postId}/like`)
}

export function reportPost(postId, reason, etc = '') {
  return api.post(`/api/v1/feed/${postId}/report`, { reason, etc })
}

export function getFeed(cursorId, size = 10) {
  return api.get('/api/v1/running-logs/feed', {
    params: { cursorId, size },
  })
}

export function getRunningLogDetail(runningLogId, authorId) {
  return api.get(`/api/v1/running-logs/${runningLogId}/${authorId}`)
}
