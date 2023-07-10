<template>
  <NavBar title="Mensajes" />
  <div>
    <div v-for="post in loaded" :key="post.id" class="fds-view-entry q-px-lg q-py-md">
      <span class="text-caption">{{ post.content }}</span>
      <div class="row justify-end gap">
        <div>
          <q-btn flat round color="primary"
                 @click="() => post.rate(Rating.LIKE)"
                 :icon="post.rated === Rating.LIKE ? 'thumb_up' : 'o_thumb_up'" />
          <span>
            {{ post.likes }}
          </span>
        </div>
        <div>
          <q-btn flat round color="primary"
                 @click="() => post.rate(Rating.DISLIKE)"
                 :icon="post.rated === Rating.DISLIKE ? 'thumb_down' : 'o_thumb_down'" />
          <span>
            {{ post.dislikes }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fds-view-entry {
  border-bottom: solid 1px #9f9f9f;
}

.gap {
  gap: 1em;
}
</style>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import store from '@/store';
import {
  ReadablePost, RateablePost,
  Rating,
} from '@/core/API';

import NavBar from '@/components/NavBar.vue';

const database: ReadablePost[] = store.messages;

const loaded = ref<RateablePost[]>([]);

onMounted(() => {
  const idsParam = useRoute().query.ids;
  const ids: Array<number> | undefined = typeof idsParam === 'string'
    && idsParam?.split('.')
      .filter((s) => s !== '')
      .map(Number)
    || undefined;

  if (!ids) {
    useRouter().back();
  } else {
    ids.map((id) => database.at(id))
      .filter((msg) => msg !== undefined)
      .forEach((msg: ReadablePost) => loaded.value.push(
        new RateablePost(
          msg.id,
          msg.content,
          msg.likes,
          msg.dislikes,
          msg.rated,
          msg.location,
        ),
      ));
  }
});
</script>
