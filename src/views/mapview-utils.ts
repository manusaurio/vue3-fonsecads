// TODO: move this to some other directory
// TODO: add an image parameter, maybe, and autocompute its bounds?
// TODO: try to get rid of map parameters (projection etc.) from the store

import { SpatialPoint } from '@/core/API';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Projection } from 'ol/proj';

interface FloorMeta {
  readonly image: string;
  readonly name: string;
  readonly level: number;
}

// see 68715924 on SO about private fields combined with `reactive`
/* eslint-disable no-underscore-dangle */
class MapMeta {
  _unixMillis?: number;
  _point?: SpatialPoint;
  _floors: FloorMeta[] = [];
  _bounds: [number, number, number, number];
  _projection: Projection;

  constructor(
    readonly projection: Projection,
    readonly latStart: number,
    readonly latEnd: number,
    readonly longStart: number,
    readonly longEnd: number,
    floors: FloorMeta[],
  ) {
    this._bounds = [...(projection.getExtent() as [number, number, number, number])];
    this._projection = projection;
    for (const floor of floors) {
      this._floors.push(
        {
          image: floor.image,
          name: floor.name,
          level: floor.level,
        },
      );
    }
  }

  static map = (
    value: number,
    istart: number,
    istop: number,
    ostart: number,
    ostop: number,
  ): number => ostart + (ostop - ostart) * ((value - istart) / (istop - istart));

  getVueOlProjection() {
    return {
      code: 'fonseca',
      units: 'pixels',
      extent: this._projection.getExtent(),
      getCode: () => this._projection.getCode(),
    };
  }

  getLastPoint(): SpatialPoint | undefined {
    // TODO: implement some logic to make the last point expire
    return this._point;
  }

  public setLastPoint(value?: SpatialPoint) {
    this._unixMillis = Date.now();
    this._point = value;
  }

  getFloor(n: number): FloorMeta {
    return this._floors[n];
  }

  getFloors(): FloorMeta[] {
    return [...this._floors];
  }

  degreesToPixels(lat: number, long: number): [number, number] {
    return [
      MapMeta.map(long, this.longStart, this.longEnd, this._bounds[0], this._bounds[2]),
      MapMeta.map(lat, this.latStart, this.latEnd, this._bounds[1], this._bounds[3]),
    ];
  }

  pixelsToDegrees(pixY: number, pixX: number): [number, number] {
    return [
      MapMeta.map(pixX, this._bounds[0], this._bounds[2], this.longStart, this.longEnd),
      MapMeta.map(pixY, this._bounds[1], this._bounds[3], this.latStart, this.latEnd),
    ];
  }
}
/* eslint-enable no-underscore-dangle */

export default MapMeta;
