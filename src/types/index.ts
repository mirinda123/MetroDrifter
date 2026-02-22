import type { FeatureCollection } from 'geojson';

export interface MetroLine {
  id: number;
  ref?: string;
  name?: string;
  network?: string;
  /** Line colour from OSM (e.g. #FF0000 or "red") */
  colour?: string;
  /** City name (local language), from add-city-to-lines script */
  city?: string;
}

export type LngLat = [number, number];

export type LineGeoJSON = FeatureCollection;
