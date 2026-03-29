<script setup>
import { ref } from 'vue'

const props = defineProps({
  show: Boolean,
})

const emit = defineEmits(['update:show', 'submit'])

const reportReason = ref('')
const reportEtc = ref('')

function close() {
  emit('update:show', false)
}

function submit() {
  if (!reportReason.value) return
  emit('submit', { reason: reportReason.value, etc: reportEtc.value })
  reportReason.value = ''
  reportEtc.value = ''
}
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
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
        <button class="modal-btn modal-cancel" @click="close">취소</button>
        <button class="modal-btn modal-confirm" :disabled="!reportReason" @click="submit">
          신고
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 16px;
}
.modal {
  background: #fff;
  border-radius: 16px;
  padding: 28px 24px 20px;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
}
.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 16px;
}
.report-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}
.report-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #2d3748;
  cursor: pointer;
}
.report-textarea {
  width: 100%;
  border: 1.5px solid #dde3ed;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  font-family: inherit;
  color: #1a1a2e;
  outline: none;
  resize: none;
  margin-bottom: 14px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.report-textarea:focus {
  border-color: #3b5bdb;
}
.modal-actions {
  display: flex;
  gap: 8px;
}
.modal-btn {
  flex: 1;
  height: 44px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.modal-cancel {
  background: #f7f8fc;
  border: 1.5px solid #e2e8f0;
  color: #718096;
}
.modal-cancel:hover {
  border-color: #a0b0e0;
  color: #3b5bdb;
}
.modal-confirm {
  background: #e53e3e;
  border: none;
  color: #fff;
}
.modal-confirm:hover:not(:disabled) {
  background: #c53030;
}
.modal-confirm:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}
</style>
