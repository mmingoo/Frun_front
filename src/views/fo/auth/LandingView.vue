<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

import { getNicknameStatus } from '@/api/auth.js'

const router = useRouter()
const auth = useAuthStore() // const router = useRouter() 아래에 추가

onMounted(async () => {
  try {
    const res = await getNicknameStatus()
    auth.hasNickname = res.data.data.hasNickname
    router.replace(auth.hasNickname ? '/feed' : '/signup/terms')
  } catch {
    // 미인증 또는 비활성화 계정 → 로그인 페이지 유지
    sessionStorage.removeItem('_inactiveAlertShown')
  }
})

function loginWithNaver() {
  window.location.href = 'http://localhost:8081/oauth2/authorization/naver'
}
</script>

<template>
  <div class="landing-wrap">
    <!-- 배경 장식 -->
    <div class="bg-circle bg-circle-1" />
    <div class="bg-circle bg-circle-2" />

    <div class="landing-card">
      <!-- 로고 -->
      <div class="logo-area">
        <div class="logo-icon">
          <svg
            width="36"
            height="36"
            viewBox="-2 0 24 20"
            fill="none"
            stroke="#3b5bdb"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M13 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0" />
            <path d="M7.5 15.5 9 11l3 2 2-5" />
            <path d="M4 19l3.5-3.5" />
          </svg>
        </div>
        <h1 class="brand">FRun</h1>
        <p class="tagline">러닝을 기록하고, 친구들과 함께 달려봐요!</p>
      </div>

      <!-- 소개 -->
      <ul class="features">
        <li>
          <span class="feature-icon">📷</span>
          <span>러닝 일지를 사진과 함께 기록</span>
        </li>
        <li>
          <span class="feature-icon">🏃‍♂️</span>
          <span>친구들의 러닝 피드 확인</span>
        </li>
        <li>
          <span class="feature-icon">📊</span>
          <span>거리·페이스 통계로 성장 확인</span>
        </li>
      </ul>

      <!-- 네이버 로그인 버튼 -->
      <button class="naver-btn" @click="loginWithNaver">
        <img src="/img/naver.png" alt="네이버 로고" width="80" height="40" />
        네이버로 시작하기
      </button>
    </div>
  </div>
</template>

<style scoped src="./LandingView.css" />
