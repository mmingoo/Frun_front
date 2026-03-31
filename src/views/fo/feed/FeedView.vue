<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getFeed, reportPost } from '@/api/feed.js'
import { BASE_URL } from '@/api/index.js'
import './FeedView.css'
import NavBar from '@/components/layout/NavBar.vue'
import FeedPostCard from '@/components/feed/FeedPostCard.vue'
import ReportModal from '@/components/common/ReportModal.vue'
import FriendSidebar from '@/components/layout/FriendSidebar.vue'

const router = useRouter()

const currentUserId = 1

onMounted(async () => {
  await loadFeed()
})

// ── 공지사항 ──────────────────────────────────────────────
const myStats = ref({})
const notices = ref([])
const NOTICE_PAGE_SIZE = 5
const noticePage = ref(1)
const noticeTotalPages = computed(() => Math.ceil(notices.value.length / NOTICE_PAGE_SIZE))
const pagedNotices = computed(() => {
  const start = (noticePage.value - 1) * NOTICE_PAGE_SIZE
  return notices.value.slice(start, start + NOTICE_PAGE_SIZE)
})

// ── 피드 ─────────────────────────────────────────────────
const posts = ref([])
const cursorId = ref(null)
const hasNext = ref(true)
const isFeedLoading = ref(false)

async function loadFeed() {
  if (isFeedLoading.value || !hasNext.value) return
  isFeedLoading.value = true
  try {
    const res = await getFeed(cursorId.value)
    const { feeds, hasNext: next, nextCursorId } = res.data.data
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
      runDate: f.runDate ?? null,
      runTime: f.runTime ? f.runTime.slice(0, 5) : null,
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

function goToDetail(post) {
  router.push(`/feed/${post.id}/${post.authorId}`)
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
      <FriendSidebar />

      <!-- ② 가운데: 피드 -->
      <main class="feed-col">
        <div v-if="posts.length === 0" class="feed-empty">친구의 게시글이 없습니다</div>
        <div v-else class="feed-list">
          <FeedPostCard
            v-for="post in posts"
            :key="post.id"
            :post="post"
            :current-user-id="currentUserId"
            @like="toggleLike"
            @report="openReport"
            @detail="goToDetail"
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
              <span class="stats-value">{{ myStats.week?.distance }} km</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">러닝 횟수</span>
              <span class="stats-value">{{ myStats.week?.count }}회</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">평균 페이스</span>
              <span class="stats-value">{{ myStats.week?.pace }}</span>
            </div>
          </div>

          <div class="stats-divider" />

          <div class="stats-header">
            <h2 class="sidebar-title">이번 달 내 기록</h2>
          </div>
          <div class="stats-grid">
            <div class="stats-item">
              <span class="stats-label">총 거리</span>
              <span class="stats-value highlight">{{ myStats.month?.distance }} km</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">러닝 횟수</span>
              <span class="stats-value">{{ myStats.month?.count }}회</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">평균 페이스</span>
              <span class="stats-value">{{ myStats.month?.pace }}</span>
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
