<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { checkNickname, setNickname, agreeTerms, logout } from '@/api/auth.js'

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
let _savedCheckState = null // captured on file input click, before the nickname watcher runs

const nicknamePattern = /^[가-힣a-zA-Z0-9]{5,10}$/

// 닉네임 형식 유효성 검사 — 공백 우선 체크 후 패턴 검사
const nicknameError = computed(() => {
  if (!nickname.value) return ''
  if (nickname.value.includes(' ')) return '공백은 사용할 수 없습니다.'
  if (!nicknamePattern.test(nickname.value)) return '5~10자, 한글/영문/숫자만 사용 가능합니다.'
  return ''
})

// 형식 유효 + 중복 확인 통과 + 5자 이상을 모두 만족해야 제출 가능
const canSubmit = computed(() => {
  return (
    !nicknameError.value &&
    nickname.value.length >= 5 &&
    isDuplicateChecked.value &&
    duplicateStatus.value === 'ok'
  )
})

// 닉네임 변경 시 중복 확인 초기화 — 이전 확인 결과가 새 입력에 적용되지 않도록
watch(nickname, () => {
  isDuplicateChecked.value = false
  duplicateMessage.value = ''
  duplicateStatus.value = ''
})

function onProfileClick() {
  // 파일 picker가 열리기 전, nickname watcher가 실행되기 전 시점에 상태를 캡처
  // (포커스 이탈 시 IME 조합 확정 → nickname 변경 → watcher 실행 순서로 인해
  //  onProfileChange가 호출될 때는 이미 watcher가 상태를 초기화한 후임)
  _savedCheckState = {
    checked: isDuplicateChecked.value,
    message: duplicateMessage.value,
    status: duplicateStatus.value,
    nickname: nickname.value,
  }
}

function onProfileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
    alert('jpg, jpeg, png 파일만 업로드 가능합니다.')
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    alert('파일 크기는 최대 10MB입니다.')
    return
  }
  profileImage.value = file
  profilePreview.value = URL.createObjectURL(file)

  // 닉네임이 바뀌지 않았다면 중복확인 상태를 복원
  const saved = _savedCheckState
  if (saved?.checked && saved.nickname === nickname.value) {
    isDuplicateChecked.value = true
    duplicateMessage.value = saved.message
    duplicateStatus.value = saved.status
  }
}

async function checkDuplicate() {
  if (!nickname.value || nicknameError.value) return
  isLoading.value = true
  try {
    const res = await checkNickname(nickname.value)
    const exists = res.data.data.exists
    if (exists) {
      // 중복 있음 — 제출 불가 상태
      duplicateStatus.value = 'error'
      duplicateMessage.value = res.data.message
    } else {
      // 중복 없음 — 제출 가능 상태
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
    // TermsView에서 저장한 마케팅 동의 여부를 포함해 약관 API 호출
    await agreeTerms([
      { termsId: TERMS_SERVICE_ID, isAgreed: true },
      { termsId: TERMS_PRIVACY_ID, isAgreed: true },
      { termsId: TERMS_MARKETING_ID, isAgreed: auth.marketingAgreed },
    ])
    await setNickname(nickname.value, profileImage.value)
    auth.hasNickname = true
    sessionStorage.removeItem('_inSignupFlow')  // 가입 진행 중 플래그 제거
    router.push('/feed')
  } catch {
    alert('닉네임 저장에 실패했습니다. 다시 시도해주세요.')
  } finally {
    isLoading.value = false
  }
}

async function handleCancel() {
  try {
    await logout()
  } catch {
    // 실패해도 클라이언트 상태는 초기화
  }
  auth.logout()
  sessionStorage.removeItem('_inSignupFlow')
  alert('로그아웃 하였습니다.')
  router.push('/')
}
</script>

<template>
  <div class="container">
    <h1 class="title">닉네임을 설정해주세요</h1>
    <p class="subtitle" style="margin-bottom: 4px">jpg, jpeg, png 형식, 최대 3MB</p>
    <p class="subtitle">5~10자, 한글/영문/숫자 사용 가능</p>

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
        @click="onProfileClick"
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
          maxlength="10"
          class="nickname-input"
          :class="{ 'input-error': nicknameError }"
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
      <p v-else class="msg msg-hint">{{ nickname.length }}/10</p>
    </div>

    <!-- 시작하기 버튼 -->
    <button class="btn-submit" :disabled="!canSubmit || isLoading" @click="handleSubmit">
      <span v-if="isLoading" class="spinner" />
      <span v-else>시작하기</span>
    </button>
    <button class="btn-cancel" @click="handleCancel">취소</button>
  </div>
</template>

<style scoped src="./SetNickname.css" />
