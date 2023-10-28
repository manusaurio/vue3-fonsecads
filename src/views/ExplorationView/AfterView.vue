<template>
  <div>
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

    <div style="top:20px; right: 20px;"
         class="fds-map-buttons absolute"
         >
      <q-btn round color="grey-1" text-color="grey-9" icon="layers" @click="changeFloor"/>
      <q-btn round
             size="sm"
             color="grey-1"
             text-color="grey-9"
             icon="question_mark"
             @click="showingInfo = !showingInfo"
             />
      <Transition name="fds-button-trans">
        <q-btn v-if="state.outOfBounds || !state.geolocation.working"
               round size="sm" color="red-5" text-color="grey-1" icon="warning"
               @click="state.showWarning()"
               />
      </Transition>
    </div>

    <div style="position: absolute; bottom: 20px; right: 20px;"
         class="fds-map-buttons"
         >
      <q-btn fab
             icon="add"
             color="primary"
             :disabled="cantPost"
             @click="$router.push({ name: 'compose' });"
             />
    </div>
  </div>
</template>

<script setup="setup" lang="ts">
import { ref, computed } from 'vue';
import store from '@/store';
import { state } from './common';

const showingInfo = ref(false);
const emit = defineEmits(['floorChangeRequest']);
// eslint-disable-next-line arrow-body-style
const canPost = computed(() => {
  return state.geolocation.on
        && state.geolocation.working
        && store.mapMeta.getLastPoint()
        && !state.outOfBounds;
});
const cantPost = computed(() => !canPost.value);

const changeFloor = () => emit('floorChangeRequest');
</script>

<style>
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
