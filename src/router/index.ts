import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/map',
    name: 'map',
    component: () => import(/* webpackChunkName: "map" */ '../views/MapView.vue'),
  },
  {
    path: '/compose/locate',
    name: 'locate',
    component: () => import('../views/PlacementView.vue'),
  },
  {
    path: '/compose',
    name: 'compose',
    component: () => import('../views/ComposeView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
