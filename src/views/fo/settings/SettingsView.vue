<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '@/components/layout/NavBar.vue'
import { useAuthStore } from '@/stores/auth'
import { checkNickname } from '@/api/auth.js'
import { updateNickname, deactivateAccount } from '@/api/user.js'
import { logout as logoutApi } from '@/api/auth.js'

const router = useRouter()
const auth = useAuthStore()

// ── 닉네임 변경 ──────────────────────────────────────────
const nickname = ref('')
const isDuplicateChecked = ref(false)
const duplicateMessage = ref('')
const duplicateStatus = ref('') // 'ok' | 'error' | ''
const isNicknameLoading = ref(false)
const nicknameSaveMsg = ref('')

const nicknamePattern = /^[가-힣a-zA-Z0-9]{5,20}$/

const nicknameError = computed(() => {
  if (!nickname.value) return ''
  if (nickname.value.includes(' ')) return '공백은 사용할 수 없습니다.'
  if (!nicknamePattern.test(nickname.value)) return '5~20자, 한글/영문/숫자만 사용 가능합니다.'
  return ''
})

const canSaveNickname = computed(() => {
  return (
    !nicknameError.value &&
    nickname.value.length >= 5 &&
    isDuplicateChecked.value &&
    duplicateStatus.value === 'ok'
  )
})

function onNicknameInput() {
  isDuplicateChecked.value = false
  duplicateMessage.value = ''
  duplicateStatus.value = ''
  nicknameSaveMsg.value = ''
}

async function checkDuplicate() {
  if (!nickname.value || nicknameError.value) return
  isNicknameLoading.value = true
  try {
    const res = await checkNickname(nickname.value)
    const exists = res.data.data.exists
    if (exists) {
      duplicateStatus.value = 'error'
      duplicateMessage.value = res.data.message
    } else {
      duplicateStatus.value = 'ok'
      duplicateMessage.value = res.data.message
      isDuplicateChecked.value = true
    }
  } finally {
    isNicknameLoading.value = false
  }
}

async function handleSaveNickname() {
  if (!canSaveNickname.value) return
  isNicknameLoading.value = true
  try {
    await updateNickname(nickname.value)
    auth.setNickname(nickname.value)
    alert('닉네임이 변경되었습니다.')
    nicknameSaveMsg.value = '닉네임이 변경되었습니다.'
    nickname.value = ''
    isDuplicateChecked.value = false
    duplicateMessage.value = ''
    duplicateStatus.value = ''
  } catch (e) {
    nicknameSaveMsg.value = e.response?.data?.message ?? '닉네임 변경에 실패했습니다.'
  } finally {
    isNicknameLoading.value = false
  }
}

// ── 계정 비활성화 ─────────────────────────────────────────
const showDeactivateConfirm = ref(false)
const isDeactivating = ref(false)

async function handleDeactivate() {
  showDeactivateConfirm.value = false
  isDeactivating.value = true
  try {
    await deactivateAccount()
    alert('계정이 비활성화되었습니다.')
    await logoutApi()
    auth.logout()
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
        <h2 class="page-title">설정</h2>

        <!-- 닉네임 변경 섹션 -->
        <section class="settings-card">
          <h3 class="card-title">닉네임 변경</h3>
          <p class="card-desc">5~20자, 한글/영문/숫자 사용 가능</p>

          <div class="input-row">
            <input
              v-model="nickname"
              type="text"
              placeholder="새 닉네임 입력"
              maxlength="20"
              class="nickname-input"
              :class="{ 'input-error': nicknameError }"
              @input="onNicknameInput"
            />
            <button
              class="btn-check"
              :disabled="!nickname || !!nicknameError || isNicknameLoading"
              @click="checkDuplicate"
            >
              중복 확인
            </button>
          </div>

          <p v-if="nicknameError" class="msg msg-error">{{ nicknameError }}</p>
          <p
            v-else-if="duplicateMessage"
            class="msg"
            :class="duplicateStatus === 'ok' ? 'msg-ok' : 'msg-error'"
          >
            {{ duplicateMessage }}
          </p>
          <p v-else-if="nickname" class="msg msg-hint">{{ nickname.length }}/20</p>

          <p v-if="nicknameSaveMsg" class="msg msg-save">{{ nicknameSaveMsg }}</p>

          <button
            class="btn-save"
            :disabled="!canSaveNickname || isNicknameLoading"
            @click="handleSaveNickname"
          >
            <span v-if="isNicknameLoading" class="spinner" />
            <span v-else>저장</span>
          </button>
        </section>

        <!-- 계정 비활성화 섹션 -->
        <section class="settings-card danger-card">
          <h3 class="card-title danger-title">계정 비활성화</h3>
          <p class="card-desc">
            계정을 비활성화하면 프로필과 게시물이 숨겨집니다. 계정은 3개월 후에 영구 삭제됩니다.
            3개월 이내에 언제든지 다시 로그인해 복구할 수 있습니다.
          </p>
          <button
            class="btn-deactivate"
            :disabled="isDeactivating"
            @click="showDeactivateConfirm = true"
          >
            계정 비활성화
          </button>
        </section>
      </div>
    </div>
  </div>

  <!-- 계정 비활성화 확인 모달 -->
  <div
    v-if="showDeactivateConfirm"
    class="modal-overlay"
    @click.self="showDeactivateConfirm = false"
  >
    <div class="modal">
      <h3 class="modal-title">계정을 비활성화하시겠습니까?</h3>
      <p class="modal-desc">
        비활성화 후 로그인하면 언제든지 복구할 수 있습니다. 비활성화 후 3개월 후에 계정이 영구적으로
        삭제됩니다.
      </p>
      <div class="modal-actions">
        <button class="modal-btn modal-cancel" @click="showDeactivateConfirm = false">취소</button>
        <button class="modal-btn modal-deactivate" @click="handleDeactivate">비활성화</button>
      </div>
    </div>
  </div>
</template>

<style scoped src="./SettingsView.css" />
