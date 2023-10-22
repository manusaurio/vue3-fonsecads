import {
  onMounted,
  onBeforeUnmount,
  unref,
  Ref,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { View } from 'ol';

import store from '@/store';

type PossiblyView = View | undefined;

export function useUpdateRouteWithCoords(
  view: (PossiblyView) | Ref<PossiblyView>,
  getCurrentFloor: () => number,
) {
  const router = useRouter();
  const route = useRoute();
  const originalRouteName = route.name;
  let updateTimerRef: ReturnType<typeof setInterval>;

  if (!originalRouteName) throw Error(`Invalid route name ${originalRouteName?.toString()}`);

  const stopUpdateRouteCoords = () => clearInterval(updateTimerRef);

  const updateRoute = () => {
    const viewValue = unref(view);
    if (!viewValue) {
      stopUpdateRouteCoords();
      throw Error('Unavailable view!');
    }

    if (route.name !== originalRouteName) return;

    const currentZoom = viewValue.getZoom();
    const currentCenter = viewValue.getCenter();
    const currentFloor = getCurrentFloor();

    if (currentCenter) {
      const [x, y] = currentCenter;
      const [lat, long] = store.mapMeta.pixelsToDegrees(x, y);

      router.replace({
        name: originalRouteName,
        params: { coord: `${lat},${long},${currentZoom},${currentFloor}` },
      });
    }
  };

  const startUpdateRouteCoords = () => {
    updateTimerRef = setInterval(updateRoute, 2000);
  };

  onMounted(startUpdateRouteCoords);

  onBeforeUnmount(stopUpdateRouteCoords);
}
