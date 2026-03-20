import { defineStore } from 'pinia'

// auth 저장소 생성
export const useAuthStore = defineStore('auth', {
  // 저장소에서 관리할 데이터(변수) 를 정의하는 곳
  state: () => ({
    hasNickname: null,
  }),

  // store의 메서드를 정의하는 곳
  actions: {
    logout() {
      this.hasNickname = null
    },
  },
})
