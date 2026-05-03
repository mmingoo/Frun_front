<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { createRunning } from '@/api/running.js'
import NavBar from '@/components/layout/NavBar.vue'

const router = useRouter()
const isLoading = ref(false)

// 날짜/시간 (현재 날짜/시간 기본값)
const now = new Date()
const padTwo = (n) => String(n).padStart(2, '0')
const defaultDate = `${now.getFullYear()}-${padTwo(now.getMonth() + 1)}-${padTwo(now.getDate())}`
const defaultTime = `${padTwo(now.getHours())}:${padTwo(now.getMinutes())}`

const runDate = ref(defaultDate)
const runTime = ref(defaultTime)

// 오늘 날짜 선택 시에만 현재 시각으로 시간 상한을 제한 — 미래 시간 입력 방지
const maxTime = computed(() => (runDate.value === defaultDate ? defaultTime : undefined))

// 거리 / 러닝시간
const distance = ref('')
const durationMin = ref('')
const durationSec = ref('')

// 거리와 시간으로 페이스(분/km) 자동 계산
const pace = computed(() => {
  const dist = parseFloat(distance.value)
  const mins = parseInt(durationMin.value) || 0
  const secs = parseInt(durationSec.value) || 0
  const totalMin = mins + secs / 60  // 총 시간(분)
  if (!dist || dist <= 0 || !totalMin) return ''
  const paceMin = Math.floor(totalMin / dist)
  const paceSec = Math.round((totalMin / dist - paceMin) * 60)
  return `${paceMin}'${String(paceSec).padStart(2, '0')}"`
})

// 사진 첨부 (최대 5개)
const photos = ref([])
const photoInputRef = ref(null)

// 5장 제한에 걸리면 input을 열지 않음
function openPhotoInput() {
  if (photos.value.length >= 5) return
  photoInputRef.value?.click()
}

function onPhotoChange(e) {
  const files = Array.from(e.target.files)
  for (const file of files) {
    if (photos.value.length >= 5) break  // 중간에 5장이 차면 나머지 무시
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      alert('jpg, jpeg, png 파일만 업로드 가능합니다.')
      continue
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 최대 10MB입니다.')
      continue
    }
    photos.value.push({ file, preview: URL.createObjectURL(file) })
  }
  e.target.value = ''  // 같은 파일 재선택 가능하도록 input 초기화
}

function removePhoto(index) {
  // Object URL은 명시적으로 해제하지 않으면 메모리에서 해제되지 않음
  URL.revokeObjectURL(photos.value[index].preview)
  photos.value.splice(index, 1)
}

// 메모
const memo = ref('')

// 공개 설정
const isPublic = ref(true)

// 입력 필터링
function onDistanceInput(e) {
  let val = e.target.value.replace(/[^0-9.]/g, '')  // 숫자와 점만 허용
  const dotIndex = val.indexOf('.')
  if (dotIndex !== -1) {
    // 점이 여러 개면 첫 번째만 남기고 소수점 이하 최대 2자리로 제한
    val = val.slice(0, dotIndex + 1) + val.slice(dotIndex + 1).replace(/\./g, '')
    if (val.length > dotIndex + 3) val = val.slice(0, dotIndex + 3)
  }
  e.target.value = val
  distance.value = val
}

function onDurationMinInput(e) {
  const val = e.target.value.replace(/[^0-9]/g, '')  // 숫자만 허용
  e.target.value = val
  durationMin.value = val
}

function onDurationSecInput(e) {
  const val = e.target.value.replace(/[^0-9]/g, '')  // 숫자만 허용
  e.target.value = val
  durationSec.value = val
}

// 유효성
const distanceError = computed(() => {
  if (!distance.value) return ''
  if (!/^\d+(\.\d{0,2})?$/.test(distance.value)) return '숫자와 점(.)만 입력 가능하며, 소수점 이하 2자리까지만 입력할 수 있습니다.'
  const v = parseFloat(distance.value)
  if (isNaN(v) || v <= 0) return '올바른 거리를 입력해주세요.'
  if (v > 100) return '거리는 최대 100km까지 입력 가능합니다.'
  return ''
})

const MIN_DATE = '2026-02-01'  // 서비스 오픈일 이전 날짜 방지

const dateTimeError = computed(() => {
  if (runDate.value < MIN_DATE) {
    return `러닝 날짜는 ${MIN_DATE} 이후여야 합니다.`
  }
  if (runDate.value > defaultDate) {
    return '러닝 날짜는 오늘 날짜를 초과할 수 없습니다.'
  }
  // 오늘 날짜 선택 시 미래 시각 방지
  if (runDate.value === defaultDate && runTime.value > defaultTime) {
    return '현재 시각보다 이후 시간은 입력할 수 없습니다.'
  }
  return ''
})

const durationError = computed(() => {
  // 둘 다 비어있으면 에러 없음 (canSubmit에서 필수 체크)
  if (!durationMin.value && durationSec.value === '') return ''
  const mins = parseInt(durationMin.value) || 0
  const secs = durationSec.value === '' ? null : parseInt(durationSec.value)
  if (mins > 600) return '러닝 시간은 최대 600분까지 입력 가능합니다.'
  if (secs === null) return '초를 입력해주세요.'  // 분만 입력하고 초를 빈 값으로 남긴 경우
  if (secs < 0 || secs >= 60) return '초는 0~59 사이로 입력해주세요.'
  return ''
})

// 날짜·거리·러닝시간 모두 유효해야 제출 가능
const canSubmit = computed(() => {
  return (
    !dateTimeError.value &&
    distance.value &&
    !distanceError.value &&
    (durationMin.value || durationSec.value !== '') &&
    !durationError.value
  )
})

async function handleSubmit() {
  if (!canSubmit.value) return
  isLoading.value = true
  try {
    await createRunning({
      runDate: runDate.value,
      runTime: runTime.value,
      distance: distance.value,
      durationMin: durationMin.value,
      durationSec: durationSec.value,
      memo: memo.value,
      isPublic: isPublic.value,
      photos: photos.value,
    })
    alert('러닝일지를 작성하였습니다.')
    router.push('/feed')
  } catch (e) {
    const message = e.response?.data?.message
    alert(message)
  } finally {
    isLoading.value = false
  }
}

function handleCancel() {
  router.back()
}

// 사진 라이트박스
const lightboxSrc = ref(null)

// 클릭한 사진을 라이트박스로 표시
function viewPhoto(src) {
  lightboxSrc.value = src
}

function closeLightbox() {
  lightboxSrc.value = null
}

// ESC 키로 라이트박스 닫기
function onKeydown(e) {
  if (e.key === 'Escape') closeLightbox()
}

// 전역 keydown 이벤트 등록 및 해제
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="page-wrap">
    <NavBar />
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
              <svg
                class="input-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <input v-model="runDate" type="date" :min="MIN_DATE" :max="defaultDate" class="base-input" />
            </div>
            <div class="input-wrap">
              <svg
                class="input-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <input v-model="runTime" type="time" :max="maxTime" class="base-input" />
            </div>
          </div>
          <p v-if="dateTimeError" class="msg msg-error">{{ dateTimeError }}</p>
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
                <svg
                  class="input-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
                <input
                  :value="distance"
                  type="text"
                  inputmode="decimal"
                  placeholder="예: 5.20"
                  class="base-input"
                  @input="onDistanceInput"
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
                    :value="durationMin"
                    type="text"
                    inputmode="numeric"
                    placeholder="분"
                    class="base-input text-center"
                    @input="onDurationMinInput"
                  />
                </div>
                <span class="duration-sep">:</span>
                <div class="input-wrap" :class="{ 'input-error': durationError }">
                  <input
                    :value="durationSec"
                    type="text"
                    inputmode="numeric"
                    placeholder="초"
                    class="base-input text-center"
                    @input="onDurationSecInput"
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
            <svg
              class="input-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
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
            <div v-for="(photo, i) in photos" :key="i" class="photo-item">
              <img :src="photo.preview" :alt="`사진 ${i + 1}`" class="photo-preview" @click="viewPhoto(photo.preview)" />
              <button type="button" class="photo-remove" @click="removePhoto(i)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </div>
            <button
              v-if="photos.length < 5"
              type="button"
              class="photo-add"
              @click="openPhotoInput"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
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
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path
                  d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                />
              </svg>
              공개
            </button>
            <button
              type="button"
              class="vis-btn"
              :class="{ active: !isPublic }"
              @click="isPublic = false"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              비공개
            </button>
          </div>
        </div>

        <!-- 버튼 영역 -->
        <div class="action-row">
          <button type="button" class="btn-cancel" @click="handleCancel">취소</button>
          <button type="submit" class="btn-submit" :disabled="!canSubmit || isLoading">
            <span v-if="isLoading" class="spinner" />
            <template v-else>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              저장하기
            </template>
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- 사진 라이트박스 -->
  <Teleport to="body">
    <div v-if="lightboxSrc" class="lightbox-overlay" @click.self="closeLightbox">
      <button class="lightbox-close" @click="closeLightbox">✕</button>
      <img :src="lightboxSrc" class="lightbox-img" alt="사진 전체보기" />
    </div>
  </Teleport>
</template>

<style scoped src="./WriteRunning.css" />

<style>
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.lightbox-img {
  max-width: 100%;
  max-height: 90vh;
  border-radius: 12px;
  object-fit: contain;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
}

.lightbox-close {
  position: absolute;
  top: 16px;
  right: 20px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  font-size: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
