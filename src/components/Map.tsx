import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMapEvents, useMap } from 'react-leaflet';
import bbox from '@turf/bbox';
import type { FeatureCollection } from 'geojson';

const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const ORM_ATTRIBUTION = 'Data &copy; OSM | Style CC-BY-SA 2.0 <a href="http://www.openrailwaymap.org/">OpenRailwayMap</a>';

interface MapCenterReporterProps {
  onCenterChange?: (center: [number, number]) => void;
}

function MapCenterReporter({ onCenterChange }: MapCenterReporterProps) {
  const map = useMap();
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const c = map.getCenter();
    onCenterChange?.([c.lng, c.lat]);
  }, [map, onCenterChange]);

  useMapEvents({
    move: () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        const c = map.getCenter();
        onCenterChange?.([c.lng, c.lat]);
        rafRef.current = null;
      });
    },
    moveend: () => {
      const c = map.getCenter();
      onCenterChange?.([c.lng, c.lat]);
    },
  });
  return null;
}

interface FitLineBoundsProps {
  geojson: FeatureCollection;
}

function FitLineBounds({ geojson }: FitLineBoundsProps) {
  const map = useMap();
  useEffect(() => {
    if (!geojson?.features?.length) return;
    const [minX, minY, maxX, maxY] = bbox(geojson);
    map.fitBounds([[minY, minX], [maxY, maxX]], { padding: [40, 40], maxZoom: 14 });
  }, [geojson, map]);
  return null;
}

const DEFAULT_LINE_COLOR = '#c23a2b';

/** Normalise OSM colour to a CSS color string (hex with # or named). */
function toCssColor(raw: string | undefined | null): string {
  if (raw == null || typeof raw !== 'string') return DEFAULT_LINE_COLOR;
  const s = raw.trim();
  if (!s) return DEFAULT_LINE_COLOR;
  if (s.startsWith('#')) return s;
  if (/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(s)) return '#' + s;
  return s;
}

export interface MapProps {
  /** When true, show OpenRailwayMap tile layer (railways worldwide) */
  showSubwayLayer: boolean;
  lineGeoJSON: FeatureCollection | null;
  overlayGeoJSON: FeatureCollection | null;
  mapCenter: [number, number] | null;
  onMapCenterChange: (center: [number, number]) => void;
  /** CSS color for the selected line (from OSM colour or fallback) */
  lineColor?: string;
  /** Selected line id; used as GeoJSON key so layer is replaced when switching lines */
  lineId?: number | null;
}

export default function Map({
  showSubwayLayer,
  lineGeoJSON,
  overlayGeoJSON,
  mapCenter,
  onMapCenterChange,
  lineColor,
  lineId,
}: MapProps) {
  const resolvedColor = toCssColor(lineColor ?? undefined);
  const lineStyle = {
    color: resolvedColor,
    weight: 4,
    opacity: 0.9,
  };
  const overlayStyle = {
    color: resolvedColor,
    weight: 5,
    opacity: 0.85,
  };

  return (
    <MapContainer
      center={[39.9, 116.4]}
      zoom={4}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
      attributionControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution={OSM_ATTRIBUTION}
      />
      {showSubwayLayer && (
        <TileLayer
          url="https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png"
          attribution={ORM_ATTRIBUTION}
          minZoom={2}
          maxZoom={19}
          tileSize={256}
        />
      )}
      <MapCenterReporter onCenterChange={onMapCenterChange} />
      {lineGeoJSON && lineGeoJSON.features && lineGeoJSON.features.length > 0 && (
        <>
          <FitLineBounds geojson={lineGeoJSON} />
          <GeoJSON key={`line-${lineId ?? 'none'}`} data={lineGeoJSON} style={lineStyle} />
        </>
      )}
      {overlayGeoJSON && overlayGeoJSON.features && overlayGeoJSON.features.length > 0 && mapCenter && (
        <GeoJSON
          key={`overlay-${mapCenter[0].toFixed(5)}-${mapCenter[1].toFixed(5)}`}
          data={overlayGeoJSON}
          style={overlayStyle}
        />
      )}
    </MapContainer>
  );
}
