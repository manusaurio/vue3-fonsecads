<template>
  <div class="full-height column no-wrap">
    <router-view name="before-map" @floor-change-request="switchLayer"></router-view>
    <ol-map
      id="map-viewport"
      :loadTilesWhileAnimating="true"
      :loadTilesWhileInteracting="true"
      :controls="[]"
      class="full-height"
      ref="mapRef"
      >
      <ol-view
        ref="viewRef"
        :center="mapParams.center"
        :rotation="mapParams.rotation"
        :constrainOnlyCenter="true"
        :zoom="mapParams.zoom"
        :projection="mapParams.projection"

        :zoomFactor="mapParams.zoomFactor"
        :maxZoom="mapParams.maxZoom"
        :minZoom="mapParams.minZoom"

        :extent="mapParams.projection.extent"
        />

      <ol-image-layer ref="imageLayerRef">
        <ol-source-image-static
          :url="currentLayer.image"
          :projection="mapParams.projection"
          :imageExtent="mapParams.projection.extent">
        </ol-source-image-static>
      </ol-image-layer>
      <router-view name="inside-map" @floor-change-request="switchLayer"></router-view>
    </ol-map>
    <router-view name="after-map" @floor-change-request="switchLayer"></router-view>
  </div>
</template>

<script setup="setup" lang="ts">
import { ref, provide } from 'vue';
import store from '@/store';
import { Map as OLMap, View } from 'ol';
import { LoadingBar, Notify } from 'quasar';
import { Layer } from 'ol/layer';

const mapParams = ref({
  center: [0, 0],
  zoomFactor: 2.0,
  minZoom: 1,
  maxZoom: 5,
  zoom: 1,
  projection: store.mapMeta.getVueOlProjection(),
  rotation: Math.PI * 0.27,
});

const mapRef = ref<{ map: OLMap }>();
const viewRef = ref<View>();
const layers = store.mapMeta.getFloors();
const imageLayerRef = ref<{ imageLayer: Layer | undefined }>();
const currentLayer = ref(layers[0]);

const switchLayer = (floor: number | undefined) => {
  LoadingBar.start();

  const nextLayer = floor ?? (currentLayer.value.level + 1) % layers.length;
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
  const lastPoint = store.mapMeta.getLastPoint();
  if (lastPoint) {
    store.mapMeta.setLastPoint({
      long: lastPoint.long,
      lat: lastPoint.lat,
      floor: currentLayer.value.level,
    });
  }
};

provide('mapRef', mapRef);
provide('viewRef', viewRef);
provide('imageLayerRef', imageLayerRef);
provide('currentLayer', currentLayer);
</script>
