<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { getFriendList } from '@/api/friend.js'
import UserAvatar from '@/components/common/UserAvatar.vue'

const router = useRouter()

const visibleFriends = ref([])
const isLoadingFriends = ref(false)
const hasMoreFriends = ref(true)
const nextCursorName = ref(null)
const nextCursorId = ref(null)

const friendSearch = ref('')
const friendListRef = ref(null)
const friendSentinelRef = ref(null)

const filteredFriends = computed(() =>
  friendSearch.value.trim()
    ? visibleFriends.value.filter((f) => f.nickname.includes(friendSearch.value.trim()))
    : visibleFriends.value,
)

let friendObserver = null

async function loadMoreFriends() {
  if (isLoadingFriends.value || !hasMoreFriends.value) return
  isLoadingFriends.value = true
  try {
    const res = await getFriendList(nextCursorName.value, nextCursorId.value)
    const { friends, hasNext, nextCursorId: nextId, nextCursorName: nextName } = res.data.data
    visibleFriends.value.push(
      ...friends.map((f) => ({
        id: f.friendId,
        nickname: f.friendName,
        profileImage: f.friendProfileImage,
      })),
    )
    hasMoreFriends.value = hasNext
    nextCursorId.value = nextId
    nextCursorName.value = nextName
  } catch (e) {
    console.error('친구 목록 로딩 실패', e)
  } finally {
    isLoadingFriends.value = false
  }
}

onMounted(async () => {
  await loadMoreFriends()

  if (friendSentinelRef.value) {
    friendObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreFriends()
      },
      { root: friendListRef.value, threshold: 0.1 },
    )
    friendObserver.observe(friendSentinelRef.value)
  }
})

onBeforeUnmount(() => {
  friendObserver?.disconnect()
})
</script>

<template>
  <aside class="friend-sidebar">
    <div class="sidebar-card">
      <h2 class="sidebar-title">친구 목록</h2>
      <div class="friend-search-wrap">
        <svg
          class="friend-search-icon"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          v-model="friendSearch"
          type="text"
          class="friend-search-input"
          placeholder="친구 검색"
        />
      </div>
      <ul ref="friendListRef" class="friend-list">
        <li
          v-for="friend in filteredFriends"
          :key="friend.id"
          class="friend-item"
          @click="router.push(`/mypage/${friend.id}`)"
        >
          <div class="friend-avatar">
            <UserAvatar :src="friend.profileImage" :alt="friend.nickname" :size="15" />
          </div>
          <span class="friend-name">{{ friend.nickname }}</span>
        </li>
        <li ref="friendSentinelRef" class="friend-sentinel">
          <span v-if="isLoadingFriends" class="friend-loading">불러오는 중…</span>
        </li>
      </ul>
      <button class="friend-add-btn" @click="router.push('/friends')">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
        친구 추가
      </button>
    </div>
  </aside>
</template>

<style scoped>
.friend-sidebar {
  position: sticky;
  top: 72px;
}

.sidebar-card {
  background: #fff;
  border: 1px solid #edf0f7;
  border-radius: 16px;
  padding: 18px 16px;
}

.sidebar-title {
  font-size: 13px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 12px;
}

.friend-search-wrap {
  position: relative;
  margin-bottom: 8px;
}

.friend-search-icon {
  position: absolute;
  left: 9px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
  pointer-events: none;
}

.friend-search-input {
  width: 100%;
  height: 32px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  padding: 0 10px 0 28px;
  font-size: 12px;
  font-family: inherit;
  color: #2d3748;
  background: #f7f8fc;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.friend-search-input::placeholder {
  color: #b8c2d0;
}

.friend-search-input:focus {
  border-color: #3b5bdb;
  background: #fff;
}

.friend-list {
  list-style: none;
  margin: 0 0 12px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  height: 450px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #dde3ed transparent;
}

.friend-list::-webkit-scrollbar {
  width: 4px;
}

.friend-list::-webkit-scrollbar-thumb {
  background: #dde3ed;
  border-radius: 4px;
}

.friend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.friend-item:hover {
  background: #f1f3f9;
}

.friend-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #edf0f7;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.friend-name {
  font-size: 12px;
  font-weight: 500;
  color: #2d3748;
}

.friend-sentinel {
  list-style: none;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.friend-loading {
  font-size: 11px;
  color: #94a3b8;
}

.friend-add-btn {
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #f7f8fc;
  border: 1.5px dashed #c4cad6;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}

.friend-add-btn:hover {
  border-color: #3b5bdb;
  color: #3b5bdb;
  background: #eef2ff;
}
</style>
