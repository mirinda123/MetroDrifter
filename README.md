<div align=center>
<img src=".\docs\img\logo_small.png"  />
</div>
<h1 align="center">
  地铁漂移 · MetroDrifter
</h1>
<p align="center">
  <a href="./docs/README_EN.md">English</a>
  <a href="./docs/README_JP.md">日本語</a>
</p>
<p align="center">
  为铁道迷设计 
    <a><img src="https://img.shields.io/badge/Powered%20By-Metro-blue"/></a>
</p>


面向铁路迷的前端地图应用🗺：基于 **OpenStreetMap**，可搜索各国地铁线路，并将线路等比例缩放后叠加到全球任意地点，方便对比不同城市地铁规模与形态

**上海地铁4号线**：

<img src=".\docs\img\shanghai_metro_4.png"  />

**漂移到东京的上海地铁四号线**：

<img src=".\docs\img\shanghai_metro_4_in_tokyo.png"  />

## 在线体验地址

https://metro-drifter.vercel.app/

## 功能

- **搜索**：按国家/地区从本地数据读取地铁线路列表
- **选线**：选择一条线路后显示在地图上
- **数据**：支持全球36个国家的数千条地铁

## 本地运行

```bash
npm install
npm run dev
```

#### （可选）更新地铁线路数据

本项目中已经包含各国的地铁数据，如果要更新，则运行：

```bash
npm run download-data
```

会通过 Overpass API 拉取地铁线路数据，元数据写入 `public/data/countries.json`、`public/data/lines/*.json`，几何坐标数据写入`public/data/geometry/*.json`。

若下载指定国家的地铁数据：

```bash
# -- 后面写国家名，多词国家请加引号
npm run download-data -- Japan
npm run download-data -- "South Korea"
npm run download-data -- China "South Korea" France
```

## 数据

- 地图数据 © [OpenStreetMap](https://www.openstreetmap.org/copyright) 贡献者  
- 铁路样式 © [OpenRailwayMap](http://www.openrailwaymap.org/)（CC-BY-SA 2.0）  
