import type { Key } from '@heroui/react';
import { useState, useCallback, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import {
  Card,
  Select,
  Label,
  ListBox,
  Checkbox,
} from '@heroui/react';
import Map from './components/Map';
import { getCountries, getLinesByCountry, getLineGeometry } from './services/dataService';
import { scaleAndTranslateTo } from './utils/geo';
import type { MetroLine } from './types';
import type { FeatureCollection } from 'geojson';
import { type Locale, translations } from './i18n';
import './App.css';

const FALLBACK_COUNTRIES = ['China', 'France', 'Germany', 'United Kingdom', 'Japan'];

const panelInputClass =
  'bg-white/10 border-white/20 data-[hover=true]:bg-white/15 data-[focus-visible=true]:ring-white/30';
const panelPopoverClass = 'glass-panel border border-white/20';

export default function App() {
  const [countries, setCountries] = useState<string[]>(FALLBACK_COUNTRIES);
  const [country, setCountry] = useState<string>('China');
  const [city, setCity] = useState<string | null>(null);
  const [lines, setLines] = useState<MetroLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<MetroLine | null>(null);
  const [lineGeoJSON, setLineGeoJSON] = useState<FeatureCollection | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([116.4, 39.9]);
  const [showSubwayLayer, setShowSubwayLayer] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarExpandedHeight, setSidebarExpandedHeight] = useState<number>(0);
  const sidebarContentRef = useRef<HTMLDivElement>(null);
  const [locale, setLocale] = useState<Locale>('zh');
  const localeRef = useRef(locale);
  localeRef.current = locale;
  const t = translations[locale];

  const SIDEBAR_HANDLE_REM = 3.5;
  const SIDEBAR_HANDLE_PX = 56;

  useLayoutEffect(() => {
    if (sidebarCollapsed) return;
    const el = sidebarContentRef.current;
    if (!el) return;
    const maxContent = typeof window !== 'undefined' ? window.innerHeight - SIDEBAR_HANDLE_PX - 16 : 600;
    const contentHeight = Math.min(el.scrollHeight, maxContent);
    setSidebarExpandedHeight(contentHeight);
  }, [sidebarCollapsed, lines.length, city, countries.length, error]);

  useEffect(() => {
    getCountries()
      .then((list) => {
        if (list.length > 0) setCountries(list);
      })
      .catch(() => {});
  }, []);

  const overlayGeoJSON = useMemo(() => {
    if (!lineGeoJSON?.features?.length || !mapCenter) return null;
    return scaleAndTranslateTo(lineGeoJSON, 1, mapCenter);
  }, [lineGeoJSON, mapCenter]);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLines([]);
    setCity(null);
    setSelectedLine(null);
    setLineGeoJSON(null);
    try {
      const list = await getLinesByCountry(country);
      setLines(list);
      if (list.length === 0)
        setError(translations[localeRef.current].errorNoData);
    } catch (e) {
      setError(e instanceof Error ? e.message : translations[localeRef.current].errorSearchFailed);
    } finally {
      setLoading(false);
    }
  }, [country]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  const handleSelectLine = useCallback(async (line: MetroLine) => {
    setSelectedLine(line);
    setLineGeoJSON(null);
    setLoading(true);
    setError(null);
    try {
      const geo = await getLineGeometry(line.id);
      setLineGeoJSON(geo);
    } catch (e) {
      setError(e instanceof Error ? e.message : translations[localeRef.current].errorLoadGeometryFailed);
    } finally {
      setLoading(false);
    }
  }, []);

  const cities = useMemo(() => {
    const set = new Set<string>();
    lines.forEach((l) => {
      if (l.city != null && l.city.trim() !== '') set.add(l.city.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [lines]);

  const filteredLines = useMemo(() => {
    if (!city) return lines;
    return lines.filter((l) => l.city === city);
  }, [lines, city]);

  useEffect(() => {
    if (selectedLine && !filteredLines.some((l) => l.id === selectedLine.id)) {
      setSelectedLine(null);
      setLineGeoJSON(null);
    }
  }, [filteredLines, selectedLine]);

  const lineSelectValue: Key | null = selectedLine ? String(selectedLine.id) : null;
  const onLineChange = useCallback(
    (value: Key | Key[] | null) => {
      if (value == null || Array.isArray(value)) {
        setSelectedLine(null);
        setLineGeoJSON(null);
        return;
      }
      const id = Number(value);
      const line = filteredLines.find((l) => l.id === id);
      if (line) handleSelectLine(line);
    },
    [filteredLines, handleSelectLine]
  );

  return (
    <div className="app relative h-full w-full overflow-hidden">
      <main className="map-wrap absolute inset-0">
        <Map
          showSubwayLayer={showSubwayLayer}
          lineGeoJSON={lineGeoJSON}
          overlayGeoJSON={overlayGeoJSON}
          mapCenter={mapCenter}
          onMapCenterChange={setMapCenter}
          lineColor={selectedLine?.colour}
          lineId={selectedLine?.id}
        />
      </main>
      <aside
        className={`panel glass-panel fixed bottom-2 left-2 z-[1000] flex flex-col overflow-hidden border border-white/20 shadow-2xl w-80 min-w-[280px] rounded-2xl ${
          sidebarCollapsed ? 'rounded-b-2xl rounded-t-xl' : ''
        }`}
        style={{
          height: sidebarCollapsed ? `${SIDEBAR_HANDLE_REM}rem` : `${SIDEBAR_HANDLE_PX + sidebarExpandedHeight}px`,
          transition: 'height 300ms ease-out',
        }}
      >
        {/* Handle: pill + chevron; bottom fixed, only top moves when collapse/expand */}
        <button
          type="button"
          onClick={() => {
            if (sidebarCollapsed) setSidebarExpandedHeight(0);
            setSidebarCollapsed((c) => !c);
          }}
          className="flex shrink-0 cursor-pointer flex-col items-center gap-1.5 border-b border-white/15 py-2.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          aria-label={sidebarCollapsed ? t.expandSidebar : t.collapseSidebar}
        >
          <span className="h-1 w-8 shrink-0 rounded-full bg-white/40" aria-hidden />
          {sidebarCollapsed ? (
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
        <div ref={sidebarContentRef} className="flex flex-col overflow-y-auto max-h-[calc(100vh-5rem)] shrink-0">
        <Card variant="transparent" className="border-0 shadow-none flex flex-col">
          <Card.Header className="flex flex-col items-start gap-1 px-5 pt-4 pb-0 shrink-0">
            <div className="flex items-center gap-2">
              <Card.Title className="text-xl font-semibold text-white/95">
                {t.title}
              </Card.Title>
              <a
                href="https://github.com/mirinda123/MetroDrifter"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-white/60 hover:text-white/80"
                aria-label="GitHub repository"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
            <Card.Description className="text-sm text-white/70">
              {t.subtitle}
            </Card.Description>
            <div className="flex flex-wrap gap-2 pt-1 text-xs">
              <button
                type="button"
                onClick={() => setLocale('zh')}
                className={`rounded px-2 py-0.5 transition-colors ${
                  locale === 'zh' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white/80'
                }`}
              >
                {t.langZh}
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`rounded px-2 py-0.5 transition-colors ${
                  locale === 'en' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white/80'
                }`}
              >
                {t.langEn}
              </button>
              <button
                type="button"
                onClick={() => setLocale('ja')}
                className={`rounded px-2 py-0.5 transition-colors ${
                  locale === 'ja' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white/80'
                }`}
              >
                {t.langJa}
              </button>
            </div>
          </Card.Header>
          <Card.Content className="flex flex-col gap-4 px-5 py-4">
            <Select
              variant="secondary"
              placeholder={t.countryPlaceholder}
              value={country}
              onChange={(v) => v != null && setCountry(String(v))}
              isDisabled={loading}
              fullWidth
              className="text-white/95"
            >
              <Label className="text-white/80">{t.countryLabel}</Label>
              <Select.Trigger className={panelInputClass}>
                <Select.Value className="text-white/95" />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover className={panelPopoverClass}>
                <ListBox>
                  {countries.map((c) => (
                    <ListBox.Item key={c} id={c} textValue={c} className="text-foreground">
                      {c}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            {lines.length > 0 && (
              <Select
                variant="secondary"
                placeholder={t.cityPlaceholder}
                value={city ?? ''}
                onChange={(v) => setCity(v && String(v).trim() ? String(v) : null)}
                isDisabled={loading}
                fullWidth
                className="text-white/95"
              >
                <Label className="text-white/80">{t.cityLabel}</Label>
                <Select.Trigger className={panelInputClass}>
                  <Select.Value className="text-white/95" />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover className={panelPopoverClass}>
                  <ListBox>
                    <ListBox.Item id="" textValue={t.allCities} className="text-foreground">
                      {t.allCities}
                    </ListBox.Item>
                    {cities.map((c) => (
                      <ListBox.Item key={c} id={c} textValue={c} className="text-foreground">
                        {c}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            )}

            {error && (
              <div className="rounded-lg bg-danger/20 px-3 py-2 text-sm text-danger">
                {error}
              </div>
            )}

            {filteredLines.length > 0 && (
              <Select
                variant="secondary"
                placeholder={t.selectLinePlaceholder}
                value={lineSelectValue}
                onChange={onLineChange}
                isDisabled={loading}
                fullWidth
              >
                <Label className="text-white/80">{t.selectLine}</Label>
                <Select.Trigger className={panelInputClass}>
                  <Select.Value className="text-white/95" />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover className={panelPopoverClass}>
                  <ListBox>
                    {filteredLines.map((l) => {
                      const text =
                        [l.ref, l.name, l.network].filter(Boolean).join(' · ') || `ID ${l.id}`;
                      return (
                        <ListBox.Item
                          key={l.id}
                          id={String(l.id)}
                          textValue={text}
                          className="text-foreground"
                        >
                          {text}
                        </ListBox.Item>
                      );
                    })}
                  </ListBox>
                </Select.Popover>
              </Select>
            )}

            {selectedLine && lineGeoJSON && (
              <p className="text-xs text-white/60">
                {t.dragHint}
              </p>
            )}

            <Checkbox
              isSelected={showSubwayLayer}
              onChange={setShowSubwayLayer}
              className="[&_.checkbox__content]:text-white/85 [&_.checkbox__content]:text-sm"
            >
              <Checkbox.Control aria-label={t.railwayLayerAria}>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>
                <Label>{t.railwayLayerLabel}</Label>
              </Checkbox.Content>
            </Checkbox>

            <footer className="mt-auto shrink-0 pt-4 text-[11px] text-white/50">
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white/80"
              >
                © OpenStreetMap
              </a>
              {' · '}
              <a
                href="http://www.openrailwaymap.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white/80"
              >
                OpenRailwayMap
              </a>
            </footer>
          </Card.Content>
        </Card>
        </div>
      </aside>
    </div>
  );
}
