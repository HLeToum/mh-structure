/* ================================================================
   MAP — Leaflet + CartoDB Voyager (dark/light thème sync)
   Deux cartes dans la section "Zones d'intervention" :
     • map-carmaux    — Tarn (81)        lat 44.0508  / lon  2.1602
     • map-guadeloupe — Guadeloupe (971) lat 16.1938  / lon -61.6224
   ================================================================ */
(function () {
  'use strict';

  var TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  var ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" aria-label="OpenStreetMap (nouvelle fenêtre)">OpenStreetMap</a>'
           + ' &copy; <a href="https://carto.com/" target="_blank" rel="noopener noreferrer" aria-label="CARTO (nouvelle fenêtre)">CARTO</a>';

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
      maxZoom: 19,
      subdomains: 'abcd'
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

})();
