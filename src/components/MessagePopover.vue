<template>
<Popper v-bind="$attrs" show arrow placement="top" interactive="false">
  <slot />
  <template v-slot:content="props">
    <slot name="content" v-bind="props" />
  </template>
</Popper>
</template>

<script>
import { defineComponent } from 'vue';
import Popper from 'vue3-popper';

export default defineComponent({
  setup() {
    console.log('hola');
  },
  components: {
    Popper,
  },
});
</script>

<style scoped>
  :deep(.popper) {
    padding: 9px;
    border-radius: 10px;
    border-color: black;
    color: #fff;
    font-weight: bold;
    min-width: max-content;
  }

  :deep(.popper p) {
    word-wrap: break-word;
    max-width: 200px;
    margin: 0 0 0 0;
  }

  :deep(.popper),
  :deep(.popper:hover),
  :deep(.popper:hover > #arrow::before),
  :deep(.popper #arrow::before) {
    background: #e92791;
  }
</style>
