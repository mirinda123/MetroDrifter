#!/usr/bin/env node
/**
 * Download countries, metro line lists, and line geometry from Overpass API into public/data/.
 *
 * Usage:
 *   npm run download-data                    # all default countries
 *   npm run download-data -- Japan           # single country (note the --)
 *   npm run download-data -- China France    # multiple countries
 *   npx tsx scripts/download-data.ts Japan  # single country (direct)
 *
 * Incremental: existing line-list files are refreshed (with colour); missing geometry only is downloaded.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'public', 'data');
const LINES_DIR = path.join(DATA_DIR, 'lines');
const GEOM_DIR = path.join(DATA_DIR, 'geometry');

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

/** Max wait time (ms) per HTTP request; on timeout the next endpoint is tried */
const REQUEST_TIMEOUT_MS = 60000;
/** Delay (ms) after fetching each country's line list to avoid overloading Overpass */
const SLEEP_AFTER_COUNTRY_MS = 300;
/** Delay (ms) after each batch of geometry downloads */
const SLEEP_AFTER_GEOMETRY_BATCH_MS = 200;
/** Concurrency for geometry file downloads; too high may be rate-limited by Overpass */
const GEOMETRY_CONCURRENCY = 5;

const DEFAULT_COUNTRIES = [
  'China', 'France', 'Germany', 'United Kingdom', 'Japan', 'Spain', 'Russia',
  'United States', 'Italy', 'South Korea', 'Brazil', 'India', 'Mexico',
  'Canada', 'Australia', 'Netherlands', 'Switzerland', 'Austria', 'Belgium',
  'Portugal', 'Greece', 'Turkey', 'Poland', 'Czech Republic', 'Sweden',
  'Argentina', 'Chile', 'Colombia', 'Egypt', 'Iran', 'Thailand', 'Taiwan',
  'Singapore', 'Malaysia', 'Indonesia', 'Philippines',
];

interface OverpassElement {
  type: string;
  id?: number;
  tags?: Record<string, string>;
  geometry?: { lon: number; lat: number }[];
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

interface MetroLineRecord {
  id: number;
  ref?: string;
  name?: string;
  network?: string;
  /** Line colour from OSM (e.g. #FF0000 or "red") */
  colour?: string;
}

/** When primary name returns 0 lines, try these Overpass area names (e.g. OSM uses "Czechia" not "Czech Republic") */
const COUNTRY_ALIASES: Record<string, string[]> = {
  'Czech Republic': ['Czechia'],
};

function countryToKey(name: string): string {
  return String(name).replace(/\s+/g, '_');
}

async function overpassQuery(query: string): Promise<OverpassResponse> {
  const body = 'data=' + encodeURIComponent(query);
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'MetroDrifter-Download/1.0 (data mirror script)',
  };
  let lastError: Error | null = null;
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      const text = await res.text();
      if (!res.ok) {
        lastError = new Error(`Overpass ${res.status}: ${text.slice(0, 200)}`);
        continue;
      }
      if (text.trimStart().startsWith('<')) {
        lastError = new Error(`Server returned non-JSON (XML/HTML), try again later: ${text.slice(0, 150)}`);
        continue;
      }
      return JSON.parse(text) as OverpassResponse;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(`${url}: ${String(e)}`);
      if (!lastError.message.includes('JSON')) {
        lastError = new Error(`${url}: ${lastError.message}`);
      }
    }
  }
  throw lastError;
}

async function fetchLinesForCountry(countryName: string): Promise<MetroLineRecord[]> {
  const query = `
[out:json][timeout:45];
area["name:en"="${countryName}"]->.a;
if (!area.a) { area["name"="${countryName}"]->.a; }
if (!area.a) { area["ISO3166-1"="${countryName}"]->.a; }
relation(area.a)["route"="subway"];
out ids tags;
  `.trim();
  const json = await overpassQuery(query);
  const relations = (json.elements || [])
    .map((r) => {
      let raw = r.tags?.colour ?? r.tags?.color ?? undefined;
      let colour: string | undefined = raw?.trim() ? raw.trim() : undefined;
      // Normalise hex: "FF0000" or "F00" -> "#FF0000" / "#F00"
      if (colour && !colour.startsWith('#') && /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(colour)) {
        colour = '#' + colour;
      }
      return {
        id: r.id!,
        ref: r.tags?.ref,
        name: r.tags?.name,
        network: r.tags?.network,
        ...(colour ? { colour } : {}),
      };
    })
    .filter((r) => r.ref || r.name);
  return relations;
}

interface GeoFeature {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: { type: 'LineString'; coordinates: [number, number][] };
}

async function fetchGeometryForRelation(relationId: number): Promise<{ type: 'FeatureCollection'; features: GeoFeature[] }> {
  const query = `
[out:json][timeout:45];
relation(${relationId});
way(r);
out geom;
  `.trim();
  const json = await overpassQuery(query);
  const ways = (json.elements || []).filter((e): e is OverpassElement => e.type === 'way' && Array.isArray(e.geometry));
  const features: GeoFeature[] = ways.map((way) => ({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: way.geometry!.map((n) => [n.lon, n.lat] as [number, number]),
    },
  }));
  return { type: 'FeatureCollection', features };
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function readRelationIdsFromLinesFile(filePath: string): number[] {
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const list = JSON.parse(raw) as { id?: number }[];
    return Array.isArray(list) ? list.map((l) => l.id).filter((id): id is number => id != null) : [];
  } catch {
    return [];
  }
}

function getAllRelationIdsFromLinesDir(): Set<number> {
  const ids = new Set<number>();
  if (!fs.existsSync(LINES_DIR)) return ids;
  for (const name of fs.readdirSync(LINES_DIR)) {
    if (!name.endsWith('.json')) continue;
    const filePath = path.join(LINES_DIR, name);
    for (const id of readRelationIdsFromLinesFile(filePath)) ids.add(id);
  }
  return ids;
}

/** Normalize country key to display name: "South_Korea" -> "South Korea" */
function normalizeCountryName(name: string): string {
  return name.replace(/_/g, ' ').trim();
}

function getExistingCountryList(): Set<string> {
  const fromJson = path.join(DATA_DIR, 'countries.json');
  if (fs.existsSync(fromJson)) {
    try {
      const list = JSON.parse(fs.readFileSync(fromJson, 'utf8')) as unknown;
      const arr = Array.isArray(list) ? (list as string[]) : [];
      return new Set(arr.map(normalizeCountryName));
    } catch {
      // ignore
    }
  }
  const fromDir = new Set<string>();
  if (fs.existsSync(LINES_DIR)) {
    for (const name of fs.readdirSync(LINES_DIR)) {
      if (name.endsWith('.json')) {
        fromDir.add(normalizeCountryName(name.replace(/\.json$/, '')));
      }
    }
  }
  return fromDir;
}

async function main(): Promise<void> {
  console.log('Downloading map data via Overpass API');
  const onlyCountries: string[] =
    process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_COUNTRIES;
  const countryList = onlyCountries.join(', ');
  console.log(
    onlyCountries.length === 1
      ? `Downloading 1 country: ${countryList}\n`
      : `Downloading ${onlyCountries.length} countries: ${countryList}\n`
  );
  ensureDir(LINES_DIR);
  ensureDir(GEOM_DIR);

  const existingCountries = getExistingCountryList();
  const allRelationIds = new Set(getAllRelationIdsFromLinesDir());
  const newlyDownloadedCountries: string[] = [];

  for (const country of onlyCountries) {
    const key = countryToKey(country);
    const linesPath = path.join(LINES_DIR, `${key}.json`);

    const hadExisting = fs.existsSync(linesPath);
    const existingIds = hadExisting ? readRelationIdsFromLinesFile(linesPath) : [];
    if (hadExisting) existingIds.forEach((id) => allRelationIds.add(id));

    process.stdout.write(
      hadExisting ? `Refreshing ${country} lines list (with colour)... ` : `Downloading ${country} lines list... `
    );
    try {
      let lines = await fetchLinesForCountry(country);
      let usedAlias: string | null = null;
      if (lines.length === 0 && COUNTRY_ALIASES[country]) {
        for (const alias of COUNTRY_ALIASES[country]) {
          lines = await fetchLinesForCountry(alias);
          if (lines.length > 0) {
            usedAlias = alias;
            break;
          }
        }
      }
      fs.writeFileSync(linesPath, JSON.stringify(lines, null, 0), 'utf8');
      lines.forEach((l) => allRelationIds.add(l.id));
      newlyDownloadedCountries.push(country);
      existingCountries.add(country);
      const withColor = lines.filter((l) => l.colour).length;
      console.log(
        `OK (${lines.length} lines${withColor > 0 ? `, ${withColor} with colour` : ''})` +
          (usedAlias ? ` (via "${usedAlias}")` : '')
      );
    } catch (e) {
      console.log(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    await sleep(SLEEP_AFTER_COUNTRY_MS);
  }

  const relationIds = [...allRelationIds];
  const missingGeomIds = relationIds.filter((id) => !fs.existsSync(path.join(GEOM_DIR, `${id}.json`)));
  console.log(`\nLine geometry: total ${relationIds.length}, existing ${relationIds.length - missingGeomIds.length}, to download ${missingGeomIds.length}.`);

  for (let i = 0; i < missingGeomIds.length; i += GEOMETRY_CONCURRENCY) {
    const batch = missingGeomIds.slice(i, i + GEOMETRY_CONCURRENCY);
    const pct = (((i + batch.length) / missingGeomIds.length) * 100).toFixed(0);
    process.stdout.write(`  [${pct}%] ${batch.join(', ')} ... `);
    const results = await Promise.all(
      batch.map(async (id) => {
        try {
          const geo = await fetchGeometryForRelation(id);
          fs.writeFileSync(
            path.join(GEOM_DIR, `${id}.json`),
            JSON.stringify(geo, null, 0),
            'utf8'
          );
          return { id, ok: true };
        } catch (e) {
          return { id, ok: false, err: e instanceof Error ? e.message : String(e) };
        }
      })
    );
    const okCount = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      console.log(`${okCount} OK, ${failed.length} failed: ${failed.map((f) => f.id).join(', ')}`);
    } else {
      console.log(`${okCount} OK`);
    }
    if (i + GEOMETRY_CONCURRENCY < missingGeomIds.length) {
      await sleep(SLEEP_AFTER_GEOMETRY_BATCH_MS);
    }
  }

  const finalCountries = [...existingCountries].sort();
  fs.writeFileSync(
    path.join(DATA_DIR, 'countries.json'),
    JSON.stringify(finalCountries, null, 0),
    'utf8'
  );
  console.log(`\nDone. Countries: ${finalCountries.length}, newly downloaded countries: ${newlyDownloadedCountries.length}, newly downloaded geometry: ${missingGeomIds.length}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
