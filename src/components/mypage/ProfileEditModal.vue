<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  profileImage: { type: String, default: null },
  bio: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'save'])

const editBio = ref('')
const editProfileImageFile = ref(null)
const editProfileImagePreview = ref(null)
const imageError = ref('')

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

const canSave = computed(() => !imageError.value)

// 모달이 열릴 때마다 부모 props 값으로 편집 상태 초기화
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      editBio.value = props.bio
      editProfileImageFile.value = null                    // 새 파일 선택 초기화
      editProfileImagePreview.value = props.profileImage   // 기존 이미지 미리보기 유지
      imageError.value = ''
    }
  },
)

function onProfileImageChange(e) {
  const file = e.target.files[0]
  if (!file) return

  // 허용되지 않는 파일 형식 — input을 초기화해 같은 파일 재선택 가능하게 함
  if (!ALLOWED_TYPES.includes(file.type)) {
    imageError.value = 'jpg, jpeg, png 형식의 파일만 업로드할 수 있습니다.'
    e.target.value = ''
    return
  }
  if (file.size > MAX_SIZE) {
    alert('파일 크기는 최대 10MB입니다.')
    e.target.value = ''
    return
  }

  imageError.value = ''
  editProfileImageFile.value = file
  // createObjectURL로 로컬 미리보기 생성 — 서버 업로드 전이므로 BASE_URL 불필요
  editProfileImagePreview.value = URL.createObjectURL(file)
}

function save() {
  // 저장 이벤트에 bio(trim), imageFile, imagePreview 전달 후 모달 닫기
  emit('save', {
    bio: editBio.value.trim(),
    imageFile: editProfileImageFile.value,
    imagePreview: editProfileImagePreview.value,
  })
  emit('update:modelValue', false)
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="close">
    <div class="modal">
      <h3 class="modal-title">프로필 편집</h3>

      <!-- 프로필 사진 -->
      <div class="form-group photo-group">
        <label class="form-label">프로필 사진</label>
        <img
          v-if="editProfileImagePreview"
          :src="editProfileImagePreview"
          alt="프로필 미리보기"
          class="photo-preview"
        />
        <div v-else class="photo-placeholder">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" stroke-width="1.5">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </div>
        <label class="btn-change-photo">
          사진 변경
          <input type="file" accept=".jpg,.jpeg,.png" style="display: none" @change="onProfileImageChange" />
        </label>
        <p v-if="imageError" class="image-error">{{ imageError }}</p>
        <p v-else class="image-hint">jpg, jpeg, png · 최대 3MB</p>
      </div>

      <!-- 한 줄 소개 -->
      <div class="form-group">
        <div class="form-label-row">
          <label class="form-label">한 줄 소개</label>
          <span class="char-count" :class="{ 'char-count-max': editBio.length >= 50 }">
            {{ editBio.length }}/50
          </span>
        </div>
        <input
          v-model="editBio"
          type="text"
          class="form-input"
          placeholder="한 줄 소개를 입력하세요"
          maxlength="50"
        />
      </div>

      <div class="modal-actions">
        <button class="modal-btn modal-cancel" @click="close">취소</button>
        <button class="modal-btn modal-confirm" :disabled="!canSave" @click="save">저장</button>
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
  max-width: 380px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.photo-group {
  align-items: center;
}

.form-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: #4a5568;
}

.char-count {
  font-size: 11px;
  color: #a0aec0;
}

.char-count-max {
  color: #e53e3e;
}

.photo-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e2e8f0;
}

.photo-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-change-photo {
  height: 32px;
  padding: 0 16px;
  background: #f7f8fc;
  border: 1.5px solid #dbdfe9;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #2d3748;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}

.btn-change-photo:hover {
  border-color: #3b5bdb;
  color: #3b5bdb;
  background: #eef2ff;
}

.form-input {
  height: 42px;
  padding: 0 13px;
  border: 1.5px solid #dde3ed;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  color: #1a1a2e;
  background: #fafbfc;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #3b5bdb;
  background: #fff;
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
  background: #3b5bdb;
  border: none;
  color: #fff;
}

.modal-confirm:hover:not(:disabled) {
  background: #2f4ac7;
}

.modal-confirm:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.image-hint {
  font-size: 11px;
  color: #a0aec0;
  margin: 0;
}

.image-error {
  font-size: 11px;
  color: #e53e3e;
  margin: 0;
}
</style>
