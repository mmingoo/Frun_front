import api from '.'

// 댓글 달기
export function saveComment(content, runningLogId) {
  return api.post(`/api/v1/running-logs/${runningLogId}/comments`, { content: content })
}

// 답글 달기
export function saveReply(content, runningLogId, parentId) {
  return api.post(`/api/v1/running-logs/${runningLogId}/${parentId}/comments`, { content: content })
}

//댓글 조회
export function getComment(runningLogId, cursorId, size = 30) {
  return api.get(`/api/v1/running-logs/${runningLogId}/comments`, {
    params: cursorId ? { cursorId, size } : { size },
  })
}

export function getReply(runningLogId, parentId, cursorId, size = 30) {
  return api.get(`/api/v1/running-logs/reply/${parentId}`, {
    params: cursorId ? { cursorId, size } : { size },
  })
}

// 댓글/답글 수정
export function updateComment(commentId, content) {
  return api.patch(`/api/v1/running-logs/comments/${commentId}`, { content })
}

// 댓글 삭제
export function deleteCommentApi(commentId) {
  return api.delete(`/api/v1/running-logs/comments/${commentId}`)
}

