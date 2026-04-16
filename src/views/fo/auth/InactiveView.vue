<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { activateAccount, getInactiveInfo } from '@/api/user.js'
import { BASE_URL } from '@/api/index.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const isLoading = ref(false)
const infoLoading = ref(true)
const deactivatedAt = ref('')
const deletionScheduledAt = ref('')
const tempToken = ref('')
const userStatus = ref('')

function formatDate(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

onMounted(async () => {
  const tokenFromQuery = route.query.token
  if (!tokenFromQuery) {
    // 토큰 없이 직접 접근한 경우
    router.replace('/')
    return
  }

  tempToken.value = tokenFromQuery

  // 비활성화 정보 조회 — 실패해도 페이지는 유지
  try {
    const infoRes = await getInactiveInfo(tempToken.value)
    deactivatedAt.value = formatDate(infoRes.data.data.deactivatedAt)
    deletionScheduledAt.value = formatDate(infoRes.data.data.deletionScheduledAt)
    userStatus.value = infoRes.data.data.userStatus ?? ''
  } catch {
    // 정보 조회 실패 시 날짜 없이 페이지 유지
  } finally {
    infoLoading.value = false
  }
})

async function handleActivate() {
  isLoading.value = true
  try {
    // 임시 토큰으로 활성화 → 백엔드가 refreshToken 쿠키 발급
    await activateAccount(tempToken.value)

    // refreshToken 쿠키로 정식 accessToken 재발급
    const reissueRes = await axios.post(
      `${BASE_URL}/api/v1/auth/reissue`,
      {},
      { withCredentials: true },
    )
    auth.setAccessToken(reissueRes.data.data.accessToken)
    auth.hasNickname = true
    alert('계정을 활성화하였습니다.')
    router.replace('/feed')
  } catch {
    alert('활성화에 실패했습니다. 다시 시도해주세요.')
  } finally {
    isLoading.value = false
  }
}

async function handleCancel() {
  sessionStorage.setItem('_inactiveAlertShown', '1')
  auth.logout()
  router.replace('/')
}
</script>

<template>
  <div class="inactive-wrap">
    <div v-if="infoLoading" class="dialog">
      <div class="spinner-center" />
    </div>

    <div v-else class="dialog">
      <div class="icon">😴</div>
      <h2 class="title">해당 계정은 비활성화된 계정입니다.</h2>

      <!-- 신고 누적 비활성화 -->
      <template v-if="userStatus === 'REPORT_INACTIVE'">
        <p class="desc admin-msg">
          신고 누적 3회로 인해 계정이 비활성화 되었습니다.<br />자세한 문의는 관리자에게
          해주세요.<br />계정은 3개월 뒤에 삭제됩니다
        </p>
        <div class="actions">
          <button class="btn btn-cancel" @click="handleCancel">확인</button>
        </div>
      </template>

      <!-- 관리자 직접 비활성화 -->
      <template v-else-if="userStatus === 'DIRECT_INACTIVE'">
        <p class="desc admin-msg">
          관리자에 의해 계정이 비활성화 되었습니다.<br />자세한 문의는 관리자에게 해주세요.
          <br />계정은 3개월 뒤에 삭제됩니다
        </p>
        <div class="actions">
          <button class="btn btn-cancel" @click="handleCancel">확인</button>
        </div>
      </template>

      <!-- 자진 비활성화 (기존 UI) -->
      <template v-else>
        <p class="question">활성화하시겠습니까?</p>

        <div v-if="deactivatedAt || deletionScheduledAt" class="info-box">
          <div v-if="deactivatedAt" class="info-row">
            <span class="info-label">비활성화 일시</span>
            <span class="info-value">{{ deactivatedAt }}</span>
          </div>
          <div v-if="deletionScheduledAt" class="info-row">
            <span class="info-label">자동 삭제 예정일</span>
            <span class="info-value warn">{{ deletionScheduledAt }}</span>
          </div>
        </div>

        <p class="desc">취소하면 로그아웃 처리됩니다.</p>

        <div class="actions">
          <button class="btn btn-cancel" :disabled="isLoading" @click="handleCancel">취소</button>
          <button class="btn btn-activate" :disabled="isLoading" @click="handleActivate">
            <span v-if="isLoading" class="spinner" />
            <span v-else>활성화하기</span>
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped src="./InactiveView.css" />
