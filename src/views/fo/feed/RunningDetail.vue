<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { addLike, cancelLike, deleteRunningLog, getRunningLogDetail } from '@/api/feed.js'
import { useReport } from '@/composables/useReport.js'
import { BASE_URL } from '@/api/index.js'
import NavBar from '@/components/layout/NavBar.vue'
import FriendSidebar from '@/components/layout/FriendSidebar.vue'
import ReportModal from '@/components/common/ReportModal.vue'
import { getMyInfo } from '@/api/user.js'
import { useAuthStore } from '@/stores/auth.js'
import {
  getComment,
  getReply,
  saveComment,
  saveReply,
  updateComment,
  deleteCommentApi,
} from '@/api/comment'

const router = useRouter()
const route = useRoute()

// ── 상태 ──────────────────────────────────────────────────
const post = ref(null)
const isLoading = ref(true)
const errorMsg = ref('')
const auth = useAuthStore()

// ── API 호출 ───────────────────────────────────────────────
onMounted(async () => {
  if (!auth.userId || !auth.nickname) {
    const res = await getMyInfo()
    auth.setUserId(res.data.data.userId)
    auth.setNickname(res.data.data.nickName)
    if (res.data.data.profileImageUrl) {
      auth.setProfileImage(`${BASE_URL}${res.data.data.profileImageUrl}`)
    }
  }
  const { runningLogId, authorId } = route.params

  // 러닝일지 조회
  try {
    // 러닝일지 정보 조회
    const res = await getRunningLogDetail(runningLogId, authorId)
    const d = res.data.data

    post.value = {
      runningLogId: d.runningLogId,
      authorId: d.userId,
      nickname: d.nickName,
      profileImage: d.imageUrl ? `${BASE_URL}${d.imageUrl}` : null,
      createdAt: d.createdAt?.slice(0, 16).replace('T', ' ') ?? '',
      runDate: d.runDate,
      runTime: d.runTime ? d.runTime.slice(0, 5) : null,
      logImages: (d.logImages ?? []).map((img) => `${BASE_URL}${img}`),
      distance: d.distance,
      duration: d.duration, // "HH:mm:ss" 형태
      pace: d.pace,
      memo: d.memo,
      likeCount: d.likeCtn,
      commentCount: d.commentCtn,
      liked: d.liked,
    }
  } catch (e) {
    const status = e.response?.status
    if (status === 404) {
      router.replace({ name: 'NotFoundView', params: { pathMatch: route.path.split('/').slice(1) } })
      return
    }
    errorMsg.value = '불러오기에 실패했습니다.'
  } finally {
    isLoading.value = false
  }

  await loadMoreComments()

  const targetCommentId = route.query.commentId ? Number(route.query.commentId) : null
  if (targetCommentId) {
    await scrollToTargetComment(targetCommentId)
  }
  setupCommentObserver()
})

// ── duration 포맷 ("HH:mm:ss" → "X시간 Xm Xs") ─────────────
function formatDuration(duration) {
  if (!duration) return '-'
  const [h, m, s] = duration.split(':').map(Number)
  if (h > 0) return `${h}시간 ${m}분 ${s}초`
  if (m > 0) return `${m}분 ${s}초`
  return `${s}초`
}

// ── 이미지 슬라이더 ───────────────────────────────────────
const currentImageIndex = ref(0)

function prevImage() {
  if (!post.value) return
  if (currentImageIndex.value > 0) currentImageIndex.value--
}

function nextImage() {
  if (!post.value) return
  const len = post.value.logImages.length
  if (currentImageIndex.value < len - 1) currentImageIndex.value++
}

// ── 이미지 라이트박스 ─────────────────────────────────────
const lightboxOpen = ref(false)

function openLightbox() {
  lightboxOpen.value = true
}

function closeLightbox() {
  lightboxOpen.value = false
}

const isOwner = computed(() => post.value?.authorId === auth.userId)

// ── 좋아요 ────────────────────────────────────────────────
async function toggleLike() {
  if (!post.value) return
  if (post.value.liked) {
    post.value.likeCount--
    post.value.liked = false
    await cancelLike(post.value.runningLogId)
  } else {
    post.value.likeCount++
    post.value.liked = true
    await addLike(post.value.runningLogId)
  }
}

// ── 수정 / 삭제 ───────────────────────────────────────────
function handleEdit() {
  router.push(`/running/edit/${post.value.runningLogId}/${post.value.authorId}`)
}

const showDeleteConfirm = ref(false)

async function confirmDelete() {
  showDeleteConfirm.value = false
  try {
    await deleteRunningLog(post.value.runningLogId)
    alert('러닝일지를 삭제하였습니다.')
    router.push(`/mypage/${auth.userId}`)
  } catch (e) {
    const message = e.response?.data?.message
    alert(message || '삭제에 실패했습니다. 다시 시도해주세요.')
  }
}

//댓글
const comments = ref([])
const newComment = ref('')
const hasNextComment = ref(true)
const commentCursorId = ref(null)
const isLoadingComments = ref(false)
const commentSentinelRef = ref(null)
let commentObserver = null

async function loadMoreComments() {
  if (isLoadingComments.value || !hasNextComment.value || !post.value) return
  isLoadingComments.value = true
  try {
    const res = await getComment(post.value.runningLogId, commentCursorId.value ?? undefined)
    const data = res.data.data
    comments.value.push(
      ...data.contents.map((c) => ({
        id: c.commentId,
        authorId: c.userId,
        nickname: c.nickname,
        profileImage: c.profileImageUrl ? `${BASE_URL}${c.profileImageUrl}` : null,
        content: c.content,
        createdAt: c.createdAt?.slice(0, 16).replace('T', ' ') ?? '',
        replyCount: c.replyCount,
        replies: [],
        showReplyInput: false,
        replyInput: '',
      })),
    )
    hasNextComment.value = data.hasNext
    commentCursorId.value = data.nextCursor ?? null
    totalCommentCount.value = post.value.commentCount ?? 0
  } catch (e) {
    console.log('댓글 불러오기 실패 : ', e)
  } finally {
    isLoadingComments.value = false
  }
}

function setupCommentObserver() {
  if (!commentSentinelRef.value) return
  commentObserver?.disconnect()
  commentObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) loadMoreComments()
    },
    { threshold: 0 },
  )
  commentObserver.observe(commentSentinelRef.value)
}

onBeforeUnmount(() => {
  commentObserver?.disconnect()
})

// 댓글 달기
async function submitComment() {
  const text = newComment.value.trim()

  // 댓글 200자 제한
  if (!text || text.length > 200) return

  try {
    // 댓글 저장
    const res = await saveComment(text, post.value.runningLogId)

    // 서버 저장 후 화면 리스트에 댓글 추가
    comments.value.push({
      id: res.data.data,
      authorId: auth.userId,
      nickname: auth.nickname ?? '',
      profileImage: auth.profileImage ?? null,
      content: text,
      createdAt: '방금',
      replyCount: 0,
      replies: [],
      showReplyInput: false,
      replyInput: '',
    })

    // 입력창 초기화
    newComment.value = ''
    totalCommentCount.value++
    if (post.value) post.value.commentCount = (post.value.commentCount ?? 0) + 1
  } catch (e) {
    const message = e.response?.data?.message
    alert(message)
  }
}

// 댓글/답글 삭제 확인 모달
const deletingTarget = ref(null) // { type: 'comment'|'reply', commentId, replyId? }

function deleteComment(commentId) {
  deletingTarget.value = { type: 'comment', commentId }
}

function deleteReply(commentId, replyId) {
  deletingTarget.value = { type: 'reply', commentId, replyId }
}

async function confirmDeleteComment() {
  const target = deletingTarget.value
  if (!target) return
  try {
    const id = target.type === 'comment' ? target.commentId : target.replyId
    await deleteCommentApi(id)
    if (target.type === 'comment') {
      const idx = comments.value.findIndex((c) => c.id === target.commentId)
      if (idx !== -1) {
        const deleted = comments.value[idx]
        const deletedTotal = 1 + (deleted.replyCount ?? deleted.replies?.length ?? 0)
        comments.value.splice(idx, 1)
        totalCommentCount.value = Math.max(0, totalCommentCount.value - deletedTotal)
        if (post.value) post.value.commentCount = Math.max(0, (post.value.commentCount ?? 0) - deletedTotal)
      }
    } else {
      const comment = comments.value.find((c) => c.id === target.commentId)
      if (comment) {
        const idx = comment.replies.findIndex((r) => r.id === target.replyId)
        if (idx !== -1) {
          comment.replies.splice(idx, 1)
          comment.replyCount = Math.max(0, (comment.replyCount ?? 0) - 1)
          totalCommentCount.value = Math.max(0, totalCommentCount.value - 1)
          if (post.value) post.value.commentCount = Math.max(0, (post.value.commentCount ?? 0) - 1)
        }
      }
    }
  } catch (e) {
    const message = e.response?.data?.message
    alert(message)
  } finally {
    deletingTarget.value = null
  }
}

async function toggleReplyInput(comment) {
  comment.showReplyInput = !comment.showReplyInput
  if (comment.showReplyInput && comment.replyCount > 0 && !comment.repliesLoaded) {
    await loadReplies(comment)
  } else if (comment.showReplyInput && comment.repliesLoaded) {
    comment.showReplies = true
  }
}

// 답글 목록 펼치기 (첫 로드 + 무한 스크롤)
async function loadReplies(comment) {
  if (comment.repliesLoaded) {
    comment.showReplies = !comment.showReplies
    if (!comment.showReplies) comment.showReplyInput = false
    return
  }
  try {
    const res = await getReply(post.value.runningLogId, comment.id)
    const data = res.data.data
    comment.replies = data.contents.map((r) => ({
      id: r.commentId,
      authorId: r.userId,
      nickname: r.nickname,
      profileImage: r.profileImageUrl ? `${BASE_URL}${r.profileImageUrl}` : null,
      content: r.content,
      createdAt: r.createdAt?.slice(0, 16).replace('T', ' ') ?? '',
    }))
    comment.replyHasNext = data.hasNext
    comment.replyCursor = data.nextCursor ?? null
    comment.repliesLoaded = true
    comment.showReplies = true
  } catch (e) {
    console.log('답글 불러오기 실패 : ', e)
  }
}

async function loadMoreReplies(comment) {
  if (!comment.replyHasNext || comment.replyLoadingMore) return
  comment.replyLoadingMore = true
  try {
    const res = await getReply(post.value.runningLogId, comment.id, comment.replyCursor)
    const data = res.data.data
    comment.replies.push(
      ...data.contents.map((r) => ({
        id: r.commentId,
        authorId: r.userId,
        nickname: r.nickname,
        profileImage: r.profileImageUrl ? `${BASE_URL}${r.profileImageUrl}` : null,
        content: r.content,
        createdAt: r.createdAt?.slice(0, 16).replace('T', ' ') ?? '',
      })),
    )
    comment.replyHasNext = data.hasNext
    comment.replyCursor = data.nextCursor ?? null
  } catch (e) {
    console.log('답글 더보기 실패 : ', e)
  } finally {
    comment.replyLoadingMore = false
  }
}

//답글 달기
async function submitReply(comment) {
  const text = comment.replyInput.trim()
  if (!text || text.length > 200) return

  try {
    const res = await saveReply(text, post.value.runningLogId, comment.id)
    comment.replies.push({
      id: res.data.data,
      authorId: auth.userId,
      nickname: auth.nickname ?? '',
      profileImage: auth.profileImage ?? null,
      content: text,
      createdAt: '방금',
    })

    comment.replyCount++
    comment.replyInput = ''
    comment.showReplyInput = false
    comment.showReplies = true
    totalCommentCount.value++
    if (post.value) post.value.commentCount = (post.value.commentCount ?? 0) + 1
  } catch (e) {
    const message = e.response?.data?.message
    alert(message)
  }
}

// 댓글/답글 수정
const editingId = ref(null)
const editingContent = ref('')

function startEdit(id, content) {
  editingId.value = id
  editingContent.value = content
}

function cancelEdit() {
  editingId.value = null
  editingContent.value = ''
}

async function submitEdit() {
  const text = editingContent.value.trim()
  if (!text || text.length > 200) return

  try {
    await updateComment(editingId.value, text)

    // 댓글에서 찾기
    const comment = comments.value.find((c) => c.id === editingId.value)
    if (comment) {
      comment.content = text
      cancelEdit()
      return
    }

    // 답글에서 찾기
    for (const c of comments.value) {
      const reply = c.replies?.find((r) => r.id === editingId.value)
      if (reply) {
        reply.content = text
        cancelEdit()
        return
      }
    }
  } catch (e) {
    const message = e.response?.data?.message
    alert(message)
  }
}

const totalCommentCount = ref(0)

// ── 신고 ──────────────────────────────────────────────────
const { showReportModal, openReport, submitReport } = useReport()

// ── 알림에서 특정 댓글로 이동 ─────────────────────────────
const highlightedCommentId = ref(null)

async function scrollToTargetComment(targetId) {
  // 1단계: 최상위 댓글 전체 페이지 로드 후 탐색
  while (!comments.value.find((c) => c.id === targetId) && hasNextComment.value) {
    await loadMoreComments()
  }

  if (comments.value.find((c) => c.id === targetId)) {
    highlightedCommentId.value = targetId
    await nextTick()
    const el = document.getElementById(`comment-${targetId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => {
        highlightedCommentId.value = null
      }, 3000)
    }
    return
  }

  // 2단계: 답글에서 탐색 — 각 댓글의 모든 reply 페이지를 순회
  for (const comment of comments.value) {
    if (!comment.replyCount) continue

    if (!comment.repliesLoaded) {
      await loadReplies(comment)
    } else {
      comment.showReplies = true
    }

    if (comment.replies.find((r) => r.id === targetId)) {
      highlightedCommentId.value = targetId
      await nextTick()
      const el = document.getElementById(`reply-${targetId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => {
          highlightedCommentId.value = null
        }, 3000)
      }
      return
    }

    while (comment.replyHasNext) {
      await loadMoreReplies(comment)
      if (comment.replies.find((r) => r.id === targetId)) {
        comment.showReplies = true
        highlightedCommentId.value = targetId
        await nextTick()
        const el = document.getElementById(`reply-${targetId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setTimeout(() => {
            highlightedCommentId.value = null
          }, 3000)
        }
        return
      }
    }
  }
}
</script>

<template>
  <div class="page-wrap">
    <!-- ── 네비게이션 바 ── -->
    <NavBar />

    <!-- ── 로딩 ── -->
    <div v-if="isLoading" class="state-wrap">
      <span class="spinner-lg" />
    </div>

    <!-- ── 에러 ── -->
    <div v-else-if="errorMsg" class="state-wrap error-msg">
      {{ errorMsg }}
    </div>

    <!-- ── 본문 ── -->
    <template v-else-if="post">
      <div class="page-outer-grid">
        <FriendSidebar />
        <div>
          <!-- 제목 바 -->
          <div class="page-title-bar"></div>

          <!-- 2열 그리드 -->
          <main class="content-grid">
            <!-- ── 왼쪽: 일지 본문 ── -->
            <section class="post-section">
              <!-- 작성자 -->
              <div
                class="post-header"
                style="cursor: pointer"
                @click="router.push(`/mypage/${post.authorId}`)"
              >
                <div class="author-info">
                  <div class="avatar">
                    <img v-if="post.profileImage" :src="post.profileImage" :alt="post.nickname" />
                    <svg
                      v-else
                      width="22"
                      height="22"
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
                <div v-if="isOwner" class="owner-actions">
                  <button class="action-btn btn-edit" @click.stop="handleEdit">수정</button>
                  <button class="action-btn btn-delete" @click.stop="showDeleteConfirm = true">
                    삭제
                  </button>
                </div>
                <button v-else class="btn-report" @click.stop="openReport(post.runningLogId)">신고</button>
              </div>

              <!-- 이미지 슬라이더 -->
              <div v-if="post.logImages.length > 0" class="photo-container">
                <div class="photo-inner" @click="openLightbox">
                  <img :src="post.logImages[currentImageIndex]" alt="러닝 사진" />
                  <div v-if="post.logImages.length > 1" class="img-dots">
                    <span
                      v-for="(_, i) in post.logImages"
                      :key="i"
                      class="img-dot"
                      :class="{ active: i === currentImageIndex }"
                    />
                  </div>
                </div>
                <template v-if="post.logImages.length > 1">
                  <button class="img-arrow img-arrow-left" @click="prevImage">‹</button>
                  <button class="img-arrow img-arrow-right" @click="nextImage">›</button>
                </template>
              </div>

              <!-- 러닝 스탯 -->
              <div class="stats-chips">
                <span v-if="post.runDate" class="chip">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3b5bdb"
                    stroke-width="2.2"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {{ post.runDate }}{{ post.runTime ? ' ' + post.runTime : '' }}
                </span>
                <span class="chip">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3b5bdb"
                    stroke-width="2.2"
                  >
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  {{ post.distance }}km
                </span>
                <span class="chip">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3b5bdb"
                    stroke-width="2.2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {{ formatDuration(post.duration) }}
                </span>
                <span class="chip">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3b5bdb"
                    stroke-width="2.2"
                  >
                    <path d="M3 12h18M3 6h18M3 18h18" />
                  </svg>
                  {{ post.pace }}
                </span>
              </div>

              <!-- 좋아요 -->
              <div class="post-footer">
                <button class="like-btn" :class="{ liked: post.liked }" @click="toggleLike">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    :fill="post.liked ? '#e53e3e' : 'none'"
                    stroke="#e53e3e"
                    stroke-width="2"
                  >
                    <path
                      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5
                  5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5
                  5.5 0 0 0 0-7.78z"
                    />
                  </svg>
                  좋아요 {{ post.likeCount }}개
                </button>
              </div>

              <!-- 메모 -->
              <p v-if="post.memo" class="post-memo">{{ post.memo }}</p>
            </section>

            <!-- ── 오른쪽: 댓글 ── -->
            <section class="comment-section">
              <h2 class="comment-title">댓글 {{ totalCommentCount }}개</h2>

              <div class="comment-list">
                <div v-for="comment in comments" :key="comment.id" class="comment-block">
                  <!-- 댓글 -->
                  <div
                    :id="`comment-${comment.id}`"
                    class="comment-item"
                    :class="{ 'comment-highlighted': highlightedCommentId === comment.id }"
                  >
                    <div
                      class="comment-avatar"
                      style="cursor: pointer"
                      @click="router.push(`/mypage/${comment.authorId}`)"
                    >
                      <img
                        v-if="comment.profileImage"
                        :src="comment.profileImage"
                        :alt="comment.nickname"
                      />
                      <svg
                        v-else
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#94a3b8"
                        stroke-width="2"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div class="comment-body">
                      <div class="comment-meta">
                        <span
                          class="comment-author"
                          style="cursor: pointer"
                          @click="router.push(`/mypage/${comment.authorId}`)"
                          >{{ comment.nickname }}</span
                        >
                        <span class="comment-date">{{ comment.createdAt }}</span>
                        <div
                          v-if="comment.authorId === auth.userId || isOwner"
                          class="comment-meta-actions"
                        >
                          <button
                            v-if="comment.authorId === auth.userId"
                            class="text-btn text-btn-edit"
                            @click="startEdit(comment.id, comment.content)"
                          >
                            수정
                          </button>
                          <button
                            class="text-btn text-btn-delete"
                            @click="deleteComment(comment.id)"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                      <!-- 수정 모드 -->
                      <div v-if="editingId === comment.id" class="edit-input-wrap">
                        <textarea
                          v-model="editingContent"
                          class="edit-textarea"
                          maxlength="200"
                          @keyup.enter.exact="submitEdit"
                        />
                        <div class="edit-footer">
                          <span class="char-count" :class="{ warn: editingContent.length >= 180 }">
                            {{ editingContent.length }}/200
                          </span>
                          <div class="edit-btns">
                            <button class="text-btn" @click="cancelEdit">취소</button>
                            <button class="text-btn text-btn-edit" @click="submitEdit">완료</button>
                          </div>
                        </div>
                      </div>
                      <p v-else class="comment-text">{{ comment.content }}</p>
                      <div class="comment-actions">
                        <button class="text-btn" @click="toggleReplyInput(comment)">
                          답글 달기
                        </button>
                        <button
                          v-if="comment.replyCount > 0"
                          class="text-btn"
                          @click="loadReplies(comment)"
                        >
                          {{ comment.showReplies ? '답글 숨기기' : `답글 ${comment.replyCount}개` }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- 답글 목록 -->
                  <div v-if="comment.showReplies && comment.replies.length > 0" class="reply-list">
                    <div
                      v-for="reply in comment.replies"
                      :key="reply.id"
                      :id="`reply-${reply.id}`"
                      class="reply-item"
                      :class="{ 'comment-highlighted': highlightedCommentId === reply.id }"
                    >
                      <div
                        class="comment-avatar reply-avatar"
                        style="cursor: pointer"
                        @click="router.push(`/mypage/${reply.authorId}`)"
                      >
                        <img
                          v-if="reply.profileImage"
                          :src="reply.profileImage"
                          :alt="reply.nickname"
                        />
                        <svg
                          v-else
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#94a3b8"
                          stroke-width="2"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>

                      <div class="comment-body">
                        <div class="comment-meta">
                          <span
                            class="comment-author"
                            style="cursor: pointer"
                            @click="router.push(`/mypage/${reply.authorId}`)"
                            >{{ reply.nickname }}</span
                          >
                          <span class="comment-date">{{ reply.createdAt }}</span>
                          <div
                            v-if="reply.authorId === auth.userId || isOwner"
                            class="comment-meta-actions"
                          >
                            <button
                              v-if="reply.authorId === auth.userId"
                              class="text-btn text-btn-edit"
                              @click="startEdit(reply.id, reply.content)"
                            >
                              수정
                            </button>
                            <button
                              class="text-btn text-btn-delete"
                              @click="deleteReply(comment.id, reply.id)"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                        <!-- 수정 모드 -->
                        <div v-if="editingId === reply.id" class="edit-input-wrap">
                          <textarea
                            v-model="editingContent"
                            class="edit-textarea"
                            maxlength="200"
                            @keyup.enter.exact="submitEdit"
                          />
                          <div class="edit-footer">
                            <span
                              class="char-count"
                              :class="{ warn: editingContent.length >= 180 }"
                            >
                              {{ editingContent.length }}/200
                            </span>
                            <div class="edit-btns">
                              <button class="text-btn" @click="cancelEdit">취소</button>
                              <button class="text-btn text-btn-edit" @click="submitEdit">
                                완료
                              </button>
                            </div>
                          </div>
                        </div>
                        <p v-else class="comment-text">{{ reply.content }}</p>
                      </div>
                    </div>
                    <!-- 답글 더보기 -->
                    <button
                      v-if="comment.replyHasNext"
                      class="text-btn"
                      :disabled="comment.replyLoadingMore"
                      @click="loadMoreReplies(comment)"
                    >
                      {{ comment.replyLoadingMore ? '불러오는 중…' : '답글 더보기' }}
                    </button>
                  </div>

                  <!-- 답글 입력 (reply-list 바깥) -->
                  <div v-if="comment.showReplyInput" class="reply-input-wrap">
                    <div class="input-with-counter">
                      <input
                        v-model="comment.replyInput"
                        type="text"
                        placeholder="답글을 입력하세요..."
                        class="reply-input"
                        maxlength="200"
                        @keyup.enter="submitReply(comment)"
                      />
                      <span
                        class="input-char-count"
                        :class="{ warn: comment.replyInput.length >= 180 }"
                      >
                        {{ comment.replyInput.length }}/200
                      </span>
                    </div>
                    <button class="reply-submit-btn" @click="submitReply(comment)">등록</button>
                  </div>
                </div>
                <div ref="commentSentinelRef" class="comment-sentinel">
                  <span v-if="isLoadingComments" class="comment-spinner" />
                </div>
              </div>

              <!-- 댓글 입력 -->
              <div class="comment-input-area">
                <div class="input-with-counter">
                  <input
                    v-model="newComment"
                    type="text"
                    placeholder="댓글을 입력하세요..."
                    class="comment-input"
                    maxlength="200"
                    @keyup.enter="submitComment"
                  />
                  <span class="input-char-count" :class="{ warn: newComment.length >= 180 }">
                    {{ newComment.length }}/200
                  </span>
                </div>
                <button
                  class="comment-submit-btn"
                  :disabled="!newComment.trim()"
                  @click="submitComment"
                >
                  등록
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>
    </template>

    <!-- ── 라이트박스 ── -->
    <div v-if="lightboxOpen" class="lightbox-overlay" @click="closeLightbox">
      <img
        :src="post.logImages[currentImageIndex]"
        alt="러닝 사진"
        class="lightbox-img"
        @click.stop
      />
      <button class="lightbox-close" @click="closeLightbox">✕</button>
    </div>

    <!-- ── 삭제 확인 모달 ── -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal">
        <h3 class="modal-title">러닝일지를 삭제하시겠습니까?</h3>
        <div class="modal-actions">
          <button class="modal-btn modal-cancel" @click="showDeleteConfirm = false">취소</button>
          <button class="modal-btn modal-confirm" @click="confirmDelete">삭제</button>
        </div>
      </div>
    </div>

    <!-- ── 댓글/답글 삭제 확인 모달 ── -->
    <div v-if="deletingTarget" class="modal-overlay" @click.self="deletingTarget = null">
      <div class="modal">
        <h3 class="modal-title">댓글을 삭제하시겠습니까?</h3>
        <div class="modal-actions">
          <button class="modal-btn modal-cancel" @click="deletingTarget = null">취소</button>
          <button class="modal-btn modal-confirm" @click="confirmDeleteComment">삭제</button>
        </div>
      </div>
    </div>

    <!-- ── 신고 모달 ── -->
    <ReportModal v-model:show="showReportModal" @submit="submitReport" />
  </div>
</template>

<style scoped src="./RunningDetail.css" />

<!-- 이미지 슬라이더 + 로딩/에러 추가 스타일 -->
<style scoped>
.state-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
}

.error-msg {
  font-size: 15px;
  color: #e53e3e;
}

.spinner-lg {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b5bdb;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 스탯 칩 */
.stats-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding: 10px 7.5% 4px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  color: #3b5bdb;
  background: #eef2ff;
  border-radius: 20px;
  padding: 3px 10px;
}

/* 좋아요 */
.post-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 7.5% 10px calc(7.5% + 8px);
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #718096;
  padding: 0;
  transition: color 0.2s;
}

.like-btn:hover,
.like-btn.liked {
  color: #e53e3e;
}

/* 메모 */
.post-memo {
  padding: 6px 7.5% 20px calc(7.5% + 8px);
  font-size: 13px;
  color: #4a5568;
  line-height: 1.55;
  margin: 0;
}

/* 이미지 슬라이더 */
.photo-container {
  position: relative;
  width: 85%;
  margin: 0 auto;
}

.photo-inner {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  border-radius: 10px;
  cursor: zoom-in;
  background: #f1f3f7;
}

.photo-inner img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.img-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  z-index: 2;
}

.img-arrow:hover {
  background: rgba(0, 0, 0, 0.55);
}
.img-arrow-left {
  left: -18px;
}
.img-arrow-right {
  right: -18px;
}

.img-dots {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
  z-index: 2;
}

.img-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transition: background 0.2s;
}

.img-dot.active {
  background: #fff;
}

/* 댓글 무한 스크롤 */
.comment-sentinel {
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.comment-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #e2e8f0;
  border-top-color: #3b5bdb;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* 라이트박스 */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.lightbox-img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
}

.lightbox-close {
  position: absolute;
  top: 20px;
  right: 24px;
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.lightbox-close:hover {
  opacity: 1;
}
</style>
