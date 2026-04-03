import api from './index'

export function getFriendList(cursorname, cursorId, size = 10) {
  return api.get('/api/v1/friend/friend-list', {
    params: { cursorname: cursorname ?? undefined, cursorId: cursorId ?? undefined, size },
  })
}

export function searchFriend(keyword, cursorname, cursorId, size) {
  return api.get('/api/v1/friend/search', {
    params: { keyword, cursorname, cursorId, size },
  })
}

//친구 삭제
export function deleteFriend(friendId) {
  return api.delete(`/api/v1/friend/${friendId}`)
}

// 친구 요청 보내기
export function requestFriend(receiverId) {
  return api.post(`/api/v1/friend/request/${receiverId}`)
}

// 친구 요청 수락
export function acceptFriend(senderId) {
  return api.post(`/api/v1/friend/request/accept/${senderId}`)
}

// 친구 요청 거절
export function rejectFriend(senderId) {
  return api.delete(`/api/v1/friend/request/reject/${senderId}`)
}
