import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    hasNickname: null,
    termsAgreed: false,
    marketingAgreed: false,
    accessToken: null, // 메모리에만 보관 (새로고침 시 reissue로 복구)
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
      this.notificationCnt = cnt ?? 0
    },
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
