import { reactive } from 'vue';
import MapMeta from '@/views/mapview-utils';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Projection } from 'ol/proj';
import { Message } from './core/Message';
import { Rating, ReadablePost } from './core/API';

// eslint-disable-next-line import/no-extraneous-dependencies
const projection: Projection = new Projection({
  code: 'fonseca',
  units: 'pixels',
  extent: [-837.5, -837.5, 837.5, 837.5],
});

// -34.921882713652614, -57.94138876779047

const messages: ReadablePost[] = [
  {
    id: 0,
    content: new Message(0n, 0n),
    likes: 0,
    dislikes: 0,
    rated: Rating.UNSET,
    location: {
      lat: -34.921882713652614,
      long: -57.94138876779047,
      floor: 0,
    },
  },
  {
    id: 1,
    content: new Message(2n, 2n, 0n, 0n, 64n),
    likes: 0,
    dislikes: 0,
    rated: Rating.UNSET,
    location: {
      lat: -34.92218704029536,
      long: -57.94164735742796,
      floor: 0,
    },
  },
  {
    id: 2,
    content: new Message(2n, 2n, 0n, 0n, 64n),
    likes: 0,
    dislikes: 0,
    rated: Rating.UNSET,
    location: {
      lat: -34.92235552277306,
      long: -57.94153703932603,
      floor: 0,
    },
  },
];

// are readonly properties causing trouble for typing?
const store = reactive({
  messages,
  mapMeta: new MapMeta(
    projection,
    -34.92256924731183,
    -34.92160867383513,
    -57.94210610271903,
    -57.94091690332326,
    [
      {
        // TODO: find a more performant solution
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
