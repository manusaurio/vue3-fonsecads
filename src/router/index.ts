import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import store from '@/store';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: { name: 'map' },
  },
  {
    path: '/map/:coord?',
    name: 'map',
    component: () => import('../views/MapView.vue'),
  },
  {
    path: '/view',
    name: 'message-list',
    component: () => import('../views/MessageList.vue'),
  },
  {
    path: '/compose/locate',
    name: 'locate',
    component: () => import('../views/PlacementView.vue'),
    beforeEnter: (to) => {
      try {
        BigInt(`0x${to.query.msg}`);
        return true;
      } catch (e) {
        return { name: 'map' };
      }
    },
  },
  {
    path: '/compose',
    name: 'compose',
    component: () => import('../views/ComposeView.vue'),
    beforeEnter: () => !(store.mapMeta.getLastPoint() === undefined) || { name: 'map' },
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
