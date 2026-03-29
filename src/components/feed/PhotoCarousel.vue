<script setup>
import { ref } from 'vue'

const props = defineProps({
  photos: {
    type: Array,
    required: true,
  },
})

const photoIndex = ref(0)
</script>

<template>
  <div v-if="photos.length" class="tracker-photo-wrap">
    <div class="tracker-photo">
      <div class="tracker-photo-inner">
        <img :src="photos[photoIndex]" alt="러닝 사진" />
      </div>
      <template v-if="photos.length > 1">
        <button v-if="photoIndex > 0" class="photo-nav photo-prev" @click="photoIndex--">
          ‹
        </button>
        <button
          v-if="photoIndex < photos.length - 1"
          class="photo-nav photo-next"
          @click="photoIndex++"
        >
          ›
        </button>
        <div class="photo-dots">
          <span
            v-for="(_, i) in photos"
            :key="i"
            class="photo-dot"
            :class="{ active: i === photoIndex }"
            @click="photoIndex = i"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.tracker-photo-wrap {
  display: flex;
  justify-content: center;
  padding: 4px 0 8px;
}

.tracker-photo {
  position: relative;
  width: 100%;
  max-width: 360px;
  aspect-ratio: 4/5;
  overflow: visible;
}

.tracker-photo-inner {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 12px;
  background: #f1f3f7;
}

.tracker-photo-inner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  background: rgba(0, 0, 0, 0.35);
  border: none;
  border-radius: 50%;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  padding: 0;
  line-height: 1;
  transition: background 0.2s;
}

.photo-nav:hover {
  background: rgba(0, 0, 0, 0.55);
}

.photo-prev { left: -14px; }
.photo-next { right: -14px; }

.photo-dots {
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 5px;
}

.photo-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: background 0.2s;
}

.photo-dot.active {
  background: #fff;
}
</style>
