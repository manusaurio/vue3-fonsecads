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

    <ol-interaction-clusterselect
      @select="selectCluster">
    </ol-interaction-clusterselect>

    <ol-vector-layer>
      <ol-source-cluster ref="sourceRef" :distance="50">
        <ol-source-vector>
          <ol-feature
            v-for="msg in messages.filter(e => e.location.floor === currentLayer.level)"
            :key="msg.id" :properties="{ msg }">
            <ol-geom-point :coordinates="getPosition(msg)"></ol-geom-point>
          </ol-feature>
        </ol-source-vector>
      </ol-source-cluster>

      <ol-style :overrideStyleFunction="overrideStyle">
  <ol-style-text :text="wrap('Visiones de la autoridad, por sobre todo desconfía de la autoridad')"
                       scale="0.8"
                       font="14px/0.85 roboto">
          <ol-style-fill color="#000"></ol-style-fill>
          <ol-style-stroke color="#fff" :width="6"></ol-style-stroke>
        </ol-style-text>
      </ol-style>

    </ol-vector-layer>
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
import store from '@/store';
import { ReadablePost, SpatialPoint } from '@/core/API';

import { useRoute, useRouter } from 'vue-router';
import type { View } from 'ol';

/* eslint-disable import/no-extraneous-dependencies */
import { Style } from 'ol/style';

import Feature from 'ol/Feature';

import { SelectEvent } from 'ol/interaction/Select';
/* eslint-enable import/no-extraneous-dependencies */

import {
  ref, computed,
  defineComponent, onBeforeMount,
  onMounted, onBeforeUnmount,
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

// https://stackoverflow.com/a/51506718/11601118 (edited Dec 17, 2020 at 14:11)
const wrap = (s: string) => s.replace(/(?![^\n]{1,24}$)([^\n]{1,24})\s/g, '$1\n');

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
  setup() {
    const router = useRouter();
    // TODO: move map-related objects into a single one
    const center = ref([0, 0]);
    const zoomFactor = ref(2.0);
    const minZoom = ref(1);
    const maxZoom = ref(5);

    const view = ref<View>();
    const route = useRoute();
    const tooltip = ref();
    const sourceRef = ref();
    let lastTooltipTimer: ReturnType<typeof setTimeout> | undefined;
    let nextCoordUpdate: ReturnType<typeof setTimeout> | undefined;

    const layers = store.mapMeta.getFloors();
    const currentLayer = ref(layers[0]);

    const viewCoords: [number, number, number, number] | undefined = (() => {
      const stringCoord = route.params.coord;
      if (typeof stringCoord !== 'string' || stringCoord.length < 8) return undefined;

      const coord = stringToCoord(stringCoord);
      const pixelsXY = store.mapMeta.degreesToPixels(coord[0], coord[1]);

      // TODO: wait, why are they inverted? it should be x-y not y-x
      return [pixelsXY[1], pixelsXY[0], coord[2], coord[3]];
    })();

    const switchLayer = () => {
      const nextLayer = (currentLayer.value.level + 1) % layers.length;
      currentLayer.value = layers[nextLayer];
      tooltip.value.show();

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
        view.value?.setZoom(3.0);
        view.value?.setCenter([x, y]);
      }

      store.mapMeta.setLastPoint({
        long: pos[0],
        lat: pos[1],
        floor: currentLayer.value.level,
      });
    };

    const zoom = ref(1);

    // good enough...
    // TODO: maybe include it as part of the map metadata
    const rotation = Math.PI * 0.27;

    const trackingOptions = ref({ enableHighAccuracy: true });

    const projection = store.mapMeta.getVueOlProjection();

    const overrideStyle = (feature: Feature, style: Style) => {
      const clusteredFeatures = feature.get('features');
      const size = clusteredFeatures.length;
      const text = wrap(clusteredFeatures[0].get('msg').content.toString());

      style.getText().setText(
        size === 1
          ? text
          : `${text} (${size - 1}+)`,
      );
    };

    // poorly named
    const selectCluster = (cosa: SelectEvent) => {
      if (cosa.selected.length > 0) {
        const features = cosa.selected[0].get('features');
        if (features.length === 1) {
          const { id } = features[0].get('msg');
          router.push({ name: 'message-list', query: { ids: id } });
        } else {
          const ids = features.map((f: Feature) => f.get('msg').id).join('.');
          router.push({ name: 'message-list', query: { ids } });
        }
      }
    };

    const updateRouteCoords = () => {
      setTimeout(updateRouteCoords, 1000);

      const v = view.value;
      if (v) {
        const cZoom = v.getZoom();
        const cCenter = v.getCenter();
        const cFloor: number = currentLayer.value.level;

        if (cCenter) {
          const [x, y] = cCenter;
          const [lat, long] = store.mapMeta.pixelsToDegrees(x, y);

          router.replace({ name: 'map', params: { coord: `${lat},${long},${cZoom},${cFloor}` } });
        }
      }
    };

    onBeforeMount(() => {
      store.mapMeta.setLastPoint(undefined);
    });

    onMounted(() => {
      if (viewCoords) {
        view.value?.setCenter([viewCoords[1], viewCoords[0]]);
        view.value?.setZoom(viewCoords[2]);
        currentLayer.value = layers[viewCoords[3]];
      }

      updateRouteCoords();
    });

    onBeforeUnmount(() => clearTimeout(nextCoordUpdate));

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
      overrideStyle,
      selectCluster,
      sourceRef,
      wrap,
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
