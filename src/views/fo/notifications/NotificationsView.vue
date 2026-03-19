<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const notifications = ref([
  {
    id: 1,
    type: 'like',
    fromNickname: '친구닉네임A',
    profileImage: null,
    message: '회원님의 러닝일지를 좋아합니다.',
    targetId: 2,
    createdAt: '방금 전',
    read: false,
    friendStatus: null,
  },
  {
    id: 2,
    type: 'comment',
    fromNickname: '친구닉네임B',
    profileImage: null,
    message: '회원님의 러닝일지에 댓글을 남겼습니다.',
    targetId: 2,
    createdAt: '10분 전',
    read: false,
    friendStatus: null,
  },
  {
    id: 3,
    type: 'friend',
    fromNickname: '친구닉네임C',
    profileImage: null,
    message: '회원님에게 친구 요청을 보냈습니다.',
    targetId: null,
    createdAt: '1시간 전',
    read: false,
    friendStatus: null, // null | 'accepted' | 'rejected'
  },
  {
    id: 4,
    type: 'like',
    fromNickname: '친구닉네임A',
    profileImage: null,
    message: '회원님의 러닝일지를 좋아합니다.',
    targetId: 1,
    createdAt: '어제',
    read: true,
    friendStatus: null,
  },
  {
    id: 5,
    type: 'friend',
    fromNickname: '친구닉네임D',
    profileImage: null,
    message: '회원님에게 친구 요청을 보냈습니다.',
    targetId: null,
    createdAt: '어제',
    read: true,
    friendStatus: 'accepted',
  },
])

const unread = computed(() => notifications.value.filter((n) => !n.read).length)

const typeColor = { like: '#e53e3e', comment: '#3b5bdb', friend: '#38a169' }

function handleClick(noti) {
  if (noti.type === 'friend') return
  noti.read = true
  if (noti.targetId) router.push(`/feed/${noti.targetId}`)
}

function acceptFriend(noti) {
  noti.friendStatus = 'accepted'
  noti.read = true
  // TODO: API 연동
}

function rejectFriend(noti) {
  noti.friendStatus = 'rejected'
  noti.read = true
  // TODO: API 연동
}

function markAllRead() {
  notifications.value.forEach((n) => (n.read = true))
}
</script>

<template>
  <div class="page-wrap">
    <!-- ── 네비게이션 바 ── -->
    <header class="navbar">
      <button class="nav-logo" @click="router.push('/feed')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0"/>
          <path d="M7.5 15.5 9 11l3 2 2-5"/>
          <path d="M4 19l3.5-3.5"/>
        </svg>
        <span class="nav-brand">Frun</span>
      </button>
      <div class="nav-actions">
        <button class="nav-item" @click="router.push('/feed')">홈</button>
        <button class="nav-item" @click="router.push('/stats')">동계</button>
        <button class="nav-item" @click="router.push('/friends')">친구</button>
        <button class="nav-icon-btn active" @click="router.push('/notifications')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span v-if="unread > 0" class="badge">{{ unread }}</span>
        </button>
        <button class="nav-btn-my" @click="router.push('/mypage')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          MY
        </button>
      </div>
    </header>

    <!-- ── 메인 ── -->
    <div class="main-wrap">
      <div class="page-header">
        <h1 class="page-title">
          알림
          <span v-if="unread > 0" class="unread-chip">{{ unread }}개 읽지 않음</span>
        </h1>
        <button v-if="unread > 0" class="mark-all-btn" @click="markAllRead">모두 읽음</button>
      </div>

      <div v-if="notifications.length === 0" class="empty-wrap">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c4cad6" stroke-width="1.5">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <p>알림이 없습니다.</p>
      </div>

      <ul v-else class="noti-list">
        <li
          v-for="noti in notifications"
          :key="noti.id"
          class="noti-item"
          :class="{ unread: !noti.read, clickable: noti.type !== 'friend' }"
          @click="handleClick(noti)"
        >
          <!-- 아바타 + 타입 점 -->
          <div class="noti-avatar-wrap">
            <div class="noti-avatar">
              <img v-if="noti.profileImage" :src="noti.profileImage" :alt="noti.fromNickname" />
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span class="type-dot" :style="{ background: typeColor[noti.type] }" />
          </div>

          <!-- 내용 -->
          <div class="noti-body">
            <p class="noti-text">
              <strong>{{ noti.fromNickname }}</strong> {{ noti.message }}
            </p>
            <span class="noti-time">{{ noti.createdAt }}</span>
          </div>

          <!-- 친구 요청 수락/거절 (카드 맨 오른쪽) -->
          <div v-if="noti.type === 'friend'" class="friend-actions">
            <template v-if="noti.friendStatus === null">
              <button class="btn-accept" @click.stop="acceptFriend(noti)">수락</button>
              <button class="btn-reject" @click.stop="rejectFriend(noti)">거절</button>
            </template>
            <span v-else-if="noti.friendStatus === 'accepted'" class="status-badge accepted">수락됨</span>
            <span v-else class="status-badge rejected">거절됨</span>
          </div>

          <!-- 읽지 않음 점 -->
          <span v-if="!noti.read && noti.type !== 'friend'" class="unread-dot" />
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.page-wrap {
  min-height: 100vh;
  background: #f7f8fc;
}

/* ── 네비게이션 바 ── */
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
  gap: 4px;
}

.nav-item {
  padding: 6px 14px;
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
  position: relative;
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

.badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  background: #e53e3e;
  color: #fff;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
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
  margin-left: 4px;
}

.nav-btn-my:hover {
  background: #2f4ac7;
}

/* ── 메인 ── */
.main-wrap {
  max-width: 640px;
  margin: 0 auto;
  padding: 28px 20px 60px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 18px;
  font-weight: 800;
  color: #1a1a2e;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.unread-chip {
  font-size: 12px;
  font-weight: 600;
  color: #3b5bdb;
  background: #eef2ff;
  border-radius: 20px;
  padding: 2px 10px;
}

.mark-all-btn {
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 600;
  color: #3b5bdb;
  cursor: pointer;
  padding: 0;
  transition: opacity 0.2s;
}

.mark-all-btn:hover { opacity: 0.7; }

/* ── 빈 상태 ── */
.empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 0;
  color: #94a3b8;
  font-size: 14px;
}

/* ── 알림 목록 ── */
.noti-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.noti-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border: 1px solid #edf0f7;
  border-radius: 14px;
  padding: 14px 16px;
  transition: background 0.15s;
}

.noti-item.clickable {
  cursor: pointer;
}

.noti-item.clickable:hover {
  background: #f7f8fc;
}

.noti-item.unread {
  background: #f0f4ff;
  border-color: #dde6ff;
}

.noti-item.unread.clickable:hover {
  background: #e8eeff;
}

.noti-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.noti-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #edf0f7;
  border: 1.5px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.noti-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.type-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #fff;
}

.noti-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.noti-text {
  font-size: 13px;
  color: #2d3748;
  margin: 0;
  line-height: 1.5;
}

.noti-time {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

/* ── 친구 요청 버튼 ── */
.friend-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
}

.btn-accept {
  height: 30px;
  padding: 0 16px;
  background: #3b5bdb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-accept:hover { background: #2f4ac7; }

.btn-reject {
  height: 30px;
  padding: 0 16px;
  background: #fff;
  color: #718096;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reject:hover {
  border-color: #e53e3e;
  color: #e53e3e;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.accepted {
  background: #e6f7ee;
  color: #38a169;
}

.status-badge.rejected {
  background: #f7f8fc;
  color: #94a3b8;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b5bdb;
  flex-shrink: 0;
  margin-top: 6px;
}

@media (max-width: 480px) {
  .main-wrap { padding: 18px 14px 40px; }
  .navbar { padding: 0 16px; }
}
</style>
