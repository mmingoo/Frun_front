<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '@/components/layout/NavBar.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { searchFriend, requestFriend, acceptFriend, rejectFriend, deleteFriend } from '@/api/friend'
import { BASE_URL } from '@/api/index.js'

const router = useRouter()

const searchInput = ref('')
const searchResults = ref([])
const hasSearched = ref(false)

let debounceTimer = null
let abortController = null

// 500ms 디바운스 — 입력마다 API를 호출하지 않도록 타이머 초기화 후 재설정
function scheduleSearch(val) {
  clearTimeout(debounceTimer)
  if (!val.trim()) {
    abortController?.abort() // 진행 중인 요청 취소
    searchResults.value = []
    hasSearched.value = false
    return
  }
  debounceTimer = setTimeout(() => doSearch(val), 500)
}

function onInput(e) {
  // e.target.value는 IME 조합 중에도 실제 표시값을 반환하므로
  // 한국어 입력 시 compositionend 없이도 즉시 검색 트리거 가능
  scheduleSearch(e.target.value)
}

// 이전 요청을 abort 후 새 컨트롤러 생성 — 키입력이 빠를 때 이전 응답이 늦게 오면 결과가 덮어씌워지는 문제 방지
async function doSearch(keyword) {
  keyword = (keyword ?? searchInput.value).trim()
  if (!keyword) return

  abortController?.abort()
  abortController = new AbortController()

  try {
    const res = await searchFriend(keyword, null, 20, abortController.signal)
    const data = res.data.data
    searchResults.value = (data.users ?? []).map((u) => ({
      id: u.userId,
      nickname: u.nickname,
      profileImage: u.profileImageUrl ? `${BASE_URL}${u.profileImageUrl}` : null,
      friendStatus: u.friendStatus ?? 'NONE',
    }))
    hasSearched.value = true
  } catch (e) {
    if (e.name === 'CanceledError' || e.code === 'ERR_CANCELED') return
    console.error('친구 검색 실패', e)
    searchResults.value = []
    hasSearched.value = true
  }
}

// API 성공 후 로컬 상태를 'SENDED'로 즉시 업데이트 — 버튼이 "친구요청 중"으로 바뀜
async function handleAddFriend(user) {
  try {
    await requestFriend(user.id)
    user.friendStatus = 'SENDED'
    alert('친구 요청을 보냈습니다.')
  } catch (e) {
    const message = e.response?.data?.message
    alert(message)
  }
}

async function handleAcceptFriend(user) {
  try {
    await acceptFriend(user.id)
    user.friendStatus = 'FRIEND'
    alert('친구 요청을 수락하였습니다.')
  } catch (e) {
    const message = e.response?.data?.message
    alert(message)
  }
}

async function handleRejectFriend(user) {
  try {
    await rejectFriend(user.id)
    user.friendStatus = 'NONE'
    alert('친구 요청을 거절하였습니다.')
  } catch (e) {
    const message = e.response?.data?.message
    alert(message)
  }
}

// confirm으로 한번 더 확인 후 삭제 — 실수 방지
async function handleDeleteFriend(user) {
  if (!confirm(`'${user.nickname}'님을 친구 목록에서 삭제하시겠습니까?`)) return
  try {
    await deleteFriend(user.id)
    user.friendStatus = 'NONE'
    alert('친구를 삭제하였습니다.')
  } catch (e) {
    const message = e.response?.data?.message
    alert(message)
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
            @input="onInput"
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
            <div
              class="friend-avatar"
              style="cursor: pointer"
              @click="router.push(`/mypage/${user.id}`)"
            >
              <UserAvatar :src="user.profileImage" :alt="user.nickname" :size="20" />
            </div>
            <span
              class="friend-name"
              style="cursor: pointer"
              @click="router.push(`/mypage/${user.id}`)"
              >{{ user.nickname }}</span
            >

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
