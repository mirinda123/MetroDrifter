/**
 * Scale and translate line geometry to a target position.
 * Uses Turf: center -> scale -> translate to target point.
 */

import center from '@turf/center';
import transformScale from '@turf/transform-scale';
import { featureCollection } from '@turf/helpers';
import type { FeatureCollection, Feature, LineString } from 'geojson';

type LineStringFeature = Feature<LineString>;

function getBboxCenter(fc: FeatureCollection): [number, number] {
  const c = center(fc);
  return c.geometry.coordinates as [number, number];
}

function translateCoords(
  coords: number[] | number[][],
  dlng: number,
  dlat: number
): number[] | number[][] {
  if (Array.isArray(coords[0]) && typeof (coords[0] as number[])[0] === 'number') {
    return (coords as number[][]).map((c) => [c[0] + dlng, c[1] + dlat]);
  }
  const [x, y] = coords as number[];
  return [x + dlng, y + dlat];
}

function scaleAndTranslateOne(
  feature: LineStringFeature,
  scale: number,
  targetLngLat: [number, number],
  sourceCenter: [number, number]
): LineStringFeature {
  const scaled = transformScale(feature, scale, { origin: sourceCenter }) as LineStringFeature;
  const dlng = targetLngLat[0] - sourceCenter[0];
  const dlat = targetLngLat[1] - sourceCenter[1];
  const geom = scaled.geometry;
  if (geom.type === 'LineString') {
    geom.coordinates = translateCoords(geom.coordinates, dlng, dlat) as [number, number][];
  }
  return scaled;
}

/**
 * Scale and translate all LineStrings in a FeatureCollection to the target center.
 */
export function scaleAndTranslateTo(
  geojson: FeatureCollection,
  scale: number,
  targetLngLat: [number, number]
): FeatureCollection {
  if (!geojson?.features?.length) return geojson;
  const sourceCenter = getBboxCenter(geojson);
  const features = geojson.features.map((f) => {
    if (f.geometry?.type === 'LineString') {
      return scaleAndTranslateOne(
        f as LineStringFeature,
        scale,
        targetLngLat,
        sourceCenter
      );
    }
    return f;
  });
  return featureCollection(features);
}

/** Approximate distance between two points in degrees. */
export function distanceDegrees(a: [number, number], b: [number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
}
