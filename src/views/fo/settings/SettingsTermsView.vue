<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '@/components/layout/NavBar.vue'
import { getTermsList, getMyTerms, updateTermsAgreement } from '@/api/auth.js'

const router = useRouter()

const terms = ref([])
const agreed = ref({})
const openStates = ref({})
const isSaving = ref(false)
const saveMsg = ref('')
const saveMsgType = ref('')
const loadError = ref('')

onMounted(async () => {
  try {
    // 약관 목록과 내 동의 현황을 병렬로 조회해 로딩 시간 단축
    const [termsRes, myRes] = await Promise.all([getTermsList(), getMyTerms()])
    terms.value = termsRes.data.data
    const myAgreements = myRes.data

    // 약관 ID별로 내 동의 여부를 매핑 — 서버 응답에 없는 약관은 false로 초기화
    terms.value.forEach((t) => {
      const my = myAgreements.find((a) => a.title === t.title)
      agreed.value[t.termId] = my ? my.isAgreed : false
      openStates.value[t.termId] = false
    })
  } catch {
    loadError.value = '약관 정보를 불러오는데 실패했습니다.'
  }
})

async function handleSave() {
  isSaving.value = true
  saveMsg.value = ''
  try {
    const agreements = terms.value.map((t) => ({
      termId: t.termId,
      agreed: t.required ? true : agreed.value[t.termId], // 필수 약관은 체크박스 상태와 무관하게 강제 동의
    }))
    await updateTermsAgreement(agreements)
    alert('약관 동의가 저장되었습니다.')
    router.back()
  } catch (e) {
    saveMsg.value = e.response?.data?.message ?? '저장에 실패했습니다.'
    saveMsgType.value = 'error'
  } finally {
    isSaving.value = false
  }
}

// 약관 본문 줄바꿈 문자를 HTML로 변환 (v-html 렌더링용)
function formatContent(content) {
  return content.replace(/\n/g, '<br />')
}
</script>

<template>
  <div class="page-wrap">
    <NavBar />
    <div class="page-grid">
      <div class="main-wrap">
        <div class="page-header">
          <button class="btn-back" @click="router.push('/settings')">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h2 class="page-title">약관 동의 변경</h2>
        </div>

        <p v-if="loadError" class="msg msg-error">{{ loadError }}</p>

        <section v-else class="settings-card">
          <div v-for="term in terms" :key="term.termId" class="term-item">
            <div class="term-row">
              <div class="term-info">
                <span class="term-name">{{ term.title }}</span>
                <span class="term-badge" :class="term.required ? 'required' : 'optional'">
                  {{ term.required ? '필수' : '선택' }}
                </span>
              </div>
              <div class="term-actions">
                <button
                  class="btn-toggle"
                  @click="openStates[term.termId] = !openStates[term.termId]"
                >
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
                <label class="toggle-switch">
                  <input v-if="term.required" type="checkbox" checked disabled />
                  <input
                    v-else
                    v-model="agreed[term.termId]"
                    type="checkbox"
                    @change="saveMsg = ''"
                  />
                  <span class="toggle-track" />
                </label>
              </div>
            </div>
            <div v-if="openStates[term.termId]" class="term-content">
              <p v-html="formatContent(term.content)" />
            </div>
          </div>

          <p v-if="saveMsg" class="msg" :class="saveMsgType === 'ok' ? 'msg-save' : 'msg-error'">
            {{ saveMsg }}
          </p>

          <button class="btn-save" :disabled="isSaving" @click="handleSave">
            <span v-if="isSaving" class="spinner" />
            <span v-else>저장</span>
          </button>
        </section>

        <p class="terms-notice">
          서비스 이용약관 및 개인정보처리방침은 서비스 이용을 위한 필수 약관으로 철회할 수 없습니다.
          계정을 삭제하려면
          <button class="link-btn" @click="router.push('/settings/deactivate')">
            계정 비활성화</button
          >를 이용해주세요.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped src="./SettingsView.css" />
<style scoped>
.term-item {
  border-bottom: 1px solid #f0f2f7;
}

.term-item:last-of-type {
  border-bottom: none;
}

.term-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: none;
}

.term-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.term-name {
  font-size: 14px;
  font-weight: 500;
  color: #2d3748;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.term-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
}

.term-badge.required {
  background: #eef2ff;
  color: #3b5bdb;
}

.term-badge.optional {
  background: #f0fff4;
  color: #38a169;
}

.term-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

/* 토글 스위치 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.toggle-track {
  position: absolute;
  inset: 0;
  background: #dde3ed;
  border-radius: 22px;
  transition: background 0.2s;
}

.toggle-track::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.toggle-switch input:checked + .toggle-track {
  background: #3b5bdb;
}

.toggle-switch input:checked + .toggle-track::after {
  transform: translateX(18px);
}

.toggle-switch input:disabled + .toggle-track {
  background: #c0c8d8;
  cursor: not-allowed;
}

.btn-toggle {
  background: none;
  border: none;
  cursor: pointer;
  color: #8e9aaf;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.btn-toggle:hover {
  color: #3b5bdb;
}

.term-content {
  background: #fafbfc;
  border: 1.5px solid #edf0f7;
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 10px;
  max-height: 200px;
  overflow-y: auto;
  font-size: 12.5px;
  line-height: 1.75;
  color: #4a5568;
}

.term-content::-webkit-scrollbar {
  width: 5px;
}

.term-content::-webkit-scrollbar-track {
  background: #f0f4ff;
  border-radius: 3px;
}

.term-content::-webkit-scrollbar-thumb {
  background: #bbc8ee;
  border-radius: 3px;
}

.term-content p {
  margin: 0 0 12px;
}

.term-content p:last-child {
  margin-bottom: 0;
}

.terms-notice {
  font-size: 12px;
  color: #a0aec0;
  line-height: 1.6;
  text-align: center;
  margin: 0;
}

.link-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 12px;
  color: #3b5bdb;
  cursor: pointer;
  text-decoration: underline;
}
</style>
