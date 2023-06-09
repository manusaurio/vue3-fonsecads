<template>
  <ol-map
    id="map-viewport"
    :loadTilesWhileAnimating="true"
    :loadTilesWhileInteracting="true"
  >
    <ol-view
      ref="view"
      :center="center"
      :rotation="rotation"
      :zoom="zoom"
      :projection="projection"
    />
    <ol-zoom-control />

    <ol-image-layer id="xkcd">
      <ol-source-image-static
        :url="imgUrl"
        :imageSize="size"
        :projection="projection"
        :imageExtent="extent"
        ></ol-source-image-static>
    </ol-image-layer>

  </ol-map>
</template>

<script lang="ts">
import { ref, reactive } from 'vue';

export default {
  setup() {
    const center = ref([512, 484]);
    const zoom = ref(1);
    const rotation = ref(0);

    const imgUrl = ref('https://imgs.xkcd.com/comics/online_communities.png');

    const size = ref([1024, 968]);

    const extent = ref([0, 0, 1024, 968]);
    const projection = reactive({
      code: 'xkcd-image',
      units: 'pixels',
      extent,
    });

    return {
      center,
      zoom,
      rotation,
      imgUrl,
      size,
      extent,
      projection,
    };
  },
};
</script>

<style>
#map-viewport {
  height: 100%;
}
</style>
