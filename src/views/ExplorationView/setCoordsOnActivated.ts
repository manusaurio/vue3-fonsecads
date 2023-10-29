import { useRoute } from 'vue-router';
import { onActivated, Ref, unref } from 'vue';
import { View } from 'ol';

import store from '@/store';

type PossiblyView = View | undefined;

const stringToCoord = (s: string): [number, number, number, number] => {
  const nums = s.split(',').map(Number);

  if (!nums.every(Number.isFinite) || nums.length !== 4) {
    throw Error(`Invalid coordinate parameters ${s}`);
  }

  return nums as [number, number, number, number];
};

const getRouteCoords: (() => [number, number, number, number] | undefined) = () => {
  const stringCoord = useRoute().params.coord;
  if (typeof stringCoord !== 'string' || stringCoord.length < 8) return undefined;

  const coord = stringToCoord(stringCoord);
  const pixelsXY = store.mapMeta.degreesToPixels(coord[0], coord[1]);

  // TODO: wait, why are they inverted? it should be x-y not y-x
  return [pixelsXY[1], pixelsXY[0], coord[2], coord[3]];
};

export function useSetCoordsOnActivated(
  view: PossiblyView | Ref<PossiblyView>,
  layerChange: (floor: number) => void,
) {
  onActivated(() => {
    const routeCoords = getRouteCoords();
    const viewValue = unref(view);

    if (routeCoords && viewValue) {
      viewValue.setCenter([routeCoords[1], routeCoords[0]]);
      viewValue.setZoom(routeCoords[2]);
      layerChange(routeCoords[3]);
    }
  });
}
