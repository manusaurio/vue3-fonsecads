<template>
  <ol-zoom-control />

  <ol-geolocation :projection="projection"
                  :tracking-options="trackingOptions"
                  @change:position="geoLocChange"
                  @error="geoLocError"
                  />

  <MessagesLayers :pixelLocation="pixelLocation"
                  @cluster-clicked="changeToDetailView"
                  />
</template>

<script setup="setup" lang="ts">
import {
  ref,
  inject,
  Ref,
  onMounted,
  onUnmounted,
} from 'vue';
import type {
  Map as OLMap,
  View,
} from 'ol';
import { useRouter } from 'vue-router';
import { LoadingBar } from 'quasar';
import type RenderEvent from 'ol/render/Event';
import type { Layer } from 'ol/layer';
import type { ObjectEvent } from 'ol/Object';
import { easeOut } from 'ol/easing';
import type { GeolocationError } from 'ol/Geolocation';
import type { ImageStatic } from 'ol/source';

import store from '@/store';
import type { FloorMeta } from '@/MapMeta';
import MessagesLayers from '@/components/MessagesLayers.vue';
import { RateablePost } from '@/core/API';
import postRenderCircle from '../postRenderCircle';
import { useUpdateRouteWithCoords } from './updateCoords';
import { useSetCoordsOnActivated } from './setCoordsOnActivated';
import { state } from './common';

const viewRef = inject<Ref<View>>('viewRef');
const currentLayer = inject<Ref<FloorMeta>>('currentLayer');
const imageLayerRef = inject<Ref<{ imageLayer: Layer | undefined }>>('imageLayerRef');
const mapRef = inject<Ref<{ map: OLMap }>>('mapRef');
const projection = store.mapMeta.getVueOlProjection();
const trackingOptions = { enableHighAccuracy: true };
const shownGeoLocErrors = ref<Set<number>>(new Set());
const emit = defineEmits(['floorChangeRequest']);
const pixelLocation = ref(store.mapMeta.getLastPointInPixels());
const router = useRouter();

const geoLocError = (error: GeolocationError) => {
  let title: string;
  let message: string;

  state.geolocation.working = false;

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

  state.warningDialog = {
    title,
    message,
    html: true,
    'no-route-dismiss': true,
  };

  if (!shownGeoLocErrors.value.has(error.code)) state.showWarning();

  shownGeoLocErrors.value.add(error.code);
};

const geoLocChange = (event: ObjectEvent) => {
  state.geolocation.on = true;
  state.geolocation.working = true;

  const pos = event.target.getPosition();
  if (pos[0] === undefined || pos[1] === undefined) {
    store.mapMeta.setLastPoint(undefined);
    return;
  }

  const [x, y] = store.mapMeta.degreesToPixels(pos[1], pos[0]);

  state.outOfBounds = !store.mapMeta.userZone.intersectsCoordinate([x, y]);

  if (store.mapMeta.getLastPoint() === undefined) {
    const view = viewRef?.value as View;

    if (!state.outOfBounds) {
      view?.animate({
        center: [x, y],
        zoom: 3.0,
        duration: 700,
      });
    } else {
      view?.animate({
        zoom: 0,
        center: [200, 0], // XXX!!!
        rotation: 0,
        duration: 1000,
        easing: easeOut,
      });

      state.warningDialog = {
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
    floor: currentLayer?.value.level as number,
  });

  pixelLocation.value = store.mapMeta.getLastPointInPixels();
};

let renderCircle: (e: RenderEvent) => void;

useUpdateRouteWithCoords(viewRef, () => (currentLayer?.value as FloorMeta).level);
useSetCoordsOnActivated(viewRef, (n: number) => { emit('floorChangeRequest', n); });

const changeToDetailView = (posts: Array<RateablePost>) => {
  const ids = posts.map((p) => p.id).join('.');

  router.push({
    name: 'detail-view',
    query: { ids },
  });
};

onMounted(() => {
  const map = mapRef?.value.map;
  const view = viewRef?.value;
  const imageLayer = imageLayerRef?.value?.imageLayer;

  // XXX: It could probably be set up from the map core component, given the proper props
  //  (see ol/source/ImageStatic events)
  const imageSrc = (imageLayer?.getSource() as ImageStatic)?.getUrl();
  if (imageSrc) {
    LoadingBar.start();
    const image = new Image();
    image.onload = () => LoadingBar.stop();
    image.src = imageSrc;
  }

  renderCircle = postRenderCircle(
    map as OLMap,
    view as View,
    store.getPostableRadius(),
    'rgba(20, 20, 20, 0.8)',
    store.mapMeta.getLastPointInPixels.bind(store.mapMeta),
    () => state.geolocation.on && state.geolocation.working,
  );

  imageLayer?.on('postrender', renderCircle);
});

onUnmounted(() => {
  const imageLayer = imageLayerRef?.value?.imageLayer;
  imageLayer?.un('postrender', renderCircle);
  state.reset();
});
</script>
