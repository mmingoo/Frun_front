import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    hasNickname: null,
  }),

  actions: {
    logout() {
      this.hasNickname = null
    },
  },
})
