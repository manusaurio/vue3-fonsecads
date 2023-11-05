<template>
  <!-- rendering condition so messageChanged doesn't get triggered after populating -->
  <!-- (we're populating `posts` from the route querys AND THEN mounting the component) -->
  <MessageViewer v-if="posts.length > 0"
                 :posts="posts"
                 :exit-function="() => router.push({ name: 'map' })"
                 emit-change-on-mounted
                 style="height: 50%; max-height: 300px"
                 @messageChanged="messageChanged"
    />
</template>
<script setup="setup" lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  ref,
  inject,
} from 'vue';
import type { Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import MessageViewer from '@/components/MessageViewer.vue';
import store from '@/store';
import { RateablePost } from '@/core/API';
import { dist } from '@/math-utils';
import { FloorMeta } from '@/MapMeta';
import { state } from './common';

const currentLayer = inject<Ref<FloorMeta>>('currentLayer');
const lastUserCoordPixels = store.mapMeta.getLastPointInPixels();
const radius = store.getPostableRadius();
const route = useRoute();
const router = useRouter();
const posts = ref<RateablePost[]>([]);
state.currentCoord = undefined;

const messageChanged = (post: RateablePost) => {
  const { lat, long } = post.location;
  const coord = store.mapMeta.degreesToPixels(lat, long);
  state.currentCoord = coord;
};

const withinRange = (post: RateablePost) => {
  if (!lastUserCoordPixels) return false;

  const { lat, long } = post.location;
  const postCoord = store.mapMeta.degreesToPixels(lat, long);
  return post.location.floor === currentLayer?.value.level
        && dist(lastUserCoordPixels, postCoord) < radius;
};

onMounted(() => {
  const database = store.posts;
  const idsParam = route.query.ids;
  const ids: Array<number> | undefined = typeof idsParam === 'string'
    && idsParam?.split('.')
      .filter((s) => s !== '')
      .map(Number)
      .filter(Number.isFinite)
    || undefined;

  if (ids !== undefined && ids.length > 0) {
    posts.value = ids.map((id) => database.get(id))
      .filter((p) => p !== undefined && withinRange(p));
  }

  if (posts.value.length === 0) router.push({ name: 'map' });
});

onBeforeUnmount(() => {
  state.currentCoord = undefined;
});
</script>
