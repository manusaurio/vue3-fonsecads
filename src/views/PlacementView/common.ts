import { reactive } from 'vue';

export interface PlacementViewState {
  chosenCoordinates?: [number, number];
  origin?: [number, number];
  radius?: number;
}

export const state: PlacementViewState = reactive({});
