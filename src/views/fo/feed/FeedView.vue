<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { reportPost } from '@/api/feed.js'

const router = useRouter()

// ── 목 데이터 ──────────────────────────────────────────────
const currentUserId = 1

// 전체 친구 목록 (실제로는 API에서 페이지 단위로 받아옴)
const ALL_FRIENDS = Array.from({ length: 60 }, (_, i) => ({
  id: i + 2,
  nickname: `친구${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i / 26) : ''}`,
  profileImage: null,
}))

const PAGE_SIZE = 20
const friendSearch = ref('')
const friendListRef = ref(null)
const friendSentinelRef = ref(null)
const visibleFriends = ref(ALL_FRIENDS.slice(0, PAGE_SIZE))
const filteredFriends = computed(() =>
  friendSearch.value.trim()
    ? visibleFriends.value.filter((f) => f.nickname.includes(friendSearch.value.trim()))
    : visibleFriends.value,
)
const isLoadingFriends = ref(false)
const hasMoreFriends = ref(ALL_FRIENDS.length > PAGE_SIZE)

let friendObserver = null

function loadMoreFriends() {
  if (isLoadingFriends.value || !hasMoreFriends.value) return
  isLoadingFriends.value = true
  // 실제 구현 시 API 호출로 교체
  setTimeout(() => {
    const start = visibleFriends.value.length
    const next = ALL_FRIENDS.slice(start, start + PAGE_SIZE)
    if (next.length === 0) {
      hasMoreFriends.value = false
    } else {
      visibleFriends.value.push(...next)
      if (visibleFriends.value.length >= ALL_FRIENDS.length) hasMoreFriends.value = false
    }
    isLoadingFriends.value = false
  }, 400)
}

onMounted(() => {
  if (!friendSentinelRef.value) return
  friendObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) loadMoreFriends()
    },
    { root: friendListRef.value, threshold: 0.1 },
  )
  friendObserver.observe(friendSentinelRef.value)
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

const posts = ref([
  {
    id: 1,
    authorId: 2,
    nickname: '러너_닉네임',
    profileImage: null,
    createdAt: '2026.04.10 06:30',
    photo: null,
    distance: null,
    duration: null,
    pace: null,
    memo: null,
    likeCount: 24,
    liked: false,
    commentCount: 8,
    isPublic: true,
  },
  {
    id: 2,
    authorId: 2,
    nickname: '러너_닉네임',
    profileImage: null,
    createdAt: '2026.04.10 06:30',
    photo: null,
    distance: 5.2,
    duration: 32,
    pace: '6\'09"',
    memo: '오늘도 완주! 날씨가 좋아서 기분 좋았다 😊',
    likeCount: 24,
    liked: false,
    commentCount: 8,
    isPublic: true,
  },
])

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
const reportReason = ref('')
const reportEtc = ref('')

function openReport(postId) {
  reportPostId.value = postId
  reportReason.value = ''
  reportEtc.value = ''
  showReportModal.value = true
}

async function submitReport() {
  if (!reportReason.value) return
  await reportPost(reportPostId.value, reportReason.value, reportEtc.value)
  showReportModal.value = false
}
</script>

<template>
  <div class="page-wrap">
    <!-- ── 네비게이션 바 ── -->
    <header class="navbar">
      <button class="nav-logo" @click="router.push('/feed')">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3b5bdb"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M13 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0" />
          <path d="M7.5 15.5 9 11l3 2 2-5" />
          <path d="M4 19l3.5-3.5" />
        </svg>
        <span class="nav-brand">Frun</span>
      </button>
      <div class="nav-actions">
        <button class="nav-item active" @click="router.push('/feed')">홈</button>
        <button class="nav-item" @click="router.push('/stats')">동계</button>
        <button class="nav-item" @click="router.push('/friends')">친구</button>
        <button class="nav-icon-btn" @click="router.push('/notifications')">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
        <button class="nav-btn-my" @click="router.push('/mypage')">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          MY
        </button>
      </div>
    </header>

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
                <img v-if="friend.profileImage" :src="friend.profileImage" :alt="friend.nickname" />
                <svg
                  v-else
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94a3b8"
                  stroke-width="1.8"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
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
        <div class="feed-list">
          <article v-for="post in posts" :key="post.id" class="post-card">
            <!-- 카드 헤더 -->
            <div class="post-header">
              <div class="author-row">
                <div class="avatar">
                  <img v-if="post.profileImage" :src="post.profileImage" :alt="post.nickname" />
                  <svg
                    v-else
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    stroke-width="1.8"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <p class="author-name">{{ post.nickname }}</p>
                  <p class="post-date">{{ post.createdAt }}</p>
                </div>
              </div>
              <button
                v-if="post.authorId !== currentUserId"
                class="report-btn"
                @click="openReport(post.id)"
              >
                신고
              </button>
            </div>

            <!-- 트래커 사진 -->
            <div class="post-photo" @click="router.push(`/feed/${post.id}`)">
              <img v-if="post.photo" :src="post.photo" alt="러닝 트래커 사진" />
              <div v-else class="photo-placeholder">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#c4cad6"
                  stroke-width="1.5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span>[러닝 트래커 사진]</span>
              </div>
            </div>

            <!-- 스탯 (있을 때만) -->
            <div v-if="post.distance" class="post-stats">
              <span class="stat-chip">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3b5bdb"
                  stroke-width="2.2"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                {{ post.distance }}km
              </span>
              <span class="stat-chip">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3b5bdb"
                  stroke-width="2.2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {{ post.duration }}분
              </span>
              <span class="stat-chip">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3b5bdb"
                  stroke-width="2.2"
                >
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
                페이스 {{ post.pace }}
              </span>
            </div>

            <!-- 메모 -->
            <p v-if="post.memo" class="post-memo">{{ post.memo }}</p>

            <!-- 좋아요 / 댓글 -->
            <div class="post-footer">
              <button class="like-btn" :class="{ liked: post.liked }" @click="toggleLike(post)">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  :fill="post.liked ? '#e53e3e' : 'none'"
                  stroke="#e53e3e"
                  stroke-width="2"
                >
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  />
                </svg>
                좋아요 {{ post.likeCount }}개
              </button>
              <button class="comment-link" @click="router.push(`/feed/${post.id}`)">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                댓글 {{ post.commentCount }}개
              </button>
            </div>
          </article>
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
    <div v-if="showReportModal" class="modal-overlay" @click.self="showReportModal = false">
      <div class="modal">
        <h3 class="modal-title">신고 사유 선택</h3>
        <div class="report-options">
          <label class="report-option">
            <input v-model="reportReason" type="radio" value="inappropriate" />
            부적절한 콘텐츠
          </label>
          <label class="report-option">
            <input v-model="reportReason" type="radio" value="etc" />
            기타
          </label>
        </div>
        <textarea
          v-if="reportReason === 'etc'"
          v-model="reportEtc"
          placeholder="신고 사유를 입력하세요."
          class="report-textarea"
          maxlength="200"
          rows="3"
        />
        <div class="modal-actions">
          <button class="modal-btn modal-cancel" @click="showReportModal = false">취소</button>
          <button class="modal-btn modal-confirm" :disabled="!reportReason" @click="submitReport">
            신고
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./FeedView.css" />
