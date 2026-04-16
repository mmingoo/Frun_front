<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { getFriendList, deleteFriend } from '@/api/friend.js'
import { BASE_URL } from '@/api/index.js'
import UserAvatar from '@/components/common/UserAvatar.vue'

const router = useRouter()

const visibleFriends = ref([])
const isLoadingFriends = ref(false)
const hasMoreFriends = ref(true)
const nextCursorName = ref(null)
const nextCursorId = ref(null)

const friendSearch = ref('')
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
    const res = await getFriendList(
      nextCursorName.value ?? undefined,
      nextCursorId.value ?? undefined,
    )
    const { friends, hasNext, nextCursorId: nextId, nextCursorName: nextName } = res.data.data
    visibleFriends.value.push(
      ...friends.map((f) => ({
        id: f.friendId,
        nickname: f.friendName,
        profileImage: f.friendProfileImage ? `${BASE_URL}${f.friendProfileImage}` : null,
      })),
    )
    if (!hasNext || (nextId != null && nextId === nextCursorId.value)) {
      hasMoreFriends.value = false
      return
    }
    console.log(nextId)
    console.log(nextName)
    hasMoreFriends.value = true
    nextCursorId.value = nextId ?? null
    nextCursorName.value = nextName ?? null
    console.log()
  } catch (e) {
    console.error('친구 목록 로딩 실패', e)
  } finally {
    isLoadingFriends.value = false
  }
}

function setupObserver() {
  if (!friendSentinelRef.value) return
  friendObserver?.disconnect()
  friendObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) loadMoreFriends()
    },
    { root: null, rootMargin: '0px', threshold: 0 },
  )
  friendObserver.observe(friendSentinelRef.value)
}

const pendingDeleteFriend = ref(null)

function confirmDelete(friend) {
  pendingDeleteFriend.value = friend
}

async function executeDelete() {
  const friend = pendingDeleteFriend.value
  pendingDeleteFriend.value = null
  try {
    await deleteFriend(friend.id)
    visibleFriends.value = visibleFriends.value.filter((f) => f.id !== friend.id)
    alert('친구를 삭제하였습니다.')
  } catch (e) {
    const message = e.response?.data?.message
    alert(message)
  }
}

onMounted(async () => {
  await loadMoreFriends()
  setupObserver()
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
      <ul class="friend-list">
        <li
          v-for="friend in filteredFriends"
          :key="friend.id"
          class="friend-item"
          @click="$router.push(`/mypage/${friend.id}`)"
        >
          <div class="friend-avatar">
            <UserAvatar :src="friend.profileImage" :alt="friend.nickname" :size="15" />
          </div>
          <span class="friend-name">{{ friend.nickname }}</span>
          <button class="friend-delete-btn" @click.stop="confirmDelete(friend)" title="친구 삭제">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </li>

        <li ref="friendSentinelRef" class="friend-sentinel">
          <span v-if="isLoadingFriends" class="friend-spinner" />
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

  <Teleport to="body">
    <div
      v-if="pendingDeleteFriend"
      class="fs-modal-overlay"
      @click.self="pendingDeleteFriend = null"
    >
      <div class="fs-modal">
        <p class="fs-modal-msg">
          <strong>{{ pendingDeleteFriend.nickname }}</strong> 님을 친구 목록에서 삭제하시겠습니까?
        </p>
        <div class="fs-modal-actions">
          <button class="fs-modal-btn fs-cancel" @click="pendingDeleteFriend = null">취소</button>
          <button class="fs-modal-btn fs-confirm" @click="executeDelete">삭제</button>
        </div>
      </div>
    </div>
  </Teleport>
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

.friend-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #e2e8f0;
  border-top-color: #3b5bdb;
  border-radius: 50%;
  animation: friend-spin 0.7s linear infinite;
}

@keyframes friend-spin {
  to {
    transform: rotate(360deg);
  }
}

.friend-delete-btn {
  margin-left: auto;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  border-radius: 4px;
  color: #c4cad6;
  cursor: pointer;
  opacity: 1;
  transition:
    color 0.15s,
    background 0.15s;
  padding: 0;
}

.friend-delete-btn:hover {
  color: #e53e3e;
  background: #fff0f0;
}

.fs-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.fs-modal {
  background: #fff;
  border-radius: 14px;
  padding: 24px 22px 18px;
  width: 280px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
}

.fs-modal-msg {
  font-size: 14px;
  color: #2d3748;
  margin: 0 0 18px;
  line-height: 1.5;
  text-align: center;
}

.fs-modal-actions {
  display: flex;
  gap: 8px;
}

.fs-modal-btn {
  flex: 1;
  height: 38px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.fs-cancel {
  background: #f7f8fc;
  border: 1.5px solid #e2e8f0;
  color: #718096;
}

.fs-cancel:hover {
  border-color: #a0b0e0;
  color: #3b5bdb;
}

.fs-confirm {
  background: #e53e3e;
  border: none;
  color: #fff;
}

.fs-confirm:hover {
  background: #c53030;
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
