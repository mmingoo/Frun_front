<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import NavBar from '@/components/layout/NavBar.vue'
import { getNoticeDetail } from '@/api/notice.js'

const router = useRouter()
const route = useRoute()

const notice = ref(null)
const isLoading = ref(true)
const errorMsg = ref('')

onMounted(async () => {
  const { noticeId } = route.params
  try {
    const res = await getNoticeDetail(noticeId)
    notice.value = res.data.data
  } catch (e) {
    const status = e.response?.status
    if (status === 404) errorMsg.value = '존재하지 않는 공지사항입니다.'
    else errorMsg.value = '불러오기에 실패했습니다.'
  } finally {
    isLoading.value = false
  }
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.slice(0, 16).replace('T', ' ')
}

const NOTICE_TYPE_LABEL = {
  SERVICE: '서비스',
  COMPETITION: '대회',
}
function noticeTypeLabel(type) {
  return NOTICE_TYPE_LABEL[type] ?? type
}

const IMAGE_URL_RE = /(https?:\/\/\S+\.(?:png|jpe?g|gif|webp|svg)(?:\?\S*)?)/gi

const renderedContent = computed(() => {
  if (!notice.value?.content) return ''
  return notice.value.content.replace(
    IMAGE_URL_RE,
    (url) => `<img src="${url}" alt="공지 이미지" class="notice-img" />`,
  )
})

const lightboxSrc = ref(null)

function onBodyClick(e) {
  if (e.target.classList.contains('notice-img')) {
    lightboxSrc.value = e.target.src
  }
}

function closeLightbox() {
  lightboxSrc.value = null
}
</script>

<template>
  <div class="page-wrap">
    <NavBar />

    <div class="main-wrap">
      <!-- 뒤로가기 -->
      <button class="back-btn" @click="router.back()">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        뒤로 가기
      </button>

      <!-- 로딩 -->
      <div v-if="isLoading" class="loading-wrap">
        <span class="loading-spinner" />
      </div>

      <!-- 에러 -->
      <div v-else-if="errorMsg" class="empty-wrap">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#c4cad6"
          stroke-width="1.5"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p>{{ errorMsg }}</p>
      </div>

      <!-- 본문 -->
      <article v-else-if="notice" class="notice-card">
        <header class="notice-header">
          <div class="notice-badge-row">
            <span class="notice-type-badge">{{ noticeTypeLabel(notice.noticeType) }}</span>
          </div>
          <div class="notice-title-row">
            <h1 class="notice-title">{{ notice.title }}</h1>
            <p class="notice-date">{{ formatDate(notice.createdAt) }}</p>
          </div>
          <hr class="divider" />
        </header>

        <div class="notice-body" v-html="renderedContent" @click="onBodyClick" />
      </article>
    </div>
  </div>

  <!-- 라이트박스 -->
  <Teleport to="body">
    <div v-if="lightboxSrc" class="lightbox-overlay" @click="closeLightbox">
      <img :src="lightboxSrc" alt="확대 이미지" class="lightbox-img" @click.stop />
      <button class="lightbox-close" @click="closeLightbox">✕</button>
    </div>
  </Teleport>
</template>

<style scoped src="./NoticeDetailView.css" />
