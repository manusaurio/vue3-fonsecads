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

import { ReadablePost, Rating, Location } from '@/core/API';
import { Message } from '@/core/Message';
import NavBar from '@/components/NavBar.vue';

class RateablePost implements ReadablePost {
  id: number;
  content: Message;
  likes: number;
  dislikes: number;
  rated: Rating;
  location: Location;

  constructor(
    id: number,
    content: Message,
    likes: number,
    dislikes: number,
    rated: Rating,
    location: Location,
  ) {
    this.id = id;
    this.content = content;
    this.likes = likes;
    this.dislikes = dislikes;
    this.rated = rated;
    this.location = { ...location }; // hmm is this frown upon? idk;
  }

  rate(newRating: Rating.LIKE | Rating.DISLIKE): void {
    if (this.rated === newRating) {
      this.rated = Rating.UNSET;
      if (newRating === Rating.LIKE) this.likes--; else this.dislikes--;

      return;
    }

    if (newRating === Rating.LIKE) {
      this.likes += 1;
      if (this.rated === Rating.DISLIKE) this.dislikes -= 1;
    } else {
      this.dislikes += 1;
      if (this.rated === Rating.LIKE) this.likes -= 1;
    }

    this.rated = newRating;
  }
}

const database: RateablePost[] = [
  [3n, 2n, 1n, 1n, 65n],
  [0n, 0n],
  [1n, 130n],
  [2n, 130n, 3n, 2n, 67n],
].map((arr, i) => new RateablePost(
  i,
  new Message(...arr),
  Math.floor(Math.random() * 5),
  Math.floor(Math.random() * 5),
  Math.floor(Math.random() * 3 - 1),
  { lat: 33.0, long: -50.0, floor: 0 },
));

const loaded = ref<RateablePost[]>([]);
// const loaded = Ref<RateablePost>(

onMounted(() => {
  const idsParam = useRoute().query.ids;
  const ids = typeof idsParam === 'string'
     && idsParam?.split('.')
       .filter((s) => s !== '')
       .map(Number)
    || undefined;

  if (ids === undefined) {
    useRouter().back();
  } else {
    // eslint-disable-next-line no-restricted-syntax
    for (const id of ids) {
      if (id < database.length) loaded.value.push(database[id]);
    }
  }
});
</script>
