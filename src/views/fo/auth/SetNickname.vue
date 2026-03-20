<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

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
    // TODO: API 연동
    // const res = await api.get(`/members/nickname/check?nickname=${nickname.value}`)
    await new Promise((r) => setTimeout(r, 500))
    const isTaken = false // mock
    if (isTaken) {
      duplicateStatus.value = 'error'
      duplicateMessage.value = '이미 사용 중인 닉네임입니다.'
    } else {
      duplicateStatus.value = 'ok'
      duplicateMessage.value = '사용 가능한 닉네임입니다.'
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
    // TODO: API 연동
    // const formData = new FormData()
    // formData.append('nickname', nickname.value)
    // if (profileImage.value) formData.append('profileImage', profileImage.value)
    // await api.post('/members/nickname', formData)
    await new Promise((r) => setTimeout(r, 500))
    auth.hasNickname = true
    router.push('/feed')
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

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 16px;
  max-width: 440px;
  margin: 0 auto;
}

.title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 6px;
  text-align: center;
}

.subtitle {
  font-size: 13px;
  color: #8e9aaf;
  margin: 0 0 28px;
  text-align: center;
}

/* 프로필 */
.profile-section {
  margin-bottom: 28px;
}

.profile-upload {
  position: relative;
  display: block;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  cursor: pointer;
}

.profile-img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #edf0f7;
  border: 2px dashed #c4cad6;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #8e9aaf;
  font-size: 11px;
  text-align: center;
  line-height: 1.4;
  transition: background 0.2s;
}

.profile-placeholder:hover {
  background: #e2e6f0;
}

.profile-placeholder svg {
  color: #b0b9c8;
}

.camera-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 26px;
  height: 26px;
  background: #3b5bdb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 2px 6px rgba(59, 91, 219, 0.4);
}

.hidden {
  display: none;
}

/* 입력 영역 */
.input-section {
  width: 100%;
  margin-bottom: 24px;
}

.input-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
}

.input-row {
  display: flex;
  gap: 8px;
}

.nickname-input {
  flex: 1;
  height: 44px;
  border: 1.5px solid #dde3ed;
  border-radius: 10px;
  padding: 0 14px;
  font-size: 14px;
  color: #1a1a2e;
  outline: none;
  transition: border-color 0.2s;
  background: #fafbfc;
}

.nickname-input::placeholder {
  color: #b0b9c8;
}

.nickname-input:focus {
  border-color: #3b5bdb;
  background: #fff;
}

.nickname-input.input-error {
  border-color: #e53e3e;
}

.btn-check {
  height: 44px;
  padding: 0 16px;
  background: #3b5bdb;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 0.2s,
    opacity 0.2s;
}

.btn-check:hover:not(:disabled) {
  background: #2f4ac7;
}

.btn-check:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.msg {
  font-size: 12px;
  margin: 6px 0 0 2px;
}

.msg-hint {
  color: #b0b9c8;
}

.msg-ok {
  color: #38a169;
}

.msg-error {
  color: #e53e3e;
}

/* 제출 버튼 */
.btn-submit {
  width: 100%;
  height: 50px;
  background: #3b5bdb;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.2s,
    opacity 0.2s;
  letter-spacing: 0.5px;
}

.btn-submit:hover:not(:disabled) {
  background: #2f4ac7;
}

.btn-submit:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2.5px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 480px) {
  .card {
    padding: 32px 20px 28px;
  }
}
</style>
