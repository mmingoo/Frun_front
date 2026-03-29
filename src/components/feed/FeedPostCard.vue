<script setup>
import { useRouter } from 'vue-router'
import UserAvatar from '@/components/common/UserAvatar.vue'

const props = defineProps({
  post: { type: Object, required: true },
  currentUserId: { type: Number, required: true },
})

const emit = defineEmits(['like', 'report'])

const router = useRouter()
</script>

<template>
  <article class="post-card">
    <!-- 카드 헤더 -->
    <div class="post-header">
      <div class="author-row">
        <div class="avatar">
          <UserAvatar :src="post.profileImage" :alt="post.nickname" :size="18" />
        </div>
        <div>
          <p class="author-name">{{ post.nickname }}</p>
          <p class="post-date">{{ post.createdAt }}</p>
        </div>
      </div>
      <button
        v-if="post.authorId !== currentUserId"
        class="report-btn"
        @click="emit('report', post.id)"
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

    <!-- 스탯 -->
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
      <button class="like-btn" :class="{ liked: post.liked }" @click="emit('like', post)">
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
</template>

<style scoped>
.post-card {
  background: #fff;
  border: 1px solid #edf0f7;
  border-radius: 16px;
  overflow: hidden;
}
.post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
}
.author-row {
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
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.author-name {
  font-size: 13px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 2px;
}
.post-date {
  font-size: 11px;
  color: #94a3b8;
  margin: 0;
}
.report-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: #94a3b8;
  padding: 0;
  transition: color 0.2s;
}
.report-btn:hover {
  color: #e53e3e;
}
.post-photo {
  width: 100%;
  aspect-ratio: 16/9;
  background: #f1f3f7;
  cursor: pointer;
  overflow: hidden;
  transition: opacity 0.2s;
}
.post-photo:hover {
  opacity: 0.92;
}
.post-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #b0b9c8;
  font-size: 12px;
}
.post-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px 2px;
  flex-wrap: wrap;
}
.stat-chip {
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
.post-memo {
  padding: 8px 16px 4px;
  font-size: 13px;
  color: #4a5568;
  line-height: 1.55;
  margin: 0;
}
.post-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px 14px;
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
.comment-link {
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
.comment-link:hover {
  color: #3b5bdb;
}
</style>
