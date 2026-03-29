import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    hasNickname: null,
    accessToken: null, // 메모리에만 보관 (새로고침 시 reissue로 복구)
    profileImage: null,
  }),

  actions: {
    setAccessToken(token) {
      this.accessToken = token
    },
    setProfileImage(url) {
      this.profileImage = url
    },
    logout() {
      this.hasNickname = null
      this.accessToken = null
      this.profileImage = null
    },
  },
})
