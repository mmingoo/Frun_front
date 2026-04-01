<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import NavBar from '@/components/layout/NavBar.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { getWeeklyStats, getMonthlyStats, getPeriodStats } from '@/api/stats'
import { getFriendList } from '@/api/friend'
import { useAuthStore } from '@/stores/auth'
import { getMyInfo } from '@/api/user'

const authStore = useAuthStore()

// ── 로딩 / 에러 ───────────────────────────────────────────
const isLoading = ref(false)
const errorMsg = ref(null)

// ── 탭 ────────────────────────────────────────────────────
const activeTab = ref('week')

// ── 날짜 초기값 ───────────────────────────────────────────
const today = new Date()
const thisMonthFirst = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
const todayStr = today.toISOString().slice(0, 10)

// ── 기간별 날짜 ───────────────────────────────────────────
const periodFrom = ref(thisMonthFirst)
const periodTo = ref(todayStr)
const appliedFrom = ref(thisMonthFirst)
const appliedTo = ref(todayStr)

// ── 포맷 헬퍼 ─────────────────────────────────────────────
const DAY_OF_WEEK_MAP = {
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
  SAT: '토',
  SUN: '일',
}

function formatPace(avgPaceSec) {
  if (!avgPaceSec) return '-'
  const m = Math.floor(avgPaceSec / 60)
  const s = String(avgPaceSec % 60).padStart(2, '0')
  return `${m}'${s}"`
}

function formatDuration(totalDurationSec) {
  if (!totalDurationSec) return '-'
  const h = Math.floor(totalDurationSec / 3600)
  const m = Math.floor((totalDurationSec % 3600) / 60)
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`
}

function formatSummary(summary) {
  return {
    totalDistance: summary.totalDistanceKm,
    count: summary.runCount,
    avgPace: formatPace(summary.avgPaceSec),
    totalTime: formatDuration(summary.totalDurationSec),
  }
}

// ── 통계 데이터 ───────────────────────────────────────────
const defaultStats = { totalDistance: 0, count: 0, avgPace: '-', totalTime: '-' }

const weekStats = ref({ ...defaultStats })
const monthStats = ref({ ...defaultStats })
const periodStatsData = ref({ ...defaultStats })

const currentStats = computed(() => {
  if (activeTab.value === 'week') return weekStats.value
  if (activeTab.value === 'month') return monthStats.value
  return periodStatsData.value
})

// ── 차트 데이터 ───────────────────────────────────────────
const weeklyChartData = ref(
  ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) => ({
    label: DAY_OF_WEEK_MAP[d],
    distance: 0,
  })),
)

const monthlyWeeks = ref([])
const periodChartData = ref([])
const friendRecords = ref([])

// ── API 호출 ──────────────────────────────────────────────
async function fetchWeekly() {
  isLoading.value = true
  errorMsg.value = null
  try {
    const res = await getWeeklyStats(targetUserId.value, todayStr)
    const { summary, chart } = res.data.data

    weekStats.value = formatSummary(summary)

    // chart: [{ dayOfWeek, distanceKm }] → [{ label, distance }]
    weeklyChartData.value = chart.map((d) => ({
      label: DAY_OF_WEEK_MAP[d.dayOfWeek],
      distance: d.distanceKm,
    }))
  } catch (e) {
    errorMsg.value = '주별 데이터를 불러오지 못했습니다.'
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

async function fetchMonthly() {
  isLoading.value = true
  errorMsg.value = null
  try {
    // const res = await getMonthlyStats(targetUserId.value, today.getFullYear(), today.getMonth() + 1)
    const res = await getMonthlyStats(targetUserId.value)

    const { summary, chart } = res.data.data

    monthStats.value = formatSummary(summary)

    // chart: [{ weekLabel, totalDistanceKm, days: [{ dayOfWeek, distanceKm }] }]
    monthlyWeeks.value = chart.map((week) => ({
      label: week.weekLabel,
      total: week.totalDistanceKm,
      days: week.days.map((d) => ({
        label: DAY_OF_WEEK_MAP[d.dayOfWeek],
        distance: d.distanceKm,
      })),
    }))
  } catch (e) {
    errorMsg.value = '달별 데이터를 불러오지 못했습니다.'
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

async function fetchPeriod() {
  isLoading.value = true
  errorMsg.value = null
  try {
    const res = await getPeriodStats(targetUserId.value, appliedFrom.value, appliedTo.value)
    const { summary, chart } = res.data.data

    periodStatsData.value = formatSummary(summary)

    // chart: [{ date, dayOfWeek, distanceKm }]
    // → [{ date, label: 'M/D', day: '월', distance }]
    periodChartData.value = chart.map((d) => {
      const [, m, day] = d.date.split('-')
      return {
        date: d.date,
        label: `${Number(m)}/${Number(day)}`,
        day: DAY_OF_WEEK_MAP[d.dayOfWeek],
        distance: d.distanceKm,
      }
    })
  } catch (e) {
    errorMsg.value = '기간별 데이터를 불러오지 못했습니다.'
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

function fetchStats() {
  if (activeTab.value === 'week') fetchWeekly()
  else if (activeTab.value === 'month') fetchMonthly()
  else fetchPeriod()
}

function searchPeriod() {
  appliedFrom.value = periodFrom.value
  appliedTo.value = periodTo.value
  fetchPeriod()
}

watch(activeTab, () => fetchStats())

// ── 차트 계산 ─────────────────────────────────────────────
const chartData = computed(() => weeklyChartData.value)

const maxDistance = computed(() => Math.max(...chartData.value.map((d) => d.distance)) || 1)

const yTicks = computed(() => {
  const max = maxDistance.value
  return [max, max * 0.75, max * 0.5, max * 0.25, 0].map((v) =>
    v === 0 ? '0' : Number(v.toFixed(1)),
  )
})

const monthlyMaxDistance = computed(() => {
  const all = monthlyWeeks.value.flatMap((w) => w.days.map((d) => d.distance))
  return Math.max(...all) || 1
})

const periodMaxDistance = computed(
  () => Math.max(...periodChartData.value.map((d) => d.distance)) || 1,
)

const periodYTicks = computed(() => {
  const max = periodMaxDistance.value
  return [max, max * 0.75, max * 0.5, max * 0.25, 0].map((v) =>
    v === 0 ? '0' : Number(v.toFixed(1)),
  )
})

const chartTitle = computed(() => {
  if (activeTab.value === 'week') return '주별 거리 막대 차트'
  if (activeTab.value === 'month') return '달별 거리 막대 차트'
  return '기간별 거리 막대 차트'
})

// ── 친구 선택 ─────────────────────────────────────────────
const selectedFriendId = ref(null) // null = 내 통계, 숫자 = 친구 통계
const targetUserId = computed(() => selectedFriendId.value ?? authStore.userId)

function selectFriend(friend) {
  selectedFriendId.value = friend.userId
  fetchStats() // 선택된 친구 기준으로 다시 조회
}

function resetToMyStats() {
  selectedFriendId.value = null
  fetchStats()
}

// ── 친구 목록 로드 ────────────────────────────────────────
async function fetchFriendList() {
  let cursorName = null
  let cursorId = null
  const all = []
  while (true) {
    const res = await getFriendList(cursorName, cursorId)
    const { friends, hasNext, nextCursorName, nextCursorId } = res.data.data
    friends.forEach((f) =>
      all.push({
        userId: f.friendId,
        nickname: f.friendName,
        profileImage: f.friendProfileImage,
        totalDistanceKm: 0,
      }),
    )
    if (!hasNext) break
    cursorName = nextCursorName
    cursorId = nextCursorId
  }
  friendRecords.value = all
}

// ── 친구 기록 ─────────────────────────────────────────────
const friendSearchQuery = ref('')

const filteredFriendRecords = computed(() => {
  if (!friendSearchQuery.value.trim()) return friendRecords.value
  return friendRecords.value.filter((f) =>
    f.nickname.toLowerCase().includes(friendSearchQuery.value.toLowerCase()),
  )
})

const visibleCount = ref(6)
const visibleFriends = computed(() => filteredFriendRecords.value.slice(0, visibleCount.value))

watch(friendSearchQuery, () => {
  visibleCount.value = 6
})

const sentinel = ref(null)
let observer = null

onMounted(async () => {
  // userId가 없으면 먼저 채우기
  if (!authStore.userId) {
    const res = await getMyInfo()
    authStore.setUserId(res.data.data.userId)
  }
  fetchFriendList()
  fetchStats()

  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && visibleCount.value < friendRecords.value.length) {
      visibleCount.value = Math.min(visibleCount.value + 5, friendRecords.value.length)
    }
  })
  if (sentinel.value) observer.observe(sentinel.value)
})

onBeforeUnmount(() => {
  if (observer) observer.disconnect()
})

const friendPanelTitle = computed(() => {
  return '친구 러닝 통계'
})
</script>

<template>
  <div class="page-wrap">
    <NavBar />

    <!-- ── 메인 콘텐츠 ── -->
    <div class="main-wrap">
      <!-- 탭 + 기간 선택 -->
      <div class="tab-bar">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'week' }"
          @click="activeTab = 'week'"
        >
          주별
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'month' }"
          @click="activeTab = 'month'"
        >
          달별
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'period' }"
          @click="activeTab = 'period'"
        >
          기간별
        </button>

        <div v-if="activeTab === 'period'" class="period-picker">
          <input type="date" v-model="periodFrom" class="date-input" />
          <span class="period-sep">~</span>
          <input type="date" v-model="periodTo" class="date-input" />
          <button class="period-search-btn" @click="searchPeriod">조회</button>
        </div>
        <div v-else class="period-picker-placeholder" />
      </div>

      <!-- 요약 통계 -->
      <div class="summary-row">
        <div class="summary-item">
          <span class="summary-label">
            <span v-if="activeTab === 'week'">이번 주</span>
            <span v-else-if="activeTab === 'month'">이번 달</span>
            <span v-else>기간 내</span>
            총 거리
          </span>
          <span class="summary-value">{{ currentStats.totalDistance }} km</span>
        </div>
        <div class="summary-divider" />
        <div class="summary-item">
          <span class="summary-label">러닝 횟수</span>
          <span class="summary-value">{{ currentStats.count }}회</span>
        </div>
        <div class="summary-divider" />
        <div class="summary-item">
          <span class="summary-label">평균 페이스</span>
          <span class="summary-value">{{ currentStats.avgPace }}</span>
        </div>
        <div class="summary-divider" />
        <div class="summary-item">
          <span class="summary-label">총 러닝 시간</span>
          <span class="summary-value">{{ currentStats.totalTime }}</span>
        </div>
      </div>

      <!-- 차트 + 친구 기록 -->
      <div class="content-grid">
        <!-- 차트 영역 -->
        <div class="chart-card">
          <div class="chart-inner">
            <!-- ── 달별: 요일 × 주별 스크롤 차트 ── -->
            <template v-if="activeTab === 'month'">
              <div class="monthly-chart-wrap">
                <!-- Y축 (고정) -->
                <div class="monthly-y-axis">
                  <span v-for="tick in yTicks" :key="tick" class="y-tick">{{ tick }}</span>
                </div>
                <!-- 가로 스크롤 영역 -->
                <div class="chart-scroll-wrap">
                  <div class="chart-scroll">
                    <div v-for="week in monthlyWeeks" :key="week.label" class="week-group">
                      <!-- 주 합계 헤더 -->
                      <div class="week-header">
                        <span class="week-label">{{ week.label }}</span>
                        <span class="week-total">{{ week.total }} km</span>
                      </div>
                      <!-- 요일별 막대 -->
                      <div class="week-bars">
                        <div class="grid-layer" aria-hidden="true">
                          <div v-for="i in 5" :key="i" class="grid-line" />
                        </div>
                        <div v-for="day in week.days" :key="day.label" class="bar-col">
                          <div class="bar-wrap">
                            <div
                              class="bar"
                              :style="{ height: (day.distance / monthlyMaxDistance) * 140 + 'px' }"
                            >
                              <span v-if="day.distance > 0" class="bar-value">{{
                                day.distance
                              }}</span>
                            </div>
                          </div>
                          <span class="bar-label">{{ day.label }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- ── 기간별: flat 가로 스크롤 차트 ── -->
            <template v-else-if="activeTab === 'period'">
              <div class="monthly-chart-wrap">
                <!-- Y축 (고정) -->
                <div class="monthly-y-axis period-y-axis">
                  <span v-for="tick in periodYTicks" :key="tick" class="y-tick">{{ tick }}</span>
                </div>
                <!-- 가로 스크롤 영역 -->
                <div class="chart-scroll-wrap">
                  <!-- chart-scroll 직접 사용 → width: max-content 보장 → 스크롤 동작 -->
                  <div class="chart-scroll">
                    <div class="period-bar-section">
                      <div class="grid-layer period-gl" aria-hidden="true">
                        <div v-for="i in 5" :key="i" class="grid-line" />
                      </div>
                      <div v-for="item in periodChartData" :key="item.date" class="period-col-item">
                        <div class="period-bar-wrap">
                          <div
                            class="bar"
                            :style="{ height: (item.distance / periodMaxDistance) * 140 + 'px' }"
                          >
                            <span v-if="item.distance > 0" class="bar-value">{{
                              item.distance
                            }}</span>
                          </div>
                        </div>
                        <span class="bar-label">{{ item.label }}</span>
                        <span class="bar-sublabel">{{ item.day }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- ── 주별: 기존 차트 ── -->
            <template v-else>
              <div class="chart-area">
                <div class="y-axis">
                  <span v-for="tick in yTicks" :key="tick" class="y-tick">{{ tick }}</span>
                </div>
                <div class="chart-body">
                  <div class="grid-layer" aria-hidden="true">
                    <div v-for="i in 5" :key="i" class="grid-line" />
                  </div>
                  <div class="bar-chart">
                    <div v-for="item in chartData" :key="item.label" class="bar-col">
                      <div class="bar-wrap">
                        <div
                          class="bar"
                          :style="{ height: (item.distance / maxDistance) * 140 + 'px' }"
                        >
                          <span v-if="item.distance > 0" class="bar-value">{{
                            item.distance
                          }}</span>
                        </div>
                      </div>
                      <span class="bar-label">{{ item.label }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <p class="chart-placeholder-text">[{{ chartTitle }}]</p>
          </div>
        </div>

        <!-- 친구 기록 -->
        <div class="friends-card">
          <div class="friends-header-row">
            <h2 class="friends-title">{{ friendPanelTitle }}</h2>
            <button v-if="selectedFriendId" class="my-stats-btn" @click="resetToMyStats">
              내 통계 보기
            </button>
          </div>
          <!-- <div v-if="selectedFriendId" class="selected-friend-banner">
            {{ visibleFriends.find((f) => f.userId === selectedFriendId)?.nickname ?? '친구' }}의
            통계를 보는 중
          </div> -->
          <div class="friends-search-row">
            <div class="friends-search-box">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                stroke-width="2"
                class="friends-search-icon"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                v-model="friendSearchQuery"
                type="text"
                class="friends-search-input"
                placeholder="닉네임 검색"
              />
            </div>
          </div>
          <ul class="friends-list">
            <li
              v-for="friend in visibleFriends"
              :key="friend.userId"
              class="friends-item"
              :class="{ 'friends-item--selected': friend.userId === selectedFriendId }"
              @click="selectFriend(friend)"
            >
              <div class="friend-avatar">
                <UserAvatar :src="friend.profileImage" :alt="friend.nickname" :size="12" />
              </div>
              <span class="friend-name">{{ friend.nickname }}</span>
            </li>
            <li
              v-if="visibleCount < filteredFriendRecords.length"
              ref="sentinel"
              class="friends-sentinel"
            />
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./StatsView.css" />
