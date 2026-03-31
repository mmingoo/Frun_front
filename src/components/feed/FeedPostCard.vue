<script setup>
import { ref } from 'vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { useRouter } from 'vue-router'

defineProps({
  post: { type: Object, required: true },
  currentUserId: { type: Number, required: true },
})

const emit = defineEmits(['like', 'report', 'detail', 'edit', 'delete'])
const router = useRouter()

const imageIndexMap = ref({})

function getIndex(postId) {
  return imageIndexMap.value[postId] ?? 0
}
function prev(postId, length) {
  const cur = getIndex(postId)
  imageIndexMap.value[postId] = (cur - 1 + length) % length
}
function next(postId, length) {
  const cur = getIndex(postId)
  imageIndexMap.value[postId] = (cur + 1) % length
}
</script>

<template>
  <article class="card">
    <!-- 작성자 -->
    <header class="card-header">
      <div class="author" style="cursor: pointer" @click="router.push(`/mypage/${post.authorId}`)">
        <div class="avatar">
          <UserAvatar :src="post.profileImage" :alt="post.nickname" :size="20" />
        </div>
        <div class="author-text">
          <span class="author-name">{{ post.nickname }}</span>
          <span class="author-date">{{ post.createdAt }}</span>
        </div>
      </div>
      <div v-if="post.authorId === currentUserId" class="owner-actions">
        <button class="action-btn btn-edit" @click="emit('edit', post)">수정</button>
        <button class="action-btn btn-delete" @click="emit('delete', post)">삭제</button>
      </div>
      <button
        v-else
        class="btn-report"
        @click="emit('report', post.id)"
      >
        신고
      </button>
    </header>

    <!-- 사진 슬라이더 -->
    <div v-if="post.photos && post.photos.length > 0" class="photo-container">
      <!-- 이미지 클립 영역 -->
      <div class="photo-inner" @click="emit('detail', post)">
        <img :src="post.photos[getIndex(post.id)]" alt="러닝 사진" />
        <div v-if="post.photos.length > 1" class="dots">
          <span
            v-for="(_, i) in post.photos"
            :key="i"
            class="dot"
            :class="{ active: i === getIndex(post.id) }"
          />
        </div>
      </div>
      <!-- 화살표 (photo-inner 바깥에 위치) -->
      <template v-if="post.photos.length > 1">
        <button class="arrow arrow-left" @click.stop="prev(post.id, post.photos.length)">‹</button>
        <button class="arrow arrow-right" @click.stop="next(post.id, post.photos.length)">›</button>
      </template>
    </div>

    <!-- 스탯 -->
    <div v-if="post.distance" class="stats">
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
        {{ post.duration }}분
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

    <!-- 메모 -->
    <p v-if="post.memo" class="memo">{{ post.memo }}</p>

    <!-- 좋아요 / 댓글 -->
    <footer class="card-footer">
      <button class="btn-like" :class="{ liked: post.liked }" @click="emit('like', post)">
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
      <button class="btn-comment" @click="emit('detail', post)">
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
    </footer>
  </article>
</template>

<style scoped>
/* ── 카드 ── */
.card {
  background: #fff;
  border: 1px solid #edf0f7;
  border-radius: 16px;
  overflow: hidden;
}

/* ── 헤더 ── */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 12px;
}
.author {
  display: flex;
  align-items: center;
  gap: 10px;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #edf0f7;
  border: 1.5px solid #e2e8f0;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* UserAvatar 가 반환하는 img 는 부모 크기에 맞게 채움 */
.avatar :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.author-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.author-name {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a2e;
}
.author-date {
  font-size: 11px;
  color: #94a3b8;
}
.owner-actions {
  display: flex;
  gap: 8px;
}
.action-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.action-btn:hover {
  opacity: 0.7;
}
.btn-edit {
  color: #3b5bdb;
}
.btn-delete {
  color: #e53e3e;
}
.btn-report {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #e53e3e;
  padding: 0;
  transition: opacity 0.2s;
}
.btn-report:hover {
  opacity: 0.7;
}

/* ── 사진 ── */
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
  cursor: pointer;
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
.arrow {
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
  z-index: 2;
  transition: background 0.2s;
}
.arrow:hover {
  background: rgba(0, 0, 0, 0.55);
}
.arrow-left {
  left: -18px;
}
.arrow-right {
  right: -18px;
}
.dots {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
  z-index: 2;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transition: background 0.2s;
}
.dot.active {
  background: #fff;
}

/* ── 스탯 ── */
.stats {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding: 10px 16px 4px;
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

/* ── 메모 ── */
.memo {
  padding: 6px 16px 4px 24px;
  font-size: 13px;
  color: #4a5568;
  line-height: 1.55;
  margin: 0;
}

/* ── 푸터 ── */
.card-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px 14px;
}
.btn-like {
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
.btn-like:hover,
.btn-like.liked {
  color: #e53e3e;
}
.btn-comment {
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #94a3b8;
  padding: 0;
  transition: color 0.2s;
}
.btn-comment:hover {
  color: #3b5bdb;
}
</style>
