<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '@/components/layout/NavBar.vue'
import { getNotices } from '@/api/notice.js'

const router = useRouter()

const notices = ref([])
const currentPage = ref(0)
const totalPages = ref(0)
const hasNext = ref(false)
const isLoading = ref(true)
const errorMsg = ref('')

async function fetchNotices(page) {
  isLoading.value = true
  errorMsg.value = ''
  try {
    const res = await getNotices(page)
    const data = res.data.data
    notices.value = data.notices
    currentPage.value = data.currentPage
    totalPages.value = data.totalPages
    hasNext.value = data.hasNext
  } catch {
    errorMsg.value = '공지사항을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

function goToPage(page) {
  if (page < 0 || page >= totalPages.value) return
  fetchNotices(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}

const NOTICE_TYPE_LABEL = {
  SERVICE: '서비스',
  COMPETITION: '대회',
}
function noticeTypeLabel(type) {
  return NOTICE_TYPE_LABEL[type] ?? type
}

onMounted(() => fetchNotices(0))
</script>

<template>
  <div class="page-wrap">
    <NavBar />
    <div class="page-grid">
      <div class="main-wrap">
        <div class="page-header">
          <button class="btn-back" @click="router.back()">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2 class="page-title">공지사항</h2>
        </div>

        <!-- 로딩 -->
        <div v-if="isLoading" class="status-wrap">
          <span class="loading-spinner" />
        </div>

        <!-- 에러 -->
        <div v-else-if="errorMsg" class="status-wrap">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c4cad6" stroke-width="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{{ errorMsg }}</p>
        </div>

        <!-- 빈 목록 -->
        <div v-else-if="notices.length === 0" class="status-wrap">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c4cad6" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p>공지사항이 없습니다.</p>
        </div>

        <!-- 목록 -->
        <ul v-else class="notice-list">
          <li
            v-for="notice in notices"
            :key="notice.noticeId"
            class="notice-item"
            @click="router.push(`/notices/${notice.noticeId}`)"
          >
            <div class="notice-item-top">
              <span class="notice-type-badge">{{ noticeTypeLabel(notice.noticeType) }}</span>
              <span class="notice-date">{{ formatDate(notice.createdAt) }}</span>
            </div>
            <p class="notice-title">{{ notice.title }}</p>
          </li>
        </ul>

        <!-- 페이지네이션 -->
        <div v-if="!isLoading && totalPages > 1" class="pagination">
          <button
            class="page-btn"
            :disabled="currentPage === 0"
            @click="goToPage(currentPage - 1)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            v-for="p in totalPages"
            :key="p - 1"
            class="page-btn page-num-btn"
            :class="{ active: currentPage === p - 1 }"
            @click="goToPage(p - 1)"
          >
            {{ p }}
          </button>

          <button
            class="page-btn"
            :disabled="!hasNext"
            @click="goToPage(currentPage + 1)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./NoticeListView.css" />
