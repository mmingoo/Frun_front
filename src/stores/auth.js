import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    hasNickname: null,       // null=미확인, true=설정됨, false=미설정
    termsAgreed: false,
    marketingAgreed: false,
    accessToken: null,       // 메모리에만 보관 (새로고침 시 reissue로 복구)
    profileImage: null,
    userId: null,
    nickname: null,
    notificationCnt: 0,
  }),

  actions: {
    setAccessToken(token) {
      this.accessToken = token
    },
    setProfileImage(url) {
      this.profileImage = url
    },
    setUserId(id) {
      this.userId = id
    },
    setNickname(nickname) {
      this.nickname = nickname
    },
    setNotificationCnt(cnt) {
      // undefined/null 방어 처리 — 항상 숫자 유지
      this.notificationCnt = cnt ?? 0
    },
    // 로그아웃 시 모든 인증 관련 상태를 초기값으로 리셋
    logout() {
      this.hasNickname = null
      this.termsAgreed = false
      this.marketingAgreed = false
      this.accessToken = null
      this.profileImage = null
      this.userId = null
      this.nickname = null
      this.notificationCnt = 0
    },
  },
})
