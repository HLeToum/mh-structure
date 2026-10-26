/* ================================================================
   MAP — Leaflet + tuiles OpenStreetMap (dark/light thème sync)
   Deux cartes dans la section "Zones d'intervention" :
     • map-carmaux    — Tarn (81)        lat 44.0508  / lon  2.1602
     • map-guadeloupe — Guadeloupe (971) lat 16.1938  / lon -61.6224
   ================================================================ */
(function () {
  'use strict';

  /* CARTO exige désormais une clé d'API (tuiles « API KEY REQUIRED ») :
     on utilise les tuiles standard d'OpenStreetMap, attribution obligatoire. */
  var TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  var ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" aria-label="OpenStreetMap (nouvelle fenêtre)">OpenStreetMap</a>';

  /* Registre de toutes les instances pour le sync thème */
  var allInstances = [];

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }

  /* ── Icône marqueur gold MH Structure ── */
  function makeGoldIcon() {
    return L.divIcon({
      className: 'map-pin',
      html: '<svg width="32" height="42" viewBox="0 0 32 42" fill="none">'
          + '<filter id="mh-sh"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/></filter>'
          + '<path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26S32 28 32 16C32 7.163 24.837 0 16 0z" fill="#C9A84C" filter="url(#mh-sh)"/>'
          + '<circle cx="16" cy="16" r="6" fill="#1a2a42"/>'
          + '<circle cx="16" cy="16" r="3" fill="#C9A84C"/>'
          + '</svg>',
      iconSize:    [32, 42],
      iconAnchor:  [16, 42],
      popupAnchor: [0, -44]
    });
  }

  /* ── Fabrique une carte Leaflet et enregistre l'instance ── */
  function createMap(elId, coords, zoom) {
    var el = document.getElementById(elId);
    if (!el) return null;
    if (typeof L === 'undefined') { console.warn('map.js : Leaflet non chargé'); return null; }

    var m = L.map(elId, {
      center: coords,
      zoom: zoom,
      scrollWheelZoom: 'center',
      zoomControl: true,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      wheelDebounceTime: 40
    });

    var tl = L.tileLayer(TILE_URL, {
      attribution: ATTR,
      maxZoom: 19
    }).addTo(m);

    allInstances.push({ map: m, tileLayer: tl });

    /* Invalide la taille dès que le conteneur est visible */
    setTimeout(function () { m.invalidateSize(); }, 120);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { m.invalidateSize(); obs.disconnect(); }
        });
      }, { threshold: 0.1 }).observe(el);
    }

    return m;
  }

    /* ================================================================
     CARTE 2 — Section "Zones" : Carmaux (map-carmaux)
     ================================================================ */
  function initZoneCarmaux() {
    var COORDS    = [44.0508, 2.1602];
    var GMAPS_URL = 'https://maps.google.com/?q=44.0508,2.1602';

    var m = createMap('map-carmaux', COORDS, 15);
    if (!m) return;

    var marker = L.marker(COORDS, { icon: makeGoldIcon() })
      .addTo(m)
      .bindPopup(
          '<strong>MH Structure</strong>'
        + '<br><span>6 Boulevard du Rajol</span>'
        + '<br><span>81400 Carmaux — Tarn (81)</span>'
        + '<br><a class="map-gmaps-link" href="' + GMAPS_URL + '" target="_blank" rel="noopener noreferrer"'
        + ' aria-label="Voir sur Google Maps (nouvel onglet)">📍 Voir sur Google Maps</a>'
      );
    var el = marker.getElement();
    if (el) el.setAttribute('aria-label', 'MH Structure Carmaux — 6 Boulevard du Rajol, 81400 Carmaux');
  }

  /* ================================================================
     CARTE 3 — Section "Zones" : Guadeloupe (map-guadeloupe)
     ================================================================ */
  function initZoneGuadeloupe() {
    var COORDS    = [16.193797, -61.622398];
    var GMAPS_URL = 'https://maps.google.com/?q=16.193797,-61.622398';

    var m = createMap('map-guadeloupe', COORDS, 15);
    if (!m) return;

    var marker = L.marker(COORDS, { icon: makeGoldIcon() })
      .addTo(m)
      .bindPopup(
          '<strong>MH Structure</strong>'
        + '<br><span>2049B Chemin de Caféire</span>'
        + '<br><span>97170 Petit-Bourg — Guadeloupe (971)</span>'
        + '<br><a class="map-gmaps-link" href="' + GMAPS_URL + '" target="_blank" rel="noopener noreferrer"'
        + ' aria-label="Voir sur Google Maps (nouvel onglet)">📍 Voir sur Google Maps</a>'
      );
    var el = marker.getElement();
    if (el) el.setAttribute('aria-label', 'MH Structure Guadeloupe — 2049B Chemin de Caféire, 97170 Petit-Bourg');
  }

  /* ── Sync tuiles dark/light sur changement de thème ── */
  function syncTiles() {
    allInstances.forEach(function (inst) {
      inst.tileLayer.setUrl(TILE_URL);
      setTimeout(function () { inst.map.invalidateSize(); }, 50);
    });
  }

  new MutationObserver(syncTiles).observe(
    document.documentElement,
    { attributes: true, attributeFilter: ['data-theme'] }
  );

  /* ── Init toutes les cartes ── */
  function initAll() {
    initZoneCarmaux();
    initZoneGuadeloupe();
  }

  /* ── Chargement de Leaflet à la demande ──────────────────────────
        leaflet.css et leaflet.js ne sont plus dans le <head> : ils sont
        téléchargés quand la section des cartes approche de l'écran
        (600 px d'avance), ce qui les sort du chemin critique. La feuille
        est ajoutée en fin de <head>, donc après style.css, comme avant. ── */
  var LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  var LEAFLET_JS  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  var leafletRequested = false;

  function loadLeaflet() {
    if (leafletRequested) return;
    leafletRequested = true;
    if (typeof L !== 'undefined') { initAll(); return; }

    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = LEAFLET_CSS;
    css.crossOrigin = 'anonymous';
    document.head.appendChild(css);

    var js = document.createElement('script');
    js.src = LEAFLET_JS;
    js.crossOrigin = 'anonymous';
    js.onload = initAll;
    document.head.appendChild(js);
  }

  function start() {
    var first = document.getElementById('map-carmaux') || document.getElementById('map-guadeloupe');
    if (!first) return;
    if (!('IntersectionObserver' in window)) { loadLeaflet(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) {
        io.disconnect();
        loadLeaflet();
      }
    }, { rootMargin: '600px 0px' });
    ['map-carmaux', 'map-guadeloupe'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

})();
