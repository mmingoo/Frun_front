import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '@/views/fo/auth/LandingView.vue'
import SetNickname from '@/views/fo/auth/SetNickname.vue'
import WriteRunning from '@/views/fo/running/WriteRunning.vue'
import EditRunning from '@/views/fo/running/EditRunning.vue'
import FeedView from '@/views/fo/feed/FeedView.vue'
import RunningDetail from '@/views/fo/feed/RunningDetail.vue'
import StatsView from '@/views/fo/stats/StatsView.vue'
import FriendsView from '@/views/fo/friends/FriendsView.vue'
import NotificationsView from '@/views/fo/notifications/NotificationsView.vue'
import MyPageView from '@/views/fo/mypage/MyPageView.vue'
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
      path: '/signup/nickname',
      name: 'SetNickname',
      component: SetNickname,
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
  ],
})

// 모든 페이지 이동 전에 실행
router.beforeEach(async (to) => {
  // / 는 LandingView에서 자체적으로 토큰 체크 후 리다이렉트 처리
  if (to.path === '/') return true

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

  // /signup/nickname은 로그인은 됐지만 닉네임 없는 유저만 접근 가능
  if (to.path === '/signup/nickname') {
    return auth.hasNickname ? '/feed' : true
  }

  if (!auth.hasNickname) return '/signup/nickname'
})

export default router
