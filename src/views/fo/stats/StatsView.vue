<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'

const router = useRouter()

// ── 탭 ────────────────────────────────────────────────────
const activeTab = ref('week') // 'week' | 'month' | 'period'

// ── 기간별 날짜 ───────────────────────────────────────────
const periodFrom = ref('2026-03-01')
const periodTo = ref('2026-03-17')
const appliedFrom = ref('2026-03-01')
const appliedTo = ref('2026-03-17')

function searchPeriod() {
  appliedFrom.value = periodFrom.value
  appliedTo.value = periodTo.value
}

// ── 목 데이터 ──────────────────────────────────────────────
const weekStats = ref({
  totalDistance: 23.5,
  count: 4,
  avgPace: '6\'02"',
  totalTime: '3시간 52분',
})

const monthStats = ref({
  totalDistance: 87.3,
  count: 14,
  avgPace: '6\'10"',
  totalTime: '14시간 28분',
})

const currentStats = computed(() => {
  if (activeTab.value === 'week') return weekStats.value
  if (activeTab.value === 'month') return monthStats.value
  return periodStats.value
})

// ── 주별 차트 데이터 (요일별 거리) ─────────────────────────
const weeklyChartData = ref([
  { label: '월', distance: 0 },
  { label: '화', distance: 5.2 },
  { label: '수', distance: 0 },
  { label: '목', distance: 7.8 },
  { label: '금', distance: 4.1 },
  { label: '토', distance: 6.4 },
  { label: '일', distance: 0 },
])

const monthlyWeeks = ref([
  {
    label: '1주',
    total: 18.5,
    days: [
      { label: '월', distance: 0 },
      { label: '화', distance: 5.2 },
      { label: '수', distance: 0 },
      { label: '목', distance: 7.8 },
      { label: '금', distance: 4.1 },
      { label: '토', distance: 1.0 },
      { label: '일', distance: 0.4 },
    ],
  },
  {
    label: '2주',
    total: 23.5,
    days: [
      { label: '월', distance: 6.2 },
      { label: '화', distance: 0 },
      { label: '수', distance: 8.1 },
      { label: '목', distance: 0 },
      { label: '금', distance: 5.4 },
      { label: '토', distance: 3.8 },
      { label: '일', distance: 0 },
    ],
  },
  {
    label: '3주',
    total: 23.5,
    days: [
      { label: '월', distance: 0 },
      { label: '화', distance: 7.5 },
      { label: '수', distance: 4.2 },
      { label: '목', distance: 0 },
      { label: '금', distance: 6.8 },
      { label: '토', distance: 5.0 },
      { label: '일', distance: 0 },
    ],
  },
  {
    label: '4주',
    total: 21.8,
    days: [
      { label: '월', distance: 5.5 },
      { label: '화', distance: 0 },
      { label: '수', distance: 7.2 },
      { label: '목', distance: 4.6 },
      { label: '금', distance: 0 },
      { label: '토', distance: 4.5 },
      { label: '일', distance: 0 },
    ],
  },
])

const monthlyMaxDistance = computed(() => {
  const all = monthlyWeeks.value.flatMap((w) => w.days.map((d) => d.distance))
  return Math.max(...all) || 1
})

// 3월 전체 일별 데이터 (실제로는 API)
const allPeriodData = [
  { date: '2026-03-01', label: '3/1', day: '토', distance: 5.2 },
  { date: '2026-03-02', label: '3/2', day: '일', distance: 0 },
  { date: '2026-03-03', label: '3/3', day: '월', distance: 3.1 },
  { date: '2026-03-04', label: '3/4', day: '화', distance: 7.8 },
  { date: '2026-03-05', label: '3/5', day: '수', distance: 0 },
  { date: '2026-03-06', label: '3/6', day: '목', distance: 4.1 },
  { date: '2026-03-07', label: '3/7', day: '금', distance: 6.4 },
  { date: '2026-03-08', label: '3/8', day: '토', distance: 0 },
  { date: '2026-03-09', label: '3/9', day: '일', distance: 2.1 },
  { date: '2026-03-10', label: '3/10', day: '월', distance: 5.5 },
  { date: '2026-03-11', label: '3/11', day: '화', distance: 8.0 },
  { date: '2026-03-12', label: '3/12', day: '수', distance: 0 },
  { date: '2026-03-13', label: '3/13', day: '목', distance: 4.8 },
  { date: '2026-03-14', label: '3/14', day: '금', distance: 3.2 },
  { date: '2026-03-15', label: '3/15', day: '토', distance: 6.1 },
  { date: '2026-03-16', label: '3/16', day: '일', distance: 0 },
  { date: '2026-03-17', label: '3/17', day: '월', distance: 5.1 },
  { date: '2026-03-18', label: '3/18', day: '화', distance: 7.3 },
  { date: '2026-03-19', label: '3/19', day: '수', distance: 0 },
  { date: '2026-03-20', label: '3/20', day: '목', distance: 4.5 },
  { date: '2026-03-21', label: '3/21', day: '금', distance: 6.8 },
  { date: '2026-03-22', label: '3/22', day: '토', distance: 0 },
  { date: '2026-03-23', label: '3/23', day: '일', distance: 3.9 },
  { date: '2026-03-24', label: '3/24', day: '월', distance: 5.6 },
  { date: '2026-03-25', label: '3/25', day: '화', distance: 7.1 },
  { date: '2026-03-26', label: '3/26', day: '수', distance: 0 },
  { date: '2026-03-27', label: '3/27', day: '목', distance: 4.3 },
  { date: '2026-03-28', label: '3/28', day: '금', distance: 6.0 },
  { date: '2026-03-29', label: '3/29', day: '토', distance: 0 },
  { date: '2026-03-30', label: '3/30', day: '일', distance: 2.8 },
  { date: '2026-03-31', label: '3/31', day: '월', distance: 5.4 },
]

const periodChartData = computed(() => {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const dataMap = Object.fromEntries(allPeriodData.map((d) => [d.date, d]))
  const result = []
  const cur = new Date(appliedFrom.value)
  const end = new Date(appliedTo.value)
  while (cur <= end) {
    const y = cur.getFullYear()
    const m = cur.getMonth() + 1
    const d = cur.getDate()
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    result.push(
      dataMap[dateStr] ?? {
        date: dateStr,
        label: `${m}/${d}`,
        day: dayNames[cur.getDay()],
        distance: 0,
      },
    )
    cur.setDate(cur.getDate() + 1)
  }
  return result
})

const periodStats = computed(() => {
  const data = periodChartData.value
  const totalDistance = +data.reduce((s, d) => s + d.distance, 0).toFixed(1)
  const count = data.filter((d) => d.distance > 0).length
  const totalMin = Math.round(totalDistance * 6.08)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return {
    totalDistance,
    count,
    avgPace: count > 0 ? '6\'05"' : '-',
    totalTime: h > 0 ? `${h}시간 ${m}분` : `${m}분`,
  }
})

const periodMaxDistance = computed(() => {
  const max = Math.max(...periodChartData.value.map((d) => d.distance))
  return max || 1
})

const periodYTicks = computed(() => {
  const max = periodMaxDistance.value
  return [max, max * 0.75, max * 0.5, max * 0.25, 0].map((v) =>
    v === 0 ? '0' : Number(v.toFixed(1)),
  )
})

const chartData = computed(() => weeklyChartData.value)

const chartTitle = computed(() => {
  if (activeTab.value === 'week') return '주별 거리 막대 차트'
  if (activeTab.value === 'month') return '달별 거리 막대 차트'
  return '기간별 거리 막대 차트'
})

const maxDistance = computed(() => {
  const max = Math.max(...chartData.value.map((d) => d.distance))
  return max || 1
})

const yTicks = computed(() => {
  const max = maxDistance.value
  return [max, max * 0.75, max * 0.5, max * 0.25, 0].map((v) =>
    v === 0 ? '0' : Number(v.toFixed(1)),
  )
})

// ── 친구 기록 ─────────────────────────────────────────────
const friendRecords = ref([
  { id: 1, nickname: '친구A', profileImage: null, distance: 18.2 },
  { id: 2, nickname: '친구B', profileImage: null, distance: 12.0 },
  { id: 3, nickname: '친구C', profileImage: null, distance: 9.5 },
  { id: 4, nickname: '친구D', profileImage: null, distance: 8.3 },
  { id: 5, nickname: '친구E', profileImage: null, distance: 7.1 },
  { id: 6, nickname: '친구F', profileImage: null, distance: 6.8 },
  { id: 7, nickname: '친구G', profileImage: null, distance: 5.9 },
  { id: 8, nickname: '친구H', profileImage: null, distance: 5.2 },
  { id: 9, nickname: '친구I', profileImage: null, distance: 4.7 },
  { id: 10, nickname: '친구J', profileImage: null, distance: 3.9 },
  { id: 11, nickname: '친구K', profileImage: null, distance: 3.1 },
  { id: 12, nickname: '친구L', profileImage: null, distance: 2.5 },
  { id: 13, nickname: '친구M', profileImage: null, distance: 1.8 },
  { id: 14, nickname: '친구N', profileImage: null, distance: 1.2 },
  { id: 15, nickname: '친구O', profileImage: null, distance: 0.8 },
])

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

onMounted(() => {
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
  if (activeTab.value === 'week') return '친구 이번 주 기록'
  if (activeTab.value === 'month') return '친구 이번 달 기록'
  return '친구 기간 내 기록'
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
          <h2 class="friends-title">{{ friendPanelTitle }}</h2>
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
            <li v-for="friend in visibleFriends" :key="friend.id" class="friends-item">
              <div class="friend-avatar">
                <img v-if="friend.profileImage" :src="friend.profileImage" :alt="friend.nickname" />
                <svg
                  v-else
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94a3b8"
                  stroke-width="1.8"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
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
