import axios from 'axios'
import { useAuthStore } from '@/stores/auth.js'

const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true, // accessToken, refreshToken 쿠키 자동 전송
})

// 응답 인터셉터 - 401 응답 시 accessToken 자동 재발급
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // 401이고 재시도 안 한 요청만 재발급 시도
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // refreshToken 쿠키가 자동으로 전송됨
        // 백엔드가 새 accessToken을 Set-Cookie로 응답
        await axios.post(
          'http://localhost:8080/api/v1/auth/reissue',
          {},
          { withCredentials: true },
        )

        // 실패했던 요청 재시도 (새 쿠키가 자동으로 실림)
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
