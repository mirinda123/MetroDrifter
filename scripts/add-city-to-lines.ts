#!/usr/bin/env node
/**
 * Iterate over each JSON under public/data/lines, infer city from network for each line, write city field and update files.
 * Usage: npx tsx scripts/add-city-to-lines.ts
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LINES_DIR = path.join(__dirname, '..', 'public', 'data', 'lines');

const NETWORK_TO_CITY: Record<string, string> = {
  'Subte de Buenos Aires': 'Buenos Aires', 'Metrovías': 'Buenos Aires',
  'U-Bahn Wien': 'Wien', 'VVT': 'Innsbruck',
  'IBXL': 'Bruxelles',
  '上海地铁': '上海', '北京地铁': '北京', '广州地铁': '广州', '深圳地铁': '深圳', '重庆轨道交通': '重庆',
  '成都地铁': '成都', '武汉地铁': '武汉', '南京地铁': '南京', '天津地铁': '天津', '西安地铁': '西安',
  '苏州轨道交通': '苏州', '杭州地铁': '杭州', '郑州地铁': '郑州', '长沙地铁': '长沙', '宁波市轨道交通': '宁波',
  '昆明地铁': '昆明', '南宁轨道交通': '南宁', '大连地铁': '大连', '沈阳地铁': '沈阳', '哈尔滨地铁': '哈尔滨',
  '青岛地铁': '青岛', '济南轨道交通': '济南', '合肥轨道交通': '合肥', '福州地铁': '福州', '福州轨道交通': '福州',
  '南昌地铁': '南昌', '石家庄地铁': '石家庄', '无锡地铁': '无锡', '常州地铁': '常州', '徐州地铁': '徐州',
  '长春轨道交通': '长春', '厦门轨道交通': '厦门', '贵阳轨道交通': '贵阳', '兰州轨道交通': '兰州', '洛阳轨道交通': '洛阳',
  '绍兴轨道交通': '绍兴', '南通轨道交通': '南通', '温州轨道交通': '温州', '台州轨道交通': '台州', '东莞轨道交通': '东莞',
  '佛山地铁': '佛山', '太原轨道交通': '太原', '呼和浩特地铁': '呼和浩特', '滁州轨道交通': '滁州',
  '浙中都市圈城际轨道交通': '金华', '港鐵 MTR': '香港', '港鐵': '香港', 'MTR': '香港',
  '東京メトロ': '東京', '都営地下鉄': '東京', '京成;都営地下鉄': '東京', '札幌市営地下鉄': '札幌',
  '仙台市営地下鉄': '仙台', '仙台市地下鉄': '仙台', '名古屋市': '名古屋', '大阪市高速電気軌道': '大阪', '大阪市営地下鉄': '大阪',
  '京都市営地下鉄': '京都', '神戸市営地下鉄': '神戸', '福岡市地下鉄': '福岡', '横浜市営地下鉄': '横浜', 'みなとみらい線': '横浜',
  '広島高速交通株式会社': '広島', '埼玉高速鉄道線': '埼玉', '東葉高速線': '千葉', '東武スカイツリーライン': '東京',
  '東武スカイツリーライン;東京メトロ': '東京', '通勤五方面作戦': '東京', '東京メトロ;JR': '東京', '東急電鉄;東京メトロ': '東京', '東急電鉄': '東京',
  '小田急電鉄;東京メトロ': '東京', '西武鉄道': '東京', '池袋線系統': '東京', '東武鉄道': '東京', '京成': '東京', 'S-Train': '神戸',
  'Seoul Metro': '서울', '서울교통공사': '서울', 'Korail': '서울', '수도권 전철': '서울',
  'Busan Metro': '부산', 'Busan Transportation Corporation': '부산', '부산 도시철도': '부산',
  'Daegu Metro': '대구', '대구 도시철도': '대구', '대구도시철도': '대구',
  'Incheon Metro': '인천', 'Gwangju Metro': '광주', '광주 도시철도': '광주',
  'Daejeon Metro': '대전', '대전 도시철도': '대전',
  'Métro de Paris': 'Paris', 'RATP': 'Paris', 'Île-de-France Mobilités': 'Paris', 'CDGVAL': 'Paris',
  'Métro de Lyon': 'Lyon', 'TCL': 'Lyon',
  'Métro de Marseille': 'Marseille', 'RTM': 'Marseille',
  'Toulouse Métro': 'Toulouse', 'Tisséo': 'Toulouse',
  'Métro de Lille': 'Lille', 'Ilévia': 'Lille',
  'Métro de Rennes': 'Rennes', 'FR:STAR': 'Rennes',
  'U-Bahn Berlin': 'Berlin', 'BVG': 'Berlin', 'Verkehrsverbund Berlin-Brandenburg': 'Berlin',
  'U-Bahn Hamburg': 'Hamburg', 'Hamburger Verkehrsverbund': 'Hamburg',
  'U-Bahn München': 'München', 'MVG': 'München', 'Münchner Verkehrs- und Tarifverbund': 'München',
  'U-Bahn Frankfurt': 'Frankfurt', 'Rhein-Main-Verkehrsverbund': 'Frankfurt',
  'U-Bahn Köln': 'Köln', 'U-Bahn Nürnberg': 'Nürnberg', 'Verkehrsverbund Großraum Nürnberg': 'Nürnberg',
  'U-Bahn Stuttgart': 'Stuttgart', 'U-Bahn Hannover': 'Hannover', 'U-Bahn Düsseldorf': 'Düsseldorf',
  'VRR': 'Essen', 'WestfalenTarif': 'Bielefeld',
  'London Underground': 'London', 'TfL': 'London', 'Docklands Light Railway': 'London', 'Tyne and Wear Metro': 'Newcastle',
  'Glasgow Subway': 'Glasgow', 'Strathclyde Partnership for Transport': 'Glasgow', 'Manchester Metrolink': 'Manchester', 'West Midlands Metro': 'Birmingham', 'Merseyrail': 'Liverpool',
  'Metro de Madrid': 'Madrid', 'Metro de Barcelona': 'Barcelona', 'Metro de Valencia': 'Valencia', 'Metrovalencia': 'Valencia', 'Metro de Bilbao': 'Bilbao', 'Metro Bilbao': 'Bilbao',
  'Metro de Sevilla': 'Sevilla', 'Metro Málaga': 'Málaga',
  'Московский метрополитен': 'Москва', 'Метрополитен Санкт-Петербурга': 'Санкт-Петербург', 'Петербургский метрополитен': 'Санкт-Петербург', 'Новосибирский метрополитен': 'Новосибирск',
  'Екатеринбургский метрополитен': 'Екатеринбург', 'Казанский метрополитен': 'Казань', 'Нижегородский метрополитен': 'Нижний Новгород',
  'Самарский метрополитен': 'Самара',
  'New York City Subway': 'New York', 'NYC Subway': 'New York', 'MTA': 'New York', 'Staten Island Railway': 'New York', 'PATH': 'New York',
  'MBTA': 'Boston', 'Washington Metro': 'Washington', 'WMATA': 'Washington',
  'CTA': 'Chicago', 'Chicago "L"': 'Chicago', 'BART': 'San Francisco', 'Muni Metro': 'San Francisco', 'MARTA': 'Atlanta',
  'Miami-Dade Metrorail': 'Miami', 'MDT': 'Miami', 'PATCO': 'Philadelphia', 'SEPTA': 'Philadelphia',
  'LA Metro': 'Los Angeles', 'Metro Rail (Los Angeles)': 'Los Angeles', 'Metro Rail': 'Los Angeles',
  'Cleveland RTA Rapid Transit': 'Cleveland', 'RTA': 'Cleveland', 'Baltimore Metro': 'Baltimore', 'Baltimore Metro SubwayLink': 'Baltimore',
  'Bay Area Rapid Transit': 'San Francisco', 'ATI': 'San Juan', 'Skyline': 'Honolulu',
  'Metropolitana di Roma': 'Roma', 'ATAC': 'Roma', 'COTRAL': 'Roma', 'Comune di Palestrina': 'Roma',
  'Metropolitana di Milano': 'Milano', 'ATM Milano': 'Milano', 'STIBM': 'Milano',
  'Metropolitana di Napoli': 'Napoli', 'EAV': 'Napoli',
  'Metro Torino': 'Torino', 'Metro Genova': 'Genova', 'Metropolitana di Genova': 'Genova',
  'Metro Brescia': 'Brescia', 'Metropolitana di Brescia': 'Brescia', 'Formula': 'Brescia',
  'Metropolitana di Catania': 'Catania',
  'Metrô de São Paulo': 'São Paulo', 'Metrô': 'São Paulo', 'Metrô Rio': 'Rio de Janeiro', 'Metrô de Belo Horizonte': 'Belo Horizonte',
  'Metrô de Brasília': 'Brasília', 'Metrô-DF': 'Brasília',
  'Metrô de Porto Alegre': 'Porto Alegre', 'Trensurb': 'Porto Alegre',
  'Metrô de Recife': 'Recife', 'Metrô do Recife': 'Recife',
  'Metrô de Salvador': 'Salvador', 'Metrô de Fortaleza': 'Fortaleza', 'Metrofor': 'Fortaleza',
  'Delhi Metro': 'दिल्ली', 'Mumbai Metro': 'मुंबई', 'Chennai Metro': 'चेन्नई', 'Kolkata Metro': 'कोलकाता', 'Bangalore Metro': 'बेंगलुरु', 'Namma Metro': 'बेंगलुरु',
  'Hyderabad Metro': 'हैदराबाद', 'Jaipur Metro': 'जयपुर', 'Kochi Metro': 'कोच्चि', 'Lucknow Metro': 'लखनऊ', 'Noida Metro': 'नोएडा', 'Rapid Metro Gurgaon': 'गुड़गांव',
  'Ahmedabad Metro': 'अहमदाबाद', 'Nagpur Metro': 'नागपुर', 'Surat Metro': 'सूरत', 'Kanpur Metro': 'कानपुर', 'Pune Metro': 'पुणे',
  'Agra Metro': 'आगरा', 'Navi Mumbai Metro': 'नवी मुंबई', 'RapidX': 'दिल्ली', 'Meerut Metro': 'मेरठ', 'Thane Ring Metro': 'ठाणे',
  'Indore Metro': 'इंदौर', 'Patna Metro': 'पटना', 'Bhoj Metro': 'भोपाल',
  'Sistema de Transporte Colectivo': 'Ciudad de México', 'STC Metro': 'Ciudad de México', 'Metrorrey': 'Monterrey', 'SITEUR': 'Guadalajara', 'Mi Tren': 'Guadalajara',
  'Toronto Transit Commission': 'Toronto', 'TTC': 'Toronto', 'Toronto subway': 'Toronto',
  'STM': 'Montréal', 'Métro de Montréal': 'Montréal',
  'Metro Vancouver': 'Vancouver', 'Translink': 'Vancouver',
  'OC Transpo': 'Ottawa', 'Calgary Transit': 'Calgary',
  'Sydney Trains': 'Sydney', 'Sydney Metro': 'Sydney', 'Metro Trains Melbourne': 'Melbourne', 'Brisbane Metro': 'Brisbane',
  'GVB': 'Amsterdam', 'Amsterdam Metro': 'Amsterdam', 'Stadsvervoer Amsterdam': 'Amsterdam',
  'RET': 'Rotterdam', 'Rotterdam Metro': 'Rotterdam', 'Rail Rotterdam': 'Rotterdam',
  'VBZ': 'Zürich', 'BVB': 'Basel', 'TPG': 'Genève', 'TL': 'Lausanne',
  'Metro de Lisboa': 'Lisboa', 'Metro do Porto': 'Porto',
  'STASY': 'Αθήνα', 'Athens Metro': 'Αθήνα',
  'İstanbul Metrosu': 'İstanbul', 'Istanbul Metro': 'İstanbul',
  'Ankara Metro': 'Ankara', 'Ankara Metrosu': 'Ankara',
  'İzmir Metrosu': 'İzmir', 'İzmir Metro': 'İzmir',
  'Adana Metrosu': 'Adana', 'BursaRay': 'Bursa',
  'Metro Warszawskie': 'Warszawa', 'Warsaw Metro': 'Warszawa', 'ZTM Warszawa': 'Warszawa',
  'Metro v Praze': 'Praha', 'Prague Metro': 'Praha', 'DPP': 'Praha',
  'Stockholm Metro': 'Stockholm', 'SL': 'Stockholm', 'Tunnelbana': 'Stockholm',
  'Metro de Santiago': 'Santiago',
  'TransMilenio': 'Bogotá', 'Metro de Bogotá': 'Bogotá', 'Metro de Medellín': 'Medellín',
  'Cairo Metro': 'القاهرة', 'الشركة المصرية لإدارة وتشغيل المترو': 'القاهرة',
  'Tehran Metro': 'تهران', 'Tehran Urban and Suburban Railway': 'تهران',
  'متروی تهران': 'تهران', 'مترو کرج': 'کرج', 'قطار شهری مشهد': 'مشهد', 'متروی شیراز': 'شیراز', 'متروی تبریز': 'تبریز',
  'Bangkok Metro': 'กรุงเทพมหานคร', 'MRT': 'กรุงเทพมหานคร', 'BTS': 'กรุงเทพมหานคร',
  'Metropolitan Rapid Transit': 'กรุงเทพมหานคร', 'รถไฟฟ้าบีทีเอส': 'กรุงเทพมหานคร',
  '台北捷運': '台北', '臺北捷運': '台北', 'Taipei Metro': '台北',
  '高雄捷運': '高雄', 'Kaohsiung Metro': '高雄',
  '桃園捷運': '桃園', 'Taoyuan Metro': '桃園', '臺中捷運': '台中',
  'SMRT': 'Singapore', 'SBS Transit': 'Singapore', 'Singapore MRT': 'Singapore',
  'Rapid KL': 'Kuala Lumpur', 'KL Metro': 'Kuala Lumpur',
  'Jakarta MRT': 'Jakarta', 'MRT Jakarta': 'Jakarta', 'Transjakarta': 'Jakarta',
  'Manila Metro Rail': 'Maynila', 'MRTC': 'Maynila', 'LRTA': 'Maynila', 'LRT': 'Maynila',
};

const FALLBACK_CITY: Record<string, string> = {
  Austria: 'Wien', Belgium: 'Bruxelles', Czech_Republic: 'Praha', Greece: 'Αθήνα', Portugal: 'Lisboa',
  Singapore: 'Singapore', Sweden: 'Stockholm', Switzerland: 'Zürich',
};

function inferCity(network: string | undefined, countryKey: string, name?: string): string {
  // 1) Infer from network first
  if (network && network.trim()) {
    const n = network.trim();
    if (NETWORK_TO_CITY[n]) return NETWORK_TO_CITY[n];
    for (const part of n.split(/\s*;\s*/)) {
      const t = part.trim();
      if (t && NETWORK_TO_CITY[t]) return NETWORK_TO_CITY[t];
    }
    const zh = n.match(/^(.+?)(?:地铁|轨道交通)\s*$/);
    if (zh) return zh[1].trim();
    const ja = n.match(/^(.+?)(?:市営地下鉄|市地下鉄|市営|市)$/);
    if (ja) return ja[1].trim();
  }
  // 2) When network is empty or unmatched, extract "XX地铁"/"XX轨道交通" from name
  if (name && name.trim()) {
    const fromName = name.trim().match(/(.+?)(?:地铁|轨道交通)/);
    if (fromName) return fromName[1].trim();
    // China: infer city from line/station name when network is missing (local language: Chinese)
    if (countryKey === 'China') {
      if (/ۈرۈمچى|乌鲁木齐/.test(name)) return '乌鲁木齐';
      if (/北京雄安|R1线/.test(name)) return '北京';
      if (/郑许线|许昌东站|长安路北/.test(name)) return '郑州';
      if (/万胜围|滘心/.test(name)) return '广州';
      if (/青岛站|青岛北站|李村公园|四川路|大河东|人民会堂|蓝谷快线/.test(name)) return '青岛';
      if (/彭家庄|第一医科大学|梁王|山东大学|邢村立交桥东|清源大街/.test(name)) return '济南';
      if (/小孟工业园|窦官|白云北路|中兴路/.test(name)) return '贵阳';
      if (/幸福.*先锋|先锋.*幸福/.test(name)) return '常州';
      if (/嘉善.*西塘|嘉善.*枫南|枫南.*嘉善|西塘.*嘉善/.test(name) || /嘉善.*市域铁路|市域铁路.*嘉善/.test(name)) return '嘉兴';
      if (/眉山城际/.test(name)) return '眉山';
    }
    // USA: name contains Skyline → Honolulu light rail
    if (countryKey === 'United_States' && /Skyline/i.test(name)) return 'Honolulu';
    // Brazil: infer from name when network is missing
    if (countryKey === 'Brazil') {
      if (/Vilarinho|Novo Eldorado|Eldorado/i.test(name)) return 'Belo Horizonte';
      if (/Águas Claras|Ceilândia|Samambaia/i.test(name)) return 'Brasília';
    }
    // Canada: no network and name matches Montreal metro (Ligne verte/orange/jaune or station names)
    if (countryKey === 'Canada' && /Ligne (verte|orange|jaune|bleue)|Honoré-Beaugrand|Montmorency|Berri-UQAM/i.test(name)) return 'Montréal';
    // Chile: no network and name contains Metro/Línea → Santiago (only metro in Chile)
    if (countryKey === 'Chile' && /Metro|Línea/i.test(name)) return 'Santiago';
    // Taiwan: no network and name matches Taipei MRT line features → 台北
    if (countryKey === 'Taiwan' && /捷運|文湖|淡水|南港|板橋|土城|信義|松山|新北投|環狀|蘆洲|中和新蘆/i.test(name)) return '台北';
    // Italy: no network and name matches Rome metro (Metro C/D, Colosseo, Pantano, etc.) → Roma
    if (countryKey === 'Italy' && /Metro [CD]|Colosseo|Pantano|Monte Compatri/i.test(name)) return 'Roma';
    // Turkey: no network and name matches Kocaeli/İzmit area (Gebze, İzmit, Körfez, Gölcük, etc.) → İzmit
    if (countryKey === 'Turkey' && /Gebze|İzmit|Gölcük|Körfez|Sabiha/i.test(name)) return 'İzmit';
    // India: no network and name contains Mumbai/Line 11 etc. → मुंबई; Green Line (u/c) → Bengaluru बेंगलुरु
    if (countryKey === 'India' && /Mumbai|Line 11|Andheri|Dahisar|Gundavali|Aarey|Cuffe Parade|Versova|Ghatkopar/i.test(name)) return 'मुंबई';
    if (countryKey === 'India' && /Green Line.*u\/c|u\/c.*Green/i.test(name)) return 'बेंगलुरु';
    // Iran: no network and name is خط ۱ etc. → Isfahan اصفهان
    if (countryKey === 'Iran' && /خط\s*[۱1]\s*$|^خط\s*۱\s*$/i.test(name || '')) return 'اصفهان';
    // Russia: no network and name matches Samara/Nizhny Novgorod line features → city in Russian
    if (countryKey === 'Russia' && /Алабинская|Юнгородок/.test(name || '')) return 'Самара';
    if (countryKey === 'Russia' && /Сормовско-Мещерская|Автозаводско-Нагорная/.test(name || '')) return 'Нижний Новгород';
    // Japan: infer from name when network is missing (local language)
    if (countryKey === 'Japan' && /仙台市営地下鉄|仙台市地下鉄/.test(name || '')) return '仙台';
    if (countryKey === 'Japan' && /副都心線|東急東横線|みなとみらい|東武東上線|西武池袋線|西武有楽町線/.test(name || '')) return '東京';
    // Egypt: name contains Alexandria → الإسكندرية (Arabic)
    if (countryKey === 'Egypt' && /Alexandria/i.test(name || '')) return 'الإسكندرية';
  }
  return FALLBACK_CITY[countryKey] ?? 'Unknown';
}

function processFile(filePath: string, countryKey: string): void {
  const raw = fs.readFileSync(filePath, 'utf8');
  let lines: { id: number; ref?: string; name?: string; network?: string; colour?: string; city?: string }[];
  try {
    lines = JSON.parse(raw);
  } catch {
    console.error(`Skip ${filePath}: invalid JSON`);
    return;
  }
  if (!Array.isArray(lines)) return;
  for (const line of lines) {
    line.city = inferCity(line.network, countryKey, line.name);
  }
  fs.writeFileSync(filePath, JSON.stringify(lines), 'utf8');
  console.log(path.basename(filePath) + ': ' + lines.length + ' lines updated');
}

function main(): void {
  console.log('Adding city information for metro lines');
  if (!fs.existsSync(LINES_DIR)) {
    console.error('Not found: ' + LINES_DIR);
    process.exit(1);
  }
  const files = fs.readdirSync(LINES_DIR).filter((f) => f.endsWith('.json'));
  for (const f of files) {
    processFile(path.join(LINES_DIR, f), f.replace(/\.json$/, ''));
  }
  console.log('Done. Processed ' + files.length + ' files.');
}

main();
