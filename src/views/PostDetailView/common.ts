import { reactive } from 'vue';

export interface DetailState {
  currentCoord?: [number, number],
}

export const state: DetailState = reactive({});
