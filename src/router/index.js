import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '@/views/fo/auth/LandingView.vue'
import SetNickname from '@/views/fo/auth/SetNickname.vue'
import WriteRunning from '@/views/fo/running/WriteRunning.vue'
import FeedView from '@/views/fo/feed/FeedView.vue'
import RunningDetail from '@/views/fo/feed/RunningDetail.vue'
import StatsView from '@/views/fo/stats/StatsView.vue'
import FriendsView from '@/views/fo/friends/FriendsView.vue'
import NotificationsView from '@/views/fo/notifications/NotificationsView.vue'
import MyPageView from '@/views/fo/mypage/MyPageView.vue'

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
      path: '/feed/:id',
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

export default router
