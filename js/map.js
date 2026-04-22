/* ================================================================
   MAP — Leaflet + CartoDB tiles (dark/light thème sync)
   6 Bd du Rajol, 81400 Carmaux (44.0507°N, 2.1578°E)
   ================================================================ */
(function () {
  'use strict';

  var COORDS = [44.0499, 2.1618];
  var ZOOM   = 16;
  var TILES  = {
    dark:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
  };
  var ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
           + ' &copy; <a href="https://carto.com/" target="_blank" rel="noopener">CARTO</a>';

  var map, tileLayer;

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }

  function initMap() {
    var el = document.getElementById('about-map');
    if (!el) { console.warn('map.js : #about-map introuvable'); return; }
    if (typeof L === 'undefined') { console.warn('map.js : Leaflet non chargé'); return; }

    map = L.map('about-map', {
      center: COORDS,
      zoom: ZOOM,
      scrollWheelZoom: false,
      zoomControl: true
    });

    tileLayer = L.tileLayer(TILES[currentTheme()], {
      attribution: ATTR,
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    /* ── Marqueur gold ── */
    var goldIcon = L.divIcon({
      className: 'map-pin',
      html: '<svg width="28" height="36" viewBox="0 0 28 36" fill="none">'
          + '<path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="#C9A84C"/>'
          + '<circle cx="14" cy="14" r="5" fill="#0F1929"/>'
          + '</svg>',
      iconSize:    [28, 36],
      iconAnchor:  [14, 36],
      popupAnchor: [0, -38]
    });

    L.marker(COORDS, { icon: goldIcon })
      .addTo(map)
      .bindPopup(
        '<strong>MH Structure</strong>'
        + '<br><span>Bureau d\'études structure</span>'
        + '<br><span>6 Boulevard du Rajol</span>'
        + '<br><span>81400 Carmaux &mdash; Tarn (81)</span>'
      )
      .openPopup();

    /* ── Recalcul de la taille quand la section entre dans le viewport ── */
    setTimeout(function () { map.invalidateSize(); }, 100);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            map.invalidateSize();
            obs.disconnect();
          }
        });
      }, { threshold: 0.1 }).observe(el);
    }
  }

  /* ── Synchronisation tuiles dark / light ── */
  function syncTiles() {
    if (!tileLayer) return;
    tileLayer.setUrl(TILES[currentTheme()] || TILES.dark);
    setTimeout(function () { if (map) map.invalidateSize(); }, 50);
  }

  new MutationObserver(syncTiles).observe(
    document.documentElement,
    { attributes: true, attributeFilter: ['data-theme'] }
  );

  /* ── Init : le DOM est déjà prêt (script en bas de body) ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
  } else {
    initMap();
  }

})();
