import axios from 'axios'
import { useAuthStore } from '@/stores/auth.js'

export const BASE_URL = 'http://localhost:8081'

const api = axios.create({
  baseURL: BASE_URL,
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

let _inactiveAlertHandled = false
let _refreshExpiredHandled = false

let isRefreshing = false
let waitQueue = [] // [{ resolve, reject }] 형태

// 응답 인터셉터 - 401 시 refreshToken 쿠키로 accessToken 재발급
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && error.response?.data?.code === 'ACCOUNT_INACTIVE') {
      if (!_inactiveAlertHandled) {
        _inactiveAlertHandled = true
        const auth = useAuthStore()
        auth.logout()
        sessionStorage.setItem('_accountInactive', '1')
        alert('계정이 비활성화 되었습니다.')
        window.location.href = '/'
      }
      return new Promise(() => {})
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/logout')) {
        return Promise.resolve()
      }

      // 이미 reissue 진행 중이면 대기열에 추가
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          waitQueue.push({ resolve, reject })
        }).then(() => {
          const auth = useAuthStore()
          originalRequest.headers.Authorization = `Bearer ${auth.accessToken}`
          originalRequest._retry = true
          return api(originalRequest)
        })
      }

      isRefreshing = true
      originalRequest._retry = true

      try {
        // refreshToken 쿠키 자동 전송 → 백엔드가 새 accessToken을 JSON으로 응답
        const res = await axios.post(
          'http://localhost:8081/api/v1/auth/reissue',
          {},
          { withCredentials: true },
        )

        const newAccessToken = res.data.data.accessToken
        const auth = useAuthStore()
        auth.setAccessToken(newAccessToken)

        // 대기 중인 요청들 모두 해제
        waitQueue.forEach(({ resolve }) => resolve())
        waitQueue = []

        // 실패했던 요청 새 토큰으로 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // 대기 중인 요청들 모두 실패 처리
        waitQueue.forEach(({ reject }) => reject(refreshError))
        waitQueue = []

        const auth = useAuthStore()
        // 이미 로그아웃된 상태면 alert 없이 reject → 호출부 catch 블록이 정상 처리
        if (!auth.accessToken) {
          return Promise.reject(refreshError)
        }
        // 재발급도 실패 → 로그아웃
        if (!_refreshExpiredHandled && !sessionStorage.getItem('_refreshExpired')) {
          _refreshExpiredHandled = true
          sessionStorage.setItem('_refreshExpired', '1')
          const message = refreshError.response?.data?.message
          if (message) alert(message)
          auth.logout()
          const path = window.location.pathname
          if (path !== '/' && path !== '/inactive') {
            window.location.href = '/'
          }
        }
        return new Promise(() => {})
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api
