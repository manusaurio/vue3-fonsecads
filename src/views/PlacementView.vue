<template>
  <ol-map
    id="map-viewport"
    :loadTilesWhileAnimating="true"
    :loadTilesWhileInteracting="true"
    @singleclick="click"
  >
    <ol-view
      ref="view"
      :center="center"
      :rotation="rotation"
      constrainOnlyCenter="true"
      :zoom="zoom"
      :projection="projection"

      :zoomFactor="zoomFactor"
      :maxZoom="maxZoom"
      :minZoom="minZoom"

      :extent="extent"
    />
    <ol-zoom-control />

    <ol-image-layer>
      <ol-source-image-static
        :url="imgUrl"
        :projection="projection"
        :imageExtent="extent"></ol-source-image-static>
    </ol-image-layer>

    <ol-vector-layer>
      <ol-source-vector>
        <ol-feature>
          <ol-geom-circle :center="allowedOrigin" :radius="allowedRadius"></ol-geom-circle>
          <ol-style>
              <ol-style-fill color="#0000ff11"></ol-style-fill>
              <ol-style-stroke
                color="#0000ff44"
                :width="20.0"
              ></ol-style-stroke>
          </ol-style>
        </ol-feature>

        <ol-feature v-if="chosenCoordinates">
          <ol-geom-point :coordinates="chosenCoordinates"></ol-geom-point>
          <ol-style>
            <ol-style-icon :src="point" :anchor="[0.5, 1.0]" :scale="1.0"></ol-style-icon>
          </ol-style>
        </ol-feature>

      </ol-source-vector>
    </ol-vector-layer>

  </ol-map>

  <div class="shadow-up-3 q-pa-md"
    style="position: absolute;
              bottom: 0;
              right: 0;
              left: 0;

              background-color: white;
              ">
    <h2 class="text-subtitle1 no-margin no-padding text-weight-medium">
      Elige el punto de publicación
    </h2>
    <span class="text-caption text-italic text-grey-9">
      sé cauteloso con el arte multimedia, por sobre todo deja que haya música de cuerdas
    </span>

    <div class="q-my-md q-gutter-x-sm" style="display: flex; justify-content: flex-end">
      <q-btn outline color="primary" label="Cancelar" @click="algo" />
      <q-btn
        :disabled="chosenCoordinates === undefined"
        color="primary" label="Enviar" @click="whatever" />
    </div>
  </div>
</template>

<style>
#map-viewport {
  height: 100%;
}
</style>

<script setup lang="ts">
import { ref, reactive } from 'vue';

import point from '../assets/point.svg';

// eslint-disable-next-line
const imgUrl = ref(require('../assets/fonseca.jpg'));

const center = ref([0, 0]);
const rotation = ref(0);

const zoom = ref(2);
const zoomFactor = ref(3.0);
const minZoom = ref(1);
const maxZoom = ref(2);
const chosenCoordinates = ref<[number, number]>();

const allowedOrigin = ref([0, 0]);
const allowedRadius = ref(50);

const dist = (p1: [number, number], p2: [number, number]): number => {
  // how the f can i get a reference to the feature instance so i don't have to do this??
  const a = p1[0] - p2[0];
  const b = p1[1] - p2[1];

  return Math.sqrt(a ** 2 + b ** 2);
};

const click = (e) => {
  const origin: [number, number] = [allowedOrigin.value[0], allowedOrigin.value[1]];

  if (dist(origin, e.coordinate) < 50) {
    chosenCoordinates.value = e.coordinate;
  }
};

const extent = ref([-589, -596, 589, 596]);
const projection = reactive({
  code: 'fonseca',
  units: 'm',
  extent,
});
</script>
