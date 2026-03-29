<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { getFeed, reportPost } from '@/api/feed.js'
import { BASE_URL } from '@/api/index.js'
import { getFriendList } from '@/api/friend.js'
import './FeedView.css'
import NavBar from '@/components/layout/NavBar.vue'
import FeedPostCard from '@/components/feed/FeedPostCard.vue'
import ReportModal from '@/components/common/ReportModal.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'

const router = useRouter()

// ── 목 데이터 ──────────────────────────────────────────────
const currentUserId = 1

// 전체 친구 목록 (실제로는 API에서 페이지 단위로 받아옴)
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
  // 이미 친구목록 로딩 중이거나 , 다음에 불러올 친구 목록이 없을 때 아무것도 안함
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
  await loadFeed()
  await loadMoreFriends()

  // 친구 목록
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

const myStats = ref({
  week: { distance: 23.5, count: 4, pace: '6\'02"' },
  month: { distance: 23.5, count: 4, pace: '6\'02"' },
})

const notices = ref([
  { id: 1, title: '[공지] 서비스 이용 안내' },
  { id: 2, title: '[공지] 친구 기능 업데이트 안내' },
  { id: 3, title: '[공지] 개인정보 처리방침 변경 안내' },
  { id: 4, title: '[공지] 앱 점검 일정 안내' },
  { id: 5, title: '[공지] 이벤트: 5월 러닝 챌린지' },
  { id: 6, title: '[공지] 신규 기능 업데이트 안내' },
  { id: 7, title: '[공지] 커뮤니티 이용 규칙 안내' },
  { id: 8, title: '[공지] 서버 점검 완료 안내' },
  { id: 9, title: '[공지] 여름 러닝 이벤트 안내' },
  { id: 10, title: '[공지] 닉네임 변경 정책 안내' },
])

const NOTICE_PAGE_SIZE = 5
const noticePage = ref(1)
const noticeTotalPages = computed(() => Math.ceil(notices.value.length / NOTICE_PAGE_SIZE))
const pagedNotices = computed(() => {
  const start = (noticePage.value - 1) * NOTICE_PAGE_SIZE
  return notices.value.slice(start, start + NOTICE_PAGE_SIZE)
})

const posts = ref([]) // 피드 목록
const cursorId = ref(null) // 다음 요청용 커서
const hasNext = ref(true) // 다음 페이지 존재 여부
const isFeedLoading = ref(false) // 로딩 상태

async function loadFeed() {
  //이미 로딩 중이거나 다음에 불러올 데이터가 없는 경우 중단
  if (isFeedLoading.value || !hasNext.value) return

  // 로딩 시작 표시, 스피너 보여주기 위해
  isFeedLoading.value = true
  try {
    const res = await getFeed(cursorId.value)

    // 요청 받아온 백엔드 데이터들 할당
    const { feeds, hasNext: next, nextCursorId } = res.data.data

    // posts 변수에 불러온 피드들 복사 (필드 정규화)
    const normalized = feeds.map((f) => ({
      ...f,
      id: f.runningLogId,
      authorId: f.userId,
      nickname: f.nickName ?? f.nickname ?? '',
      profileImage: f.imageUrl ? `${BASE_URL}${f.imageUrl}` : null,
      photos: (f.logImages ?? []).map((img) => `${BASE_URL}${img}`),
      photo: f.logImages?.[0] ? `${BASE_URL}${f.logImages[0]}` : null,
      photoIndex: 0,
      likeCount: f.likeCtn ?? 0,
      commentCount: f.commentCtn ?? 0,
      liked: false,
      createdAt: f.createdAt ? f.createdAt.slice(0, 16).replace('T', ' ') : '',
    }))
    posts.value.push(...normalized)

    hasNext.value = next
    cursorId.value = nextCursorId
  } catch (e) {
    console.error('피드 로딩 실패', e)
  } finally {
    isFeedLoading.value = false
  }
}

// ── 좋아요 ────────────────────────────────────────────────
function toggleLike(post) {
  if (post.liked) {
    post.likeCount--
    post.liked = false
  } else {
    post.likeCount++
    post.liked = true
  }
}

// ── 신고 ──────────────────────────────────────────────────
const showReportModal = ref(false)
const reportPostId = ref(null)

function openReport(postId) {
  reportPostId.value = postId
  showReportModal.value = true
}

async function submitReport({ reason, etc }) {
  await reportPost(reportPostId.value, reason, etc)
  showReportModal.value = false
}
</script>

<template>
  <div class="page-wrap">
    <NavBar />

    <!-- ── 3열 레이아웃 ── -->
    <div class="main-grid">
      <!-- ① 왼쪽: 친구 목록 -->
      <aside class="sidebar-left">
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
            <!-- 무한 스크롤 센티널 -->
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

      <!-- ② 가운데: 피드 -->
      <main class="feed-col">
        <!-- 피드 카드 목록 -->
        <div v-if="posts.length === 0" class="feed-empty">친구의 게시글이 없습니다</div>
        <div v-else class="feed-list">
          <FeedPostCard
            v-for="post in posts"
            :key="post.id"
            :post="post"
            :current-user-id="currentUserId"
            @like="toggleLike"
            @report="openReport"
          />
        </div>
      </main>

      <!-- ③ 오른쪽: 내 기록 + 공지사항 -->
      <aside class="sidebar-right">
        <!-- 이번 주/달 내 기록 -->
        <div class="sidebar-card stats-card">
          <div class="stats-header">
            <h2 class="sidebar-title">이번 주 내 기록</h2>
            <button class="more-link" @click="router.push('/stats')">더보기</button>
          </div>
          <div class="stats-grid">
            <div class="stats-item">
              <span class="stats-label">총 거리</span>
              <span class="stats-value">{{ myStats.week.distance }} km</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">러닝 횟수</span>
              <span class="stats-value">{{ myStats.week.count }}회</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">평균 페이스</span>
              <span class="stats-value">{{ myStats.week.pace }}</span>
            </div>
          </div>

          <div class="stats-divider" />

          <div class="stats-header">
            <h2 class="sidebar-title">이번 달 내 기록</h2>
          </div>
          <div class="stats-grid">
            <div class="stats-item">
              <span class="stats-label">총 거리</span>
              <span class="stats-value highlight">{{ myStats.month.distance }} km</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">러닝 횟수</span>
              <span class="stats-value">{{ myStats.month.count }}회</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">평균 페이스</span>
              <span class="stats-value">{{ myStats.month.pace }}</span>
            </div>
          </div>
        </div>

        <!-- 공지사항 -->
        <div class="sidebar-card notice-card">
          <h2 class="sidebar-title notice-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#e67e22" stroke="none">
              <path
                d="M18 3a1 1 0 0 0-1.447-.894L8.763 6H5a3 3 0 0 0 0 6h.28l1.771 5.316A1 1 0 0 0 8 18h1a1 1 0 0 0 1-1v-4.382l6.553 3.276A1 1 0 0 0 18 15V3z"
              />
            </svg>
            공지사항
          </h2>
          <ul class="notice-list">
            <li
              v-for="notice in pagedNotices"
              :key="notice.id"
              class="notice-item"
              @click="router.push(`/notices/${notice.id}`)"
            >
              {{ notice.title }}
            </li>
          </ul>
          <div class="notice-pagination">
            <button class="notice-page-btn" :disabled="noticePage === 1" @click="noticePage--">
              ‹
            </button>
            <span class="notice-page-info">{{ noticePage }} / {{ noticeTotalPages }}</span>
            <button
              class="notice-page-btn"
              :disabled="noticePage === noticeTotalPages"
              @click="noticePage++"
            >
              ›
            </button>
          </div>
        </div>

        <!-- 러닝일지 작성 버튼 -->
        <button class="write-btn" @click="router.push('/running/write')">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          러닝일지 작성
        </button>
      </aside>
    </div>

    <!-- ── 신고 모달 ── -->
    <ReportModal v-model:show="showReportModal" @submit="submitReport" />
  </div>
</template>
