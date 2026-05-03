<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '@/components/layout/NavBar.vue'
import { useAuthStore } from '@/stores/auth'
import { deactivateAccount } from '@/api/user.js'
import { logout as logoutApi } from '@/api/auth.js'

const router = useRouter()
const auth = useAuthStore()

const showDeactivateConfirm = ref(false)
const isDeactivating = ref(false)

// 비활성화 순서: 계정 비활성화 → 백엔드 세션 종료 → 클라이언트 상태 초기화
async function handleDeactivate() {
  showDeactivateConfirm.value = false
  isDeactivating.value = true
  try {
    await deactivateAccount()
    await logoutApi() // 백엔드 refreshToken 쿠키 무효화
    auth.logout() // 클라이언트 accessToken 및 스토어 초기화
    alert('계정을 비활성화하였습니다.')
    router.replace('/')
  } catch (e) {
    const message = e.response?.data?.message
    alert(message)
  } finally {
    isDeactivating.value = false
  }
}
</script>

<template>
  <div class="page-wrap">
    <NavBar />
    <div class="page-grid">
      <div class="main-wrap">
        <div class="page-header">
          <button class="btn-back" @click="router.push('/settings')">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h2 class="page-title">계정 비활성화</h2>
        </div>

        <section class="settings-card danger-card">
          <h3 class="card-title danger-title">주의사항</h3>
          <p class="card-desc">
            계정을 비활성화하면 프로필과 게시물이 숨겨집니다.<br /><br />
            계정은 <strong>3개월 후</strong>에 영구 삭제됩니다.<br /><br />
            3개월 이내에 언제든지 다시 로그인해 복구할 수 있습니다.
          </p>
          <button
            class="btn-deactivate"
            :disabled="isDeactivating"
            @click="showDeactivateConfirm = true"
          >
            <span v-if="isDeactivating" class="spinner spinner-red" />
            <span v-else>계정 비활성화</span>
          </button>
        </section>
      </div>
    </div>
  </div>

  <!-- 비활성화 확인 모달 -->
  <div
    v-if="showDeactivateConfirm"
    class="modal-overlay"
    @click.self="showDeactivateConfirm = false"
  >
    <div class="modal">
      <h3 class="modal-title">계정을 비활성화하시겠습니까?</h3>
      <p class="modal-desc">
        비활성화 후 로그인하면 언제든지 복구할 수 있습니다.<br />
        비활성화 후 3개월이 지나면 계정이 영구적으로 삭제됩니다.
      </p>
      <div class="modal-actions">
        <button class="modal-btn modal-cancel" @click="showDeactivateConfirm = false">취소</button>
        <button class="modal-btn modal-deactivate" @click="handleDeactivate">비활성화</button>
      </div>
    </div>
  </div>
</template>

<style scoped src="./SettingsView.css" />
<style scoped>
.spinner-red {
  border-color: rgba(197, 48, 48, 0.3);
  border-top-color: #c53030;
}
</style>
