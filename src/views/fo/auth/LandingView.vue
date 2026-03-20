<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

import api from '@/api/index.js'

const router = useRouter()
const auth = useAuthStore() // const router = useRouter() 아래에 추가

onMounted(async () => {
  try {
    const res = await api.get('/api/v1/members/me/nickname-status')
    auth.hasNickname = res.data.data.hasNickname
    router.replace(auth.hasNickname ? '/feed' : '/signup/nickname')
  } catch {
    // 미인증 → 로그인 페이지 유지
  }
})

function loginWithNaver() {
  window.location.href = 'http://localhost:8080/oauth2/authorization/naver'
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
            viewBox="0 0 24 24"
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
        <h1 class="brand">Frun</h1>
        <p class="tagline">러닝을 기록하고, 함께 달리세요</p>
      </div>

      <!-- 소개 -->
      <ul class="features">
        <li>
          <span class="feature-icon">📍</span>
          <span>러닝 일지를 사진과 함께 기록</span>
        </li>
        <li>
          <span class="feature-icon">👟</span>
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

      <p class="notice">로그인하면 Frun 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다.</p>
    </div>
  </div>
</template>

<style scoped>
.landing-wrap {
  min-height: 100vh;
  background: #f7f8fc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  position: relative;
  overflow: hidden;
}

/* 배경 장식 원 */
.bg-circle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.bg-circle-1 {
  width: 480px;
  height: 480px;
  background: radial-gradient(circle, rgba(59, 91, 219, 0.08) 0%, transparent 70%);
  top: -120px;
  right: -100px;
}

.bg-circle-2 {
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, rgba(92, 124, 250, 0.07) 0%, transparent 70%);
  bottom: -80px;
  left: -80px;
}

/* 카드 */
.landing-card {
  background: #fff;
  border: 1px solid #edf0f7;
  border-radius: 24px;
  padding: 48px 40px 40px;
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  box-shadow: 0 8px 40px rgba(59, 91, 219, 0.08);
  position: relative;
  z-index: 1;
}

/* 로고 영역 */
.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  width: 68px;
  height: 68px;
  background: linear-gradient(135deg, #eef2ff 0%, #dde6ff 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(59, 91, 219, 0.15);
}

.brand {
  font-size: 32px;
  font-weight: 900;
  color: #3b5bdb;
  letter-spacing: -1px;
  margin: 0;
}

.tagline {
  font-size: 14px;
  color: #718096;
  margin: 0;
  font-weight: 500;
}

/* 기능 목록 */
.features {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.features li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f7f8fc;
  border-radius: 12px;
  font-size: 14px;
  color: #2d3748;
  font-weight: 500;
}

.feature-icon {
  font-size: 18px;
  flex-shrink: 0;
}

/* 네이버 로그인 버튼 */
.naver-btn {
  width: 100%;
  height: 52px;
  background: #03c75a;
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 28px;
  gap: 10px;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(3, 199, 90, 0.3);
  letter-spacing: 0.2px;
}

.naver-btn:active {
  transform: translateY(0);
}

/* 안내 문구 */
.notice {
  font-size: 11px;
  color: #b0b9c8;
  text-align: center;
  line-height: 1.6;
  margin: 0;
}

@media (max-width: 480px) {
  .landing-card {
    padding: 36px 24px 32px;
    gap: 24px;
  }

  .brand {
    font-size: 28px;
  }
}
</style>
