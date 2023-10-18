<template>
<div>
  <!-- Hacky button. Carousel has no slots -->
  <!-- the top-positioning could cause issues -->
  <q-btn v-if="exitFunction"
         round
         flat
         color="primary"
         icon="close"
         class="absolute z-top q-mt-sm q-ml-sm"
         style="left: auto; right: 0"
         @click="exitFunction"
         />
  <q-carousel
    v-model="slide"
    v-bind="$attrs"
    transition-prev="scale"
    transition-next="scale"
    swipeable
    animated
    control-color="blue"
    :navigation="postsMap.size < 5"
    padding
    arrows
    infinite
    class="bg-white text-black shadow-up-6"
    @before-transition="messageChanged"
  >
    <q-carousel-slide
      v-for="post in postsMap.values()"
      :key="post.id"
      :name="post.id"
      class="fds-card-grid">
      <div></div>
      <div class="q-mt-md text-center">
        <p>{{ post.content.toString() }}</p>
      </div>
      <div class="row justify-center">
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
    </q-carousel-slide>
  </q-carousel>
</div>
</template>
<script setup="setup" lang="ts">
import {
  defineOptions,
  computed,
  ref,
  watch,
} from 'vue';

import { RateablePost, Rating, ReadablePost } from '@/core/API';

defineOptions({
  inheritAttrs: false,
});

/* eslint-disable no-spaced-func, func-call-spacing */
const props = defineProps<{
  posts: Array<ReadablePost>,
  exitFunction?: () => void,
}>();
/* eslint-enable no-spaced-func, func-call-spacing */

const postsMap = computed(() => {
  const map = new Map<number, RateablePost>();

  for (const msg of props.posts) {
    map.set(
      msg.id,
      new RateablePost(
        msg.id,
        msg.content,
        msg.likes,
        msg.dislikes,
        msg.rated,
        msg.location,
      ),
    );
  }

  return map;
});

const slide = ref(postsMap.value.keys().next()?.value);

watch(() => props.posts, (v) => {
  slide.value = v[0]?.id;
});

const emit = defineEmits(['messageChanged']);

const messageChanged = (newMsgId: string | number, oldMsgId: string | number) => {
  const map = postsMap.value;
  emit('messageChanged', map.get(Number(newMsgId)), map.get(Number((oldMsgId))));
};
</script>

<style>
.fds-card-grid {
  display: grid;
  grid-template-rows: 1fr 1fr 1fr;
  justify-items: center;
  align-items: center;
}
</style>
