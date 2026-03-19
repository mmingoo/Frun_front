<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// ── 탭 ────────────────────────────────────────────────────
const activeTab = ref('week') // 'week' | 'month' | 'period'

// ── 기간별 날짜 ───────────────────────────────────────────
const periodFrom = ref('2026-03-01')
const periodTo = ref('2026-03-17')

// ── 목 데이터 ──────────────────────────────────────────────
const weekStats = ref({
  totalDistance: 23.5,
  count: 4,
  avgPace: "6'02\"",
  totalTime: '3시간 52분',
})

const monthStats = ref({
  totalDistance: 87.3,
  count: 14,
  avgPace: "6'10\"",
  totalTime: '14시간 28분',
})

const periodStats = ref({
  totalDistance: 45.0,
  count: 8,
  avgPace: "6'05\"",
  totalTime: '7시간 18분',
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

const monthlyChartData = ref([
  { label: '1주', distance: 18.5 },
  { label: '2주', distance: 23.5 },
  { label: '3주', distance: 23.5 },
  { label: '4주', distance: 21.8 },
])

const periodChartData = ref([
  { label: '3/1', distance: 5.2 },
  { label: '3/4', distance: 7.8 },
  { label: '3/7', distance: 4.1 },
  { label: '3/10', distance: 6.4 },
  { label: '3/13', distance: 5.5 },
  { label: '3/16', distance: 8.0 },
  { label: '3/17', distance: 8.0 },
])

const chartData = computed(() => {
  if (activeTab.value === 'week') return weeklyChartData.value
  if (activeTab.value === 'month') return monthlyChartData.value
  return periodChartData.value
})

const chartTitle = computed(() => {
  if (activeTab.value === 'week') return '주별 거리 막대 차트'
  if (activeTab.value === 'month') return '월별 거리 막대 차트'
  return '기간별 거리 막대 차트'
})

const maxDistance = computed(() => {
  const max = Math.max(...chartData.value.map((d) => d.distance))
  return max || 1
})

// ── 친구 기록 ─────────────────────────────────────────────
const friendRecords = ref([
  { id: 2, nickname: '친구A', profileImage: null, distance: 18.2 },
  { id: 3, nickname: '친구B', profileImage: null, distance: 12.0 },
  { id: 4, nickname: '친구C', profileImage: null, distance: 9.5 },
])

const friendPanelTitle = computed(() => {
  if (activeTab.value === 'week') return '친구 이번 주 기록'
  if (activeTab.value === 'month') return '친구 이번 달 기록'
  return '친구 기간 내 기록'
})
</script>

<template>
  <div class="page-wrap">
    <!-- ── 네비게이션 바 ── -->
    <header class="navbar">
      <button class="nav-logo" @click="router.push('/feed')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0"/>
          <path d="M7.5 15.5 9 11l3 2 2-5"/>
          <path d="M4 19l3.5-3.5"/>
        </svg>
        <span class="nav-brand">Frun</span>
      </button>
      <div class="nav-actions">
        <button class="nav-item" @click="router.push('/feed')">홈</button>
        <button class="nav-item active" @click="router.push('/stats')">동계</button>
        <button class="nav-item" @click="router.push('/friends')">친구</button>
        <button class="nav-icon-btn" @click="router.push('/notifications')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>
        <button class="nav-btn-my" @click="router.push('/mypage')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          MY
        </button>
      </div>
    </header>

    <!-- ── 메인 콘텐츠 ── -->
    <div class="main-wrap">

      <!-- 탭 + 기간 선택 -->
      <div class="tab-bar">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'week' }"
          @click="activeTab = 'week'"
        >주별</button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'month' }"
          @click="activeTab = 'month'"
        >전별</button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'period' }"
          @click="activeTab = 'period'"
        >기간별</button>

        <div v-if="activeTab === 'period'" class="period-picker">
          <input type="date" v-model="periodFrom" class="date-input" />
          <span class="period-sep">~</span>
          <input type="date" v-model="periodTo" class="date-input" />
          <button class="period-search-btn">조회</button>
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
            <!-- SVG 막대 차트 -->
            <div class="bar-chart">
              <div
                v-for="item in chartData"
                :key="item.label"
                class="bar-col"
              >
                <span class="bar-value">{{ item.distance > 0 ? item.distance : '' }}</span>
                <div class="bar-wrap">
                  <div
                    class="bar"
                    :style="{ height: (item.distance / maxDistance) * 140 + 'px' }"
                  />
                </div>
                <span class="bar-label">{{ item.label }}</span>
              </div>
            </div>
            <p class="chart-placeholder-text">[{{ chartTitle }}]</p>
          </div>
        </div>

        <!-- 친구 기록 -->
        <div class="friends-card">
          <h2 class="friends-title">{{ friendPanelTitle }}</h2>
          <ul class="friends-list">
            <li
              v-for="friend in friendRecords"
              :key="friend.id"
              class="friends-item"
            >
              <div class="friend-avatar">
                <img v-if="friend.profileImage" :src="friend.profileImage" :alt="friend.nickname" />
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <span class="friend-name">{{ friend.nickname }}</span>
              <span class="friend-dist">{{ friend.distance }} km</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── 전체 ── */
.page-wrap {
  min-height: 100vh;
  background: #f7f8fc;
}

/* ── 네비게이션 바 ── */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  height: 52px;
  background: #fff;
  border-bottom: 1px solid #edf0f7;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 7px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.nav-brand {
  font-size: 18px;
  font-weight: 800;
  color: #3b5bdb;
  letter-spacing: -0.5px;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-item {
  padding: 6px 14px;
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #718096;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.nav-item:hover,
.nav-item.active {
  color: #3b5bdb;
  background: #eef2ff;
  font-weight: 600;
}

.nav-icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: #718096;
  border-radius: 8px;
  transition: all 0.2s;
  margin-left: 2px;
}

.nav-icon-btn:hover {
  color: #3b5bdb;
  background: #eef2ff;
}

.nav-btn-my {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 34px;
  padding: 0 14px;
  background: #3b5bdb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  margin-left: 4px;
}

.nav-btn-my:hover {
  background: #2f4ac7;
}

/* ── 메인 래퍼 ── */
.main-wrap {
  max-width: 1080px;
  margin: 0 auto;
  padding: 28px 20px 60px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── 탭 ── */
.tab-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 7px 22px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: #718096;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #3b5bdb;
  border-color: #3b5bdb;
  color: #fff;
  font-weight: 700;
}

.tab-btn:hover:not(.active) {
  border-color: #3b5bdb;
  color: #3b5bdb;
  background: #eef2ff;
}

/* ── 기간 선택 ── */
.period-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.period-picker-placeholder {
  margin-left: auto;
}

.date-input {
  height: 38px;
  padding: 0 12px;
  border: 1.5px solid #dde3ed;
  border-radius: 10px;
  font-size: 13px;
  font-family: inherit;
  color: #1a1a2e;
  background: #fff;
  outline: none;
  transition: border-color 0.2s;
}

.date-input:focus {
  border-color: #3b5bdb;
}

.period-sep {
  font-size: 14px;
  color: #94a3b8;
  font-weight: 500;
}

.period-search-btn {
  height: 38px;
  padding: 0 18px;
  background: #3b5bdb;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.period-search-btn:hover {
  background: #2f4ac7;
}

/* ── 요약 통계 행 ── */
.summary-row {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #edf0f7;
  border-radius: 16px;
  padding: 20px 32px;
  gap: 0;
}

.summary-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.summary-label {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.2px;
  text-align: center;
}

.summary-value {
  font-size: 20px;
  font-weight: 800;
  color: #1a1a2e;
  letter-spacing: -0.5px;
}

.summary-divider {
  width: 1px;
  height: 36px;
  background: #edf0f7;
  flex-shrink: 0;
}

/* ── 콘텐츠 그리드 ── */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 20px;
  align-items: start;
}

/* ── 차트 카드 ── */
.chart-card {
  background: #fff;
  border: 1px solid #edf0f7;
  border-radius: 16px;
  padding: 24px;
  min-height: 240px;
}

.chart-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

/* ── 막대 차트 ── */
.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  width: 100%;
  height: 180px;
  padding: 0 12px;
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
  justify-content: flex-end;
}

.bar-value {
  font-size: 11px;
  font-weight: 700;
  color: #3b5bdb;
  min-height: 16px;
}

.bar-wrap {
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  flex: 1;
}

.bar {
  width: 100%;
  max-width: 48px;
  background: linear-gradient(180deg, #5c7cfa 0%, #3b5bdb 100%);
  border-radius: 6px 6px 3px 3px;
  min-height: 0;
  transition: height 0.4s ease;
}

.bar-label {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
}

.chart-placeholder-text {
  font-size: 13px;
  color: #b0b9c8;
  margin: 0;
}

/* ── 친구 기록 카드 ── */
.friends-card {
  background: #fff;
  border: 1px solid #edf0f7;
  border-radius: 16px;
  padding: 20px 18px;
}

.friends-title {
  font-size: 13px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 14px;
}

.friends-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.friends-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #f7f8fc;
  cursor: pointer;
  transition: background 0.15s;
}

.friends-item:hover {
  background: #eef2ff;
}

.friend-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #edf0f7;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.friend-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.friend-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #2d3748;
}

.friend-dist {
  font-size: 13px;
  font-weight: 700;
  color: #3b5bdb;
}

/* ── 반응형 ── */
@media (max-width: 760px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .summary-row {
    padding: 16px 16px;
    gap: 0;
  }

  .summary-value {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .main-wrap {
    padding: 18px 14px 40px;
  }

  .navbar {
    padding: 0 16px;
  }

  .summary-row {
    flex-wrap: wrap;
    gap: 12px;
  }

  .summary-divider {
    display: none;
  }

  .summary-item {
    min-width: 45%;
  }
}
</style>
