<script setup>
defineProps({
  src: { type: String, default: null },
  alt: { type: String, default: '' },
  size: { type: Number, default: 18 },
})
</script>

<template>
  <img v-if="src" :src="src" :alt="alt" />
  <svg
    v-else
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#94a3b8"
    stroke-width="1.8"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
</template>
