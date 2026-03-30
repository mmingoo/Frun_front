<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import NavBar from '@/components/layout/NavBar.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import FriendSidebar from '@/components/layout/FriendSidebar.vue'
import { getMyRunningLogs, getFriendRunningLogs } from '@/api/running'
import { getMypaeInfo } from '@/api/user'
import { BASE_URL } from '@/api/index.js'

const router = useRouter()
const route = useRoute()
const isMyPage = computed(() => !route.params.id)
const myProfile = ref(null)
const friendProfile = ref({})
const isLoadingPosts = ref(false)
const profile = computed(() => {
  if (isMyPage.value) return myProfile.value
  return friendProfile.value
})
const hasNext = ref(true)
const cursorId = ref(null)
const posts = ref([])
const isLoadingProfile = ref(false)
const friendStats = ref({ totalDistance: 120.8, totalCount: 22, avgPace: '6\'18"' })

const stats = computed(() => {
  if (isMyPage.value) {
    return {
      totalDistance: myProfile.value?.totalDistance ?? 0,
      totalCount: myProfile.value?.totalCount ?? 0,
      avgPace: myProfile.value?.avgPace ?? '-',
    }
  }
  return friendStats.value
})

onMounted(() => {
  if (isMyPage.value) {
    loadMyProfile()
  }
  loadMyPosts()
})
// ── 마이페이지 정보 ───────────────────────────────────────
function parseDurationMin(duration) {
  if (!duration) return 0
  const [h, m] = duration.split(':').map(Number)
  return h * 60 + m
}

async function loadMyProfile() {
  isLoadingProfile.value = true
  try {
    const res = await getMypaeInfo()
    const d = res.data.data
    myProfile.value = {
      id: d.userId,
      nickname: d.nickname,
      profileImage: d.profileImageUrl ? `${BASE_URL}${d.profileImageUrl}` : null,
      bio: d.bio ?? '',
      friendCount: d.friendCount,
      totalCount: d.totalRunCount,
      totalDistance: d.totalDistanceKm,
      avgPace: d.avgPace,
    }
  } catch (e) {
    console.error('프로필 로딩 실패', e)
  } finally {
    isLoadingProfile.value = false
  }
}

async function loadMyPosts() {
  if (isLoadingPosts.value || !hasNext.value) return
  isLoadingPosts.value = true

  try {
    const res = isMyPage.value
      ? await getMyRunningLogs(cursorId.value)
      : await getFriendRunningLogs(route.params.id, cursorId.value)
    const { feeds, hasNext: next, nextCursorId } = res.data.data
    const normalized = feeds.map((f) => ({
      id: f.runningLogId,
      authorId: f.authorId,
      runDate: f.runDate,
      photo: f.logImages?.[0] ? `${BASE_URL}${f.logImages[0]}` : null,
      distance: f.distance,
      duration: parseDurationMin(f.duration),
      pace: f.pace,
      likeCount: f.likeCtn ?? 0,
    }))

    posts.value.push(...normalized)
    hasNext.value = next
    cursorId.value = nextCursorId
  } catch (e) {
    console.log('러닝 목록 로딩 실패', e)
  } finally {
    isLoadingPosts.value = false
  }
}

// ── 게시물 미리보기 오버레이 ──────────────────────────────
const hoveredId = ref(null)

// ── 프로필 편집 ──────────────────────────────────────────
const showEditModal = ref(false)
const editNickname = ref('')
const editBio = ref('')

function openEdit() {
  editNickname.value = myProfile.value.nickname
  editBio.value = myProfile.value.bio
  showEditModal.value = true
}

function saveEdit() {
  if (!editNickname.value.trim()) return
  myProfile.value.nickname = editNickname.value.trim()
  myProfile.value.bio = editBio.value.trim()
  showEditModal.value = false
}

// ── 친구 추가/삭제 ────────────────────────────────────────
function toggleFriend() {
  friendProfile.value.isFriend = !friendProfile.value.isFriend
}
</script>

<template>
  <div class="page-wrap">
    <NavBar />

    <!-- ── 메인 ── -->
    <div class="page-grid">
      <FriendSidebar />
      <div class="main-wrap">
        <!-- ── 프로필 헤더 (인스타그램 스타일) ── -->
        <div class="profile-box">
          <div v-if="isLoadingProfile" class="profile-loading">불러오는 중…</div>
          <div v-else-if="profile" class="profile-header">
            <!-- 아바타 -->
            <div class="avatar-lg">
              <UserAvatar :src="profile.profileImage" :alt="profile.nickname" :size="44" />
            </div>

            <!-- 오른쪽 정보 -->
            <div class="profile-right">
              <!-- 닉네임 + 버튼 -->
              <div class="profile-name-row">
                <h1 class="profile-nickname">{{ profile.nickname }}</h1>
                <button v-if="isMyPage" class="btn-edit" @click="openEdit">프로필 편집</button>
                <button
                  v-else
                  class="btn-friend"
                  :class="{ 'btn-friend-delete': profile.isFriend }"
                  @click="toggleFriend"
                >
                  {{ profile.isFriend ? '친구 삭제' : '친구 추가' }}
                </button>
              </div>

              <!-- 게시물 / 친구 / 총 거리 -->
              <div class="profile-counts">
                <div class="count-item">
                  <span class="count-value">{{ stats.totalCount }}</span>
                  <span class="count-label">게시물</span>
                </div>
                <div class="count-item">
                  <span class="count-value">{{ profile.friendCount }}</span>
                  <span class="count-label">친구</span>
                </div>
                <div class="count-item">
                  <span class="count-value">{{ stats.totalDistance }}<small>km</small></span>
                  <span class="count-label">총 거리</span>
                </div>
                <div class="count-item">
                  <span class="count-value">{{ stats.avgPace }}</span>
                  <span class="count-label">평균 페이스</span>
                </div>
              </div>

              <!-- 한 줄 소개 -->
              <p v-if="profile.bio" class="profile-bio">{{ profile.bio }}</p>
            </div>
          </div>
        </div>

        <!-- ── 구분선 ── -->
        <div class="divider" />

        <!-- ── 게시물 그리드 ── -->
        <div v-if="posts.length === 0" class="empty-wrap">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#c4cad6"
            stroke-width="1.5"
          >
            <path d="M13 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0" />
            <path d="M7.5 15.5 9 11l3 2 2-5" />
            <path d="M4 19l3.5-3.5" />
          </svg>
          <p>아직 러닝 기록이 없습니다.</p>
        </div>

        <div v-else class="post-grid">
          <div
            v-for="post in posts"
            :key="post.id"
            class="grid-item"
            @mouseenter="hoveredId = post.id"
            @mouseleave="hoveredId = null"
            @click="router.push(`/feed/${post.id}/${post.authorId}`)"
          >
            <!-- 사진 or 플레이스홀더 -->
            <img v-if="post.photo" :src="post.photo" alt="러닝 사진" class="grid-img" />
            <div v-else class="grid-placeholder">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#d0d5e0"
                stroke-width="1.4"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span class="grid-dist">{{ post.distance }}km</span>
            </div>

            <!-- 호버 오버레이 -->
            <div class="grid-overlay" :class="{ visible: hoveredId === post.id }">
              <div class="overlay-stat">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  stroke-width="2.2"
                >
                  <path d="M13 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0" />
                  <path d="M7.5 15.5 9 11l3 2 2-5" />
                  <path d="M4 19l3.5-3.5" />
                </svg>
                {{ post.distance }}km
              </div>
              <div class="overlay-stat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#e53e3e" stroke="none">
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  />
                </svg>
                {{ post.likeCount }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 프로필 편집 모달 ── -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal">
        <h3 class="modal-title">프로필 편집</h3>
        <div class="form-group">
          <label class="form-label">닉네임</label>
          <input
            v-model="editNickname"
            type="text"
            class="form-input"
            placeholder="닉네임을 입력하세요"
            maxlength="20"
          />
        </div>
        <div class="form-group">
          <label class="form-label">한 줄 소개</label>
          <input
            v-model="editBio"
            type="text"
            class="form-input"
            placeholder="한 줄 소개를 입력하세요"
            maxlength="50"
          />
        </div>
        <div class="modal-actions">
          <button class="modal-btn modal-cancel" @click="showEditModal = false">취소</button>
          <button
            class="modal-btn modal-confirm"
            :disabled="!editNickname.trim()"
            @click="saveEdit"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./MyPageView.css" />
