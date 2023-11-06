<template>
  <div class="shadow-up-6 q-pa-md z-top">
    <h2 class="text-subtitle1 no-margin text-weight-medium">
      Elige el punto de publicación
    </h2>
    <span class="text-caption text-italic text-grey-9">
      {{ msg }}
    </span>

    <div class="q-my-md q-gutter-x-sm" style="display: flex; justify-content: flex-end">
      <q-btn outline color="primary" label="Cancelar" @click="$router.go(-1)" />
      <q-btn
        :disabled="state.chosenCoordinates === undefined"
        color="primary" label="Enviar" @click="submit" />
    </div>
  </div>
</template>

<script setup="setup" lang="ts">
import { useRoute, useRouter } from 'vue-router';
import {
  inject,
  onBeforeMount,
  onMounted,
  onUnmounted,
} from 'vue';
import type { Ref } from 'vue';
import type RenderEvent from 'ol/render/Event';
import type { Layer } from 'ol/layer';
import type {
  Map as OLMap,
  View,
} from 'ol';

import type { FloorMeta } from '@/MapMeta';
import { RateablePost, remote } from '@/core/API';
import { Message } from '@/core/Message';
import store from '@/store';
import postRenderCircle from '../postRenderCircle';
import { state } from './common';

const route = useRoute();
const router = useRouter();
const mapRef = inject<Ref<{ map: OLMap }>>('mapRef') as Ref<{map: OLMap }>;
const currentLayer = inject('currentLayer') as Ref<FloorMeta>;
const imageLayerRef = inject('imageLayerRef') as Ref<{ imageLayer: Layer }>;
const viewRef = inject<Ref<View>>('viewRef') as Ref<View>;
const msgQuery = route.query.msg;
const msg: Message | undefined = (() => {
  try {
    const candidateMsg = Message.fromString(`0x${msgQuery}`);
    return candidateMsg.isValid() ? candidateMsg : undefined;
  } catch (e) {
    return undefined;
  }
})();
const postableRadius: number = store.getPostableRadius();
let renderCircle: (e: RenderEvent) => void;

const submit = () => {
  if (!state.chosenCoordinates || msg === undefined) return;

  const [x, y] = state.chosenCoordinates;
  const [lat, long] = store.mapMeta.pixelsToDegrees(x, y);

  remote.postMessage(
    {
      lat,
      long,
      level: currentLayer.value.level,
    },
    msg,
  ).then((p: RateablePost) => store.posts.set(p.id, p))
    .then(() => console.log(store.posts))
    .finally(() => router.push({ name: 'map' }));
};

// XXX: This does not prevent the component from being mounted/unmounted
//  use a route guard instead
onBeforeMount(() => {
  state.origin = store.mapMeta.getLastPointInPixels();

  if (!state.origin) router.push({ name: 'map' });
});

onMounted(() => {
  state.radius = postableRadius;
  renderCircle = postRenderCircle(
    mapRef.value.map,
    viewRef.value,
    postableRadius,
    'rgba(20, 20, 20, 0.8)',
    () => state.origin,
  );

  imageLayerRef.value.imageLayer.on('postrender', renderCircle);
});

onUnmounted(() => {
  imageLayerRef.value.imageLayer.un('postrender', renderCircle);
  state.chosenCoordinates = undefined;
  state.origin = undefined;
  state.radius = undefined;
});
</script>
