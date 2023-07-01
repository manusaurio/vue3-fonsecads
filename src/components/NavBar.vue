<template>
  <q-toolbar class="text-primary shadow-1">
    <q-btn flat round dense icon="arrow_back" @click="router.back()" />
    <q-toolbar-title>
      {{ title }}
    </q-toolbar-title>
  </q-toolbar>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

defineProps({
  title: String,
});
</script>
