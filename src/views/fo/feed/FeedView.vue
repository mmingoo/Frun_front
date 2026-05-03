<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { addLike, cancelLike, getFeed } from '@/api/feed.js'
import { useReport } from '@/composables/useReport.js'
import { BASE_URL } from '@/api/index.js'
import { getWeeklyStats, getMonthlyStats } from '@/api/stats'
import { getMyInfo } from '@/api/user'
import { getNotices } from '@/api/notice.js'
import { useAuthStore } from '@/stores/auth'
import './FeedView.css'
import NavBar from '@/components/layout/NavBar.vue'
import FeedPostCard from '@/components/feed/FeedPostCard.vue'
import ReportModal from '@/components/common/ReportModal.vue'
import FriendSidebar from '@/components/layout/FriendSidebar.vue'

const router = useRouter()
const authStore = useAuthStore()

const currentUserId = ref([])

// 페이지 진입 시 유저 정보 확인 후 피드·통계·공지사항을 병렬 로딩하고 무한스크롤 옵저버 등록
onMounted(async () => {
  // 스토어에 userId가 없으면 API로 조회 후 저장
  if (!authStore.userId) {
    const res = await getMyInfo()
    authStore.setUserId(res.data.data.userId)
  }
  // 피드·통계·공지사항 세 요청을 동시에 실행해 초기 로딩 시간 단축
  await Promise.all([loadFeed(), loadMyStats(), loadNotices()])
  // DOM이 준비된 후 무한스크롤 옵저버 연결
  setupFeedObserver()
})

// 초(sec) → "분'초"" 형식의 페이스 문자열로 변환 (예: 330 → "5'30"")
function formatPace(sec) {
  if (!sec) return '-'
  // 초를 분으로 나눈 몫이 분, 나머지가 초 / 초는 2자리로 패딩
  return `${Math.floor(sec / 60)}'${String(sec % 60).padStart(2, '0')}"`
}

// 초(sec) → "N시간 M분" 또는 "M분" 형식의 운동 시간 문자열로 변환
function formatDuration(sec) {
  if (!sec) return '-'
  const h = Math.floor(sec / 3600)               // 전체 시간(hour) 추출
  const m = Math.floor((sec % 3600) / 60)         // 남은 초에서 분(minute) 추출
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`    // 1시간 미만이면 분만 표시
}

// 이번 주·이번 달 러닝 통계를 병렬 조회해 myStats에 저장
async function loadMyStats() {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)  // API 파라미터용 "YYYY-MM-DD" 문자열
  try {
    // 주간·월간 통계를 동시에 요청해 대기 시간 최소화
    const [weekRes, monthRes] = await Promise.all([
      getWeeklyStats(authStore.userId, todayStr),
      getMonthlyStats(authStore.userId, today.getFullYear(), today.getMonth() + 1),
    ])
    // 응답에서 summary 객체만 꺼내 변수에 할당
    const w = weekRes.data.data.summary
    const mo = monthRes.data.data.summary
    // 화면에 필요한 형태로 가공해 myStats에 저장
    myStats.value = {
      week: {
        distance: w.totalDistanceKm,
        count: w.runCount,
        pace: formatPace(w.avgPaceSec),           // 초 → 페이스 문자열
        totalTime: formatDuration(w.totalDurationSec),  // 초 → 시간 문자열
      },
      month: {
        distance: mo.totalDistanceKm,
        count: mo.runCount,
        pace: formatPace(mo.avgPaceSec),
        totalTime: formatDuration(mo.totalDurationSec),
      },
    }
  } catch (e) {
    console.error('내 통계 로딩 실패', e)
  }
}

// ── 공지사항 ──────────────────────────────────────────────
const myStats = ref({})
const notices = ref([])
const NOTICE_PAGE_SIZE = 5
const noticePage = ref(1)

// 전체 공지사항을 페이지 단위로 반복 호출해 notices 배열에 누적 (hasNext가 false일 때까지)
async function loadNotices() {
  try {
    let page = 0
    let hasMore = true
    // 서버에 다음 페이지가 없을 때까지 순차적으로 모두 불러옴
    while (hasMore) {
      const res = await getNotices(page)
      // notices를 list로, hasNext를 next로 구조분해 (변수명 충돌 방지)
      const { notices: list, hasNext: next } = res.data.data
      // API 응답 필드를 컴포넌트에서 사용하는 이름으로 매핑
      notices.value.push(
        ...list.map((n) => ({
          id: n.noticeId,
          title: n.title,
          noticeType: n.noticeType,
          createdDate: n.createdAt,
        })),
      )
      hasMore = next   // 다음 페이지 존재 여부 갱신
      page++
    }
  } catch (e) {
    console.error('공지사항 로딩 실패', e)
  }
}
const NOTICE_TYPE_LABEL = {
  GENERAL: '일반',
  COMPETITION: '대회',
  EVENT: '이벤트',
  UPDATE: '업데이트',
}
// 공지 타입 영문 코드를 한글 레이블로 변환 (미정의 타입은 원본 코드 그대로 반환)
function noticeTypeLabel(type) {
  return NOTICE_TYPE_LABEL[type] ?? type
}

// 전체 공지 수를 페이지 크기로 나눠 올림 → 총 페이지 수
const noticeTotalPages = computed(() => Math.ceil(notices.value.length / NOTICE_PAGE_SIZE))
const pagedNotices = computed(() => {
  // 현재 페이지의 시작 인덱스 계산 후 NOTICE_PAGE_SIZE 만큼 잘라서 반환
  const start = (noticePage.value - 1) * NOTICE_PAGE_SIZE
  return notices.value.slice(start, start + NOTICE_PAGE_SIZE)
})

// ── 피드 ─────────────────────────────────────────────────
const posts = ref([])
const cursorId = ref(null)
const hasNext = ref(true)
const isFeedLoading = ref(false)
const feedListRef = ref(null)
const feedSentinelRef = ref(null)
let feedObserver = null

// 커서 기반 무한스크롤 피드 로딩 — 중복 호출 방지 후 다음 커서까지 포스트를 누적
async function loadFeed() {
  // 이미 로딩 중이거나 마지막 페이지면 중단
  if (isFeedLoading.value || !hasNext.value) return
  isFeedLoading.value = true
  try {
    const res = await getFeed(cursorId.value)
    const { feeds, hasNext: next, nextCursorId } = res.data.data
    // 커서가 변하지 않았으면 실제로 새 데이터가 없는 것이므로 종료
    if (nextCursorId != null && nextCursorId === cursorId.value) {
      hasNext.value = false
      return
    }
    // API 응답 필드를 컴포넌트 규격에 맞게 정규화
    const normalized = feeds.map((f) => ({
      ...f,
      id: f.runningLogId,
      authorId: f.userId,
      nickname: f.nickName ?? f.nickname ?? '',          // 대소문자 혼용 필드 방어 처리
      profileImage: f.imageUrl ? `${BASE_URL}${f.imageUrl}` : null,
      photos: (f.logImages ?? []).map((img) => `${BASE_URL}${img}`),  // 이미지 목록 절대경로 변환
      photo: f.logImages?.[0] ? `${BASE_URL}${f.logImages[0]}` : null, // 대표 이미지(첫 번째)
      photoIndex: 0,                                      // 이미지 슬라이더 초기 인덱스
      likeCount: f.likeCtn ?? 0,
      commentCount: f.commentCtn ?? 0,
      liked: f.liked,
      createdAt: f.createdAt ? f.createdAt.slice(0, 16).replace('T', ' ') : '',  // ISO → "YYYY-MM-DD HH:mm"
      runDate: f.runDate ?? null,
      runTime: f.runTime ? f.runTime.slice(0, 5) : null,  // "HH:mm:ss" → "HH:mm"
    }))
    posts.value.push(...normalized)   // 기존 목록에 누적
    hasNext.value = next
    cursorId.value = nextCursorId ?? null  // 다음 요청에 사용할 커서 갱신
  } catch (e) {
    console.error('피드 로딩 실패', e)
  } finally {
    isFeedLoading.value = false
  }
}

// 피드 목록 하단 sentinel 요소가 뷰포트에 10% 이상 진입하면 loadFeed를 트리거하는 옵저버 등록
function setupFeedObserver() {
  if (!feedSentinelRef.value) return  // sentinel DOM이 없으면 등록 불가
  feedObserver?.disconnect()          // 이전 옵저버가 남아있으면 먼저 해제
  feedObserver = new IntersectionObserver(
    (entries) => {
      // sentinel이 뷰포트 안으로 들어오면 다음 페이지 로딩
      if (entries[0].isIntersecting) loadFeed()
    },
    { threshold: 0.1 },  // 10% 이상 보일 때 콜백 실행
  )
  feedObserver.observe(feedSentinelRef.value)
}

// 컴포넌트 해제 시 옵저버를 반드시 정리해 메모리 누수 방지
onBeforeUnmount(() => {
  feedObserver?.disconnect()
})

// 선택한 포스트의 상세 페이지로 이동
function goToDetail(post) {
  router.push(`/feed/${post.id}`)
}

// ── 좋아요 ────────────────────────────────────────────────
// Optimistic UI: UI를 먼저 업데이트 후 API 호출, 실패 시 롤백
async function toggleLike(post) {
  if (post.liked) {
    // 이미 좋아요 상태 → 즉시 UI 감소 후 취소 API 호출
    post.likeCount--
    post.liked = false
    try {
      await cancelLike(post.id)
    } catch (e) {
      // API 실패 시 감소했던 수치와 상태를 원복
      post.likeCount++
      post.liked = true
      const message = e.response?.data?.message
      alert(message)
    }
  } else {
    // 좋아요 미설정 상태 → 즉시 UI 증가 후 추가 API 호출
    post.likeCount++
    post.liked = true
    try {
      await addLike(post.id)
    } catch (e) {
      // API 실패 시 증가했던 수치와 상태를 원복
      post.likeCount--
      post.liked = false
      const message = e.response?.data?.message
      alert(message)
    }
  }
}
// ── 신고 ──────────────────────────────────────────────────
const { showReportModal, openReport, submitReport } = useReport()

// ISO 날짜 문자열을 "YYYY-MM-DD HH:mm" 형식으로 잘라서 반환
function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.slice(0, 16).replace('T', ' ')
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
      <main ref="feedListRef" class="feed-col">
        <div v-if="posts.length === 0 && !isFeedLoading" class="feed-empty">
          친구의 게시글이 없습니다
        </div>
        <div class="feed-list">
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
        <div ref="feedSentinelRef" class="feed-sentinel">
          <span v-if="isFeedLoading" class="feed-spinner" />
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
            <div class="stats-item">
              <span class="stats-label">총 러닝 시간</span>
              <span class="stats-value">{{ myStats.week?.totalTime }}</span>
            </div>
          </div>

          <div class="stats-divider" />

          <div class="stats-header">
            <h2 class="sidebar-title">이번 달 내 기록</h2>
          </div>
          <div class="stats-grid">
            <div class="stats-item">
              <span class="stats-label">총 거리</span>
              <span class="stats-value">{{ myStats.month?.distance }} km</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">러닝 횟수</span>
              <span class="stats-value">{{ myStats.month?.count }}회</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">평균 페이스</span>
              <span class="stats-value">{{ myStats.month?.pace }}</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">총 러닝 시간</span>
              <span class="stats-value">{{ myStats.month?.totalTime }}</span>
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
              <span class="notice-item-top">
                <span class="notice-type-badge">{{ noticeTypeLabel(notice.noticeType) }}</span>
                <span class="notice-title-text">{{ notice.title }}</span>
              </span>
              <span class="notice-date">{{ formatDate(notice.createdDate) }}</span>
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
