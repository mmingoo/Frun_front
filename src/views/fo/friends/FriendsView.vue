<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '@/components/layout/NavBar.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { searchFriend, requestFriend, acceptFriend, rejectFriend, deleteFriend } from '@/api/friend'
import { BASE_URL } from '@/api/index.js'

const router = useRouter()

const searchInput = ref('')
const searchResults = ref([])
const hasSearched = ref(false)
const isLoading = ref(false)

let debounceTimer = null

watch(searchInput, (val) => {
  clearTimeout(debounceTimer)
  if (!val.trim()) {
    searchResults.value = []
    hasSearched.value = false
    return
  }
  debounceTimer = setTimeout(() => doSearch(), 300)
})

async function doSearch() {
  if (!searchInput.value.trim()) return
  isLoading.value = true
  hasSearched.value = true
  try {
    const res = await searchFriend(searchInput.value.trim(), null, null, 20)
    const data = res.data.data
    searchResults.value = (data.users ?? []).map((u) => ({
      id: u.userId,
      nickname: u.nickname,
      profileImage: u.profileImageUrl ? `${BASE_URL}${u.profileImageUrl}` : null,
      friendStatus: u.friendStatus ?? 'NONE',
    }))
  } catch (e) {
    console.error('친구 검색 실패', e)
    searchResults.value = []
  } finally {
    isLoading.value = false
  }
}

async function handleAddFriend(user) {
  try {
    await requestFriend(user.id)
    user.friendStatus = 'SENDED'
  } catch (e) {
    console.error('친구 요청 실패', e)
  }
}


async function handleAcceptFriend(user) {
  try {
    await acceptFriend(user.id)
    user.friendStatus = 'FRIEND'
  } catch (e) {
    console.error('친구 수락 실패', e)
  }
}

async function handleRejectFriend(user) {
  try {
    await rejectFriend(user.id)
    user.friendStatus = 'NONE'
  } catch (e) {
    console.error('친구 거절 실패', e)
  }
}

async function handleDeleteFriend(user) {
  try {
    await deleteFriend(user.id)
    user.friendStatus = 'NONE'
  } catch (e) {
    console.error('친구 삭제 실패', e)
  }
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
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            stroke-width="2"
            class="search-icon"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
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
        <div v-if="isLoading" class="empty-text">검색 중...</div>
        <div v-else-if="searchResults.length === 0" class="empty-text">검색 결과가 없습니다.</div>
        <ul v-else class="friend-list">
          <li v-for="user in searchResults" :key="user.id" class="friend-item">
            <div class="friend-avatar" style="cursor:pointer" @click="router.push(`/mypage/${user.id}`)">
              <UserAvatar :src="user.profileImage" :alt="user.nickname" :size="20" />
            </div>
            <span class="friend-name" style="cursor:pointer" @click="router.push(`/mypage/${user.id}`)">{{ user.nickname }}</span>

            <template v-if="user.friendStatus === 'NONE'">
              <button class="btn-add" @click="handleAddFriend(user)">친구 추가</button>
            </template>
            <template v-else-if="user.friendStatus === 'SENDED'">
              <button class="btn-add btn-disabled" disabled>친구요청 중</button>
            </template>
            <template v-else-if="user.friendStatus === 'PENDING'">
              <div class="btn-group">
                <button class="btn-add btn-accept" @click="handleAcceptFriend(user)">수락</button>
                <button class="btn-delete" @click="handleRejectFriend(user)">거절</button>
              </div>
            </template>
            <template v-else-if="user.friendStatus === 'FRIEND'">
              <div class="btn-group">
                <span class="already-friend">친구</span>
                <button class="btn-delete" @click="handleDeleteFriend(user)">삭제</button>
              </div>
            </template>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped src="./FriendsView.css" />
