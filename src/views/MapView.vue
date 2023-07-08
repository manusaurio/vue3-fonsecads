<template>
  <div>
  <q-tooltip ref="tooltip"
    class="text-body2 bg-primary"
    anchor="bottom middle"
    :offset="[0, 10]"
    self="top middle">
    {{ currentLayer.name }}
 </q-tooltip>
 </div>
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

      :extent="projection.extent"
    />
    <ol-zoom-control />

    <ol-image-layer>
      <ol-source-image-static
        :url="currentLayer.image"
        :projection="projection"
        :imageExtent="projection.extent">
    </ol-source-image-static>
    </ol-image-layer>

  <ol-overlay v-for="item in messages.filter(e => e.location.floor === currentLayer.level)"
      :key="item.id"
      :position="getPosition(item)">
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

    <ol-geolocation :projection="projection"
                    :tracking-options="trackingOptions"
                    @positionChanged="geoLocChange">
      <template>
        <ol-vector-layer :zIndex="2">
          <ol-source-vector>
            <ol-feature>
              <ol-geom-point :coordinates="locCoordinates"></ol-geom-point>
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

 <div style="position: absolute; bottom: 20px; right: 20px;"
   class="fds-map-buttons">
   <q-btn fab
          icon="add"
          color="primary"
          :disabled="cantPost"
          @click="$router.push({ name: 'compose' });">
     <q-tooltip anchor="center left"
                :class="{ invisible: canPost }"
                self="center right"
                :hide-delay="1500">
       <strong>Tu ubicacion es necesaria</strong>
     </q-tooltip>
   </q-btn>
  </div>
</template>

<script lang="ts">
import MessagePopover from '@/components/MessagePopover.vue';
import store from '@/store';
import { ReadablePost, SpatialPoint } from '@/core/API';

import { useRoute } from 'vue-router';
import type { View } from 'ol';

import {
  ref, computed,
  defineComponent,
  onBeforeMount,
  onMounted,
} from 'vue';

// eslint-disable-next-line
const hereIcon = ref(require('../assets/location.svg'));

const locCoordinates = ref<[number?, number?]>([undefined, undefined]);

const canPost = computed(() => store.mapMeta.getLastPoint() !== undefined);
const cantPost = computed(() => store.mapMeta.getLastPoint() === undefined);

const messages = ref<ReadablePost[]>(store.messages);

// TODO: it could go with the utils
const stringToCoord = (s: string): [number, number, number, number] => {
  const nums = s.split(',').map(Number);

  // TODO: do a better check so the user can't end up
  //  in the middle of nowhere or something like that
  if (!nums.every(Number.isFinite) || nums.length !== 4) {
    throw Error(`Invalid coordinate parameters ${s}`);
  }

  return nums as [number, number, number, number];
};

const cachedPos: Map<number, [number, number]> = new Map();

const compPixelsSpatial = (sp: SpatialPoint): [number, number] => {
  const { lat, long } = sp;
  const [x, y] = store.mapMeta.degreesToPixels(lat, long);
  return [x, y];
};

const getPosition = (message: ReadablePost): [number, number] => {
  const { id } = message;
  const pPos = cachedPos.get(id) ?? compPixelsSpatial(message.location);
  cachedPos.set(id, pPos);
  return pPos;
};

export default defineComponent({
  components: {
    MessagePopover,
  },
  setup() {
    // TODO: move map-related objects into a single one
    const center = ref([0, 0]);
    const zoomFactor = ref(2.0);
    const minZoom = ref(1);
    const maxZoom = ref(5);

    const view = ref<View>();
    const route = useRoute();
    const tooltip = ref();
    let lastTooltipTimer: ReturnType<typeof setTimeout> | undefined;

    onBeforeMount(() => store.mapMeta.setLastPoint(undefined));

    onMounted(() => {
      const stringCoord = route.params.coord;

      if (typeof stringCoord === 'string' && stringCoord.length >= 8) {
        const coord = stringToCoord(stringCoord);
        const [x, y] = store.mapMeta.degreesToPixels(coord[0], coord[1]);

        view.value?.setCenter([x, y]);
        view.value?.setZoom(coord[2]);
        // TODO: setFloor(coord[3])
      }
    });

    const layers = store.mapMeta.getFloors();
    const currentLayer = ref(layers[0]);

    const switchLayer = () => {
      const nextLayer = (currentLayer.value.level + 1) % layers.length;
      currentLayer.value = layers[nextLayer];
      tooltip.value.show();

      // TODO: remove tooltip + timeout. Replace with Quasar notifications plugin
      clearTimeout(lastTooltipTimer);
      lastTooltipTimer = setTimeout(tooltip.value.hide, 2000);
    };

    const geoLocChange = (pos: [number?, number?]) => {
      if (pos[0] === undefined || pos[1] === undefined) {
        locCoordinates.value[0] = undefined;
        locCoordinates.value[1] = undefined;
        store.mapMeta.setLastPoint(undefined);
        return;
      }

      const [x, y] = store.mapMeta.degreesToPixels(pos[1], pos[0]);

      locCoordinates.value[0] = x;
      locCoordinates.value[1] = y;

      if (store.mapMeta.getLastPoint() === undefined) {
        view.value?.setZoom(2.0);
        view.value?.setCenter([x, y]);
      }

      store.mapMeta.setLastPoint({
        long: pos[0],
        lat: pos[1],
        floor: 0,
      });
    };

    const zoom = ref(1);
    const rotation = ref(0);

    const trackingOptions = ref({ enableHighAccuracy: true });

    const projection = store.mapMeta.getVueOlProjection();

    return {
      messages,
      center,
      zoom,
      rotation,
      projection,
      hereIcon,
      geoLocChange,
      locCoordinates,
      trackingOptions,
      canPost,
      cantPost,
      getPosition,
      view,
      zoomFactor,
      minZoom,
      maxZoom,
      switchLayer,
      currentLayer,
      tooltip,
    };
  },
});
</script>

<style>
#map-viewport {
  height: 100%;
}

.fds-map-buttons {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-content: center;
  align-items: center;
  gap: 10px;
}
</style>
