import api from './index.js'

export function toggleLike(postId) {
  return api.post(`/api/v1/feed/${postId}/like`)
}

export function reportPost(postId, reason, etc = '') {
  return api.post(`/api/v1/feed/${postId}/report`, { reason, etc })
}
