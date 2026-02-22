export type Locale = 'zh' | 'en' | 'ja';

export const translations: Record<
  Locale,
  {
    title: string;
    subtitle: string;
    countryLabel: string;
    countryPlaceholder: string;
    cityLabel: string;
    cityPlaceholder: string;
    allCities: string;
    selectLine: string;
    selectLinePlaceholder: string;
    dragHint: string;
    railwayLayerLabel: string;
    railwayLayerAria: string;
    expandSidebar: string;
    collapseSidebar: string;
    errorNoData: string;
    errorSearchFailed: string;
    errorLoadGeometryFailed: string;
    langZh: string;
    langEn: string;
    langJa: string;
  }
> = {
  zh: {
    title: '地铁漂移',
    subtitle: '搜索地铁线路，随意拖动对比',
    countryLabel: '国家 / 地区',
    countryPlaceholder: '选择国家',
    cityLabel: '城市',
    cityPlaceholder: '选择城市',
    allCities: '全部城市',
    selectLine: '选择线路',
    selectLinePlaceholder: '选择…',
    dragHint: '拖拽地图时，线路会跟随当前地图中心显示。',
    railwayLayerLabel: '显示铁路图层',
    railwayLayerAria: '显示铁路图层',
    expandSidebar: '展开侧栏',
    collapseSidebar: '收起侧栏',
    errorNoData: '暂无该国家本地数据，请运行 npm run download-data 拉取。',
    errorSearchFailed: '加载失败，请重试。',
    errorLoadGeometryFailed: '加载线路几何失败。',
    langZh: '中文',
    langEn: 'English',
    langJa: '日本語',
  },
  en: {
    title: 'MetroDrifter',
    subtitle: 'Search metro lines, drag to compare',
    countryLabel: 'Country / Region',
    countryPlaceholder: 'Select country',
    cityLabel: 'City',
    cityPlaceholder: 'Select city',
    allCities: 'All cities',
    selectLine: 'Select line',
    selectLinePlaceholder: 'Select…',
    dragHint: 'Drag the map; the line follows the current map center.',
    railwayLayerLabel: 'Show railway layer',
    railwayLayerAria: 'Show railway layer',
    expandSidebar: 'Expand sidebar',
    collapseSidebar: 'Collapse sidebar',
    errorNoData: 'No local data for this country. Run npm run download-data to fetch.',
    errorSearchFailed: 'Search failed, please try again.',
    errorLoadGeometryFailed: 'Failed to load line geometry.',
    langZh: '中文',
    langEn: 'English',
    langJa: '日本語',
  },
  ja: {
    title: 'メトロドリフト',
    subtitle: '地下鉄路線を検索し、ドラッグで比較',
    countryLabel: '国・地域',
    countryPlaceholder: '国を選択',
    cityLabel: '都市',
    cityPlaceholder: '都市を選択',
    allCities: 'すべての都市',
    selectLine: '路線を選択',
    selectLinePlaceholder: '選択…',
    dragHint: '地図をドラッグすると、路線が現在の中心に合わせて表示されます。',
    railwayLayerLabel: '鉄道レイヤーを表示',
    railwayLayerAria: '鉄道レイヤーを表示',
    expandSidebar: 'サイドバーを展開',
    collapseSidebar: 'サイドバーを閉じる',
    errorNoData: 'この国のデータがありません。npm run download-data を実行してください。',
    errorSearchFailed: '読み込みに失敗しました。再試行してください。',
    errorLoadGeometryFailed: '路線の読み込みに失敗しました。',
    langZh: '中文',
    langEn: 'English',
    langJa: '日本語',
  },
};
