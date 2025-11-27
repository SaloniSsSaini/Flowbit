import React, { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet-editable";
import * as turf from "@turf/turf";
import axios from "axios";
import supercluster from "supercluster";
import "leaflet.heat";
import { saveAs } from "file-saver";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const STORAGE_KEY = "flowbit_aois_v3";

function debounce(fn: any, wait = 300) {
  let t: any;
  return (...args: any[]) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export default function AdvancedMap({ showWms = true }: { showWms?: boolean }) {
  const mapRef = useRef<any>(null);
  const [aois, setAois] = useState<any[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [heatOn, setHeatOn] = useState(false);
  const [markersSample, setMarkersSample] = useState<any[]>([]);

  // Load saved AOIs + generate sample points
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setAois(JSON.parse(raw));

    const samples = Array.from({ length: 500 }).map((_, i) => ({
      type: "Feature",
      properties: { id: i },
      geometry: {
        type: "Point",
        coordinates: [
          10.4 + (Math.random() - 0.5) * 5,
          51.16 + (Math.random() - 0.5) * 5,
        ],
      },
    }));
    setMarkersSample(samples);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(aois));
  }, [aois]);

  const pushHistory = useCallback(
    (newAois: any[]) => {
      const s = JSON.stringify(newAois);
      const cut = history.slice(0, historyIndex + 1);
      cut.push(s);
      setHistory(cut);
      setHistoryIndex(cut.length - 1);
    },
    [history, historyIndex]
  );

  // Leaflet Editable
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!map.editTools) {
      map.editTools = new (L as any).Editable(map);
    }

    const createdHandler = (e: any) => {
      const gj = e.layer.toGeoJSON();
      const item = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        geojson: gj,
      };

      const updated = [...aois, item];
      setAois(updated);
      pushHistory(updated);

      if (gj.geometry.type === "Polygon") {
        const area = turf.area(gj);
        alert("Polygon Area: " + Math.round(area) + " m²");
      }
    };

    map.on("editable:created", createdHandler);
    return () => map.off("editable:created", createdHandler);
  }, [aois, pushHistory]);

  // WMS LAYER (Final working)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let wmsLayer: any = null;

    if (showWms) {
      wmsLayer = (L as any).tileLayer
        .wms("https://www.wms.nrw.de/geobasis/wms_nw_dop", {
          layers: "nw_dop",
          format: "image/jpeg",
          transparent: false,
          version: "1.1.1",
          attribution: "WMS NRW",
        })
        .addTo(map);
    }

    return () => {
      if (wmsLayer) map.removeLayer(wmsLayer);
    };
  }, [showWms]);

  // Drawing
  const drawPolygon = () => mapRef.current?.editTools?.startPolygon();
  const drawLine = () => mapRef.current?.editTools?.startPolyline();
  const drawMarker = () => mapRef.current?.editTools?.startMarker();

  // Undo / Redo
  const undo = () => {
    if (historyIndex <= 0) return;
    const prev = JSON.parse(history[historyIndex - 1]);
    setAois(prev);
    setHistoryIndex(historyIndex - 1);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const next = JSON.parse(history[historyIndex + 1]);
    setAois(next);
    setHistoryIndex(historyIndex + 1);
  };

  // Export JSON
  const exportGeo = () => {
    const blob = new Blob([JSON.stringify(aois, null, 2)], {
      type: "application/json",
    });
    saveAs(blob, "aois.json");
  };

  // Export PDF
  const exportPDF = async () => {
    const el = document.querySelector(".leaflet-container") as HTMLElement;
    if (!el) return alert("Map not ready");

    const c = await html2canvas(el);
    const img = c.toDataURL("image/png");

    const pdf = new jsPDF({ orientation: "landscape" });
    const w = pdf.internal.pageSize.getWidth();
    const h = (c.height * w) / c.width;

    pdf.addImage(img, "PNG", 0, 0, w, h);
    pdf.save("map.pdf");
  };

  // Import GeoJSON
  const importGeo = (file: File) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result as string);
        const arr = Array.isArray(data) ? data : [data];

        const updated = [
          ...aois,
          ...arr.map((g) => ({
            id: Date.now() + Math.random(),
            createdAt: new Date().toISOString(),
            geojson: g,
          })),
        ];
        setAois(updated);
        pushHistory(updated);
      } catch {
        alert("Invalid GeoJSON");
      }
    };
    r.readAsText(file);
  };

  // Heatmap
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (heatOn) {
      const pts = markersSample.map((p) => [
        p.geometry.coordinates[1],
        p.geometry.coordinates[0],
      ]);

      const layer = (L as any).heatLayer(pts, { radius: 25 }).addTo(map);
      map._heat = layer;
    } else {
      if (map._heat) map.removeLayer(map._heat);
    }
  }, [heatOn, markersSample]);

  // Search
  const doSearch = useCallback(
    debounce(async (q: string) => {
      if (!q) return setSearchResults([]);

      const res = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        { params: { q, format: "json", limit: 6 } }
      );
      setSearchResults(res.data);
    }, 400),
    []
  );

  const goTo = (r: any) => {
    mapRef.current.setView([+r.lat, +r.lon], 14);
    setSearchResults([]);
  };

  // Right click marker
  function RightClickMarker() {
    useMapEvents({
      contextmenu(e) {
        const map = mapRef.current;
        const m = L.marker(e.latlng).addTo(map);

        const newItem = {
          id: Date.now(),
          createdAt: new Date().toISOString(),
          geojson: m.toGeoJSON(),
        };

        const updated = [...aois, newItem];
        setAois(updated);
        pushHistory(updated);
      },
    });
    return null;
  }

  // AI Hull
  const convexHull = () => {
    const pts = turf.featureCollection(
      markersSample.map((p) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [
            p.geometry.coordinates[0],
            p.geometry.coordinates[1],
          ],
        },
      }))
    );

    const hull = turf.convex(pts);
    if (!hull) return alert("Unable to compute hull");

    const updated = [
      ...aois,
      { id: Date.now(), createdAt: new Date().toISOString(), geojson: hull },
    ];

    setAois(updated);
    pushHistory(updated);
  };

  return (
    <div className="h-full w-full flex">

      {/* SIDEBAR */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.4 }}
        className="w-80 bg-white p-4 border-r flex flex-col gap-3"
      >
        <h2 className="font-semibold text-lg">AOI Tools</h2>

        <input
          className="w-full border p-2"
          placeholder="Search place..."
          onKeyUp={(e) => doSearch((e.target as any).value)}
        />

        {searchResults.length > 0 && (
          <ul className="max-h-40 border overflow-auto">
            {searchResults.map((r) => (
              <li
                key={r.place_id}
                className="p-2 cursor-pointer hover:bg-gray-100"
                onClick={() => goTo(r)}
              >
                {r.display_name}
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <button onClick={drawPolygon} className="px-3 py-1 bg-blue-600 text-white rounded">
            Polygon
          </button>
          <button onClick={drawLine} className="px-3 py-1 bg-blue-600 text-white rounded">
            Line
          </button>
          <button onClick={drawMarker} className="px-3 py-1 bg-blue-600 text-white rounded">
            Marker
          </button>
        </div>

        <div className="flex gap-2">
          <button onClick={undo} className="px-3 py-1 bg-gray-300 rounded">
            Undo
          </button>
          <button onClick={redo} className="px-3 py-1 bg-gray-300 rounded">
            Redo
          </button>
        </div>

        <div className="flex gap-2">
          <button onClick={exportGeo} className="px-3 py-1 bg-green-600 text-white rounded">
            Export JSON
          </button>
          <button onClick={exportPDF} className="px-3 py-1 bg-purple-600 text-white rounded">
            Export PDF
          </button>
        </div>

        <div>
          <label className="text-sm">Import GeoJSON</label>
          <input type="file" accept=".json,.geojson" onChange={(e) => e.target.files && importGeo(e.target.files[0])} />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setHeatOn((h) => !h)}
            className="px-3 py-1 bg-orange-500 text-white rounded"
          >
            {heatOn ? "Hide Heatmap" : "Show Heatmap"}
          </button>

          <button onClick={convexHull} className="px-3 py-1 bg-red-600 text-white rounded">
            AI Hull
          </button>
        </div>

        <h4 className="font-semibold">Saved AOIs</h4>
        <div className="max-h-48 overflow-auto border p-2">
          {aois.map((a) => (
            <div key={a.id} className="border-b p-2">
              <div className="flex justify-between">
                <div>
                  <div>AOI {a.id}</div>
                  <div className="text-xs text-gray-500">
                    {a.geojson.geometry.type}
                  </div>
                </div>

                <button
                  className="text-red-500 text-xs"
                  onClick={() =>
                    setAois(aois.filter((x) => x.id !== a.id))
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

      </motion.aside>

      {/* MAP */}
      <div className="flex-1 relative">
        <MapContainer
          center={[51.1657, 10.4515]}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
          editable={true}
          whenCreated={(m) => (mapRef.current = m)}
        >
          {/* ALWAYS OSM BELOW */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap"
          />

          <RightClickMarker />
        </MapContainer>
      </div>
    </div>
  );
}
