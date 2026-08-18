/**
 * consent.js — Consent Mode v2 (Google) + chargement conditionnel des balises
 *
 * Doit être chargé dans le <head>, en SYNCHRONE, AVANT toute autre balise Google.
 * Le mode consentement doit être initialisé avant que gtag.js ne s'exécute,
 * sinon Google considère la page comme non conforme dans l'EEE.
 *
 * Principe :
 *   1. Tous les consentements sont refusés par défaut (exigence RGPD / CNIL).
 *   2. Aucune balise Google n'est chargée tant que le visiteur n'a pas accepté.
 *   3. Le choix est mémorisé dans localStorage('mh-cookie-consent') :
 *        'granted' = accepté | 'denied' = refusé | absent = pas encore choisi
 *
 * Expose window.MHTracking pour cookies.js et tracking.js.
 */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════════
     CONFIGURATION — les seules valeurs à renseigner

     Tant que adsId et ga4Id sont vides, AUCUN script Google n'est chargé
     et le site se comporte exactement comme avant. Rien à modifier
     ailleurs : il suffit de coller les identifiants ci-dessous.

       adsId  : Google Ads  → Objectifs → Conversions → Paramètres
                Format 'AW-1234567890'
       ga4Id  : Analytics   → Admin → Flux de données → flux web
                Format 'G-ABCD123456'

     conversions : libellés fournis par Google Ads à la création de chaque
     action de conversion. Format 'AW-1234567890/AbC-D_efGhIjKlM'.
     Une conversion sans libellé est simplement ignorée.
     ═══════════════════════════════════════════════════════════════════ */
  var CONFIG = {
    adsId: 'AW-18382343832',
    ga4Id: '',
    conversions: {
      devis: 'AW-18382343832/PP08CP-Irt8cEJidsb1E',  // « Envoi de formulaire de lead » — page /merci
      appel: '',   // clic sur un numéro de téléphone — action à créer dans Google Ads
      email: ''    // clic sur l'adresse e-mail — action à créer dans Google Ads
    }
  };

  var STORAGE_KEY = 'mh-cookie-consent';

  /* ── dataLayer + gtag : définis même sans identifiant, pour que les
        appels de conversion depuis tracking.js ne lèvent jamais d'erreur ── */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  var hasTags   = Boolean(CONFIG.adsId || CONFIG.ga4Id);
  var stored    = null;
  var tagsLoaded = false;

  try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { /* mode privé */ }

  /* Valeurs reconnues : 'granted', 'denied', 'ack' (bannière informative lue).
     Toute autre valeur — notamment l'ancien '1' de la bannière pré-Google —
     est traitée comme « pas encore choisi », pour que le visiteur puisse se
     prononcer sur les nouvelles balises. */
  if (stored !== 'granted' && stored !== 'denied' && stored !== 'ack') stored = null;

  /* Un « j'ai compris » donné avant l'installation des balises ne vaut pas
     consentement publicitaire : on redemande dès que des balises existent. */
  if (stored === 'ack' && (CONFIG.adsId || CONFIG.ga4Id)) stored = null;

  /* ── 1. État par défaut : tout refusé ──────────────────────────────
        wait_for_update laisse 500 ms à un consentement mémorisé pour
        s'appliquer avant que le moindre appel ne parte. ── */
  gtag('consent', 'default', {
    ad_storage:            'denied',
    ad_user_data:          'denied',
    ad_personalization:    'denied',
    analytics_storage:     'denied',
    functionality_storage: 'granted',  // préférences thème / langue
    security_storage:      'granted',
    wait_for_update:       500
  });

  /* ── 2. Chargement effectif des balises (seulement après accord) ── */
  function loadTags() {
    if (tagsLoaded || !hasTags) return;
    tagsLoaded = true;

    var id = CONFIG.adsId || CONFIG.ga4Id;
    var s  = document.createElement('script');
    s.async = true;
    s.src   = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);

    gtag('js', new Date());
    if (CONFIG.adsId) gtag('config', CONFIG.adsId);
    if (CONFIG.ga4Id) gtag('config', CONFIG.ga4Id, { anonymize_ip: true });
  }

  /* ── Effacement des cookies Google déjà déposés ────────────────────
        Utile lorsqu'un visiteur revient sur son accord : le retrait du
        consentement doit faire cesser le traitement, pas seulement les
        appels futurs. Les cookies Google sont posés sur le domaine et sur
        le domaine parent, d'où les deux tentatives. ── */
  function effacerCookiesGoogle() {
    var hote = window.location.hostname;
    var parent = hote.split('.').slice(-2).join('.');
    document.cookie.split(';').forEach(function (c) {
      var nom = c.split('=')[0].trim();
      if (!/^(_ga|_gid|_gcl|_gac)/.test(nom)) return;
      [hote, '.' + hote, parent, '.' + parent].forEach(function (d) {
        document.cookie = nom + '=; path=/; domain=' + d + '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      });
      document.cookie = nom + '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    });
  }

  /* ── 3. Mise à jour du consentement ────────────────────────────── */
  function update(granted) {
    var v = granted ? 'granted' : 'denied';
    gtag('consent', 'update', {
      ad_storage:         v,
      ad_user_data:       v,
      ad_personalization: v,
      analytics_storage:  v
    });
    if (granted) loadTags();
  }

  /* ── 4. Restauration d'un choix précédent ──────────────────────── */
  if (stored === 'granted') {
    update(true);
  } else if (stored === 'denied') {
    update(false);
  }

  /* ── 5. API publique ───────────────────────────────────────────── */
  window.MHTracking = {
    /** true si des identifiants sont configurés */
    isConfigured: function () { return hasTags; },

    /** 'granted' | 'denied' | null (pas encore choisi) */
    status: function () { return stored; },

    /** Le visiteur accepte : mémorise + active les balises */
    grant: function () {
      stored = 'granted';
      try { localStorage.setItem(STORAGE_KEY, 'granted'); } catch (e) {}
      update(true);
    },

    /** Le visiteur refuse : mémorise, rien n'est chargé, cookies déjà posés effacés */
    deny: function () {
      stored = 'denied';
      try { localStorage.setItem(STORAGE_KEY, 'denied'); } catch (e) {}
      update(false);
      effacerCookiesGoogle();
    },

    /** Bannière informative simplement lue (aucune balise n'était configurée) */
    acknowledge: function () {
      stored = 'ack';
      try { localStorage.setItem(STORAGE_KEY, 'ack'); } catch (e) {}
    },

    /**
     * Envoie une conversion Google Ads.
     * Sans consentement, sans identifiant ou sans libellé : ne fait rien.
     * @param {string} nom  clé de CONFIG.conversions ('devis', 'appel', 'email')
     * @param {function} [apres]  rappel exécuté une fois l'envoi terminé
     */
    conversion: function (nom, apres) {
      var label = CONFIG.conversions[nom];
      if (stored !== 'granted' || !CONFIG.adsId || !label) {
        if (typeof apres === 'function') apres();
        return;
      }
      var params = { send_to: label };
      if (typeof apres === 'function') {
        var fait = false;
        params.event_callback = function () { if (!fait) { fait = true; apres(); } };
        setTimeout(function () { if (!fait) { fait = true; apres(); } }, 900);
      }
      gtag('event', 'conversion', params);
    }
  };

}());
