import axios from 'axios'
import api, { BASE_URL } from '.'

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

export function updateNickname(nickname) {
  return api.patch('/api/v1/users/nickname', { nickname: nickname })
}

export function deactivateAccount() {
  return api.delete('/api/v1/users/deactivate')
}

// code(UUID)로 임시 토큰 발급 — 인터셉터 우회 (인증 전 단계)
export function getInactiveTempToken(code) {
  return axios.post(`${BASE_URL}/api/v1/users/inactive/token`, null, {
    params: { code },
  })
}

// 임시 토큰을 직접 헤더에 담아 전송 (인터셉터 우회)
export function activateAccount(tempToken) {
  return axios.patch(
    `${BASE_URL}/api/v1/users/activate`,
    {},
    {
      headers: { Authorization: `Bearer ${tempToken}` },
      withCredentials: true, // refreshToken 쿠키 수신
    },
  )
}

export function getInactiveInfo(tempToken) {
  return axios.get(`${BASE_URL}/api/v1/users/inactive-info`, {
    headers: { Authorization: `Bearer ${tempToken}` },
  })
}
