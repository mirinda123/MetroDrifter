# 地铁漂移 · MetroDrifter

面向铁路迷的前端地图应用：基于 **OpenStreetMap** 与 **OpenRailwayMap**，可搜索各国地铁线路，并将线路**等比例缩放后叠加到全球任意地点**，方便对比不同城市地铁规模与形态。

## 功能

- **底图**：OSM 街道图 + 可选 OpenRailwayMap 铁路图层
- **搜索**：按国家/地区从本地数据读取该区域内的地铁线路列表
- **选线**：选择一条线路后从本地加载其几何并显示在地图上（红色实线）
- **叠加**：拖拽地图时，线路以当前地图中心为基准等比例显示（蓝色线），无需联网

## 技术栈

- **Vite + React**
- **Leaflet** + **react-leaflet**：地图与瓦片、GeoJSON 绘制
- **Turf.js**：几何中心、缩放与平移
- **本地数据**：国家列表、线路列表、线路几何均存于 `public/data/`，由下载脚本从 Overpass 拉取

## 使用

**1. 安装依赖并下载本地数据（首次或更新数据时执行）：**

```bash
npm install
npm run download-data
```

`download-data` 会从 Overpass API 拉取各国地铁线路及几何，写入 `public/data/countries.json`、`public/data/lines/*.json`、`public/data/geometry/*.json`。

**只下载指定国家**（`--` 后面写国家名；多词国家请加引号，不要分开写）：

```bash
npm run download-data -- Japan
npm run download-data -- "South Korea"
npm run download-data -- China "South Korea" France
```

**2. 启动开发服务器：**

```bash
npm run dev
```

浏览器打开本地地址（如 `http://localhost:5173`），在左侧选择国家并点击「搜索地铁线」，从下拉框选择线路即可；拖拽地图时蓝色叠加线会跟随当前地图中心。

## 数据与版权

- 地图数据 © [OpenStreetMap](https://www.openstreetmap.org/copyright) 贡献者  
- 铁路样式 © [OpenRailwayMap](http://www.openrailwaymap.org/)（CC-BY-SA 2.0）  
- 请遵守 Overpass API 与 OpenRailwayMap 瓦片的使用条款（非商业、限流、User-Agent 等）

## 许可证

MIT
