"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Polígono simplificado do Brasil ─────────────────────────────────────────

const BRAZIL_LATLNGS: L.LatLngTuple[] = [
  [-4.39,-51.20],[-1.76,-50.07],[0.64,-51.08],[1.55,-50.08],[3.48,-51.53],
  [4.22,-54.26],[4.84,-60.20],[3.88,-63.82],[2.72,-66.27],[1.41,-68.68],
  [-0.11,-70.13],[-0.86,-72.08],[-2.14,-75.57],[-4.22,-74.00],[-6.11,-73.02],
  [-8.46,-74.00],[-10.00,-72.08],[-11.00,-70.64],[-12.65,-68.87],[-13.48,-69.04],
  [-15.10,-69.60],[-17.58,-69.45],[-18.27,-70.36],[-21.05,-68.19],
  [-22.22,-65.77],[-21.92,-63.64],[-20.24,-61.97],[-20.54,-58.17],
  [-22.43,-57.56],[-23.54,-55.65],[-24.05,-53.65],[-25.28,-53.79],
  [-27.19,-53.64],[-28.56,-49.97],[-30.18,-51.24],[-31.44,-51.98],
  [-33.74,-53.40],[-33.02,-52.78],[-28.57,-48.55],[-26.25,-48.52],
  [-24.44,-46.83],[-23.34,-44.83],[-21.26,-40.99],[-19.66,-39.75],
  [-17.36,-39.18],[-14.70,-38.92],[-12.96,-37.60],[-10.91,-37.11],
  [-8.81,-35.18],[-5.78,-35.22],[-2.90,-41.72],[-2.54,-44.33],
  [-1.00,-48.00],[-4.39,-51.20],
];

// ─── Coordenadas ──────────────────────────────────────────────────────────────

export const STATE_CAPITALS: Record<string, [number, number]> = {
  AC: [-9.9748,  -67.8243], AL: [ -9.6658, -35.7353], AM: [ -3.1317, -60.0217],
  AP: [  0.0355, -51.0705], BA: [-12.9714, -38.5014], CE: [ -3.7327, -38.5270],
  DF: [-15.7801, -47.9292], ES: [-20.3155, -40.3128], GO: [-16.6864, -49.2643],
  MA: [ -2.5297, -44.3028], MG: [-19.9167, -43.9345], MS: [-20.4697, -54.6201],
  MT: [-15.5989, -56.0949], PA: [ -1.4558, -48.4902], PB: [ -7.1150, -34.8641],
  PE: [ -8.0578, -34.8829], PI: [ -5.0892, -42.8019], PR: [-25.4297, -49.2711],
  RJ: [-22.9068, -43.1729], RN: [ -5.7945, -35.2110], RO: [ -8.7612, -63.9004],
  RR: [  2.8235, -60.6758], RS: [-30.0346, -51.2177], SC: [-27.5954, -48.5480],
  SE: [-10.9111, -37.0717], SP: [-23.5505, -46.6333], TO: [-10.2491, -48.3243],
};

export const REGIAO_CENTERS: Record<string, [number, number]> = {
  Norte:          [ -3.4, -65.3],
  Nordeste:       [ -8.5, -39.0],
  "Centro-Oeste": [-15.0, -53.0],
  Sudeste:        [-20.5, -43.8],
  Sul:            [-27.0, -51.5],
};

export const REGIAO_RADIUS_M: Record<string, number> = {
  Norte: 1_400_000, Nordeste: 800_000, "Centro-Oeste": 900_000,
  Sudeste: 500_000, Sul: 450_000,
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CityRadius { city: string; radius: number; lat?: number; lng?: number; maxRadius?: number; }
type LocationMode = "brasil" | "regioes" | "estados" | "cidades";

interface Props {
  mode: LocationMode;
  regioes: string[];
  estados: string[];
  cidades: CityRadius[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDivIcon(html: string) {
  return L.divIcon({ className: "", html, iconSize: [0, 0] });
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function LocationMap({ mode, regioes, estados, cidades }: Props) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const mapRef         = useRef<L.Map | null>(null);
  const layerGroupRef  = useRef<L.LayerGroup | null>(null);

  // Inicializa o mapa uma única vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [-15, -52], zoom: 4,
      scrollWheelZoom: true, zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);
    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Atualiza camadas sempre que as props mudam
  useEffect(() => {
    const map = mapRef.current;
    const lg  = layerGroupRef.current;
    if (!map || !lg) return;

    lg.clearLayers();

    const yellow = "#ffcc01";

    if (mode === "brasil") {
      L.polygon(BRAZIL_LATLNGS, {
        color: yellow, fillColor: yellow,
        fillOpacity: 0.1, weight: 2, dashArray: "8 5",
      }).addTo(lg);
      map.fitBounds(L.latLngBounds(BRAZIL_LATLNGS), { padding: [20, 20] });
    }

    if (mode === "regioes" && regioes.length > 0) {
      const pts: L.LatLngTuple[] = [];
      regioes.forEach((r) => {
        const center = REGIAO_CENTERS[r];
        if (!center) return;
        L.circle(center, {
          radius: REGIAO_RADIUS_M[r] ?? 700_000,
          color: yellow, fillColor: yellow, fillOpacity: 0.13, weight: 2,
        }).addTo(lg);
        L.marker(center, {
          icon: makeDivIcon(
            `<div style="background:#ffcc01;color:#111;font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px;white-space:nowrap;box-shadow:0 2px 8px #0007">${r}</div>`
          ),
        }).addTo(lg);
        pts.push(center);
      });
      if (pts.length === 1) { map.setView(pts[0], 5); }
      else if (pts.length > 1) { map.fitBounds(L.latLngBounds(pts).pad(0.4)); }
    }

    if (mode === "estados" && estados.length > 0) {
      const pts: L.LatLngTuple[] = [];
      estados.forEach((uf) => {
        const pos = STATE_CAPITALS[uf];
        if (!pos) return;
        L.circleMarker(pos, { radius: 9, color: yellow, fillColor: yellow, fillOpacity: 0.8, weight: 2 })
          .bindTooltip(uf, { permanent: true, direction: "top", offset: [0, -8],
            className: "leaflet-tooltip-diverti" })
          .addTo(lg);
        pts.push(pos);
      });
      if (pts.length === 1) { map.setView(pts[0], 7); }
      else if (pts.length > 1) { map.fitBounds(L.latLngBounds(pts).pad(0.4)); }
      else { map.setView([-15, -52], 4); }
    }

    if (mode === "cidades") {
      const centers: L.LatLngTuple[] = [];
      const allPts: L.LatLngTuple[] = [];
      cidades.forEach(({ city, radius, lat, lng }) => {
        if (lat == null || lng == null) return;
        const pos: L.LatLngTuple = [lat, lng];
        const r_m = radius * 1000; // km → metros
        L.circle(pos, { radius: r_m, color: yellow, fillColor: yellow, fillOpacity: 0.13, weight: 2 }).addTo(lg);
        L.circleMarker(pos, { radius: 6, color: yellow, fillColor: "#fff", fillOpacity: 1, weight: 2 })
          .bindTooltip(`<b>${city}</b><br>${radius} km`, { direction: "top" })
          .addTo(lg);
        centers.push(pos);
        // pontos nas bordas do círculo para o fitBounds englobar o círculo inteiro
        const deg = r_m / 111_320;
        const degLng = deg / Math.cos((lat * Math.PI) / 180);
        allPts.push([lat + deg, lng], [lat - deg, lng], [lat, lng + degLng], [lat, lng - degLng]);
      });
      if (allPts.length > 0) {
        // maxZoom: garante que raios pequenos não zoem demais —
        // zoom 13 ≈ área de ~5km visível, bom para ver a cidade ao redor do círculo
        const maxRadius = Math.max(...cidades.filter(c => c.lat != null).map(c => c.radius));
        const maxZoom = maxRadius <= 5 ? 13 : maxRadius <= 20 ? 12 : maxRadius <= 100 ? 10 : 8;
        map.fitBounds(L.latLngBounds(allPts).pad(0.3), { maxZoom });
      } else if (centers.length > 0) {
        map.setView(centers[0], 10);
      } else {
        map.setView([-15, -52], 4);
      }
    }
  }, [mode, regioes, estados, cidades]);

  return (
    <div style={{ position: "relative" }}>
      <div ref={containerRef} style={{ height: 320, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)" }} />
      <style>{`
        .leaflet-tooltip-diverti {
          background: #ffcc01; color: #111; border: none; font-weight: 700;
          font-size: 11px; padding: 2px 6px; border-radius: 4px; box-shadow: 0 2px 8px #0006;
        }
        .leaflet-tooltip-diverti::before { display: none; }
      `}</style>
    </div>
  );
}
