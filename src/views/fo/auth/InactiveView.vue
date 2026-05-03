<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { getInactiveTempToken, activateAccount, getInactiveInfo } from '@/api/user.js'
import { BASE_URL } from '@/api/index.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const isLoading = ref(false)
const infoLoading = ref(true)
const tokenError = ref(false)
const deactivatedAt = ref('')
const deletionScheduledAt = ref('')
const tempToken = ref('')
const userStatus = ref('')
const reportReasons = ref([])
const adminReason = ref(null)

function formatDate(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

onMounted(async () => {
  const code = route.query.code
  if (!code) {
    // code 없이 직접 URL 접근한 경우 — OAuth 콜백 없이 진입한 비정상 케이스
    router.replace('/')
    return
  }

  // code(UUID)로 임시 토큰 발급 — 1회용이므로 진입 즉시 호출 (두 번 호출하면 두 번째는 실패)
  try {
    const tokenRes = await getInactiveTempToken(code)
    tempToken.value = tokenRes.data.data
  } catch {
    tokenError.value = true
    infoLoading.value = false
    return
  }

  // 비활성화 정보 조회 — 실패해도 활성화 버튼은 표시 유지
  try {
    const infoRes = await getInactiveInfo(tempToken.value)
    const d = infoRes.data.data
    deactivatedAt.value = formatDate(d.deactivatedAt)
    deletionScheduledAt.value = formatDate(d.deletionScheduledAt)
    userStatus.value = d.userStatus ?? ''
    reportReasons.value = d.reportReasons ?? []
    adminReason.value = d.adminReason ?? null
  } catch {
    // 정보 조회 실패 시 날짜 없이 페이지 유지
  } finally {
    infoLoading.value = false
  }
})

// 활성화 순서: 임시 토큰으로 계정 활성화 → refreshToken 쿠키 수신 → 정식 accessToken 발급
async function handleActivate() {
  isLoading.value = true

  try {
    // 임시 토큰으로 활성화 → 백엔드가 refreshToken 쿠키 발급
    await activateAccount(tempToken.value)

    // refreshToken 쿠키로 정식 accessToken 재발급 — 인터셉터를 거치지 않으므로 axios 직접 사용
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
  // 다음 로그인 시 비활성화 안내 팝업을 다시 표시하지 않도록 플래그 설정
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

    <div v-else-if="tokenError" class="dialog">
      <div class="icon">⚠️</div>
      <h2 class="title">링크가 만료되었습니다.</h2>
      <p class="desc">링크는 1회용이며 5분간 유효합니다.<br />다시 로그인을 시도해주세요.</p>
      <div class="actions">
        <button class="btn btn-cancel" @click="handleCancel">확인</button>
      </div>
    </div>

    <div v-else class="dialog">
      <div class="icon">😴</div>
      <h2 class="title">해당 계정은 비활성화된 계정입니다.</h2>

      <!-- 신고 누적 비활성화 -->
      <template v-if="userStatus === 'REPORT_INACTIVE'">
        <p class="desc admin-msg">
          신고 누적 3회로 인해 계정이 비활성화 되었습니다.<br />자세한 문의나 이의신청은
          aldrn0323@naver.com 로 해주세요.<br />계정은 3개월 뒤에 삭제됩니다.
        </p>
        <div v-if="reportReasons.length" class="reason-list">
          <div v-for="(item, i) in reportReasons" :key="i" class="reason-item">
            <div class="reason-row">
              <span class="reason-label">신고 사유</span>
              <span class="reason-text">{{ item.reportReason }}</span>
            </div>
            <div class="reason-row">
              <span class="reason-label">처리 사유</span>
              <span class="reason-text">{{ item.actionReason }}</span>
            </div>
          </div>
        </div>
        <div class="actions">
          <button class="btn btn-cancel" @click="handleCancel">확인</button>
        </div>
      </template>

      <!-- 관리자 직접 비활성화 -->
      <template v-else-if="userStatus === 'DIRECT_INACTIVE'">
        <p class="desc admin-msg">
          관리자에 의해 계정이 비활성화 되었습니다.<br />자세한 문의나 이의신청은
          aldrn0323@naver.com 로 해주세요.<br />계정은 3개월 뒤에 삭제됩니다.
        </p>
        <div class="reason-box">
          <span class="reason-label">제재 사유</span>
          <span class="reason-text">{{ adminReason ?? '관리자에 의해 제재된 계정입니다.' }}</span>
        </div>
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
