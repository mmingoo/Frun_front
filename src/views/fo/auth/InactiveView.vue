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
    router.replace('/feed')
  } catch {
    alert('활성화에 실패했습니다. 다시 시도해주세요.')
  } finally {
    isLoading.value = false
  }
}

async function handleCancel() {
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
    </div>
  </div>
</template>

<style scoped src="./InactiveView.css" />
