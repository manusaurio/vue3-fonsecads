<template>
<NavBar title="Componer" />
  <div class="q-pa-md">
    <div class="fds-composer">
      <span class="text-subtitle1 text-weight-medium">Vista previa</span>
      <div class="text-weight-thin text-negative"
           :class="{ hidden: message.isValid() }"
           style="justify-self: end; align-self: center">
        <q-icon name="info"/><span style="vertical-align: middle">Mensaje incompleto</span>
      </div>

      <span class="text-caption text-italic"
            style="grid-column: 1/-1;">{{ message.toString() || '...' }}</span>

      <q-select style="grid-column: 1/-1;" outlined dense
                v-model="template1" :options="templates" label="Plantilla"
                />

      <q-select outlined dense
                :disable="disabledCategory1"
                @update:model-value="filler1Change"
                v-model="category1" :options="categories" label="Categoría de relleno"
                />

      <q-select outlined dense
                class="ellipsis"
                :disable="disabledFiller1"
                v-model="filler1" :options="fillers1" label="Relleno"
                />

      <q-select style="grid-column: 1/-1;" outlined dense
                :disable="disabledConjunction"
                @update:model-value="conjunctionChange"
                v-model="conjunction" :options="conjunctions" label="Conjunción"
                />

      <q-select :class="{ 'hidden': hiddenSecondPart }"
                style="grid-column: 1/-1;" outlined dense
                v-model="template2" :options="templates" label="Plantilla"
                />

      <q-select outlined dense
                :disable="disabledCategory2"
                :class="{ 'hidden': hiddenSecondPart }"
                @update:model-value="filler2Change"
                v-model="category2" :options="categories" label="Categoría de relleno"
                />

      <q-select outlined dense
                :disable="disabledFiller2"
                :class="{ 'hidden': hiddenSecondPart }"
                v-model="filler2" :options="fillers2" label="Opción"
                />

      <q-btn color="primary"
             :disabled="!message.isValid()"
             @click="submit"
             label="Listo"/>
    </div>
  </div>
</template>

<style>
.fds-composer {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 6px;
}

.fds-composer .q-btn {
  grid-column: -2 / -1;
  width: 120px;
  justify-self: end;
}

.fds-msg-preview {
  grid-column: 1 / -1;
}
</style>

<script setup lang="ts">
import {
  ref, watchEffect,
  computed, Ref,
} from 'vue';

import { useRouter } from 'vue-router';

import NavBar from '@/components/NavBar.vue';

import {
  Message, templates as temps,
  categoryRanges, NULL_CONJUNCTION,
  conjunctions as conjs, fillersMap,
} from '../core/Message';

interface MenuOption<T> {
  label: string,
  value: T,
}

const templates: MenuOption<bigint>[] = temps.map((e, i) => ({ label: e, value: BigInt(i) }));

const categories: MenuOption<bigint>[] = [...categoryRanges.entries()].map((e) => (
  { label: e[0], value: e[1] }
));

const nullConjunctionOption = { label: 'Ninguna', value: NULL_CONJUNCTION };
const conjunctions: MenuOption<bigint>[] = [nullConjunctionOption].concat(
  conjs.map((e, i) => ({ label: e, value: BigInt(i) })),
);

const [
  template1, template2,
  category1, category2,
  filler1, filler2,
  conjunction,
] = [
  ref<MenuOption<bigint>>(), ref<MenuOption<bigint>>(),
  ref<MenuOption<[bigint, bigint]>>(), ref<MenuOption<[bigint, bigint]>>(),
  ref<MenuOption<bigint>>(), ref<MenuOption<bigint>>(),
  ref<MenuOption<bigint>>(nullConjunctionOption),
];

const computeFillersByCategory = (cat: { label: string, value: [bigint, bigint] } | undefined) => {
  const acc: MenuOption<bigint>[] = [];

  if (cat !== undefined) {
    const [start, end] = cat.value;

    for (let i = start; i <= end; i++) {
      acc.push({ label: fillersMap.get(i), value: i });
    }
  }

  return acc;
};

const fillers1 = computed(() => computeFillersByCategory(category1.value));
const fillers2 = computed(() => computeFillersByCategory(category2.value));

const message = ref(new Message(undefined, undefined));
const hiddenSecondPart = ref(true);

const disabledCategory1 = computed(() => template1.value === undefined);
const disabledFiller1 = computed(() => category1.value === undefined);
const disabledCategory2 = computed(() => template2.value === undefined);
const disabledFiller2 = computed(() => category2.value === undefined);

const disabledConjunction = computed(() => filler1.value === undefined);

const conjunctionChange = (val: MenuOption<bigint>) => {
  if (val.value !== NULL_CONJUNCTION) {
    hiddenSecondPart.value = false;
  } else {
    hiddenSecondPart.value = true;
    template2.value = undefined;
    category2.value = undefined;
    filler2.value = undefined;
  }
};

const categoryChange = (filler: Ref<MenuOption<bigint> | undefined>) => (
  cat: MenuOption<[bigint, bigint]>,
) => {
  if (filler.value !== undefined) {
    const n = cat.value[0];
    // eslint-disable-next-line no-param-reassign
    filler.value = { label: fillersMap.get(n), value: n };
  }
};

const filler1Change = categoryChange(filler1);
const filler2Change = categoryChange(filler2);

const router = useRouter();

const submit = () => {
  router.push({
    name: 'locate-view',
    query: { msg: message.value.toBigInt().toString(16) },
  });
};

watchEffect(() => {
  message.value = new Message(
    template1.value === undefined ? undefined : template1.value.value,
    filler1.value === undefined ? undefined : filler1.value.value,
    conjunction.value.value,
    template2.value === undefined ? undefined : template2.value.value,
    filler2.value === undefined ? undefined : filler2.value.value,
  );
});
</script>
