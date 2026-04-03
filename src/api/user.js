import api from '.'

export function getUserPageInfo(userId) {
  return api.get(`/api/v1/users/${userId}/mypage`)
}

// 프로필 이미지, userId 반환
export function getMyInfo() {
  return api.get('/api/v1/users/me')
}

export function updatUserProfile(bio, profileImage) {
  // 이미지까지 전송 위해 FormData 로 전송
  const formData = new FormData()
  formData.append('bio', bio)

  // 이미지 있는 경우만 담기
  if (profileImage) formData.append('profileImage', profileImage)

  return api.patch(`/api/v1/users/profile`, formData)
}
