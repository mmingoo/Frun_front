<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getRunningLogDetail } from '@/api/feed.js'
import { BASE_URL } from '@/api/index.js'
import NavBar from '@/components/layout/NavBar.vue'
import FriendSidebar from '@/components/layout/FriendSidebar.vue'

const router = useRouter()
const route = useRoute()

// ── 상태 ──────────────────────────────────────────────────
const post = ref(null)
const isLoading = ref(true)
const errorMsg = ref('')

const currentUserId = 1 // TODO: auth store에서 꺼내기

// ── API 호출 ───────────────────────────────────────────────
onMounted(async () => {
  const { runningLogId, authorId } = route.params
  try {
    const res = await getRunningLogDetail(runningLogId, authorId)
    const d = res.data.data

    post.value = {
      runningLogId: d.runningLogId,
      authorId: d.userId,
      nickname: d.nickName,
      profileImage: d.imageUrl ?? null,
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
      liked: false,
    }
  } catch (e) {
    const status = e.response?.status
    if (status === 403) errorMsg.value = '친구가 아니어서 조회할 수 없습니다.'
    else if (status === 404) errorMsg.value = '존재하지 않는 러닝 일지입니다.'
    else errorMsg.value = '불러오기에 실패했습니다.'
  } finally {
    isLoading.value = false
  }
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
  const len = post.value.logImages.length
  currentImageIndex.value = (currentImageIndex.value - 1 + len) % len
}

function nextImage() {
  if (!post.value) return
  const len = post.value.logImages.length
  currentImageIndex.value = (currentImageIndex.value + 1) % len
}

// ── 이미지 라이트박스 ─────────────────────────────────────
const lightboxOpen = ref(false)

function openLightbox() {
  lightboxOpen.value = true
}

function closeLightbox() {
  lightboxOpen.value = false
}

const isOwner = computed(() => post.value?.authorId === currentUserId)

// ── 좋아요 ────────────────────────────────────────────────
function toggleLike() {
  if (!post.value) return
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
  router.push(`/running/edit/${post.value.runningLogId}/${post.value.authorId}`)
}

const showDeleteConfirm = ref(false)

function confirmDelete() {
  // TODO: 삭제 API 연동
  showDeleteConfirm.value = false
  router.push('/feed')
}

// ── 댓글 (목 — 추후 API 연동) ─────────────────────────────
const comments = ref([])
const newComment = ref('')

function submitComment() {
  const text = newComment.value.trim()
  if (!text || text.length > 250) return
  comments.value.push({
    id: Date.now(),
    authorId: currentUserId,
    nickname: '나',
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

function toggleReplyInput(comment) {
  comment.showReplyInput = !comment.showReplyInput
}

function submitReply(comment) {
  const text = comment.replyInput.trim()
  if (!text || text.length > 250) return
  comment.replies.push({
    id: Date.now(),
    authorId: currentUserId,
    nickname: '나',
    profileImage: null,
    content: text,
    createdAt: '방금',
  })
  comment.replyInput = ''
  comment.showReplyInput = false
  comment.showReplies = true
}

function deleteReply(commentId, replyId) {
  const comment = comments.value.find((c) => c.id === commentId)
  if (!comment) return
  const idx = comment.replies.findIndex((r) => r.id === replyId)
  if (idx !== -1) comment.replies.splice(idx, 1)
}

const totalCommentCount = computed(() =>
  comments.value.reduce((sum, c) => sum + 1 + c.replies.length, 0),
)

// ── 신고 ──────────────────────────────────────────────────
const showReportModal = ref(false)
const reportTarget = ref(null)
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
  // TODO: 신고 API 연동
  showReportModal.value = false
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
                <button
                  v-if="!isOwner"
                  class="report-link"
                  @click.stop="openReport('post', post.runningLogId)"
                >
                  신고
                </button>
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
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" stroke-width="2.2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {{ post.runDate }}{{ post.runTime ? ' ' + post.runTime : '' }}
                </span>
                <span class="chip">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" stroke-width="2.2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  {{ post.distance }}km
                </span>
                <span class="chip">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" stroke-width="2.2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {{ formatDuration(post.duration) }}
                </span>
                <span class="chip">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" stroke-width="2.2">
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
                  <div class="comment-item">
                    <div class="comment-avatar">
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
                        <span class="comment-author">{{ comment.nickname }}</span>
                        <span class="comment-date">{{ comment.createdAt }}</span>
                      </div>
                      <p class="comment-text">{{ comment.content }}</p>
                      <div class="comment-actions">
                        <button class="text-btn" @click="toggleReplyInput(comment)">
                          답글 달기
                        </button>
                        <button
                          v-if="comment.authorId !== currentUserId && !isOwner"
                          class="text-btn text-btn-report"
                          @click="openReport('comment', comment.id)"
                        >
                          신고
                        </button>
                        <button
                          v-if="comment.authorId === currentUserId"
                          class="text-btn text-btn-delete"
                          @click="deleteComment(comment.id)"
                        >
                          삭제
                        </button>
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
                          <span class="comment-author">{{ reply.nickname }}</span>
                          <span class="comment-date">{{ reply.createdAt }}</span>
                        </div>
                        <p class="comment-text">{{ reply.content }}</p>
                        <div class="comment-actions">
                          <button
                            v-if="reply.authorId !== currentUserId && !isOwner"
                            class="text-btn text-btn-report"
                            @click="openReport('reply', reply.id)"
                          >
                            신고
                          </button>
                          <button
                            v-if="reply.authorId === currentUserId"
                            class="text-btn text-btn-delete"
                            @click="deleteReply(comment.id, reply.id)"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 댓글 입력 -->
              <div class="comment-input-area">
                <input
                  v-model="newComment"
                  type="text"
                  placeholder="댓글을 입력하세요..."
                  class="comment-input"
                  maxlength="250"
                  @keyup.enter="submitComment"
                />
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
          <button class="modal-btn modal-confirm" :disabled="!reportReason" @click="submitReport">
            신고
          </button>
        </div>
      </div>
    </div>
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
  padding: 6px 7.5% 14px calc(7.5% + 8px);
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
