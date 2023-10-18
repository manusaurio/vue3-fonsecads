<template>
<div class="full-height column no-wrap">
 <ol-map
    id="map-viewport"
    :loadTilesWhileAnimating="true"
    :loadTilesWhileInteracting="true"
    :controls="[]"
    ref="mapRef"
  >
    <ol-view
      ref="viewRef"
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

    <ol-image-layer ref="imageLayerRef">
      <ol-source-image-static
        :url="currentLayer.image"
        :projection="projection"
        :imageExtent="projection.extent">
      </ol-source-image-static>
    </ol-image-layer>

    <ol-geolocation :projection="projection"
                    :tracking-options="trackingOptions"
                    @change:position="geoLocChange"
                    @error="geoLocError">
    </ol-geolocation>

    <ol-vector-layer>
      <ol-source-vector>
        <ol-feature
          v-for="msg in farawayMessages.values()"
          :key="msg.id" :properties="{ msg }">
          <ol-geom-point :coordinates="getPixelsPositionFromPost(msg)"></ol-geom-point>
        </ol-feature>
      </ol-source-vector>

      <ol-style>
        <ol-style-text
          text="?"
          font="2em/0.8 roboto"
          >
          <ol-style-stroke color="#ffffffac" :width="6"></ol-style-stroke>
        </ol-style-text>
      </ol-style>
    </ol-vector-layer>

    <ol-vector-layer className="fds-ol-selectable">
      <ol-source-cluster :distance="50">
        <ol-source-vector>
          <ol-feature
            v-for="msg in nearbyMessages.values()"
            :key="msg.id" :properties="{ msg }">
            <ol-geom-point :coordinates="getPixelsPositionFromPost(msg)"></ol-geom-point>
          </ol-feature>
        </ol-source-vector>
      </ol-source-cluster>

      <ol-style :overrideStyleFunction="overrideStyle">
        <ol-style-text
          scale="0.85"
          font="14px/0.85 roboto"
          >
          <ol-style-stroke color="#ffffff" :width="6"></ol-style-stroke>
        </ol-style-text>
      </ol-style>
    </ol-vector-layer>

  </ol-map>

  <MessageViewer v-if="viewingPosts.length > 0"
                 :posts="viewingPosts"
                 :exit-function="() => { viewingPosts = []; }"
                 />

  <q-dialog v-model="showingInfo" :no-route-dismiss="true">
    <q-card>
      <q-card-section>
        <div class="text-h6">FonsecaDS</div>
      </q-card-section>
      <q-card-section>
        Desde esta aplicación podés dejar mensajes anónimos en puntos geoespaciales.
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="OK" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

 <div style="position: absolute; top:20px; right: 20px;"
   class="fds-map-buttons">
   <q-btn round color="grey-1" text-color="grey-9" icon="layers" @click="switchLayer"/>
    <q-btn round
           size="sm"
           color="grey-1"
           text-color="grey-9"
           icon="question_mark"
           @click="showingInfo = !showingInfo"/>
    <Transition name="fds-button-trans">
      <q-btn v-if="outOfBounds || !isGeolocWorking"
             round size="sm" color="red-5" text-color="grey-1" icon="warning"
             @click="showWarning()"
             />
    </Transition>
  </div>

 <div style="position: absolute; bottom: 20px; right: 20px;"
   class="fds-map-buttons">
   <q-btn fab
          icon="add"
          color="primary"
          :disabled="cantPost"
          @click="$router.push({ name: 'compose' });">
   </q-btn>
  </div>
</div>
</template>

<script setup lang="ts">
import store from '@/store';
import { ReadablePost, SpatialPoint } from '@/core/API';

import { useRoute, useRouter } from 'vue-router';
import type { View, Map as OLMap, MapBrowserEvent } from 'ol';
import type { Layer } from 'ol/layer';

import type { Style } from 'ol/style';
import type Feature from 'ol/Feature';
import type { ObjectEvent } from 'ol/Object';
import type { GeolocationError } from 'ol/Geolocation';
import { easeOut } from 'ol/easing';

import MessageViewer from '@/components/MessageViewer.vue';

import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
} from 'vue';

import { Notify, LoadingBar, Dialog } from 'quasar';

import { dist } from '@/math-utils';

import { FeatureLike } from 'ol/Feature';
import postRenderCircle from './postRenderCircle';

const postableRadius: number = store.getPostableRadius();

const outOfBounds = ref(false);
const isGeolocWorking = ref(true);

const canPost = computed(() => store.mapMeta.getLastPoint() !== undefined && !outOfBounds.value);
const cantPost = computed(() => !canPost.value);

const messages = ref<ReadablePost[]>(store.messages);
const farawayMessages = ref<Set<ReadablePost>>(new Set());
const nearbyMessages = ref<Set<ReadablePost>>(new Set());

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

const compPixelsSpatial = (sp: SpatialPoint): [number, number] => {
  const { lat, long } = sp;
  const [x, y] = store.mapMeta.degreesToPixels(lat, long);
  return [x, y];
};

const getPixelsPositionFromPost = (() => {
  const cachedPos: Map<number, [number, number]> = new Map();

  return (message: ReadablePost): [number, number] => {
    const { id } = message;
    const pPos = cachedPos.get(id) ?? compPixelsSpatial(message.location);
    cachedPos.set(id, pPos);

    return pPos;
  };
})();

const viewingPosts = ref<ReadablePost[]>([]);

const router = useRouter();
// TODO: move map-related objects into a single one
const center = ref([0, 0]);
const zoomFactor = ref(2.0);
const minZoom = ref(1);
const maxZoom = ref(5);

const viewRef = ref<View>();
const mapRef = ref<{ map: OLMap }>();

const layers = store.mapMeta.getFloors();
const currentLayer = ref(layers[0]);

const updateVisibility = () => {
  const userPos = store.mapMeta.getLastPointInPixels();

  farawayMessages.value.clear();
  nearbyMessages.value.clear();

  if (!userPos) {
    for (const message of messages.value) {
      if (message.location.floor === currentLayer.value.level) {
        farawayMessages.value.add(message);
      }
    }
  } else {
    for (const message of messages.value) {
      if (message.location.floor === currentLayer.value.level) {
        const msgPos = getPixelsPositionFromPost(message);

        if (dist(msgPos, userPos) < postableRadius) nearbyMessages.value.add(message);
        else farawayMessages.value.add(message);
      }
    }
  }
};

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
  const lastPoint = store.mapMeta.getLastPoint();
  if (lastPoint) {
    store.mapMeta.setLastPoint({
      long: lastPoint.long,
      lat: lastPoint.lat,
      floor: currentLayer.value.level,
    });
  }

  updateVisibility();
};

const warningDialog = ref<{
  title: string,
  message: string,
  html: boolean,
  'no-route-dismiss': boolean,
}>();

const showingInfo = ref(false);

const showWarning = () => Dialog.create(warningDialog.value ?? {});

const shownGeoLocErrors = ref<Set<number>>(new Set());

const geoLocError = (error: GeolocationError) => {
  let title: string;
  let message: string;

  isGeolocWorking.value = false;

  const errorConsts = window.GeolocationPositionError;

  switch (error.code) {
    case errorConsts.PERMISSION_DENIED:
      title = '¡Rechazaste compartir tu ubicación!';
      message = 'Este sitio requiere que compartas tu ubicación.'
        + '<br><br>Por favor, volvé a ingresar y aceptá la petición del navegador.';
      break;
    case errorConsts.POSITION_UNAVAILABLE:
      title = 'No se pudo ubicar tu dispositivo';
      message = 'La ubicación no está disponible.';
      break;
    case errorConsts.TIMEOUT:
      title = 'Error';
      message = 'Tu dispositivo está tardando demasiado en reportar su ubicación.';
      break;
    default:
      title = 'Error';
      message = 'Hubo un problema no específico durante la geolocalización.';
  }

  warningDialog.value = {
    title,
    message,
    html: true,
    'no-route-dismiss': true,
  };

  if (!shownGeoLocErrors.value.has(error.code)) showWarning();

  shownGeoLocErrors.value.add(error.code);
};

const geoLocChange = (event: ObjectEvent) => {
  isGeolocWorking.value = true;

  const pos = event.target.getPosition();
  if (pos[0] === undefined || pos[1] === undefined) {
    store.mapMeta.setLastPoint(undefined);
    return;
  }

  const [x, y] = store.mapMeta.degreesToPixels(pos[1], pos[0]);

  outOfBounds.value = !store.mapMeta.userZone.intersectsCoordinate([x, y]);

  if (store.mapMeta.getLastPoint() === undefined) {
    const view = viewRef.value;

    if (!outOfBounds.value) {
      view?.animate({
        center: [x, y],
        zoom: 3.0,
        duration: 700,
      });
    } else {
      view?.animate({
        zoom: 0,
        center: [200, 0],
        rotation: 0,
        duration: 1000,
        easing: easeOut,
      });

      warningDialog.value = {
        title: 'Fuera de rango',
        message: 'Tu dispositivo está reportando su ubicación, pero está fuera de los límites del mapa.',
        html: false,
        'no-route-dismiss': true,
      };
    }
  }

  store.mapMeta.setLastPoint({
    long: pos[0],
    lat: pos[1],
    floor: currentLayer.value.level,
  });

  updateVisibility();
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
  const msg: ReadablePost = clusteredFeatures[0].get('msg');

  const shownText = wrap(msg.content.toString());

  style.getText().setText(
    size === 1
      ? shownText
      : `${shownText} (${size - 1}+)`,
  );
};

const updateRouteCoords = () => {
  const view = viewRef.value;
  if (view) {
    const cZoom = view.getZoom();
    const cCenter = view.getCenter();
    const cFloor: number = currentLayer.value.level;

    if (cCenter) {
      const [x, y] = cCenter;
      const [lat, long] = store.mapMeta.pixelsToDegrees(x, y);

      router.replace({ name: 'map', params: { coord: `${lat},${long},${cZoom},${cFloor}` } });
    }
  }
};

let updateRouteCoordsIntervalNumber: number;

const startUpdateRouteCoords = () => {
  updateRouteCoordsIntervalNumber = setInterval(updateRouteCoords, 2000);
};

const stopUpdateRouteCoords = () => clearInterval(updateRouteCoordsIntervalNumber);

const imageLayerRef = ref<{ imageLayer: Layer | undefined }>();

onMounted(() => {
  const map = mapRef.value?.map;
  const view = viewRef.value;
  const imageLayer = imageLayerRef.value?.imageLayer;

  if (map && view && imageLayer) {
    const renderCircle = postRenderCircle(
      map,
      view,
      postableRadius,
      'rgba(20, 20, 20, 0.8)',
      store.mapMeta.getLastPointInPixels.bind(store.mapMeta),
    );

    imageLayer.on('postrender', renderCircle);

    map.on('click', (e: MapBrowserEvent<UIEvent>) => {
      let topCluster: FeatureLike | undefined;
      map.forEachFeatureAtPixel(e.pixel, (cluster: FeatureLike, l: Layer) => {
        if (l.getClassName() === 'fds-ol-selectable') topCluster = cluster;
      });

      if (!topCluster) viewingPosts.value = [];
      else {
        const posts = topCluster.get('features').map((f: Feature) => f.get('msg'));
        viewingPosts.value = posts;
      }
    });
  }

  const viewCoords: [number, number, number, number] | undefined = (() => {
    const stringCoord = useRoute().params.coord;
    if (typeof stringCoord !== 'string' || stringCoord.length < 8) return undefined;

    const coord = stringToCoord(stringCoord);
    const pixelsXY = store.mapMeta.degreesToPixels(coord[0], coord[1]);

    // TODO: wait, why are they inverted? it should be x-y not y-x
    return [pixelsXY[1], pixelsXY[0], coord[2], coord[3]];
  })();

  if (viewCoords) {
    viewRef.value?.setCenter([viewCoords[1], viewCoords[0]]);
    viewRef.value?.setZoom(viewCoords[2]);
    currentLayer.value = layers[viewCoords[3]];
  }

  startUpdateRouteCoords();
  updateVisibility();
});

onBeforeUnmount(stopUpdateRouteCoords);
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

.fds-button-trans-enter-active,
.fds-button-trans-leave-active {
  transition: opacity 0.5s ease;
}

.fds-button-trans-enter-from,
.fds-button-trans-leave-to {
  opacity: 0;
}
</style>
