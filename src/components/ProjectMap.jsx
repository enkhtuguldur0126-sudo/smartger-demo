import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLang } from '../lib/i18n.jsx';
import { href } from '../lib/router.js';
import { availableCount } from '../lib/data.js';

// Улаанбаатарын төв. Газрын зургийн дэвсгэр: OpenStreetMap (үнэгүй, эх сурвалжийг заавал харуулна).
const CENTER = [47.915, 106.92];

export default function ProjectMap({ projects }) {
  const { t, pick } = useLang();
  const el = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);

  useEffect(() => {
    map.current = L.map(el.current, { scrollWheelZoom: false }).setView(CENTER, 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => map.current.remove();
  }, []);

  useEffect(() => {
    layer.current.clearLayers();
    projects.forEach((p) => {
      const count = availableCount(p.id);
      const icon = L.divIcon({
        className: '',
        html: `<div class="pin pin-${p.status}"><span>${count}</span></div>`,
        iconSize: [36, 44],
        iconAnchor: [18, 44],
        popupAnchor: [0, -40]
      });
      const marker = L.marker(p.coords, { icon, title: pick(p.name) });
      marker.bindPopup(
        `<strong>${pick(p.name)}</strong><br>${t(`status.${p.status}`)}<br>` +
          `${t('home.availableUnits', { n: count })}<br><a href="${href('project', p.id)}">${t('common.open')} →</a>`
      );
      layer.current.addLayer(marker);
    });
    if (projects.length > 1) {
      map.current.fitBounds(L.latLngBounds(projects.map((p) => p.coords)), { padding: [40, 40], maxZoom: 14 });
    }
  }, [projects, t, pick]);

  return <div ref={el} className="map" role="region" aria-label={t('home.list')} />;
}
