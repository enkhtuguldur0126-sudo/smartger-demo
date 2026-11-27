import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { useLang } from '../lib/i18n.jsx';
import { href } from '../lib/router.js';
import { availableCount, companyOf, isStale, startingPrice, missing, millions } from '../lib/data.js';

// Газрын зургийн дэвсгэр: OpenStreetMap. Үйлчилгээний нөхцөлийн дагуу
// эх сурвалжийг газрын зураг дээр байнга харуулна, урьдчилан татахгүй.
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const CENTER = [47.915, 106.92];

const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Pin: логоны зургаан өнцөгт хэлбэр. Хүрээтэй = төслийн шат, хагас дүүрсэн = баригдаж буй,
// бүтэн дүүрсэн = ашиглалтад орсон. Баталгаажсан компанид ✓, 60+ хоног шинэчлэлгүй бол бүдэг.
function pinHtml(project, count, verified, stale, labels) {
  const classes = ['pin', `pin-${project.status}`, stale ? 'pin-stale' : ''].join(' ');
  return `
    <div class="${classes}" aria-label="${esc(labels)}">
      <div class="pin-hex"><div class="pin-fill"></div><span class="pin-logo"><img class="logo-img" src="${import.meta.env.BASE_URL}logo-mark.png" alt="" width="18" height="18"></span></div>
      <span class="pin-count">${count}</span>
      ${verified ? '<span class="pin-verified">✓</span>' : ''}
      <span class="pin-tail"></span>
    </div>`;
}

export default function ProjectMap({ projects }) {
  const { t, pick, locale } = useLang();
  const el = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);

  useEffect(() => {
    map.current = L.map(el.current, { scrollWheelZoom: false }).setView(CENTER, 12);
    L.tileLayer(TILE_URL, {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(map.current);
    layer.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 36,
      iconCreateFunction: (cluster) =>
        L.divIcon({
          className: '',
          html: `<div class="cluster"><span>${cluster.getChildCount()}</span></div>`,
          iconSize: [44, 44]
        })
    }).addTo(map.current);
    return () => {
      map.current.stop();
      map.current.off();
      map.current.remove();
    };
  }, []);

  useEffect(() => {
    layer.current.clearLayers();
    projects.forEach((p) => {
      const company = companyOf(p);
      const count = availableCount(p.id);
      const stale = isStale(p);
      const status = t(`status.${p.status}`);
      const icon = L.divIcon({
        className: '',
        html: pinHtml(p, count, company?.verified, stale, `${pick(p.name)}, ${status}`),
        iconSize: [44, 50],
        iconAnchor: [22, 50],
        popupAnchor: [0, -46]
      });
      const price = startingPrice(p.id);
      const priceText = missing(price)
        ? `<span class="not-found">${esc(t('common.priceNotPublished'))}</span>`
        : `<strong>${esc(t('map.fromPrice', { price: millions(price.value, locale) }))}</strong>
           <span class="sourced-meta">${esc(t(`source.${price.source}`))} · ${esc(price.date)}</span>`;
      const popup = `
        <div class="popup">
          <span class="badge badge-${p.status}">${esc(status)}</span>
          <h3>${esc(pick(p.name))}</h3>
          <p class="muted">${esc(pick(company?.name))}${company?.verified ? ` <span class="verified-dot" title="${esc(t('common.verified'))}">✓</span>` : ''}</p>
          <p>${priceText}</p>
          <p class="small">${esc(t('home.availableUnits', { n: count }))}</p>
          ${stale ? `<p class="small stale-note">${esc(t('map.stale', { date: p.lastUpdate }))}</p>` : ''}
          <a class="btn btn-primary" href="${href('project', p.id)}">${esc(t('common.open'))}</a>
        </div>`;
      const marker = L.marker(p.coords, { icon, title: pick(p.name), keyboard: true });
      marker.bindPopup(popup, { minWidth: 220, maxWidth: 280 });
      layer.current.addLayer(marker);
    });
    if (projects.length > 1) {
      map.current.fitBounds(L.latLngBounds(projects.map((p) => p.coords)), { padding: [50, 50], maxZoom: 14, animate: false });
    } else if (projects.length === 1) {
      map.current.setView(projects[0].coords, 14, { animate: false });
    }
  }, [projects, t, pick, locale]);

  return <div ref={el} className="map" role="region" aria-label={t('map.label')} />;
}
