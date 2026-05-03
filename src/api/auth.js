import axios from 'axios'
import api from './index.js'

// axios 직접 사용 — 인터셉터를 거치면 accessToken이 없어 401이 발생하므로 우회
export function getNicknameStatus() {
  return axios.get('http://localhost:8081/api/v1/users/me/nickname-status', {
    withCredentials: true,
  })
}

export function checkNickname(nickname) {
  return api.get('/api/v1/users/check', { params: { checkNickname: nickname } })
}

export function setNickname(nickname, profileImage) {
  const formData = new FormData()
  formData.append('nickname', nickname)
  // 프로필 이미지는 선택값 — 없으면 서버가 기본 이미지로 처리
  if (profileImage) formData.append('profileImage', profileImage)
  return api.post('/api/v1/users/nickname-setup', formData)
}

export function getMyProfile() {
  return api.get('/api/v1/users/me')
}

export function logout() {
  return api.post('/api/v1/auth/logout')
}

export function agreeTerms(agreements) {
  return api.post('/api/terms/agree', { agreements })
}

export function updateTermsAgreement(agreements) {
  return api.patch('/api/terms/agree', { agreements })
}

export function getTermsList() {
  return api.get('/api/terms')
}

export function getMyTerms() {
  return api.get('/api/terms/my')
}
