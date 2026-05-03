<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { logout as logoutApi, getMyProfile } from '@/api/auth.js'
import { BASE_URL } from '@/api/index.js'
import { ref } from 'vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const userId = ref({})

// 마운트 시 프로필 이미지와 알림 카운트를 로드
onMounted(async () => {
  const res = await getMyProfile()
  const d = res.data.data
  userId.value = d.userId
  // 이미 profileImage가 세팅된 경우 덮어쓰지 않음 (다른 컴포넌트에서 먼저 세팅한 경우)
  if (!auth.profileImage) {
    try {
      auth.setProfileImage(d.profileImageUrl ? `${BASE_URL}${d.profileImageUrl}` : null)
    } catch {
      // 프로필 로딩 실패 시 무시
    }
  }
  // 네브바 알림 뱃지 초기값 세팅
  auth.setNotificationCnt(d.notificationCnt)
})

async function handleLogout() {
  try {
    await logoutApi()
  } catch {
    // 백엔드 실패해도 클라이언트 상태는 반드시 초기화
  }
  auth.logout()
  alert('로그아웃 하였습니다.')
  router.replace('/')
}
</script>

<template>
  <header class="navbar">
    <button class="nav-logo" @click="router.push('/feed')">
      <svg
        width="22"
        height="22"
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
      <span class="nav-brand">FRun</span>
    </button>
    <div class="nav-actions">
      <button
        class="nav-item"
        :class="{ active: route.path === '/feed' }"
        @click="router.push('/feed')"
      >
        홈
      </button>
      <button
        class="nav-item"
        :class="{ active: route.path === '/stats' }"
        @click="router.push('/stats')"
      >
        통계
      </button>
      <button
        class="nav-item"
        :class="{ active: route.path === '/friends' }"
        @click="router.push('/friends')"
      >
        검색
      </button>
      <button
        class="nav-icon-btn nav-notif-btn"
        :class="{ active: route.path === '/notifications' }"
        @click="router.push('/notifications')"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span v-if="auth.notificationCnt > 0" class="notif-badge">
          {{ auth.notificationCnt > 99 ? '99+' : auth.notificationCnt }}
        </span>
      </button>
      <button
        class="nav-icon-btn"
        :class="{ active: route.path === '/settings' }"
        @click="router.push('/settings')"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
          />
        </svg>
      </button>
      <button class="nav-profile-btn" @click="router.push(`/mypage/${userId}`)">
        <img
          v-if="auth.profileImage"
          :src="auth.profileImage"
          alt="프로필"
          class="nav-profile-img"
        />
        <svg
          v-else
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>
      <button class="nav-btn-my" @click="handleLogout">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        로그아웃
      </button>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  height: 52px;
  background: #fff;
  border-bottom: 1px solid #edf0f7;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 7px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.nav-brand {
  font-size: 18px;
  font-weight: 800;
  color: #3b5bdb;
  letter-spacing: -0.5px;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 0;
}

.nav-item {
  padding: 6px 8px;
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #718096;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.nav-item:hover,
.nav-item.active {
  color: #3b5bdb;
  background: #eef2ff;
  font-weight: 600;
}

.nav-icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: #718096;
  border-radius: 8px;
  transition: all 0.2s;
  margin-left: 2px;
}

.nav-icon-btn:hover,
.nav-icon-btn.active {
  color: #3b5bdb;
  background: #eef2ff;
}

.nav-btn-my {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 34px;
  padding: 0 14px;
  background: #3b5bdb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  margin-left: 15px;
}

.nav-btn-my:hover {
  background: #2f4ac7;
}

.nav-notif-btn {
  position: relative;
}

.notif-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #e53e3e;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  pointer-events: none;
}

.nav-profile-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef2ff;
  border: 2px solid #c5d0f5;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
  margin-left: 4px;
  padding: 0;
  transition: border-color 0.2s;
  color: #718096;
}

.nav-profile-btn:hover {
  border-color: #3b5bdb;
}

.nav-profile-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 640px) {
  .navbar {
    padding: 0 16px;
  }
}
</style>
