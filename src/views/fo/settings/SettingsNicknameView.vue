<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '@/components/layout/NavBar.vue'
import { useAuthStore } from '@/stores/auth'
import { checkNickname } from '@/api/auth.js'
import { updateNickname } from '@/api/user.js'

const router = useRouter()
const auth = useAuthStore()

const nickname = ref(auth.nickname ?? '')
const hasTouched = ref(false)
const isDuplicateChecked = ref(false)
const duplicateMessage = ref('')
const duplicateStatus = ref('')
const isNicknameLoading = ref(false)

const nicknamePattern = /^[가-힣a-zA-Z0-9]{5,20}$/

const nicknameError = computed(() => {
  if (!nickname.value || !hasTouched.value) return ''
  if (nickname.value === auth.nickname) return '현재 닉네임과 동일합니다.'
  if (nickname.value.includes(' ')) return '공백은 사용할 수 없습니다.'
  if (/[ㄱ-ㅎㅏ-ㅣ]/.test(nickname.value)) return '한글 자음/모음만 단독으로 사용할 수 없습니다.'
  if (!nicknamePattern.test(nickname.value)) return '5~20자, 한글/영문/숫자만 사용 가능합니다.'
  return ''
})

const canSaveNickname = computed(() => {
  return (
    hasTouched.value &&
    !nicknameError.value &&
    nickname.value.length >= 5 &&
    nickname.value !== auth.nickname &&
    isDuplicateChecked.value &&
    duplicateStatus.value === 'ok'
  )
})

function onNicknameInput() {
  hasTouched.value = true
  isDuplicateChecked.value = false
  duplicateMessage.value = ''
  duplicateStatus.value = ''
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
    router.back()
  } catch (e) {
    alert(e.response?.data?.message ?? '닉네임 변경에 실패했습니다.')
  } finally {
    isNicknameLoading.value = false
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
          <h2 class="page-title">닉네임 변경</h2>
        </div>

        <section class="settings-card">
          <p class="card-desc">5~20자, 한글/영문/숫자 사용 가능</p>

          <div class="input-row">
            <input
              v-model="nickname"
              type="text"
              placeholder="닉네임을 입력하세요"
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

          <button
            class="btn-save"
            :disabled="!canSaveNickname || isNicknameLoading"
            @click="handleSaveNickname"
          >
            <span v-if="isNicknameLoading" class="spinner" />
            <span v-else>저장</span>
          </button>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped src="./SettingsView.css" />
