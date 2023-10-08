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

      :extent="projection.extent"
    />
    <ol-zoom-control />

    <ol-image-layer>
      <ol-source-image-static
        :url="currentLayer.image"
        :projection="projection"
        :imageExtent="projection.extent"></ol-source-image-static>
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

    <ol-geolocation :projection="projection"
                    :tracking-options="trackingOptions"
                    @positionChanged="geoLocChange">
      <template>
        <ol-vector-layer :zIndex="2">
          <ol-source-vector>
            <ol-feature>
              <ol-geom-point :coordinates="allowedOrigin"></ol-geom-point>
              <ol-style>
                <ol-style-icon :src="hereIcon" :scale="1.0"></ol-style-icon>
              </ol-style>
            </ol-feature>
          </ol-source-vector>
        </ol-vector-layer>
      </template>
    </ol-geolocation>

  </ol-map>

  <div style="position: absolute; top:20px; right: 20px;"
   class="fds-map-buttons">
   <q-btn round color="grey-1" text-color="grey-9" icon="layers" @click="switchLayer"/>
  </div>

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
      {{ msg }}
    </span>

    <div class="q-my-md q-gutter-x-sm" style="display: flex; justify-content: flex-end">
      <q-btn outline color="primary" label="Cancelar" @click="$router.go(-1)" />
      <q-btn
        :disabled="chosenCoordinates === undefined"
        color="primary" label="Enviar" @click="submit" />
    </div>
  </div>
</template>

<style>
#map-viewport {
  height: 100%;
}
</style>

<script setup lang="ts">
import {
  ref, onBeforeMount,
} from 'vue';

import { Notify, LoadingBar } from 'quasar';

import { useRoute, useRouter } from 'vue-router';
import { Message } from '@/core/Message';
import store from '@/store';

import { Rating, ReadablePost } from '@/core/API';

import point from '../assets/point.svg';
import hereIcon from '../assets/location.svg';

const router = useRouter();

const lastPoint = store.mapMeta.getLastPoint();

// XXX: Lots of repetition.
//  Also these things do not need to be reactive.
const center = (() => {
  if (lastPoint) {
    return store.mapMeta.degreesToPixels(lastPoint.lat, lastPoint.long);
  }
  return [0, 0];
})();
const rotation = Math.PI * 0.27;

const zoom = ref(2);
const zoomFactor = ref(3.0);
const minZoom = ref(1);
const maxZoom = ref(2);

const projection = store.mapMeta.getVueOlProjection();

const trackingOptions = ref({ enableHighAccuracy: true });

const chosenCoordinates = ref<[number, number]>();

const allowedOrigin = (() => {
  if (!lastPoint) return ref([undefined, undefined]);

  const { lat, long } = lastPoint;
  const pixelCoords = store.mapMeta.degreesToPixels(lat, long);

  return ref([pixelCoords[0], pixelCoords[1]]);
})();

const layers = store.mapMeta.getFloors();
const currentLayer = lastPoint ? ref(layers[lastPoint.floor]) : ref(layers[0]);

const switchLayer = () => {
  LoadingBar.start();
  const nextLayer = (currentLayer.value.level + 1) % layers.length;
  const nextLayerImage = new Image();
  nextLayerImage.onload = () => {
    LoadingBar.stop();
    Notify.create({ message: currentLayer.value.name });
  };

  nextLayerImage.src = layers[nextLayer].image;

  currentLayer.value = layers[nextLayer];

  // TODO: this is too coupled with recording of the user's position
  //  yet they need to be updated manually from different parts of the
  //  code. Refactor it.
  const currentPoint = store.mapMeta.getLastPoint();
  if (currentPoint) {
    store.mapMeta.setLastPoint({
      long: currentPoint.long,
      lat: currentPoint.lat,
      floor: currentLayer.value.level,
    });
  }
};

const allowedRadius = ref(200);

// TODO: don't use queries for this
const msgQuery = useRoute().query.msg;
const msg: Message | undefined = (() => {
  try {
    const candidateMsg = Message.fromString(`0x${msgQuery}`);
    return candidateMsg.isValid() ? candidateMsg : undefined;
  } catch (e) {
    return undefined;
  }
})();

onBeforeMount(() => msg ?? router.push('/'));

const submit = () => {
  if (chosenCoordinates.value === undefined || msg === undefined) return;

  const id = store.messages.reduce((prev, curr) => prev.id > curr.id ? prev : curr).id + 1;

  const [x, y] = chosenCoordinates.value;
  const [lat, long] = store.mapMeta.pixelsToDegrees(x, y);

  store.messages.push({
    id,
    content: msg,
    likes: 0,
    dislikes: 0,
    rated: Rating.UNSET,
    location: {
      lat,
      long,
      floor: currentLayer.value.level,
    },
  });

  router.push({
    name: 'map',
    params: {
      coord: `${lat},${long},4,${currentLayer.value.level}`,
    },
  });
};

const geoLocChange = (pos: [number?, number?]) => {
  if (pos[0] === undefined || pos[1] === undefined) {
    allowedOrigin.value[0] = undefined;
    allowedOrigin.value[1] = undefined;
    return;
  }

  const [x, y] = store.mapMeta.degreesToPixels(pos[1], pos[0]);

  allowedOrigin.value[0] = x;
  allowedOrigin.value[1] = y;

  store.mapMeta.setLastPoint({
    long: pos[0],
    lat: pos[1],
    floor: 0,
  });
};

// TODO: iirc openlayers geometry type has a method for this, use that instead
const dist = (p1: [number, number], p2: [number, number]): number => {
  const a = p1[0] - p2[0];
  const b = p1[1] - p2[1];

  return Math.sqrt(a ** 2 + b ** 2);
};

// TODO: same as previous TODO
const isWithin = (p1: [number, number]): boolean => {
  const [x, y] = p1;
  // eslint-disable-next-line
  const [minX, minY, maxX, maxY] = store.mapMeta._bounds;
  return x > minX && x < maxX && y > minY && y < maxY;
};

const view = ref();
const click = (e: any) => {
  if (allowedOrigin.value[0] === undefined || allowedOrigin.value[1] === undefined) return;

  const origin: [number, number] = [allowedOrigin.value[0], allowedOrigin.value[1]];

  if (dist(origin, e.coordinate) < allowedRadius.value && isWithin(e.coordinate)) {
    chosenCoordinates.value = e.coordinate;
  }
};
</script>
