<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoading = ref(false)

// 날짜/시간 (현재 날짜/시간 기본값)
const now = new Date()
const padTwo = (n) => String(n).padStart(2, '0')
const defaultDate = `${now.getFullYear()}-${padTwo(now.getMonth() + 1)}-${padTwo(now.getDate())}`
const defaultTime = `${padTwo(now.getHours())}:${padTwo(now.getMinutes())}`

const runDate = ref(defaultDate)
const runTime = ref(defaultTime)

// 거리 / 러닝시간
const distance = ref('')
const durationMin = ref('')
const durationSec = ref('')

// 페이스 자동 계산
const pace = computed(() => {
  const dist = parseFloat(distance.value)
  const mins = parseInt(durationMin.value) || 0
  const secs = parseInt(durationSec.value) || 0
  const totalMin = mins + secs / 60
  if (!dist || dist <= 0 || !totalMin) return ''
  const paceMin = Math.floor(totalMin / dist)
  const paceSec = Math.round(((totalMin / dist) - paceMin) * 60)
  return `${paceMin}'${String(paceSec).padStart(2, '0')}"`
})

// 사진 첨부 (최대 5개)
const photos = ref([])
const photoInputRef = ref(null)

function openPhotoInput() {
  if (photos.value.length >= 5) return
  photoInputRef.value?.click()
}

function onPhotoChange(e) {
  const files = Array.from(e.target.files)
  for (const file of files) {
    if (photos.value.length >= 5) break
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      alert('jpg, jpeg, png 파일만 업로드 가능합니다.')
      continue
    }
    if (file.size > 3 * 1024 * 1024) {
      alert('파일 크기는 최대 3MB입니다.')
      continue
    }
    photos.value.push({ file, preview: URL.createObjectURL(file) })
  }
  e.target.value = ''
}

function removePhoto(index) {
  URL.revokeObjectURL(photos.value[index].preview)
  photos.value.splice(index, 1)
}

// 메모
const memo = ref('')

// 공개 설정
const isPublic = ref(true)

// 유효성
const distanceError = computed(() => {
  if (!distance.value) return ''
  const v = parseFloat(distance.value)
  if (isNaN(v) || v <= 0) return '올바른 거리를 입력해주세요.'
  return ''
})

const durationError = computed(() => {
  if (!durationMin.value && !durationSec.value) return ''
  const secs = parseInt(durationSec.value) || 0
  if (secs >= 60) return '초는 0~59 사이로 입력해주세요.'
  return ''
})

const canSubmit = computed(() => {
  return (
    distance.value &&
    !distanceError.value &&
    (durationMin.value || durationSec.value) &&
    !durationError.value
  )
})

async function handleSubmit() {
  if (!canSubmit.value) return
  isLoading.value = true
  try {
    // TODO: API 연동
    // const formData = new FormData()
    // formData.append('runDate', `${runDate.value}T${runTime.value}`)
    // formData.append('distance', distance.value)
    // ...
    await new Promise((r) => setTimeout(r, 600))
    router.push('/feed')
  } finally {
    isLoading.value = false
  }
}

function handleCancel() {
  router.back()
}
</script>

<template>
  <div class="container">
    <!-- 헤더 -->
    <div class="page-header">
      <h1 class="title">러닝일지 작성</h1>
    </div>

    <form class="form" @submit.prevent="handleSubmit">

        <!-- 날짜 / 시간 -->
        <div class="form-group">
          <label class="group-label">
            날짜 / 시간
            <span class="badge-optional">선택</span>
          </label>
          <div class="row-2">
            <div class="input-wrap">
              <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <input v-model="runDate" type="date" class="base-input" />
            </div>
            <div class="input-wrap">
              <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <input v-model="runTime" type="time" class="base-input" />
            </div>
          </div>
        </div>

        <!-- 거리 / 러닝시간 -->
        <div class="form-group">
          <div class="row-2">
            <!-- 거리 -->
            <div class="sub-group">
              <label class="group-label">
                거리 (km)
                <span class="badge-required">필수</span>
              </label>
              <div class="input-wrap" :class="{ 'input-error': distanceError }">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 12h18M3 6h18M3 18h18"/>
                </svg>
                <input
                  v-model="distance"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="예: 5.20"
                  class="base-input"
                />
              </div>
              <p v-if="distanceError" class="msg msg-error">{{ distanceError }}</p>
            </div>

            <!-- 러닝시간 -->
            <div class="sub-group">
              <label class="group-label">
                러닝 시간
                <span class="badge-required">필수</span>
              </label>
              <div class="duration-row">
                <div class="input-wrap" :class="{ 'input-error': durationError }">
                  <input
                    v-model="durationMin"
                    type="number"
                    min="0"
                    placeholder="분"
                    class="base-input text-center"
                  />
                </div>
                <span class="duration-sep">:</span>
                <div class="input-wrap" :class="{ 'input-error': durationError }">
                  <input
                    v-model="durationSec"
                    type="number"
                    min="0"
                    max="59"
                    placeholder="초"
                    class="base-input text-center"
                  />
                </div>
              </div>
              <p v-if="durationError" class="msg msg-error">{{ durationError }}</p>
            </div>
          </div>
        </div>

        <!-- 페이스 (자동 계산) -->
        <div class="form-group">
          <label class="group-label">
            페이스
            <span class="badge-auto">자동 계산</span>
          </label>
          <div class="pace-display" :class="{ 'pace-filled': pace }">
            <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            <span v-if="pace" class="pace-value">{{ pace }} / km</span>
            <span v-else class="pace-placeholder">거리와 시간을 입력하면 자동으로 계산됩니다</span>
          </div>
        </div>

        <!-- 사진 첨부 -->
        <div class="form-group">
          <label class="group-label">
            사진 첨부
            <span class="badge-optional">최대 5장</span>
          </label>
          <div class="photo-grid">
            <div
              v-for="(photo, i) in photos"
              :key="i"
              class="photo-item"
            >
              <img :src="photo.preview" :alt="`사진 ${i + 1}`" class="photo-preview" />
              <button type="button" class="photo-remove" @click="removePhoto(i)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <button
              v-if="photos.length < 5"
              type="button"
              class="photo-add"
              @click="openPhotoInput"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              <span>추가</span>
            </button>
          </div>
          <input
            ref="photoInputRef"
            type="file"
            accept=".jpg,.jpeg,.png"
            multiple
            class="hidden"
            @change="onPhotoChange"
          />
        </div>

        <!-- 메모 -->
        <div class="form-group">
          <label class="group-label">
            메모
            <span class="badge-optional">선택</span>
          </label>
          <textarea
            v-model="memo"
            placeholder="오늘 러닝 소감을 입력해세요..."
            class="memo-input"
            rows="4"
            maxlength="500"
          />
          <p class="char-count">{{ memo.length }} / 500</p>
        </div>

        <!-- 공개 설정 -->
        <div class="form-group">
          <label class="group-label">공개 설정</label>
          <div class="visibility-row">
            <button
              type="button"
              class="vis-btn"
              :class="{ active: isPublic }"
              @click="isPublic = true"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              공개
            </button>
            <button
              type="button"
              class="vis-btn"
              :class="{ active: !isPublic }"
              @click="isPublic = false"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              비공개
            </button>
          </div>
        </div>

        <!-- 버튼 영역 -->
        <div class="action-row">
          <button type="button" class="btn-cancel" @click="handleCancel">
            취소
          </button>
          <button
            type="submit"
            class="btn-submit"
            :disabled="!canSubmit || isLoading"
          >
            <span v-if="isLoading" class="spinner" />
            <template v-else>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              저장하기
            </template>
          </button>
        </div>

    </form>
  </div>
</template>

<style scoped>
.container {
  padding: 40px 16px 60px;
  max-width: 560px;
  margin: 0 auto;
}

/* 헤더 */
.page-header {
  padding: 0 0 24px;
}

.title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
  letter-spacing: -0.3px;
}

/* 폼 */
.form {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sub-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.group-label {
  font-size: 13px;
  font-weight: 600;
  color: #3d4f6b;
  display: flex;
  align-items: center;
  gap: 6px;
}

.badge-required {
  font-size: 11px;
  font-weight: 600;
  color: #e53e3e;
  background: #fff5f5;
  border: 1px solid #fed7d7;
  padding: 1px 6px;
  border-radius: 4px;
}

.badge-optional {
  font-size: 11px;
  font-weight: 500;
  color: #8e9aaf;
  background: #f4f6fa;
  border: 1px solid #e2e8f0;
  padding: 1px 6px;
  border-radius: 4px;
}

.badge-auto {
  font-size: 11px;
  font-weight: 600;
  color: #3b5bdb;
  background: #eef2ff;
  border: 1px solid #c5d0f5;
  padding: 1px 6px;
  border-radius: 4px;
}

/* 인풋 */
.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrap.input-error .base-input {
  border-color: #e53e3e;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: #a0aec0;
  pointer-events: none;
  flex-shrink: 0;
}

.base-input {
  width: 100%;
  height: 44px;
  border: 1.5px solid #dde3ed;
  border-radius: 10px;
  padding: 0 14px 0 36px;
  font-size: 14px;
  color: #1a1a2e;
  outline: none;
  background: #fafbfc;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.base-input:focus {
  border-color: #3b5bdb;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(59, 91, 219, 0.1);
}

.base-input::placeholder {
  color: #b8c2d0;
}

.base-input.text-center {
  text-align: center;
  padding: 0 10px;
}

/* 러닝시간 */
.duration-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.duration-sep {
  font-size: 18px;
  font-weight: 700;
  color: #a0aec0;
  flex-shrink: 0;
}

/* 페이스 */
.pace-display {
  height: 44px;
  border: 1.5px dashed #dde3ed;
  border-radius: 10px;
  background: #f8f9fc;
  display: flex;
  align-items: center;
  padding: 0 14px 0 36px;
  position: relative;
  transition: all 0.3s;
}

.pace-display.pace-filled {
  border: 1.5px solid #c5d0f5;
  background: #eef2ff;
}

.pace-display .input-icon {
  color: #7b8ea8;
}

.pace-display.pace-filled .input-icon {
  color: #3b5bdb;
}

.pace-value {
  font-size: 15px;
  font-weight: 700;
  color: #3b5bdb;
  letter-spacing: 0.3px;
}

.pace-placeholder {
  font-size: 13px;
  color: #b8c2d0;
}

/* 사진 */
.photo-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.photo-item {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 12px;
  overflow: visible;
}

.photo-preview {
  width: 88px;
  height: 88px;
  border-radius: 12px;
  object-fit: cover;
  display: block;
  border: 1.5px solid #e2e8f0;
}

.photo-remove {
  position: absolute;
  top: -7px;
  right: -7px;
  width: 22px;
  height: 22px;
  background: #e53e3e;
  border: 2px solid #fff;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.2s;
  z-index: 1;
}

.photo-remove:hover {
  background: #c53030;
}

.photo-add {
  width: 88px;
  height: 88px;
  border: 2px dashed #c4cad6;
  border-radius: 12px;
  background: #f8f9fc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: #8e9aaf;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.photo-add:hover {
  border-color: #3b5bdb;
  background: #eef2ff;
  color: #3b5bdb;
}

.hidden {
  display: none;
}

/* 메모 */
.memo-input {
  width: 100%;
  border: 1.5px solid #dde3ed;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
  color: #1a1a2e;
  outline: none;
  background: #fafbfc;
  resize: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  font-family: inherit;
  line-height: 1.6;
}

.memo-input:focus {
  border-color: #3b5bdb;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(59, 91, 219, 0.1);
}

.memo-input::placeholder {
  color: #b8c2d0;
}

.char-count {
  font-size: 12px;
  color: #b0b9c8;
  text-align: right;
  margin: 0;
}

/* 공개 설정 */
.visibility-row {
  display: flex;
  gap: 10px;
}

.vis-btn {
  flex: 1;
  height: 44px;
  border: 1.5px solid #dde3ed;
  border-radius: 10px;
  background: #fafbfc;
  color: #718096;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.vis-btn:hover {
  border-color: #a0b0e0;
  color: #3b5bdb;
}

.vis-btn.active {
  border-color: #3b5bdb;
  background: #eef2ff;
  color: #3b5bdb;
  font-weight: 600;
}

/* 메시지 */
.msg {
  font-size: 12px;
  margin: 2px 0 0;
}

.msg-error {
  color: #e53e3e;
}

/* 액션 버튼 */
.action-row {
  display: flex;
  gap: 10px;
  padding-top: 4px;
}

.btn-cancel {
  flex: 0 0 100px;
  height: 50px;
  border: 1.5px solid #dde3ed;
  border-radius: 12px;
  background: #fff;
  color: #718096;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  border-color: #a0b0e0;
  color: #3b5bdb;
}

.btn-submit {
  flex: 1;
  height: 50px;
  background: linear-gradient(135deg, #3b5bdb 0%, #5c7cfa 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  letter-spacing: 0.3px;
  box-shadow: 0 4px 16px rgba(59, 91, 219, 0.3);
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(59, 91, 219, 0.4);
}

.btn-submit:active:not(:disabled) {
  transform: translateY(0);
}

.btn-submit:disabled {
  background: #a0aec0;
  cursor: not-allowed;
  box-shadow: none;
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
  to { transform: rotate(360deg); }
}

/* 반응형 */
@media (max-width: 600px) {
  .container {
    padding: 16px 16px 40px;
  }

  .form {
    gap: 20px;
  }

  .row-2 {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .photo-item,
  .photo-preview,
  .photo-add {
    width: 76px;
    height: 76px;
  }

  .btn-cancel {
    flex: 0 0 80px;
  }
}
</style>
