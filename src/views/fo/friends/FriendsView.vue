<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '@/components/layout/NavBar.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'

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
}
</script>

<template>
  <div class="page-wrap">
    <NavBar />

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
              <UserAvatar :src="user.profileImage" :alt="user.nickname" :size="20" />
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
              <UserAvatar :src="friend.profileImage" :alt="friend.nickname" :size="20" />
            </div>
            <span class="friend-name" @click="router.push(`/mypage/${friend.id}`)">{{ friend.nickname }}</span>
            <button class="btn-delete" @click="openDeleteModal(friend.id)">친구 삭제</button>
          </li>
        </ul>
      </div>
    </div>

    <!-- ── 삭제 확인 모달 ── -->
    <ConfirmModal
      v-model:show="showDeleteModal"
      title="친구 삭제"
      confirm-text="삭제"
      @confirm="confirmDelete"
    >
      <strong>{{ deleteTargetNickname }}</strong> 님을 친구 목록에서 삭제하시겠습니까?
    </ConfirmModal>
  </div>
</template>

<style scoped src="./FriendsView.css" />
