<div align=center>
<img src=".\docs\img\logo_small.png"  />
</div>

<h1 align="center">
  メトロドリフト · MetroDrifter
</h1>
<p align="center">
  <a href="./README_EN.md">English</a> ·
  <a href="./README_JP.md">日本語</a>
</p>
<p align="center">
  鉄道ファン向け
</p>
**OpenStreetMap** をベースにした Web 地図アプリです。世界各国の地下鉄・メトロ路線を検索し、任意の地点に等倍で重ねて表示できるため、都市ごとの路線の規模や形を比較できます。

**上海メトロ4号線：**

<img src="./img/shanghai_metro_4.png" style="zoom: 33%;" />

**上海メトロ4号線を東京にドリフトした例：**

<img src="./img/shanghai_metro_4_in_tokyo.png" style="zoom: 33%;" />

## オンラインで体験

https://metro-drifter.vercel.app/

## 機能

- **検索** — 国・地域ごとにローカルデータから地下鉄路線一覧を表示
- **路線選択** — 路線を選んで地図上に表示
- **データ** — 36か国・数千路線に対応

## ローカルで実行

```bash
npm install
npm run dev
```

### （任意）地下鉄路線データの更新

リポジトリにはすでに各国のデータが含まれています。更新する場合は以下を実行してください。

```bash
npm run download-data
```

Overpass API から路線一覧と幾何データを取得し、メタデータは `public/data/countries.json` および `public/data/lines/*.json` に、幾何データは `public/data/geometry/*.json` に書き出します。

特定の国だけを取得する場合：

```bash
# -- の後に国名を指定。複数語の国名は引用符で囲む
npm run download-data -- Japan
npm run download-data -- "South Korea"
npm run download-data -- China "South Korea" France
```

## データ・クレジット

- 地図データ © [OpenStreetMap](https://www.openstreetmap.org/copyright) 貢献者  
- 鉄道スタイル © [OpenRailwayMap](http://www.openrailwaymap.org/)（CC-BY-SA 2.0）
