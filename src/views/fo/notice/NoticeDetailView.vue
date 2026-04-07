<script setup>
import { ref, onMounted } from 'vue'
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
        메인화면으로 가기
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
          <span class="notice-badge">공지</span>
          <div class="notice-title-row">
            <h1 class="notice-title">{{ notice.title }}</h1>
            <p class="notice-date">{{ formatDate(notice.createdAt) }}</p>
          </div>
          <hr class="divider" />
        </header>

        <div class="notice-body" v-html="notice.content" />
      </article>
    </div>
  </div>
</template>

<style scoped src="./NoticeDetailView.css" />
