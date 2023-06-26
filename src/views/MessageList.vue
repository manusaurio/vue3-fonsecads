<template>
  <q-toolbar class="text-primary shadow-1">
    <q-btn flat round dense icon="arrow_back" />
    <q-toolbar-title>
      Mensajes
    </q-toolbar-title>
  </q-toolbar>

  <div class="q-gutter-y-sm">
    <div v-for="(msg, i) in messages" :key="i" class="fds-view-entry q-px-lg q-py-md">
      <span class="text-caption">{{ msg }}</span>
      <div class="row justify-end gap">
        <div>
          <q-btn flat round color="primary"
                 :icon="Math.random() > .5 ? 'o_thumb_up' : 'thumb_up'" />
          <span>
            {{ Math.round(Math.random() * 5) }}
          </span>
        </div>
        <div>
          <q-btn flat round color="primary" icon="o_thumb_down" />
          <span>
            {{ Math.round(Math.random() * 5) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.fds-view-entry {
  width: 100%;
  border-bottom: solid 1px #9f9f9f;
}

.gap {
  gap: 1em;
}
</style>

<script setup lang="ts">
import { Message } from '@/core/Message';

const params = [
  [3n, 2n, 1n, 1n, 65n],
  [0n, 0n],
  [1n, 130n],
];

const messages = params.map((arr) => new Message(...arr));
</script>
