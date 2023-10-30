<template>
  <div class="column full-height bg-grey-12">
    <q-carousel
      animated
      transition-prev="slide-right"
      transition-next="slide-left"
      v-model="slide"
      class="col"
      ref=carouselRef
    >
      <q-carousel-slide v-for="s in slides" :key="s.id" :name="s.id" class="q-pa-none bg-grey-12">
        <div class="full-height fds-slide">
          <div class="fds-slide-img-container">
            <img :src="s.img" alt="jeje">
          </div>
          <div class="fds-slide-text">
            <div class="text-h4 text-primary q-pb-sm">{{ s.title }}</div>
            <div class="text-subtitle1 dark q-pa-sm q-px-md">
              {{ s.description }}
            </div>
          </div>
        </div>
      </q-carousel-slide>
    </q-carousel>
    <div style="display: flex; justify-content: space-between;">
      <q-btn v-show="slide !== 'a'"
             flat color="primary"
             label="Atrás"
             @click="carouselRef.previous()"
             />
      <q-btn style="margin-left: auto"
             flat color="primary"
             :label="slide !== 'c' ? 'Siguiente' : 'Entendido'"
             @click="slide == 'c' ? finish() : carouselRef.next()"
             />
    </div>
  </div>
</template>

<script setup="setup" lang="ts">
import { ref } from 'vue';

import imga from '@/assets/wk1.png';
import imgb from '@/assets/wk2.png';
import imgc from '@/assets/wk3.png';

const carouselRef = ref();
const slides = [
  {
    id: 'a',
    img: imga,
    title: 'Susurros',
    description: 'En este sitio vas a poder escribir y valorar susurros cerca de tu geoposición.',
  },
  {
    id: 'b',
    img: imgb,
    title: 'Explorá',
    description: 'Podés encontrar y calificar susurros cerca de vos. Pulsalos para verlos en detalle.',
  },
  {
    id: 'c',
    img: imgc,
    title: 'Componé',
    description: 'Dejá tus propios susurros. Intentá que el lugar donde los dejes también aporte al significado.',
  },
];
const slide = ref('a');

const emit = defineEmits(['done']);

const finish = () => emit('done');
</script>

<style scoped>
.fds-slide {
  display: flex;
  text-align: center;
  align-items: center;
  gap: min(10%, 100px);
}

@media all and (orientation:landscape) {
  .fds-slide {
    flex-direction: row;
    padding-left: 20px;
    padding-right: 20px;
    justify-content: center;
    gap: 20px;
  }

  .fds-slide-img-container {
    height: 70%;
    max-height: 300px;
    aspect-ratio: 1/1;
    flex-grow: 6fr;
  }

  .fds-slide-img-container img {
    width: 100%;
    height: 100%;
  }
}

@media all and (orientation:portrait) {
  .fds-slide {
    flex-direction: column;
    padding-top: 20px;
    justify-content: center;
  }

  .fds-slide img {
    width: 70%;
  }
}
</style>
