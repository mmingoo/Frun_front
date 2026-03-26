import axios from 'axios'
import { useAuthStore } from '@/stores/auth.js'

const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true, // refreshToken HttpOnly 쿠키 자동 전송
})

// 요청 인터셉터 - 메모리의 accessToken을 Authorization 헤더에 담기
api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }
  return config
})

// 응답 인터셉터 - 401 시 refreshToken 쿠키로 accessToken 재발급
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // refreshToken 쿠키 자동 전송 → 백엔드가 새 accessToken을 JSON으로 응답
        const res = await axios.post(
          'http://localhost:8080/api/v1/auth/reissue',
          {},
          { withCredentials: true },
        )

        const newAccessToken = res.data.data.accessToken
        const auth = useAuthStore()
        auth.setAccessToken(newAccessToken)

        // 실패했던 요청 새 토큰으로 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch {
        // 재발급도 실패 → 로그아웃
        const auth = useAuthStore()
        auth.logout()
        if (window.location.pathname !== '/') {
          window.location.href = '/'
        }
      }
    }

    return Promise.reject(error)
  },
)

export default api
