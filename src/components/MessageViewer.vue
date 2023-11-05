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
         style="left: auto; right: 12px"
         @click="exitFunction"
         />
  <q-carousel
    v-model="slide"
    transition-prev="scale"
    transition-next="scale"
    swipeable
    animated
    control-color="blue"
    :navigation="postsMap.size < 5"
    padding
    :arrows="postsMap.size > 1"
    infinite
    class="bg-white text-black shadow-up-6 full-height"
    @before-transition="messageChanged"
  >
    <q-carousel-slide
      v-for="post of postsMap.values()"
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
                 @click="() => rate(post, Rating.LIKE)"
                 :icon="post.rated === Rating.LIKE ? 'thumb_up' : 'o_thumb_up'" />
          <span>
            {{ post.likes }}
          </span>
        </div>
        <div>
          <q-btn flat round color="primary"
                 @click="() => rate(post, Rating.DISLIKE)"
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
  computed,
  watch,
  ref,
  onMounted,
} from 'vue';

import { RateablePost, Rating, remote } from '@/core/API';

/* eslint-disable no-spaced-func, func-call-spacing */
const props = defineProps<{
  posts: Array<RateablePost>,
  exitFunction?: () => void,
  emitChangeOnMounted?: boolean,
}>();
/* eslint-enable no-spaced-func, func-call-spacing */

const postsMap = computed(() => {
  const map = new Map<number, RateablePost>();

  for (const msg of props.posts) {
    map.set(msg.id, msg);
  }

  return map;
});

const getFirstSlide = () => postsMap.value.keys().next()?.value;

const slide = ref<string | number>(getFirstSlide());
const emit = defineEmits(['messageChanged']);

const messageChanged = (newMsgId: string | number, oldMsgId: string | number) => {
  const map = postsMap.value;
  emit('messageChanged', map.get(Number(newMsgId)), map.get(Number((oldMsgId))));
};

const rate = (post: RateablePost, chosenRating: Rating.LIKE | Rating.DISLIKE) => {
  const newRating = post.rateLocally(chosenRating);
  remote.setRating(post.id, newRating);
};

watch(postsMap, () => {
  slide.value = postsMap.value.has(Number(slide.value))
    ? slide.value
    : getFirstSlide();
});

onMounted(() => {
  if (props.emitChangeOnMounted) {
    messageChanged(slide.value, slide.value);
  }
});
</script>

<style>
.fds-card-grid {
  display: grid;
  grid-template-rows: 1fr 1fr 1fr;
  justify-items: center;
  align-items: center;
}
</style>
