
# 🌍 Flowbit AOI Creation — Frontend Engineer Internship Assignment

**By: Saloni Saini**

This project is a complete implementation of the AOI (Area of Interest) creation assignment provided by **Flowbit Private Limited**.
It converts Figma UI into a working geospatial web application using **React, TypeScript, Vite, Leaflet, Tailwind CSS & Playwright**.

---

## 📌 **🚀 Features Implemented**

### 🎯 **Core Features**

* Fully functional **interactive map dashboard**
* Leaflet Editable drawing tools:

  * Polygon
  * Polyline
  * Marker
* AOI Creation + Editing
* Area calculation (m²)
* Length calculation (km)
* AOI Save (LocalStorage)
* AOI Delete + View
* OSM basemap layer

---

### 🗺️ **Advanced Mapping Features**

* **WMS NRW Aerial Layer Overlay** (German drone/satellite imagery)
* **Heatmap visualization** (Leaflet.heat)
* **AI Convex Hull** of 500+ sample points (Turf.js)
* **Right-click → Add Quick Marker**
* **Undo / Redo functionality**
* **Supercluster** (preloaded for 1000+ points scaling)

---

### 📁 **Import / Export**

* Import GeoJSON
* Export GeoJSON
* Export full Map as PDF

---

### 🔎 **Geocoding (Search Box)**

* Nominatim API
* Live suggestions dropdown
* Click → Map zooms to that location

---

## 🧩 **Tech Stack**

| Area           | Technology                 |
| -------------- | -------------------------- |
| UI             | React + TypeScript + Vite  |
| Map Engine     | Leaflet + Leaflet Editable |
| Styling        | Tailwind CSS               |
| GIS Processing | Turf.js                    |
| Search API     | Nominatim                  |
| State          | Local Component State      |
| Testing        | Playwright                 |
| Animation      | Framer Motion              |

---

# 🧱 **Project Architecture**

```
src/
 ├── components/
 │    ├── AdvancedMap.tsx   → Main Map UI + Tools + Logic
 │    └── ...
 ├── App.tsx                → Layout wrapper
 ├── main.tsx               → App entry + Leaflet CSS
 ├── index.css              → Tailwind setup
 └── tests/
      └── map.spec.ts       → Playwright tests
```

---

# 🧠 **Why Leaflet? (Map Library Choice)**

I evaluated:
✔ Leaflet
✔ MapLibre
✔ OpenLayers
✔ react-map-gl

**I chose Leaflet** because:

* Best support for **WMS tile layers**
* Supports **Leaflet Editable** (simple drawing)
* Rich plugin ecosystem (heatmap, clustering)
* Lightweight + fast
* Works perfectly with React via react-leaflet

This matches assignment expectations.

---

# ⚡ **Performance Strategy (for 1000–10,000 points)**

Flowbit asked about handling future scaling.

My solution:

### ✔ Supercluster

Used to cluster thousands of markers efficiently.

### ✔ Heatmap Layer

Used for density visualization.

### ✔ Debounced Search

Reduces unnecessary API calls.

### ✔ WMS overlay + OSM base

Prevents overloading tile requests.

### ✔ LocalStorage AOI caching

Reduces re-renders and API pressure.

---

# 🧪 **Testing Strategy (Playwright)**

Included tests:

### ✔ Test 1

Page loads + `.leaflet-container` is visible

### ✔ Test 2

Drawing controls appear

### ✔ Test 3

Sidebar + search input appears

### With more time, I would test:

* Polygon creation → AOI list update
* Import/Export workflow
* WMS layer visibility

---

# 🔄 **Tradeoffs Made**

* Used Leaflet Editable instead of react-leaflet-draw because it is simpler and works better with free WMS layers.
* No backend → AOIs stored in LocalStorage
* Not using Redux since assignment specifically asked for **client-side only lightweight state**

---

# 🏭 **Production Readiness Improvements (If needed)**

* Authentication
* Map caching via IndexedDB
* Offline tile storage
* Type-safe GeoJSON AOI schemas
* Unit tests for utility functions
* Error boundary components
* Better loading indicators for WMS

---

# ⏱️ **Time Spent**

| Task                      | Time    |
| ------------------------- | ------- |
| Map + UI Setup            | 1.5 hrs |
| Drawing Tools + AOI Logic | 2 hrs   |
| WMS Integration           | 30 mins |
| Heatmap + Hull            | 1 hr    |
| Search + PDF Export       | 45 mins |
| Bugs, polishing, styling  | 1 hr    |
| README + Testing          | 45 mins |

Total: **~7–8 hours**

---

# 📦 **How to Run**

```
npm install
npm run dev
```

Open:
👉 [http://localhost:5173/](http://localhost:5173/)

---

# 📨 **Submission**

This project is part of the Flowbit Frontend Engineer Internship Assignment.
Submitted by **Saloni Saini**.

---

# 🎉 DONE!


