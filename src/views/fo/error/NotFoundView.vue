<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.replace('/feed')
}
</script>

<template>
  <div class="error-wrap">
    <div class="dialog">
      <div class="icon">🔍</div>
      <h2 class="title">페이지를 찾을 수 없어요</h2>
      <p class="desc">
        주소가 잘못되었거나 더 이상 존재하지 않는 페이지입니다.<br />
        URL을 다시 확인해 주세요.
      </p>
      <div class="code">404</div>
      <button class="btn btn-home" @click="goHome">홈으로 돌아가기</button>
    </div>
  </div>
</template>

<style scoped src="./NotFoundView.css" />
