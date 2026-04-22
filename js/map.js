/* ================================================================
   MAP — Leaflet + CartoDB Voyager (dark/light thème sync)
   6 Bd du Rajol, 81400 Carmaux — lat 44.0508 / lon 2.1602
   ================================================================ */
(function () {
  'use strict';

  var COORDS       = [44.0508, 2.1602];  /* MH Structure         */
  var MAIRIE_COORDS= [44.0514, 2.1572];  /* Mairie de Carmaux    */
  var ZOOM         = 16;
  var GMAPS_URL    = 'https://maps.google.com/?q=44.0508,2.1602';

  var TILES = {
    dark:  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
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
      scrollWheelZoom: 'center',
      zoomControl: true,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      wheelDebounceTime: 40
    });

    tileLayer = L.tileLayer(TILES[currentTheme()], {
      attribution: ATTR,
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    /* ── Marqueur principal MH Structure (gold) ── */
    var goldIcon = L.divIcon({
      className: 'map-pin',
      html: '<svg width="32" height="42" viewBox="0 0 32 42" fill="none">'
          + '<filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/></filter>'
          + '<path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26S32 28 32 16C32 7.163 24.837 0 16 0z" fill="#C9A84C" filter="url(#sh)"/>'
          + '<circle cx="16" cy="16" r="6" fill="#1a2a42"/>'
          + '<circle cx="16" cy="16" r="3" fill="#C9A84C"/>'
          + '</svg>',
      iconSize:    [32, 42],
      iconAnchor:  [16, 42],
      popupAnchor: [0, -44]
    });

    L.marker(COORDS, { icon: goldIcon })
      .addTo(map)
      .bindPopup(
          '<strong>MH Structure</strong>'
        + '<br><span>Bureau d\'études structure</span>'
        + '<br><span>6 Boulevard du Rajol</span>'
        + '<br><span>81400 Carmaux &mdash; Tarn (81)</span>'
        + '<br><a class="map-gmaps-link" href="' + GMAPS_URL + '" target="_blank" rel="noopener">'
        + '📍 Voir sur Google Maps</a>'
      )
      .openPopup();

    /* ── Marqueur secondaire Mairie de Carmaux ── */
    var mairieIcon = L.divIcon({
      className: 'map-pin',
      html: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none">'
          + '<circle cx="12" cy="12" r="10" fill="#4a6fa5" stroke="#fff" stroke-width="2"/>'
          + '<text x="12" y="16" text-anchor="middle" font-size="11" fill="#fff" font-family="sans-serif">🏛</text>'
          + '</svg>',
      iconSize:    [24, 24],
      iconAnchor:  [12, 12],
      popupAnchor: [0, -14]
    });

    L.marker(MAIRIE_COORDS, { icon: mairieIcon })
      .addTo(map)
      .bindPopup('<strong style="font-family:sans-serif">Mairie de Carmaux</strong><br><span style="font-size:0.78rem;color:#888">Place de la Mairie — 81400 Carmaux</span>');

    /* ── invalidateSize quand visible ── */
    setTimeout(function () { map.invalidateSize(); }, 100);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { map.invalidateSize(); obs.disconnect(); }
        });
      }, { threshold: 0.1 }).observe(el);
    }
  }

  /* ── Sync tuiles dark/light ── */
  function syncTiles() {
    if (!tileLayer) return;
    tileLayer.setUrl(TILES[currentTheme()] || TILES.dark);
    setTimeout(function () { if (map) map.invalidateSize(); }, 50);
  }

  new MutationObserver(syncTiles).observe(
    document.documentElement,
    { attributes: true, attributeFilter: ['data-theme'] }
  );

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
  } else {
    initMap();
  }
})();
