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
        :imageExtent="extent">
    </ol-source-image-static>
    </ol-image-layer>

    <ol-overlay v-for="(item, index) in messages" :key="index" :position="item.position">
      <template #default>
        <!-- this is p awful ngl :D -->
        <MessagePopover style="user-select: none; pointer-events: none">
          <template #content>
            <p>
            {{ item.content }}
            </p>
          </template>
        </MessagePopover>
      </template>
    </ol-overlay>
  </ol-map>

 <div style="z-index: 10000; position: absolute; bottom: 10px; right: 10px">
   <q-btn fab icon="add" color="primary" />
  </div>
</template>

<script lang="ts">
import MessagePopover from '@/components/MessagePopover.vue';

import {
  ref, reactive, defineComponent, PropType,
} from 'vue';

interface Message {
  content: string,
  position: Array<number>;
}

export default defineComponent({
  props: {
    messages: {
      type: Array as PropType<Message[]>,
      default: () => [
        { content: 'sé cauteloso con el arte multimedia, por sobre todo deja que haya música de cuerdas', position: [0, 0] },
        { content: 'lol yea', position: [612, 484] },
        { content: 'visiones de basurero... por lo tanto, poner las cosas en su lugar es requerido adelante', position: [512, 484] },
      ],
    },
  },
  components: {
    MessagePopover,
  },
  setup() {
    const center = ref([0, 0]);
    const zoom = ref(1);
    const rotation = ref(0);

    // eslint-disable-next-line
    const imgUrl = ref(require('../assets/fonseca.jpg'));

    const extent = ref([-589, -596, 589, 596]);
    const projection = reactive({
      code: 'fonseca',
      units: 'm',
      extent,
    });

    return {
      center,
      zoom,
      rotation,
      imgUrl,
      extent,
      projection,
    };
  },
});
</script>

<style>
#map-viewport {
  height: 100%;
}
</style>
