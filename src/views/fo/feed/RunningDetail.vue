<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue'

const router = useRouter()
const route = useRoute()

// ── 목 데이터 ──────────────────────────────────────────────
const currentUserId = 1 // 로그인한 사용자 ID (mock)

const photoIndex = ref(0)

const post = ref({
  id: Number(route.params.id) || 1,
  authorId: 1,
  nickname: '러너_닉네임',
  profileImage: null,
  createdAt: '2026.04.10 06:30',
  photos: [], // 러닝 트래커 사진 URL 배열
  distance: 5.2,
  duration: 32,
  pace: "6'09\"",
  memo: '오늘도 완주! 날씨가 좋아서 기분 좋았다 😊',
  likeCount: 24,
  liked: false,
  isPublic: true,
})

const comments = ref([
  {
    id: 1,
    authorId: 2,
    nickname: '댓글러A',
    profileImage: null,
    content: '대단해요! 저도 곧 도전해볼게요 👍',
    createdAt: '2026.04.10 07:10',
    replies: [
      {
        id: 11,
        authorId: 1,
        nickname: '러너_닉네임',
        profileImage: null,
        content: '감사해요~ 같이 달려요 🏃',
        createdAt: '2026.04.10 07:15',
      },
    ],
    showReplies: true,
    replyInput: '',
    showReplyInput: false,
  },
  {
    id: 2,
    authorId: 3,
    nickname: '달리기왕',
    profileImage: null,
    content: '페이스 정말 빠르네요! 멋져요 💪',
    createdAt: '2026.04.10 08:00',
    replies: [],
    showReplies: false,
    replyInput: '',
    showReplyInput: false,
  },
])

const totalCommentCount = computed(() =>
  comments.value.reduce((sum, c) => sum + 1 + c.replies.length, 0)
)

const isOwner = computed(() => post.value.authorId === currentUserId)

// ── 좋아요 ────────────────────────────────────────────────
function toggleLike() {
  if (post.value.liked) {
    post.value.likeCount--
    post.value.liked = false
  } else {
    post.value.likeCount++
    post.value.liked = true
  }
}

// ── 수정 / 삭제 ───────────────────────────────────────────
function handleEdit() {
  router.push(`/running/edit/${post.value.id}`)
}

const showDeleteConfirm = ref(false)

function handleDelete() {
  showDeleteConfirm.value = true
}

function confirmDelete() {
  // TODO: API 연동
  showDeleteConfirm.value = false
  router.push('/feed')
}

// ── 댓글 ──────────────────────────────────────────────────
const newComment = ref('')
const commentInputRef = ref(null)

function submitComment() {
  const text = newComment.value.trim()
  if (!text || text.length > 250) return
  comments.value.push({
    id: Date.now(),
    authorId: currentUserId,
    nickname: '러너_닉네임',
    profileImage: null,
    content: text,
    createdAt: '방금',
    replies: [],
    showReplies: false,
    replyInput: '',
    showReplyInput: false,
  })
  newComment.value = ''
}

function deleteComment(commentId) {
  const idx = comments.value.findIndex((c) => c.id === commentId)
  if (idx !== -1) comments.value.splice(idx, 1)
}

function deleteReply(commentId, replyId) {
  const comment = comments.value.find((c) => c.id === commentId)
  if (!comment) return
  const idx = comment.replies.findIndex((r) => r.id === replyId)
  if (idx !== -1) comment.replies.splice(idx, 1)
}

function toggleReplyInput(comment) {
  comment.showReplyInput = !comment.showReplyInput
}

function submitReply(comment) {
  const text = comment.replyInput.trim()
  if (!text || text.length > 250) return
  comment.replies.push({
    id: Date.now(),
    authorId: currentUserId,
    nickname: '러너_닉네임',
    profileImage: null,
    content: text,
    createdAt: '방금',
  })
  comment.replyInput = ''
  comment.showReplyInput = false
  comment.showReplies = true
}

// ── 신고 ──────────────────────────────────────────────────
const showReportModal = ref(false)
const reportTarget = ref(null) // { type: 'post' | 'comment' | 'reply', id }
const reportReason = ref('')
const reportEtc = ref('')

function openReport(type, id) {
  reportTarget.value = { type, id }
  reportReason.value = ''
  reportEtc.value = ''
  showReportModal.value = true
}

function submitReport() {
  if (!reportReason.value) return
  // TODO: API 연동
  showReportModal.value = false
}
</script>

<template>
  <div class="page-wrap">
    <NavBar />

    <!-- ── 제목 ── -->
    <div class="page-title-bar">
      <button class="back-btn" @click="router.back()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <h1 class="page-title">러닝일지 상세</h1>
    </div>

    <!-- ── 본문 ── -->
    <main class="content-grid">

      <!-- 왼쪽: 일지 본문 -->
      <section class="post-section">

        <!-- 작성자 정보 + 수정/삭제 -->
        <div class="post-header">
          <div class="author-info">
            <div class="avatar">
              <img v-if="post.profileImage" :src="post.profileImage" :alt="post.nickname" />
              <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <p class="author-name">{{ post.nickname }}</p>
              <p class="post-date">{{ post.createdAt }}</p>
            </div>
          </div>
          <div v-if="isOwner" class="owner-actions">
            <button class="action-btn btn-edit" @click="handleEdit">수정</button>
            <button class="action-btn btn-delete" @click="handleDelete">삭제</button>
          </div>
        </div>

        <!-- 러닝 트래커 사진 -->
        <div v-if="post.photos?.length" class="tracker-photo-wrap">
          <div class="tracker-photo">
            <div class="tracker-photo-inner">
              <img :src="post.photos[photoIndex]" alt="러닝 사진" />
            </div>
            <template v-if="post.photos.length > 1">
              <button
                v-if="photoIndex > 0"
                class="photo-nav photo-prev"
                @click="photoIndex--"
              >‹</button>
              <button
                v-if="photoIndex < post.photos.length - 1"
                class="photo-nav photo-next"
                @click="photoIndex++"
              >›</button>
              <div class="photo-dots">
                <span
                  v-for="(_, i) in post.photos"
                  :key="i"
                  class="photo-dot"
                  :class="{ active: i === photoIndex }"
                  @click="photoIndex = i"
                />
              </div>
            </template>
          </div>
        </div>

        <!-- 러닝 스탯 -->
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-label">거리</span>
            <span class="stat-value">{{ post.distance }} km</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <span class="stat-label">시간</span>
            <span class="stat-value">{{ post.duration }}분</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <span class="stat-label">페이스</span>
            <span class="stat-value">{{ post.pace }}</span>
          </div>
        </div>

        <!-- 메모 -->
        <p v-if="post.memo" class="post-memo">{{ post.memo }}</p>

        <!-- 좋아요 / 신고 -->
        <div class="post-footer">
          <button class="like-btn" :class="{ liked: post.liked }" @click="toggleLike">
            <svg width="16" height="16" viewBox="0 0 24 24" :fill="post.liked ? '#e53e3e' : 'none'" stroke="#e53e3e" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            좋아요 {{ post.likeCount }}개
          </button>
          <button
            v-if="!isOwner"
            class="report-link"
            @click="openReport('post', post.id)"
          >
            신고
          </button>
        </div>
      </section>

      <!-- 오른쪽: 댓글 -->
      <section class="comment-section">
        <h2 class="comment-title">댓글 {{ totalCommentCount }}개</h2>

        <div class="comment-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-block">

            <!-- 댓글 -->
            <div class="comment-item">
              <div class="comment-avatar">
                <img v-if="comment.profileImage" :src="comment.profileImage" :alt="comment.nickname" />
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div class="comment-body">
                <div class="comment-meta">
                  <span class="comment-author">{{ comment.nickname }}</span>
                  <span class="comment-date">{{ comment.createdAt }}</span>
                </div>
                <p class="comment-text">{{ comment.content }}</p>
                <div class="comment-actions">
                  <button class="text-btn" @click="toggleReplyInput(comment)">답글 달기</button>
                  <button
                    v-if="comment.authorId !== currentUserId && !isOwner"
                    class="text-btn text-btn-report"
                    @click="openReport('comment', comment.id)"
                  >신고</button>
                  <button
                    v-if="comment.authorId === currentUserId"
                    class="text-btn text-btn-delete"
                    @click="deleteComment(comment.id)"
                  >삭제</button>
                </div>
              </div>
            </div>

            <!-- 답글 입력 -->
            <div v-if="comment.showReplyInput" class="reply-input-wrap">
              <input
                v-model="comment.replyInput"
                type="text"
                placeholder="답글을 입력하세요..."
                class="reply-input"
                maxlength="250"
                @keyup.enter="submitReply(comment)"
              />
              <button class="reply-submit-btn" @click="submitReply(comment)">등록</button>
            </div>

            <!-- 답글 목록 -->
            <div v-if="comment.replies.length > 0" class="reply-list">
              <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
                <div class="comment-avatar reply-avatar">
                  <img v-if="reply.profileImage" :src="reply.profileImage" :alt="reply.nickname" />
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div class="comment-body">
                  <div class="comment-meta">
                    <span class="comment-author">{{ reply.nickname }}</span>
                    <span class="comment-date">{{ reply.createdAt }}</span>
                  </div>
                  <p class="comment-text">{{ reply.content }}</p>
                  <div class="comment-actions">
                    <button
                      v-if="reply.authorId !== currentUserId && !isOwner"
                      class="text-btn text-btn-report"
                      @click="openReport('reply', reply.id)"
                    >신고</button>
                    <button
                      v-if="reply.authorId === currentUserId"
                      class="text-btn text-btn-delete"
                      @click="deleteReply(comment.id, reply.id)"
                    >삭제</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 댓글 입력 -->
        <div class="comment-input-area">
          <input
            ref="commentInputRef"
            v-model="newComment"
            type="text"
            placeholder="댓글을 입력하세요..."
            class="comment-input"
            maxlength="250"
            @keyup.enter="submitComment"
          />
          <button class="comment-submit-btn" :disabled="!newComment.trim()" @click="submitComment">등록</button>
        </div>
      </section>
    </main>

    <!-- ── 삭제 확인 모달 ── -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal">
        <h3 class="modal-title">일지를 삭제하시겠어요?</h3>
        <p class="modal-desc">삭제된 일지는 복구할 수 없습니다.</p>
        <div class="modal-actions">
          <button class="modal-btn modal-cancel" @click="showDeleteConfirm = false">취소</button>
          <button class="modal-btn modal-confirm" @click="confirmDelete">삭제</button>
        </div>
      </div>
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
          <button class="modal-btn modal-confirm" :disabled="!reportReason" @click="submitReport">신고</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./RunningDetail.css" />
