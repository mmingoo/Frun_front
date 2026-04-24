import { createRouter, createWebHistory } from 'vue-router'
import NotFoundView from '@/views/fo/error/NotFoundView.vue'
import LandingView from '@/views/fo/auth/LandingView.vue'
import SetNickname from '@/views/fo/auth/SetNickname.vue'
import TermsView from '@/views/fo/auth/TermsView.vue'
import InactiveView from '@/views/fo/auth/InactiveView.vue'
import WriteRunning from '@/views/fo/running/WriteRunning.vue'
import EditRunning from '@/views/fo/running/EditRunning.vue'
import FeedView from '@/views/fo/feed/FeedView.vue'
import RunningDetail from '@/views/fo/feed/RunningDetail.vue'
import StatsView from '@/views/fo/stats/StatsView.vue'
import FriendsView from '@/views/fo/friends/FriendsView.vue'
import NotificationsView from '@/views/fo/notifications/NotificationsView.vue'
import MyPageView from '@/views/fo/mypage/MyPageView.vue'
import SettingsView from '@/views/fo/settings/SettingsView.vue'
import SettingsNicknameView from '@/views/fo/settings/SettingsNicknameView.vue'
import SettingsDeactivateView from '@/views/fo/settings/SettingsDeactivateView.vue'
import SettingsTermsView from '@/views/fo/settings/SettingsTermsView.vue'
import NoticeDetailView from '@/views/fo/notice/NoticeDetailView.vue'
import NoticeListView from '@/views/fo/notice/NoticeListView.vue'
import api from '@/api/index.js'
import { useAuthStore } from '@/stores/auth.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'LandingView',
      component: LandingView,
    },
    {
      path: '/signup/terms',
      name: 'TermsView',
      component: TermsView,
    },
    {
      path: '/signup/nickname',
      name: 'SetNickname',
      component: SetNickname,
    },
    {
      path: '/inactive',
      name: 'InactiveView',
      component: InactiveView,
    },
    {
      path: '/feed',
      name: 'FeedView',
      component: FeedView,
    },
    {
      path: '/running/write',
      name: 'WriteRunning',
      component: WriteRunning,
    },
    {
      path: '/running/edit/:runningLogId/:authorId',
      name: 'EditRunning',
      component: EditRunning,
    },
    {
      path: '/feed/:runningLogId/:authorId',
      name: 'RunningDetail',
      component: RunningDetail,
    },
    {
      path: '/stats',
      name: 'StatsView',
      component: StatsView,
    },
    {
      path: '/friends',
      name: 'FriendsView',
      component: FriendsView,
    },
    {
      path: '/notifications',
      name: 'NotificationsView',
      component: NotificationsView,
    },
    {
      path: '/mypage',
      name: 'MyPageView',
      component: MyPageView,
    },
    {
      path: '/mypage/:id',
      name: 'FriendPageView',
      component: MyPageView,
    },
    {
      path: '/settings',
      name: 'SettingsView',
      component: SettingsView,
    },
    {
      path: '/settings/nickname',
      name: 'SettingsNicknameView',
      component: SettingsNicknameView,
    },
    {
      path: '/settings/deactivate',
      name: 'SettingsDeactivateView',
      component: SettingsDeactivateView,
    },
    {
      path: '/settings/terms',
      name: 'SettingsTermsView',
      component: SettingsTermsView,
    },
    {
      path: '/notices',
      name: 'NoticeListView',
      component: NoticeListView,
    },
    {
      path: '/notices/:noticeId',
      name: 'NoticeDetailView',
      component: NoticeDetailView,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFoundView',
      component: NotFoundView,
    },
  ],
})

// 모든 페이지 이동 전에 실행
router.beforeEach(async (to) => {
  // /inactive, NotFoundView 는 가드 없이 통과
  if (to.path === '/inactive') return true
  if (to.name === 'NotFoundView') return true

  // 비활성화 계정으로 강제 로그아웃된 경우 → API 호출 없이 랜딩 페이지 표시
  if (sessionStorage.getItem('_accountInactive')) {
    sessionStorage.removeItem('_accountInactive')
    return to.path === '/' ? true : '/'
  }

  // refreshToken 만료로 강제 로그아웃된 경우 → API 호출 없이 랜딩 페이지 표시
  if (sessionStorage.getItem('_refreshExpired')) {
    sessionStorage.removeItem('_refreshExpired')
    return to.path === '/' ? true : '/'
  }

  // / 는 로그인 상태면 feed로, 아니면 LandingView
  if (to.path === '/') {
    const auth = useAuthStore()
    if (auth.hasNickname === null) {
      try {
        const res = await api.get('/api/v1/users/me/nickname-status')
        auth.hasNickname = res.data.data.hasNickname
      } catch {
        return true // 미로그인 → LandingView 표시
      }
    }
    if (auth.hasNickname) return '/feed'
    return true
  }

  //store 에서 hasNickname 확인
  const auth = useAuthStore()

  // 아직 모르는 상태면 닉네임이 있는지 없는지 여부를 반환하는 api 실행
  if (auth.hasNickname === null) {
    try {
      const res = await api.get('/api/v1/users/me/nickname-status')
      auth.hasNickname = res.data.data.hasNickname
    } catch {
      return '/'
    }
  }

  // /signup/terms, /signup/nickname은 닉네임 없는 유저만 접근 가능
  if (to.path === '/signup/terms' || to.path === '/signup/nickname') {
    if (auth.hasNickname) return '/feed'
    // 약관 동의 없이 닉네임 설정 페이지에 직접 접근하면 약관 화면으로 이동
    if (to.path === '/signup/nickname' && !auth.termsAgreed) return '/signup/terms'
    return true
  }

  if (!auth.hasNickname) return '/signup/terms'
})

export default router
