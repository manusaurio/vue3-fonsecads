import {
  createRouter,
  createWebHistory,
  RouteRecordRaw,
  RouteLocationNormalized,
  NavigationGuardNext,
} from 'vue-router';
import store from '@/store';
import { LoadingBar } from 'quasar';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: { name: 'map' },
  },
  {
    path: '/map',
    name: 'map',
    redirect: { name: 'exploration-view' },
    component: () => import('../components/MapCore.vue'),
    children: [
      {
        path: 'e/:coord?',
        name: 'exploration-view',
        components: {
          'inside-map': () => import('../views/ExplorationView/InsideView.vue'),
          'after-map': () => import('../views/ExplorationView/AfterView.vue'),
        },
      },
      {
        path: 'detail',
        name: 'detail-view',
        components: {
          'inside-map': () => import('../views/PostDetailView/InsideView.vue'),
          'after-map': () => import('../views/PostDetailView/AfterView.vue'),
        },
      },
      {
        path: 'locate',
        name: 'locate-view',
        components: {
          'inside-map': () => import('../views/PlacementView/InsideView.vue'),
          'after-map': () => import('../views/PlacementView/AfterView.vue'),
        },
        beforeEnter: (to) => {
          try {
            BigInt(`0x${to.query.msg}`);
            return true;
          } catch (e) {
            return { name: 'map' };
          }
        },
      },
    ],
  },
  {
    path: '/compose',
    name: 'compose',
    component: () => import('../views/ComposeView.vue'),
    beforeEnter: () => {
      LoadingBar.stop();
      return (store.mapMeta.getLastPoint() !== undefined) || { name: 'map' };
    },
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach(
  (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext,
  ) => {
    if (from.name !== to.name) LoadingBar.start();
    next();
  },
);

router.beforeResolve(
  (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext,
  ) => {
    if (from.name !== to.name) LoadingBar.stop();
    next();
  },
);

export default router;
