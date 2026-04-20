<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '@/components/layout/NavBar.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import {
  getNotifications,
  deleteSelectedNotifications,
  deleteAllNotifications,
} from '@/api/notification.js'
import { acceptFriend, rejectFriend } from '@/api/friend.js'
import { BASE_URL } from '@/api/index.js'

const router = useRouter()

const notifications = ref([])
const cursorId = ref(null)
const hasNext = ref(true)
const loading = ref(false)
const sentinel = ref(null)
const selectedIds = ref([])

const unread = computed(() => notifications.value.filter((n) => !n.read).length)
const isAllSelected = computed(
  () =>
    notifications.value.length > 0 &&
    notifications.value.every((n) => selectedIds.value.includes(n.notificationId)),
)

function getType(message) {
  if (message.includes('좋아요')) return 'like'
  if (message.includes('댓글')) return 'comment'
  if (message.includes('친구')) return 'friend'
  return 'like'
}

function isReport(noti) {
  if (noti.type === 'REPORT_ACCEPTED' || noti.type === 'REPORT_REJECTED') return true
  return noti.message?.includes('신고')
}

async function loadMore() {
  if (loading.value || !hasNext.value) return
  loading.value = true
  try {
    const res = await getNotifications(cursorId.value)
    const { notificationDtoList, nextCursorId, hasNext: more } = res.data.data
    notifications.value.push(...notificationDtoList)
    if (nextCursorId === cursorId.value) {
      hasNext.value = false
      return
    }
    cursorId.value = nextCursorId
    hasNext.value = more
  } catch (e) {
    console.error('알림 조회 실패', e)
  } finally {
    loading.value = false
  }
}

let observer = null

onMounted(() => {
  loadMore()
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) loadMore()
    },
    { threshold: 0.1 },
  )
  if (sentinel.value) observer.observe(sentinel.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
})

function handleClick(noti) {
  const type = getType(noti.message)
  if (type === 'friend') return
  if (isReport(noti)) return
  noti.read = true
  if (noti.commentId) {
    router.push(`/feed/${noti.runningLogId}/${noti.authorId}?commentId=${noti.commentId}`)
  } else {
    router.push(`/feed/${noti.runningLogId}/${noti.authorId}`)
  }
}

function markAllRead() {
  notifications.value.forEach((n) => (n.read = true))
}

async function handleAccept(noti) {
  try {
    await acceptFriend(noti.senderId)
    noti.friendRequestStatus = 'FRIEND'
  } catch (e) {
    const message = e.response?.data?.message
    alert(message)
  }
}

async function handleReject(noti) {
  try {
    await rejectFriend(noti.senderId)
    noti.friendRequestStatus = 'REJECTED'
  } catch (e) {
    const message = e.response?.data?.message
    alert(message)
  }
}

function toggleSelect(id) {
  const idx = selectedIds.value.indexOf(id)
  if (idx === -1) selectedIds.value.push(id)
  else selectedIds.value.splice(idx, 1)
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = notifications.value.map((n) => n.notificationId)
  }
}

async function deleteSelected() {
  if (selectedIds.value.length === 0) return
  if (!confirm('알림을 삭제하시겠습니까?')) return
  try {
    const res = await deleteSelectedNotifications(selectedIds.value)
    notifications.value = notifications.value.filter(
      (n) => !selectedIds.value.includes(n.notificationId),
    )
    selectedIds.value = []
    alert(res.data.message)
  } catch (e) {
    alert(e.response?.data?.message || '삭제에 실패했습니다.')
  }
}

async function deleteAll() {
  if (!confirm('모든 알림을 삭제하시겠습니까?')) return
  try {
    const res = await deleteAllNotifications()
    notifications.value = []
    selectedIds.value = []
    alert(res.data.message)
  } catch (e) {
    alert(e.response?.data?.message || '삭제에 실패했습니다.')
  }
}
</script>

<template>
  <div class="page-wrap">
    <NavBar />

    <div class="main-wrap">
      <div class="page-header">
        <h1 class="page-title">
          알림
          <span v-if="unread > 0" class="unread-chip">{{ unread }}개 읽지 않음</span>
        </h1>
        <button v-if="unread > 0" class="mark-all-btn" @click="markAllRead">모두 읽음</button>
      </div>

      <div class="noti-section">
        <div class="delete-toolbar">
          <label class="select-all-label" @click.prevent="toggleSelectAll">
            <span class="select-all-checkbox">
              <input type="checkbox" :checked="isAllSelected" @change.stop />
              <span class="noti-checkbox-ui" />
            </span>
            전체 선택
          </label>
          <div class="delete-btns">
            <button
              class="btn-delete-selected"
              :disabled="selectedIds.length === 0"
              @click="deleteSelected"
            >
              선택 삭제{{ selectedIds.length > 0 ? ` (${selectedIds.length})` : '' }}
            </button>
            <button class="btn-delete-all" @click="deleteAll">전체 삭제</button>
          </div>
        </div>

        <div v-if="!loading && notifications.length === 0" class="empty-wrap">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#c4cad6"
            stroke-width="1.5"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <p>알림이 없습니다.</p>
        </div>

        <ul v-else class="noti-list">
          <li
            v-for="noti in notifications"
            :key="noti.notificationId"
            class="noti-item"
            :class="{
              unread: !noti.read,
              clickable: getType(noti.message) !== 'friend' && !isReport(noti),
              report: isReport(noti),
              selected: selectedIds.includes(noti.notificationId),
            }"
            @click="toggleSelect(noti.notificationId)"
          >
            <label class="noti-checkbox-wrap" @click.stop>
              <input
                type="checkbox"
                :checked="selectedIds.includes(noti.notificationId)"
                @change.stop="toggleSelect(noti.notificationId)"
              />
              <span class="noti-checkbox-ui" />
            </label>
            <div class="noti-avatar-wrap">
              <div
                class="noti-avatar"
                :style="isReport(noti) ? 'cursor: default' : 'cursor: pointer'"
                @click.stop="!isReport(noti) && router.push(`/mypage/${noti.senderId}`)"
              >
                <UserAvatar
                  :src="noti.userProfileImageUrl ? `${BASE_URL}${noti.userProfileImageUrl}` : null"
                  :alt="noti.message"
                  :size="20"
                />
              </div>
            </div>

            <div class="noti-body">
              <p class="noti-text">{{ noti.message }}</p>
              <span
                v-if="noti.content"
                class="noti-content"
                @click.stop="isReport(noti) ? toggleSelect(noti.notificationId) : handleClick(noti)"
              >{{ noti.content }}</span>
            </div>

            <template v-if="getType(noti.message) === 'friend'">
              <div v-if="noti.friendRequestStatus === 'PENDING'" class="friend-actions" @click.stop>
                <button class="btn-accept" @click="handleAccept(noti)">수락</button>
                <button class="btn-reject" @click="handleReject(noti)">거절</button>
              </div>
              <span v-else-if="noti.friendRequestStatus === 'FRIEND'" class="status-badge accepted"
                >수락됨</span
              >
              <span
                v-else-if="noti.friendRequestStatus === 'REJECTED'"
                class="status-badge rejected"
                >거절됨</span
              >
            </template>

            <span v-if="!noti.read && getType(noti.message) !== 'friend'" class="unread-dot" />
          </li>
        </ul>
      </div>

      <!-- 무한 스크롤 감지 sentinel -->
      <div ref="sentinel" class="sentinel" />

      <div v-if="loading" class="loading-wrap">
        <span class="loading-spinner" />
      </div>
    </div>
  </div>
</template>

<style scoped src="./NotificationsView.css" />
