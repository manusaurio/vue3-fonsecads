<template>
  <WalkthroughView v-if="walkthrough" @done="walkthrough = false"/>
  <router-view v-else v-slot="{ Component }">
    <keep-alive include="MapCore">
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<style>
#app {
  width: 100vw;
  height: 100vh;
}
</style>

<script setup="setup" lang="ts">
import { onBeforeMount, inject, ref } from 'vue';
import { VueCookies } from 'vue-cookies';

import WalkthroughView from '@/views/WalkthroughView.vue';

const walkthrough = ref(true);

onBeforeMount(() => {
  const $cookies = inject<VueCookies>('$cookies');
  if ($cookies) {
    if ($cookies.get('walkthrough') === '1') {
      walkthrough.value = false;
    }
    $cookies.set('walkthrough', '1', '400d');
  }
});
</script>
