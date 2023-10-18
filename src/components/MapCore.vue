<template>
  <div class="full-height column no-wrap">
    <router-view name="before-map"></router-view>
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
      <router-view name="inside-map"></router-view>
    </ol-map>
    <router-view name="after-map"></router-view>
  </div>
</template>

<script setup="setup" lang="ts">
import { ref } from 'vue';
import store from '@/store';
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

const layers = store.mapMeta.getFloors();

const currentLayer = ref(layers[0]);

const imageLayerRef = ref<{ imageLayer: Layer | undefined }>();
</script>
