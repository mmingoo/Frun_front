<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const searchQuery = ref('')
const searchInput = ref('')

const friends = ref([
  { id: 2, nickname: '친구닉네임A', profileImage: null },
  { id: 3, nickname: '친구닉네임B', profileImage: null },
  { id: 4, nickname: '친구닉네임C', profileImage: null },
  { id: 5, nickname: '친구닉네임D', profileImage: null },
])

const searchResults = ref([])
const hasSearched = ref(false)
const showDeleteModal = ref(false)
const deleteTargetId = ref(null)

const filteredFriends = computed(() => {
  if (!searchQuery.value) return friends.value
  return friends.value.filter((f) =>
    f.nickname.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const deleteTargetNickname = computed(() => {
  const t = friends.value.find((f) => f.id === deleteTargetId.value)
  return t ? t.nickname : ''
})

function doSearch() {
  hasSearched.value = true
  if (!searchInput.value.trim()) {
    searchResults.value = []
    return
  }
  // TODO: API 연동
  searchResults.value = [
    { id: 10, nickname: searchInput.value.trim(), profileImage: null, isFriend: false },
  ]
}

function addFriend(user) {
  // TODO: API 연동
  user.isFriend = true
  friends.value.push({ id: user.id, nickname: user.nickname, profileImage: user.profileImage })
}

function openDeleteModal(id) {
  deleteTargetId.value = id
  showDeleteModal.value = true
}

function confirmDelete() {
  friends.value = friends.value.filter((f) => f.id !== deleteTargetId.value)
  showDeleteModal.value = false
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
        <button class="nav-item active" @click="router.push('/friends')">친구</button>
        <button class="nav-icon-btn" @click="router.push('/notifications')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
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

    <!-- ── 메인 콘텐츠 ── -->
    <div class="main-wrap">

      <!-- 검색 바 -->
      <div class="search-row">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" class="search-icon">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="searchInput"
            type="text"
            class="search-input"
            placeholder="닉네임으로 친구 검색"
            @keydown.enter="doSearch"
          />
        </div>
        <button class="search-btn" @click="doSearch">검색</button>
      </div>

      <!-- 검색 결과 -->
      <div v-if="hasSearched && searchInput.trim()" class="section">
        <h2 class="section-title">검색 결과</h2>
        <div v-if="searchResults.length === 0" class="empty-text">검색 결과가 없습니다.</div>
        <ul v-else class="friend-list">
          <li v-for="user in searchResults" :key="user.id" class="friend-item">
            <div class="friend-avatar">
              <img v-if="user.profileImage" :src="user.profileImage" :alt="user.nickname" />
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span class="friend-name">{{ user.nickname }}</span>
            <button v-if="!user.isFriend" class="btn-add" @click="addFriend(user)">친구 추가</button>
            <span v-else class="already-friend">친구</span>
          </li>
        </ul>
      </div>

      <!-- 친구 목록 -->
      <div class="section">
        <h2 class="section-title">친구 목록 {{ friends.length }}명</h2>
        <div v-if="filteredFriends.length === 0" class="empty-text">친구가 없습니다.</div>
        <ul v-else class="friend-list">
          <li v-for="friend in filteredFriends" :key="friend.id" class="friend-item">
            <div class="friend-avatar">
              <img v-if="friend.profileImage" :src="friend.profileImage" :alt="friend.nickname" />
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span class="friend-name" @click="router.push(`/mypage/${friend.id}`)">{{ friend.nickname }}</span>
            <button class="btn-delete" @click="openDeleteModal(friend.id)">친구 삭제</button>
          </li>
        </ul>
      </div>
    </div>

    <!-- ── 삭제 확인 모달 ── -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal">
        <h3 class="modal-title">친구 삭제</h3>
        <p class="modal-desc">
          <strong>{{ deleteTargetNickname }}</strong> 님을 친구 목록에서 삭제하시겠습니까?
        </p>
        <div class="modal-actions">
          <button class="modal-btn modal-cancel" @click="showDeleteModal = false">취소</button>
          <button class="modal-btn modal-confirm" @click="confirmDelete">삭제</button>
        </div>
      </div>
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

.nav-icon-btn:hover {
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
  margin-left: 4px;
}

.nav-btn-my:hover {
  background: #2f4ac7;
}

/* ── 메인 ── */
.main-wrap {
  max-width: 760px;
  margin: 0 auto;
  padding: 28px 20px 60px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── 검색 ── */
.search-row {
  display: flex;
  gap: 10px;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 0 16px;
  height: 46px;
  transition: border-color 0.2s;
}

.search-box:focus-within {
  border-color: #3b5bdb;
}

.search-icon {
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  font-family: inherit;
  color: #1a1a2e;
  background: transparent;
}

.search-input::placeholder {
  color: #b0b9c8;
}

.search-btn {
  height: 46px;
  padding: 0 24px;
  background: #3b5bdb;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.search-btn:hover {
  background: #2f4ac7;
}

/* ── 섹션 ── */
.section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
}

.empty-text {
  font-size: 13px;
  color: #94a3b8;
  padding: 16px 0;
  text-align: center;
}

/* ── 친구 목록 ── */
.friend-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.friend-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border: 1px solid #edf0f7;
  border-radius: 14px;
  padding: 12px 16px;
}

.friend-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #edf0f7;
  border: 1.5px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.friend-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.friend-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  cursor: pointer;
  transition: color 0.15s;
}

.friend-name:hover {
  color: #3b5bdb;
}

.btn-delete {
  height: 32px;
  padding: 0 14px;
  background: #fff;
  border: 1.5px solid #e53e3e;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #e53e3e;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-delete:hover {
  background: #fff5f5;
}

.btn-add {
  height: 32px;
  padding: 0 14px;
  background: #3b5bdb;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-add:hover {
  background: #2f4ac7;
}

.already-friend {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  padding: 0 4px;
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
  max-width: 340px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 10px;
}

.modal-desc {
  font-size: 14px;
  color: #4a5568;
  margin: 0 0 20px;
  line-height: 1.6;
}

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

.modal-cancel:hover {
  border-color: #a0b0e0;
  color: #3b5bdb;
}

.modal-confirm {
  background: #e53e3e;
  border: none;
  color: #fff;
}

.modal-confirm:hover {
  background: #c53030;
}

/* ── 반응형 ── */
@media (max-width: 480px) {
  .main-wrap {
    padding: 18px 14px 40px;
  }

  .navbar {
    padding: 0 16px;
  }
}
</style>
