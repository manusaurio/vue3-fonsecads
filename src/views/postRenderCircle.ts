import type RenderEvent from 'ol/render/Event';
import { getRenderPixel } from 'ol/render';
import type { View, Map as OLMap } from 'ol';

export default (
  map: OLMap,
  view: View,
  radius: number,
  fillStyle: string,
  originFunction: () => ([number, number] | undefined),
  predicate?: () => boolean,
) => (
  event: RenderEvent,
) => {
  const ctx = event.context;
  if (!(ctx instanceof CanvasRenderingContext2D)) throw Error('Not a 2D rendering context!');
  const resolution = view.getResolution();
  const origin = originFunction();

  if (!origin || !resolution || predicate && !predicate()) return;

  const [x, y] = getRenderPixel(
    event,
    map.getPixelFromCoordinate(origin),
  );

  const mappedRadius = radius / resolution;

  ctx.resetTransform();
  ctx.beginPath();

  ctx.arc(x, y, mappedRadius, 0, 2 * Math.PI, true);
  ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = fillStyle;
  ctx.fill();
};
