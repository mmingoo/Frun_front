import axios from 'axios'
import api from './index.js'

export function getNicknameStatus() {
  return axios.get('http://localhost:8080/api/v1/users/me/nickname-status', {
    withCredentials: true,
  })
}

export function checkNickname(nickname) {
  return api.get('/api/v1/users/check', { params: { checkNickname: nickname } })
}

export function setNickname(nickname, profileImage) {
  const formData = new FormData()
  formData.append('nickname', nickname)
  if (profileImage) formData.append('profileImage', profileImage)
  return api.post('/api/v1/users/nickname-setup', formData)
}

export function logout() {
  return api.post('/api/v1/auth/logout')
}
