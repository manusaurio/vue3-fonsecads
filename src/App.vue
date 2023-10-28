<template>
  <router-view v-slot="{ Component }">
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
