/**
 * consent.js — Consent Mode v2 (Google) + chargement conditionnel des balises
 *
 * Doit être chargé dans le <head>, en SYNCHRONE, AVANT toute autre balise Google.
 * Le mode consentement doit être initialisé avant que gtag.js ne s'exécute,
 * sinon Google considère la page comme non conforme dans l'EEE.
 *
 * Principe — mode consentement AVANCÉ :
 *   1. Tous les consentements sont refusés par défaut (exigence RGPD / CNIL).
 *   2. La balise est chargée dès le départ, mais en état refusé : elle ne pose
 *      aucun cookie et n'envoie aucun identifiant tant que le visiteur n'a pas
 *      accepté. Elle envoie en revanche des relevés anonymes, sans cookie, qui
 *      permettent à Google de modéliser les conversions.
 *   3. Le choix est mémorisé dans localStorage('mh-cookie-consent') :
 *        'granted' = accepté | 'denied' = refusé | absent = pas encore choisi
 *
 * Pourquoi le mode avancé — et pas le mode basique (balise chargée seulement
 * après accord) : en mode basique, un visiteur qui refuse ou qui ignore la
 * bannière n'envoie strictement rien. Google ne voit jamais la balise vivre,
 * classe l'action de conversion en « mauvaise configuration » et ne remonte
 * aucune conversion — ce qui a été constaté sur la campagne du 18 août 2026
 * (61 clics, 0 conversion). Le mode avancé conserve le même niveau de
 * protection (aucun cookie ni identifiant sans accord, identifiants
 * publicitaires expurgés via ads_data_redaction) tout en rendant la mesure
 * possible.
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

  /* ── 1 bis. Garanties du mode avancé ───────────────────────────────
        ads_data_redaction : tant que ad_storage est refusé, les
          identifiants de clic publicitaire (gclid) sont expurgés des
          relevés envoyés. Rien de nominatif ne part sans accord.
        url_passthrough : permet de conserver l'attribution d'un clic
          d'une page à l'autre par l'URL plutôt que par un cookie. ── */
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', true);

  /* ── 2. Chargement de la balise ────────────────────────────────────
        Appelé dès l'initialisation, quel que soit l'état du consentement :
        c'est ce qui distingue le mode avancé du mode basique. L'état
        « refusé » posé ci-dessus reste actif tant que le visiteur n'a pas
        accepté. ── */
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
    /* L'expurgation des identifiants publicitaires n'est levée qu'avec
       l'accord du visiteur. */
    gtag('set', 'ads_data_redaction', !granted);
  }

  /* ── 4. Restauration d'un choix précédent ──────────────────────── */
  if (stored === 'granted') {
    update(true);
  } else if (stored === 'denied') {
    update(false);
  }

  /* ── 4 bis. Chargement de la balise, consentement ou non ────────── */
  loadTags();

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
     *
     * L'envoi a lieu quel que soit l'état du consentement : c'est le mode
     * consentement qui décide de ce que contient l'appel. Sans accord, le
     * relevé part sans cookie et sans identifiant de clic (ads_data_redaction),
     * et sert uniquement à la modélisation statistique. Avec accord, la
     * conversion est attribuée nominativement au clic d'origine.
     *
     * Conditionner cet envoi au consentement — comme c'était le cas avant le
     * passage en mode avancé — revient à ne mesurer aucune conversion.
     *
     * Sans identifiant de compte ou sans libellé : ne fait rien.
     * @param {string} nom  clé de CONFIG.conversions ('devis', 'appel', 'email')
     * @param {function} [apres]  rappel exécuté une fois l'envoi terminé
     */
    conversion: function (nom, apres) {
      var label = CONFIG.conversions[nom];
      if (!CONFIG.adsId || !label) {
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
