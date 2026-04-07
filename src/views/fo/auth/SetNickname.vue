<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { checkNickname, setNickname, agreeTerms } from '@/api/auth.js'

// termsId: 1=서비스 이용약관, 2=개인정보처리방침, 3=마케팅 정보 수신
const TERMS_SERVICE_ID = 1
const TERMS_PRIVACY_ID = 2
const TERMS_MARKETING_ID = 3

const auth = useAuthStore() // const router = useRouter() 아래에 추가
const router = useRouter()

const nickname = ref('')
const profileImage = ref(null)
const profilePreview = ref(null)
const isDuplicateChecked = ref(false)
const duplicateMessage = ref('')
const duplicateStatus = ref('') // 'ok' | 'error' | ''
const isLoading = ref(false)

const nicknamePattern = /^[가-힣a-zA-Z0-9]{5,20}$/

const nicknameError = computed(() => {
  if (!nickname.value) return ''
  if (nickname.value.includes(' ')) return '공백은 사용할 수 없습니다.'
  if (!nicknamePattern.test(nickname.value)) return '5~20자, 한글/영문/숫자만 사용 가능합니다.'
  return ''
})

const canSubmit = computed(() => {
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
}

function onProfileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
    alert('jpg, jpeg, png 파일만 업로드 가능합니다.')
    return
  }
  if (file.size > 3 * 1024 * 1024) {
    alert('파일 크기는 최대 3MB입니다.')
    return
  }
  profileImage.value = file
  profilePreview.value = URL.createObjectURL(file)
}

async function checkDuplicate() {
  if (!nickname.value || nicknameError.value) return
  isLoading.value = true
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
    isLoading.value = false
  }
}

async function handleSubmit() {
  if (!canSubmit.value) return
  isLoading.value = true
  try {
    await agreeTerms([
      { termsId: TERMS_SERVICE_ID, isAgreed: true },
      { termsId: TERMS_PRIVACY_ID, isAgreed: true },
      { termsId: TERMS_MARKETING_ID, isAgreed: auth.marketingAgreed },
    ])
    await setNickname(nickname.value, profileImage.value)
    auth.hasNickname = true
    router.push('/feed')
  } catch {
    alert('닉네임 저장에 실패했습니다. 다시 시도해주세요.')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="container">
    <h1 class="title">닉네임을 설정해주세요</h1>
    <p class="subtitle">5~20자, 한글/영문/숫자 사용 가능</p>

    <!-- 프로필 사진 -->
    <div class="profile-section">
      <label class="profile-upload" for="profile-input">
        <img v-if="profilePreview" :src="profilePreview" alt="프로필 사진" class="profile-img" />
        <div v-else class="profile-placeholder">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>프로필 사진<br />(선택)</span>
        </div>
        <div class="camera-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z" />
            <path
              d="M9 2 7.17 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3.17L15 2H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"
            />
          </svg>
        </div>
      </label>
      <input
        id="profile-input"
        type="file"
        accept=".jpg,.jpeg,.png"
        class="hidden"
        @change="onProfileChange"
      />
    </div>

    <!-- 닉네임 입력 -->
    <div class="input-section">
      <label class="input-label">닉네임</label>
      <div class="input-row">
        <input
          v-model="nickname"
          type="text"
          placeholder="닉네임 입력"
          maxlength="20"
          class="nickname-input"
          :class="{ 'input-error': nicknameError }"
          @input="onNicknameInput"
        />
        <button
          class="btn-check"
          :disabled="!nickname || !!nicknameError || isLoading"
          @click="checkDuplicate"
        >
          중복 확인
        </button>
      </div>

      <!-- 유효성 / 중복 메시지 -->
      <p v-if="nicknameError" class="msg msg-error">{{ nicknameError }}</p>
      <p
        v-else-if="duplicateMessage"
        class="msg"
        :class="duplicateStatus === 'ok' ? 'msg-ok' : 'msg-error'"
      >
        {{ duplicateMessage }}
      </p>
      <p v-else class="msg msg-hint">{{ nickname.length }}/20</p>
    </div>

    <!-- 시작하기 버튼 -->
    <button class="btn-submit" :disabled="!canSubmit || isLoading" @click="handleSubmit">
      <span v-if="isLoading" class="spinner" />
      <span v-else>시작하기</span>
    </button>
  </div>
</template>

<style scoped src="./SetNickname.css" />
