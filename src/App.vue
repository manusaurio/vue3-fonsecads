<template>
  <LoadingFeedback ref="loadingFeedback"></LoadingFeedback>
  <router-view/>
</template>

<style>
#app {
  width: 100vw;
  height: 100vh;
}
</style>

<script setup lang='ts'>
import { ref, provide } from 'vue';
import eventBus from '@/event-bus';

const loadingFeedback = ref(null);

eventBus.on('loading', (v: boolean) => {
  if (v) loadingFeedback.value.show();
  else loadingFeedback.value.hide();
});

const cambio = (o: string | undefined) => {
  if (o === undefined) loadingFeedback.value.hide();
  else loadingFeedback.value.show();
};

provide('feedback', loadingFeedback);
</script>
