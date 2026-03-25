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

<style scoped src="./NotificationsView.css" />
