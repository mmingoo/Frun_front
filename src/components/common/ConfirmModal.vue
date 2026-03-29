<script setup>
defineProps({
  show: { type: Boolean, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  confirmText: { type: String, default: '확인' },
  cancelText: { type: String, default: '취소' },
})

const emit = defineEmits(['update:show', 'confirm'])

function close() {
  emit('update:show', false)
}

function confirm() {
  emit('confirm')
  emit('update:show', false)
}
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="modal">
      <h3 class="modal-title">{{ title }}</h3>
      <p class="modal-desc">
        <slot>{{ description }}</slot>
      </p>
      <div class="modal-actions">
        <button class="modal-btn modal-cancel" @click="close">{{ cancelText }}</button>
        <button class="modal-btn modal-confirm" @click="confirm">{{ confirmText }}</button>
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
  margin: 0 0 8px;
}
.modal-desc {
  font-size: 13px;
  color: #718096;
  margin: 0 0 20px;
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
.modal-confirm:hover {
  background: #c53030;
}
</style>
