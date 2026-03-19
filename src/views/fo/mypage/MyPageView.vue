<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const isMyPage = computed(() => !route.params.id)

const myProfile = ref({
  id: 1,
  nickname: '내닉네임',
  profileImage: null,
  bio: '매일 아침 달리는 러너 🏃',
  isFriend: false,
  friendCount: 12,
})

const friendProfile = ref({
  id: 2,
  nickname: '친구닉네임A',
  profileImage: null,
  bio: '주말 러너입니다.',
  isFriend: true,
  friendCount: 8,
})

const profile = computed(() => (isMyPage.value ? myProfile.value : friendProfile.value))

const myStats = ref({ totalDistance: 312.4, totalCount: 58, avgPace: "6'05\"" })
const friendStats = ref({ totalDistance: 120.8, totalCount: 22, avgPace: "6'18\"" })
const stats = computed(() => (isMyPage.value ? myStats.value : friendStats.value))

const posts = ref([
  { id: 1, createdAt: '2026.03.17 06:40', photo: null, distance: 8.0, duration: 50, pace: "6'15\"", memo: '비 오는 새벽', likeCount: 12 },
  { id: 2, createdAt: '2026.03.15 07:10', photo: null, distance: 5.2, duration: 32, pace: "6'09\"", memo: '오늘도 완주!', likeCount: 24 },
  { id: 3, createdAt: '2026.03.13 06:50', photo: null, distance: 7.8, duration: 48, pace: "6'09\"", memo: '비가 와도 달린다', likeCount: 9 },
  { id: 4, createdAt: '2026.03.11 07:00', photo: null, distance: 4.1, duration: 26, pace: "6'20\"", memo: null, likeCount: 5 },
  { id: 5, createdAt: '2026.03.09 07:20', photo: null, distance: 6.4, duration: 40, pace: "6'15\"", memo: '기분 좋은 아침', likeCount: 18 },
  { id: 6, createdAt: '2026.03.07 06:30', photo: null, distance: 5.0, duration: 31, pace: "6'12\"", memo: null, likeCount: 7 },
])

// ── 게시물 미리보기 오버레이 ──────────────────────────────
const hoveredId = ref(null)

// ── 프로필 편집 ──────────────────────────────────────────
const showEditModal = ref(false)
const editNickname = ref('')
const editBio = ref('')

function openEdit() {
  editNickname.value = myProfile.value.nickname
  editBio.value = myProfile.value.bio
  showEditModal.value = true
}

function saveEdit() {
  if (!editNickname.value.trim()) return
  myProfile.value.nickname = editNickname.value.trim()
  myProfile.value.bio = editBio.value.trim()
  showEditModal.value = false
}

// ── 친구 추가/삭제 ────────────────────────────────────────
function toggleFriend() {
  friendProfile.value.isFriend = !friendProfile.value.isFriend
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
        <button class="nav-icon-btn" @click="router.push('/notifications')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>
        <button class="nav-btn-my" :class="{ active: isMyPage }" @click="router.push('/mypage')">
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

      <!-- ── 프로필 헤더 (인스타그램 스타일) ── -->
      <div class="profile-header">
        <!-- 아바타 -->
        <div class="avatar-lg">
          <img v-if="profile.profileImage" :src="profile.profileImage" :alt="profile.nickname" />
          <svg v-else width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.4">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>

        <!-- 오른쪽 정보 -->
        <div class="profile-right">
          <!-- 닉네임 + 버튼 -->
          <div class="profile-name-row">
            <h1 class="profile-nickname">{{ profile.nickname }}</h1>
            <button v-if="isMyPage" class="btn-edit" @click="openEdit">프로필 편집</button>
            <button
              v-else
              class="btn-friend"
              :class="{ 'btn-friend-delete': profile.isFriend }"
              @click="toggleFriend"
            >{{ profile.isFriend ? '친구 삭제' : '친구 추가' }}</button>
          </div>

          <!-- 게시물 / 친구 / 총 거리 -->
          <div class="profile-counts">
            <div class="count-item">
              <span class="count-value">{{ stats.totalCount }}</span>
              <span class="count-label">게시물</span>
            </div>
            <div class="count-item">
              <span class="count-value">{{ profile.friendCount }}</span>
              <span class="count-label">친구</span>
            </div>
            <div class="count-item">
              <span class="count-value">{{ stats.totalDistance }}<small>km</small></span>
              <span class="count-label">총 거리</span>
            </div>
            <div class="count-item">
              <span class="count-value">{{ stats.avgPace }}</span>
              <span class="count-label">평균 페이스</span>
            </div>
          </div>

          <!-- 한 줄 소개 -->
          <p v-if="profile.bio" class="profile-bio">{{ profile.bio }}</p>
        </div>
      </div>

      <!-- ── 구분선 ── -->
      <div class="divider" />

      <!-- ── 게시물 그리드 ── -->
      <div v-if="posts.length === 0" class="empty-wrap">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#c4cad6" stroke-width="1.5">
          <path d="M13 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0"/>
          <path d="M7.5 15.5 9 11l3 2 2-5"/>
          <path d="M4 19l3.5-3.5"/>
        </svg>
        <p>아직 러닝 기록이 없습니다.</p>
      </div>

      <div v-else class="post-grid">
        <div
          v-for="post in posts"
          :key="post.id"
          class="grid-item"
          @mouseenter="hoveredId = post.id"
          @mouseleave="hoveredId = null"
          @click="router.push(`/feed/${post.id}`)"
        >
          <!-- 사진 or 플레이스홀더 -->
          <img v-if="post.photo" :src="post.photo" alt="러닝 사진" class="grid-img" />
          <div v-else class="grid-placeholder">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d0d5e0" stroke-width="1.4">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span class="grid-dist">{{ post.distance }}km</span>
          </div>

          <!-- 호버 오버레이 -->
          <div class="grid-overlay" :class="{ visible: hoveredId === post.id }">
            <div class="overlay-stat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2">
                <path d="M13 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0"/>
                <path d="M7.5 15.5 9 11l3 2 2-5"/>
                <path d="M4 19l3.5-3.5"/>
              </svg>
              {{ post.distance }}km
            </div>
            <div class="overlay-stat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#e53e3e" stroke="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {{ post.likeCount }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 프로필 편집 모달 ── -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal">
        <h3 class="modal-title">프로필 편집</h3>
        <div class="form-group">
          <label class="form-label">닉네임</label>
          <input
            v-model="editNickname"
            type="text"
            class="form-input"
            placeholder="닉네임을 입력하세요"
            maxlength="20"
          />
        </div>
        <div class="form-group">
          <label class="form-label">한 줄 소개</label>
          <input
            v-model="editBio"
            type="text"
            class="form-input"
            placeholder="한 줄 소개를 입력하세요"
            maxlength="50"
          />
        </div>
        <div class="modal-actions">
          <button class="modal-btn modal-cancel" @click="showEditModal = false">취소</button>
          <button class="modal-btn modal-confirm" :disabled="!editNickname.trim()" @click="saveEdit">저장</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-wrap {
  min-height: 100vh;
  background: #fff;
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

.nav-item:hover { color: #3b5bdb; background: #eef2ff; font-weight: 600; }

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

.nav-icon-btn:hover { color: #3b5bdb; background: #eef2ff; }

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

.nav-btn-my:hover,
.nav-btn-my.active { background: #2f4ac7; }

/* ── 메인 ── */
.main-wrap {
  max-width: 900px;
  margin: 0 auto;
  padding: 36px 24px 60px;
}

/* ── 프로필 헤더 ── */
.profile-header {
  display: flex;
  align-items: flex-start;
  gap: 48px;
  margin-bottom: 32px;
}

.avatar-lg {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: #edf0f7;
  border: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar-lg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 8px;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-nickname {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
  letter-spacing: -0.3px;
}

.btn-edit {
  height: 32px;
  padding: 0 16px;
  background: #f7f8fc;
  border: 1.5px solid #dbdfe9;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #2d3748;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit:hover { border-color: #3b5bdb; color: #3b5bdb; background: #eef2ff; }

.btn-friend {
  height: 32px;
  padding: 0 16px;
  background: #3b5bdb;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-friend:hover { background: #2f4ac7; }

.btn-friend-delete {
  background: #fff;
  border: 1.5px solid #e53e3e;
  color: #e53e3e;
}

.btn-friend-delete:hover { background: #fff5f5; }

.profile-counts {
  display: flex;
  gap: 32px;
}

.count-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.count-value {
  font-size: 18px;
  font-weight: 800;
  color: #1a1a2e;
  letter-spacing: -0.4px;
}

.count-value small {
  font-size: 13px;
  font-weight: 600;
}

.count-label {
  font-size: 12px;
  color: #718096;
  font-weight: 500;
}

.profile-bio {
  font-size: 14px;
  color: #2d3748;
  margin: 0;
  line-height: 1.5;
}

/* ── 구분선 ── */
.divider {
  height: 1px;
  background: #edf0f7;
  margin-bottom: 4px;
}

/* ── 빈 상태 ── */
.empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 64px 0;
  color: #94a3b8;
  font-size: 14px;
}

/* ── 게시물 그리드 ── */
.post-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;
}

.grid-item {
  position: relative;
  aspect-ratio: 1 / 1;
  cursor: pointer;
  overflow: hidden;
  background: #f1f3f7;
}

.grid-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.2s;
}

.grid-item:hover .grid-img {
  transform: scale(1.03);
}

.grid-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #f1f3f7;
}

.grid-dist {
  font-size: 13px;
  font-weight: 700;
  color: #94a3b8;
}

/* 호버 오버레이 */
.grid-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  opacity: 0;
  transition: opacity 0.2s;
}

.grid-overlay.visible {
  opacity: 1;
}

.overlay-stat {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

/* ── 모달 ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 16px;
}

.modal {
  background: #fff;
  border-radius: 16px;
  padding: 28px 24px 20px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: #4a5568;
}

.form-input {
  height: 42px;
  padding: 0 13px;
  border: 1.5px solid #dde3ed;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  color: #1a1a2e;
  background: #fafbfc;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus { border-color: #3b5bdb; background: #fff; }

.modal-actions {
  display: flex;
  gap: 8px;
}

.modal-btn {
  flex: 1;
  height: 44px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-cancel {
  background: #f7f8fc;
  border: 1.5px solid #e2e8f0;
  color: #718096;
}

.modal-cancel:hover { border-color: #a0b0e0; color: #3b5bdb; }

.modal-confirm {
  background: #3b5bdb;
  border: none;
  color: #fff;
}

.modal-confirm:hover:not(:disabled) { background: #2f4ac7; }

.modal-confirm:disabled { background: #a0aec0; cursor: not-allowed; }

/* ── 반응형 ── */
@media (max-width: 640px) {
  .profile-header { gap: 24px; }
  .avatar-lg { width: 80px; height: 80px; }
  .profile-nickname { font-size: 18px; }
  .profile-counts { gap: 20px; }
  .main-wrap { padding: 24px 16px 48px; }
  .navbar { padding: 0 16px; }
}
</style>
