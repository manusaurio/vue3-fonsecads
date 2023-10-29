<template>
  <ol-vector-layer>
    <ol-source-vector v-if="state.origin && state.radius">
      <ol-feature>
        <ol-geom-circle :center="state.origin" :radius="state.radius"></ol-geom-circle>
        <ol-style>
          <ol-style-fill color="#0000ff11"></ol-style-fill>
          <ol-style-stroke
            color="#0000ff44"
            :width="10.0"
            />
        </ol-style>
      </ol-feature>

      <ol-feature v-if="state.chosenCoordinates">
        <ol-geom-point :coordinates="state.chosenCoordinates" />
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
import { MapBrowserEvent } from 'ol';
import type { Map as OLMap } from 'ol';
import { inject, onMounted, onUnmounted } from 'vue';
import type { Ref } from 'vue';

import store from '@/store';
import { dist } from '@/math-utils';
import { state } from './common';

const mapRef = inject<Ref<{ map: OLMap }>>('mapRef') as Ref<{map: OLMap }>;

const click = (e: MapBrowserEvent<UIEvent>) => {
  if (
    !state?.origin || state.origin[0] === undefined || state.origin[1] === undefined
      || !state?.radius
  ) return;

  const { origin }: [number, number] = state;
  const { radius }: number = state;
  const coordinate = e.coordinate as [number, number];

  const isWithinTheMap = store.mapMeta.userZone.intersectsCoordinate(coordinate);

  if (dist(origin, coordinate) < radius && isWithinTheMap) {
    state.chosenCoordinates = coordinate;
  }
};

onMounted(() => {
  mapRef.value.map.on('click', click);
});

onUnmounted(() => {
  mapRef.value.map.un('click', click);
});
</script>
