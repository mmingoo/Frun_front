<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import NavBar from '@/components/layout/NavBar.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import FriendSidebar from '@/components/layout/FriendSidebar.vue'
import ProfileEditModal from '@/components/mypage/ProfileEditModal.vue'
import { getUserRunningLogs } from '@/api/running'
import { getUserPageInfo, getMyInfo, updatUserProfile } from '@/api/user'
import { BASE_URL } from '@/api/index.js'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const profile = ref(null)
const isLoadingPosts = ref(false)
const hasNext = ref(true)
const cursorId = ref(null)
const posts = ref([])
const isLoadingProfile = ref(false)

const stats = computed(() => ({
  totalDistance: profile.value?.totalDistance ?? 0,
  totalCount: profile.value?.totalCount ?? 0,
  avgPace: profile.value?.avgPace ?? '-',
}))

async function saveEdit({ bio, imageFile, imagePreview }) {
  try {
    await updatUserProfile(bio, imageFile) // API 호출

    // API 성공 후 화면 반영
    if (imageFile) profile.value.profileImage = imagePreview
    profile.value.bio = bio
  } catch (e) {
    console.error('프로필 수정 실패', e)
  }
}
function initPage() {
  posts.value = []
  hasNext.value = true
  cursorId.value = null
  profile.value = null
  loadProfile()
  loadPosts()
}

onMounted(() => initPage())

watch(
  () => route.params.id,
  () => initPage(),
)

// ── 마이페이지 정보 ───────────────────────────────────────
function parseDurationMin(duration) {
  if (!duration) return 0
  const [h, m] = duration.split(':').map(Number)
  return h * 60 + m
}

async function loadProfile() {
  isLoadingProfile.value = true
  try {
    let userId = route.params.id
    if (!userId) {
      if (!auth.userId) {
        const res = await getMyInfo()
        auth.setUserId(res.data.data.userId)
      }
      userId = auth.userId
    }
    const res = await getUserPageInfo(userId)
    const d = res.data.data
    if (d.isOwner) auth.setUserId(d.userId)
    profile.value = {
      id: d.userId,
      nickname: d.nickname,
      profileImage: d.profileImageUrl ? `${BASE_URL}${d.profileImageUrl}` : null,
      bio: d.bio ?? '',
      friendCount: d.friendCount,
      isOwner: d.owner,
      isFriend: d.friend ?? false,
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

async function loadPosts() {
  if (isLoadingPosts.value || !hasNext.value) return
  isLoadingPosts.value = true

  try {
    const userId = route.params.id || auth.userId
    const res = await getUserRunningLogs(userId, cursorId.value)
    const { feeds, hasNext: next, nextCursorId } = res.data.data
    const normalized = feeds.map((f) => ({
      id: f.runningLogId,
      authorId: f.authorId,
      runDate: f.runDate,
      photo: f.thumbnailImage ? `${BASE_URL}${f.thumbnailImage}` : null,
      distance: f.distance,
      duration: parseDurationMin(f.duration),
      pace: f.pace,
      likeCount: f.likeCtn ?? 0,
      commentCount: f.commentCtn ?? 0,
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

function openEdit() {
  showEditModal.value = true
}

// ── 친구 추가/삭제 ────────────────────────────────────────
function toggleFriend() {
  profile.value.isFriend = !profile.value.isFriend
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
            <div class="avatar-col">
              <div class="avatar-lg">
                <UserAvatar :src="profile.profileImage" :alt="profile.nickname" :size="44" />
              </div>
            </div>

            <!-- 오른쪽 정보 -->
            <div class="profile-right">
              <!-- 닉네임 + 버튼 -->
              <div class="profile-name-row">
                <h1 class="profile-nickname">{{ profile.nickname }}</h1>
                <button v-if="profile.isOwner" class="btn-edit" @click="openEdit">
                  프로필 편집
                </button>
                <button
                  v-else-if="!profile.isOwner && profile.isFriend"
                  class="btn-friend btn-friend-delete"
                  @click="toggleFriend"
                >
                  친구 삭제
                </button>
                <button
                  v-else-if="!profile.isOwner && !profile.isFriend"
                  class="btn-friend"
                  @click="toggleFriend"
                >
                  친구 추가
                </button>
              </div>

              <!-- 게시물 / 친구 / 총 거리 -->
              <div class="profile-counts">
                <div class="count-item">
                  <span class="count-label">게시물</span>
                  <span class="count-value">{{ stats.totalCount }}</span>
                </div>
                <div class="count-item">
                  <span class="count-label">친구</span>
                  <span class="count-value">{{ profile.friendCount }}</span>
                </div>
                <div class="count-item">
                  <span class="count-label">총 거리</span>
                  <span class="count-value">{{ stats.totalDistance }}<small>km</small></span>
                </div>
                <div class="count-item">
                  <span class="count-label">평균 페이스</span>
                  <span class="count-value">{{ stats.avgPace }}</span>
                </div>
              </div>
            </div>

            <!-- 한 줄 소개 (두 컬럼 전체 너비) -->
            <p v-if="profile.bio" class="profile-bio">{{ profile.bio }}</p>
          </div>
        </div>

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

        <div v-else class="post-grid-wrap">
          <div class="post-grid">
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
                <span class="grid-dist">{{ post.distance }}km</span>
                <span class="grid-stat">{{ post.duration }}분</span>
                <span class="grid-stat">{{ post.pace }}</span>
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
                <div class="overlay-stat">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    stroke-width="2"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {{ post.commentCount }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 프로필 편집 모달 ── -->
    <ProfileEditModal
      v-model="showEditModal"
      :profile-image="profile?.profileImage"
      :bio="profile?.bio"
      @save="saveEdit"
    />
  </div>
</template>

<style scoped src="./MyPageView.css" />
