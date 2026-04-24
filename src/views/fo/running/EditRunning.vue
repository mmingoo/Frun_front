<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { updateRunning } from '@/api/running.js'
import { getRunningLogDetail } from '@/api/feed.js'
import { BASE_URL } from '@/api/index.js'
import { getMyInfo } from '@/api/user.js'
import { useAuthStore } from '@/stores/auth.js'
import NavBar from '@/components/layout/NavBar.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const isLoading = ref(false)
const isFetching = ref(true)
const fetchError = ref('')
const submitError = ref('')

// 날짜/시간
const now = new Date()
const padTwo = (n) => String(n).padStart(2, '0')
const defaultDate = `${now.getFullYear()}-${padTwo(now.getMonth() + 1)}-${padTwo(now.getDate())}`
const defaultTime = `${padTwo(now.getHours())}:${padTwo(now.getMinutes())}`

const runDate = ref(defaultDate)
const runTime = ref(defaultTime)
const maxTime = computed(() => (runDate.value === defaultDate ? defaultTime : undefined))

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
  const paceSec = Math.round((totalMin / dist - paceMin) * 60)
  return `${paceMin}'${String(paceSec).padStart(2, '0')}"`
})

// 기존 이미지 URL 목록 (서버에서 받아온 것) - { url, preview }
const existingPhotos = ref([])

// 새로 추가할 이미지 (WriteRunning과 동일한 구조) - { file, preview }
const newPhotos = ref([])
const photoInputRef = ref(null)

const totalPhotoCount = computed(() => existingPhotos.value.length + newPhotos.value.length)

// 사진 입력창 열기
function openPhotoInput() {
  if (totalPhotoCount.value >= 5) return
  photoInputRef.value?.click()
}

// 사진 input 변경 시 파일 목록을 newPhotos에 추가 (최대 5장 제한)
function onPhotoChange(e) {
  const files = Array.from(e.target.files)
  for (const file of files) {
    if (totalPhotoCount.value >= 5) break
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      alert('jpg, jpeg, png 파일만 업로드 가능합니다.')
      continue
    }
    if (file.size > 3 * 1024 * 1024) {
      alert('파일 크기는 최대 3MB입니다.')
      continue
    }
    newPhotos.value.push({ file, preview: URL.createObjectURL(file) })
  }
  e.target.value = ''
}

// 기존에 존재하는 이미지 제거 함수
function removeExistingPhoto(index) {
  existingPhotos.value.splice(index, 1)
}

// 업로드된 이미지 제거 함수
function removeNewPhoto(index) {
  URL.revokeObjectURL(newPhotos.value[index].preview)
  newPhotos.value.splice(index, 1)
}

// 메모 / 공개 설정
const memo = ref('')
const isPublic = ref(true)

// 입력 필터링
function onDistanceInput(e) {
  let val = e.target.value.replace(/[^0-9.]/g, '')
  const dotIndex = val.indexOf('.')
  if (dotIndex !== -1) {
    val = val.slice(0, dotIndex + 1) + val.slice(dotIndex + 1).replace(/\./g, '')
    if (val.length > dotIndex + 3) val = val.slice(0, dotIndex + 3)
  }
  e.target.value = val
  distance.value = val
}

function onDurationMinInput(e) {
  const val = e.target.value.replace(/[^0-9]/g, '')
  e.target.value = val
  durationMin.value = val
}

function onDurationSecInput(e) {
  const val = e.target.value.replace(/[^0-9]/g, '')
  e.target.value = val
  durationSec.value = val
}

// 유효성
const distanceError = computed(() => {
  if (!distance.value) return ''
  if (!/^\d+(\.\d{0,2})?$/.test(distance.value))
    return '숫자와 점(.)만 입력 가능하며, 소수점 이하 2자리까지만 입력할 수 있습니다.'
  const v = parseFloat(distance.value)
  if (isNaN(v) || v <= 0) return '올바른 거리를 입력해주세요.'
  if (v > 100) return '거리는 최대 100km까지 입력 가능합니다.'
  return ''
})

const MIN_DATE = '2026-02-01'

const dateTimeError = computed(() => {
  if (runDate.value < MIN_DATE) {
    return `러닝 날짜는 ${MIN_DATE} 이후여야 합니다.`
  }
  if (runDate.value > defaultDate) {
    return '러닝 날짜는 오늘 날짜를 초과할 수 없습니다.'
  }
  if (runDate.value === defaultDate && runTime.value > defaultTime) {
    return '현재 시각보다 이후 시간은 입력할 수 없습니다.'
  }
  return ''
})

const durationError = computed(() => {
  if (!durationMin.value && durationSec.value === '') return ''
  const mins = parseInt(durationMin.value) || 0
  const secs = durationSec.value === '' ? null : parseInt(durationSec.value)
  if (mins > 600) return '러닝 시간은 최대 600분까지 입력 가능합니다.'
  if (secs === null) return '초를 입력해주세요.'
  if (secs < 0 || secs >= 60) return '초는 0~59 사이로 입력해주세요.'
  return ''
})

const canSubmit = computed(() => {
  return (
    !dateTimeError.value &&
    distance.value &&
    !distanceError.value &&
    (durationMin.value || durationSec.value !== '') &&
    !durationError.value
  )
})

// 기존 데이터 불러오기
onMounted(async () => {
  const { runningLogId, authorId } = route.params

  if (!auth.userId) {
    const res = await getMyInfo()
    auth.setUserId(res.data.data.userId)
  }

  try {
    const res = await getRunningLogDetail(runningLogId, authorId)
    const d = res.data.data

    if (d.userId !== auth.userId) {
      alert('러닝일지를 수정할 권한이 없습니다.')
      router.replace('/feed')
      return
    }

    // 날짜 / 시간
    runDate.value = d.runDate ?? defaultDate
    runTime.value = d.runTime ?? defaultTime

    // 거리
    distance.value = String(d.distance ?? '')

    // 러닝 시간 ("HH:mm:ss" → 분/초)
    if (d.duration) {
      const parts = d.duration.split(':').map(Number)
      const h = parts[0] ?? 0
      const m = parts[1] ?? 0
      const s = parts[2] ?? 0
      durationMin.value = String(h * 60 + m)
      durationSec.value = String(s)
    }

    // 기존 이미지
    existingPhotos.value = (d.logImages ?? []).map((img) => ({
      url: img, // 서버에 keepImages로 전달할 경로
      preview: img.startsWith('http') ? img : `${BASE_URL}${img}`,
    }))
    // 메모
    memo.value = d.memo ?? ''

    // 공개 설정 (API 응답에 isPublic이 있으면 사용, 없으면 기본 true)
    isPublic.value = d.public !== false
  } catch (e) {
    const status = e.response?.status
    const message = e.response?.data?.message
    if (status === 404) {
      router.replace({
        name: 'NotFoundView',
        params: { pathMatch: route.path.split('/').slice(1) },
      })
      return
    } else if (status === 403) {
      alert(message || '러닝일지를 수정할 권한이 없습니다.')
      router.replace('/feed')
    } else {
      fetchError.value = message || '데이터를 불러오는 데 실패했습니다.'
    }
  } finally {
    isFetching.value = false
  }
})

async function handleSubmit() {
  if (!canSubmit.value) return
  submitError.value = ''
  isLoading.value = true
  try {
    const { runningLogId } = route.params
    await updateRunning(runningLogId, {
      runDate: runDate.value,
      runTime: runTime.value,
      distance: distance.value,
      durationMin: parseInt(durationMin.value) || 0,
      durationSec: parseInt(durationSec.value) || 0,
      memo: memo.value,
      isPublic: isPublic.value,
      keepImageUrls: existingPhotos.value.map((p) => p.url),
      newPhotos: newPhotos.value,
    })
    alert('러닝일지를 수정하였습니다.')
    router.back()
  } catch (e) {
    const status = e.response?.status
    if (status === 403) submitError.value = '수정 권한이 없습니다.'
    else if (status === 404) submitError.value = '존재하지 않는 러닝 일지입니다.'
    else submitError.value = '수정에 실패했습니다. 다시 시도해주세요.'
  } finally {
    isLoading.value = false
  }
}

function handleCancel() {
  router.back()
}
</script>

<template>
  <div class="page-wrap">
    <NavBar />
    <div class="container">
      <!-- 로딩 -->
      <div v-if="isFetching" class="state-center">
        <span class="spinner" />
      </div>

      <!-- 에러 -->
      <div v-else-if="fetchError" class="state-center error-text">
        {{ fetchError }}
      </div>

      <!-- 폼 -->
      <template v-else>
        <!-- 헤더 -->
        <div class="page-header">
          <h1 class="title">러닝일지 수정</h1>
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
              <span v-else class="pace-placeholder"
                >거리와 시간을 입력하면 자동으로 계산됩니다</span
              >
            </div>
          </div>

          <!-- 사진 첨부 -->
          <div class="form-group">
            <label class="group-label">
              사진 첨부
              <span class="badge-optional">최대 5장</span>
            </label>
            <div class="photo-grid">
              <!-- 기존 사진 -->
              <div v-for="(photo, i) in existingPhotos" :key="`existing-${i}`" class="photo-item">
                <img :src="photo.preview" :alt="`사진 ${i + 1}`" class="photo-preview" />
                <button type="button" class="photo-remove" @click="removeExistingPhoto(i)">
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
              <!-- 새로 추가한 사진 -->
              <div v-for="(photo, i) in newPhotos" :key="`new-${i}`" class="photo-item">
                <img :src="photo.preview" :alt="`새 사진 ${i + 1}`" class="photo-preview" />
                <button type="button" class="photo-remove" @click="removeNewPhoto(i)">
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
                v-if="totalPhotoCount < 5"
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

          <!-- 제출 에러 -->
          <p v-if="submitError" class="msg msg-error">{{ submitError }}</p>

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
                수정하기
              </template>
            </button>
          </div>
        </form>
      </template>
    </div>
  </div>
</template>

<style scoped src="./WriteRunning.css" />

<style scoped>
.state-center {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
}

.error-text {
  font-size: 15px;
  color: #e53e3e;
}
</style>
