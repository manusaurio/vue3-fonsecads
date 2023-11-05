import { reactive, ref, Ref } from 'vue';
import MapMeta from '@/MapMeta';
import { Projection } from 'ol/proj';
import { Polygon } from 'ol/geom';
import { Coordinate } from 'ol/coordinate';

import { RateablePost } from './core/API';

const projection: Projection = new Projection({
  code: 'fonseca',
  units: 'pixels',
  extent: [-837.5, -837.5, 837.5, 837.5],
});

// -34.921882713652614, -57.94138876779047
const posts: Ref<Map<number, RateablePost>> = ref(new Map());

const userZone: Polygon = (() => {
  type CoordMatrix = Array<Array<Coordinate>>;
  // I'm laazyy maaaan
  /* eslint-disable implicit-arrow-linebreak */
  const mapPoints: (m: CoordMatrix) => CoordMatrix = (coordMatrix: CoordMatrix) =>
    coordMatrix.map((s: Array<Coordinate>) => s.map((c: Coordinate) => [
      MapMeta.map(c[0], 0, 1675, -837.5, 837.5),
      -MapMeta.map(c[1], 0, 1675, -837.5, 837.5),
    ]));
  /* eslint-enable implicit-arrow-linebreak */

  const nonNegativePoints = [
    [[534, 150], [462, 1467], [837, 1772], [958, 1779], [1669, 900], [1172, 502], [1061, 88]],
  ];

  const mappedPoints = mapPoints(nonNegativePoints);

  return new Polygon(
    mappedPoints,
    'XY',
  );
})();

// are readonly properties causing trouble for typing?
const store = reactive({
  getPostableRadius: () => 200,
  posts,
  mapMeta: new MapMeta(
    projection,
    -34.92256924731183,
    -34.92160867383513,
    -57.94210610271903,
    -57.94091690332326,
    userZone,
    [200, 0],
    [
      {
        // TODO: remove from the store
        /* eslint-disable global-require */
        image: require('@/assets/gl.png'),
        name: 'planta baja',
        level: 0,
      },
      {
        image: require('@/assets/1f.png'),
        name: 'primer piso',
        level: 1,
        /* eslint-enable global-require */
      },
    ],
  ),
});

export default store;
