<template>
  <ol-vector-layer>
    <ol-source-vector>
      <ol-feature
        v-for="msg in farawayMessages.values()"
        :key="msg.id" :properties="{ msg }">
        <ol-geom-point :coordinates="getPixelsPositionFromPost(msg)"></ol-geom-point>
      </ol-feature>
    </ol-source-vector>

    <ol-style>
      <ol-style-text
        text="?"
        font="2em/0.8 roboto"
        >
        <ol-style-stroke color="#ffffffac" :width="6"></ol-style-stroke>
      </ol-style-text>
    </ol-style>
  </ol-vector-layer>

  <ol-vector-layer className="fds-ol-selectable">
    <ol-source-cluster :distance="50">
      <ol-source-vector>
        <ol-feature
          v-for="msg in nearbyMessages.values()"
          :key="msg.id" :properties="{ msg }">
          <ol-geom-point :coordinates="getPixelsPositionFromPost(msg)"></ol-geom-point>
        </ol-feature>
      </ol-source-vector>
    </ol-source-cluster>

    <ol-style :overrideStyleFunction="overrideStyle">
      <ol-style-text
        scale="0.85"
        font="14px/0.85 roboto"
        >
        <ol-style-stroke color="#ffffff" :width="6"></ol-style-stroke>
      </ol-style-text>
    </ol-style>
  </ol-vector-layer>
</template>

<script setup="setup" lang="ts">
import {
  ref,
  Ref,
  watch,
  inject,
  onMounted,
  onUnmounted,
} from 'vue';
import type { Style } from 'ol/style';
import type Feature from 'ol/Feature';
import type { Layer } from 'ol/layer';
import type { FeatureLike } from 'ol/Feature';
import type { Map as OLMap, MapBrowserEvent } from 'ol/';

import type { FloorMeta } from '@/MapMeta';
import { ReadablePost, SpatialPoint } from '@/core/API';
import { dist } from '@/math-utils';
import store from '@/store';

const props = defineProps<{
  pixelLocation: [number, number] | undefined,
}>();

const emit = defineEmits(['clusterClicked']);
const mapRef = inject<Ref<{ map: OLMap }>>('mapRef');
const currentLayer = inject<Ref<FloorMeta>>('currentLayer');
const farawayMessages = ref<Set<ReadablePost>>(new Set());
const nearbyMessages = ref<Set<ReadablePost>>(new Set());

const compPixelsSpatial = (sp: SpatialPoint): [number, number] => {
  const { lat, long } = sp;
  const [x, y] = store.mapMeta.degreesToPixels(lat, long);
  return [x, y];
};

const getPixelsPositionFromPost = (() => {
  const cachedPos: Map<number, [number, number]> = new Map();

  return (message: ReadablePost): [number, number] => {
    const { id } = message;
    const pPos = cachedPos.get(id) ?? compPixelsSpatial(message.location);
    cachedPos.set(id, pPos);

    return pPos;
  };
})();

watch(
  [store.posts, () => props.pixelLocation, currentLayer],
  () => {
    const fMsgs = farawayMessages.value;
    const nMsgs = nearbyMessages.value;
    fMsgs.clear();
    nMsgs.clear();

    if (!props.pixelLocation) return;
    for (const post of store.posts.values()) {
      // console.log(post.location.floor);
      if (post.location.level === currentLayer?.value.level) {
        const msgPos = getPixelsPositionFromPost(post);

        if (dist(msgPos, props.pixelLocation) < store.getPostableRadius()) nMsgs.add(post);
        else fMsgs.add(post);
      }
    }
  },
  {
    deep: true,
    immediate: true,
  },
);

// https://stackoverflow.com/a/51506718/11601118 (edited Dec 17, 2020 at 14:11)
const wrap = (s: string) => s.replace(/(?![^\n]{1,24}$)([^\n]{1,24})\s/g, '$1\n');

const overrideStyle = (feature: Feature, style: Style) => {
  const clusteredFeatures = feature.get('features');
  const size = clusteredFeatures.length;
  const msg: ReadablePost = clusteredFeatures[0].get('msg');

  const shownText = wrap(msg.content.toString());

  style.getText().setText(
    size === 1
      ? shownText
      : `${shownText} (${size - 1}+)`,
  );
};

const clickOnMapEvent = (e: MapBrowserEvent<UIEvent>) => {
  let topCluster: FeatureLike | undefined;
  mapRef?.value?.map.forEachFeatureAtPixel(e.pixel, (cluster: FeatureLike, l: Layer) => {
    if (l.getClassName() === 'fds-ol-selectable') topCluster = cluster;
  });

  if (topCluster) {
    const posts = topCluster.get('features').map((f: Feature) => f.get('msg'));
    emit('clusterClicked', posts);
  }
};

onMounted(() => {
  mapRef?.value?.map.on('click', clickOnMapEvent);
});

onUnmounted(() => {
  mapRef?.value?.map.un('click', clickOnMapEvent);
});
</script>
