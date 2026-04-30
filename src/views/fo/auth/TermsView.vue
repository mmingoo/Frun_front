<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { getTermsList, logout } from '@/api/auth.js'

const router = useRouter()
const auth = useAuthStore()

const terms = ref([])
const agreed = ref({})
const openStates = ref({})
const loadError = ref('')

onMounted(async () => {
  try {
    const res = await getTermsList()
    terms.value = res.data.data
    terms.value.forEach((t) => {
      agreed.value[t.termId] = false
      openStates.value[t.termId] = false
    })
  } catch {
    loadError.value = '약관을 불러오는데 실패했습니다.'
  }
})

const agreeAll = computed(() => terms.value.every((t) => agreed.value[t.termId]))

const canNext = computed(() =>
  terms.value.filter((t) => t.required).every((t) => agreed.value[t.termId]),
)

function toggleAll() {
  const next = !agreeAll.value
  terms.value.forEach((t) => {
    agreed.value[t.termId] = next
  })
}

function handleNext() {
  if (!canNext.value) return
  const marketingTerm = terms.value.find((t) => !t.required)
  auth.termsAgreed = true
  auth.marketingAgreed = marketingTerm ? agreed.value[marketingTerm.termId] : false
  router.push('/signup/nickname')
}

function formatContent(content) {
  return content.replace(/\n/g, '<br />')
}

async function handleCancel() {
  try {
    await logout()
  } catch {
    // 실패해도 클라이언트 상태는 초기화
  }
  auth.logout()
  sessionStorage.removeItem('_inSignupFlow')
  alert('로그아웃 하였습니다.')
  router.push('/')
}
</script>

<template>
  <div class="terms-wrap">
    <div class="terms-card">
      <!-- 로고 -->
      <div class="logo-area">
        <div class="logo-icon">
          <svg
            width="28"
            height="28"
            viewBox="-2 0 24 20"
            fill="none"
            stroke="#3b5bdb"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M13 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0" />
            <path d="M7.5 15.5 9 11l3 2 2-5" />
            <path d="M4 19l3.5-3.5" />
          </svg>
        </div>
        <h1 class="brand">FRun</h1>
      </div>

      <h2 class="page-title">서비스 이용약관</h2>
      <p class="page-subtitle">FRun 서비스 이용을 위해 약관에 동의해주세요.</p>

      <p v-if="loadError" class="load-error">{{ loadError }}</p>

      <template v-else-if="terms.length">
        <!-- 전체 동의 -->
        <label class="agree-all-row" :class="{ checked: agreeAll }">
          <input type="checkbox" :checked="agreeAll" class="agree-checkbox" @change="toggleAll" />
          <span class="agree-all-label">전체 동의</span>
        </label>

        <div class="divider" />

        <!-- 약관 목록 -->
        <div v-for="term in terms" :key="term.termId" class="term-item">
          <div class="term-header">
            <label class="term-check-label">
              <input type="checkbox" v-model="agreed[term.termId]" class="agree-checkbox" />
              <span class="badge" :class="term.required ? 'required' : 'optional'">
                {{ term.required ? '필수' : '선택' }}
              </span>
              <span class="term-title">{{ term.title }} 동의</span>
            </label>
            <button class="btn-toggle" @click="openStates[term.termId] = !openStates[term.termId]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                :style="{
                  transform: openStates[term.termId] ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
          <div v-if="openStates[term.termId]" class="term-content">
            <p v-html="formatContent(term.content)" />
          </div>
        </div>
      </template>

      <!-- 다음 버튼 -->
      <button class="btn-next" :disabled="!canNext" @click="handleNext">다음</button>
      <button class="btn-cancel" @click="handleCancel">취소</button>
    </div>
  </div>
</template>

<style scoped src="./TermsView.css" />
