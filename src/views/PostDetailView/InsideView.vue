<template>
  <ol-vector-layer>
    <ol-source-vector>
      <ol-feature v-if="state.currentCoord">
        <ol-geom-point :coordinates="state.currentCoord" />
          <ol-style>
            <ol-style-circle :radius="10">
              <ol-style-fill :color="'rgb(50, 0, 200, 0.5)'"/>
              <ol-style-stroke :color="'rgb(50, 0, 200, 0.2)'"
                               :width="5"
                               />
            </ol-style-circle>
          </ol-style>
      </ol-feature>
    </ol-source-vector>
  </ol-vector-layer>
</template>

<script setup="setup" lang="ts">
import {
  inject,
  onMounted,
  watch,
  Ref,
} from 'vue';
import { View } from 'ol';
import { easeOut } from 'ol/easing';

import { state } from './common';

const viewRef = inject<Ref<View>>('viewRef') as Ref<View>;

const slideToPoint = (center: [number, number]) => {
  viewRef.value.animate({
    center,
    zoom: 3,
    duration: 300,
    easing: easeOut,
  });
};

onMounted(() => {
  watch(() => state.currentCoord, () => {
    if (state.currentCoord) {
      slideToPoint(state.currentCoord);
    }
  });

  if (state.currentCoord) slideToPoint(state.currentCoord);
});
</script>
