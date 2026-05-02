/**
 * cookies.js — RGPD cookie consent banner
 * Shows a banner on first visit; hides after acceptance.
 * Stores consent in localStorage('mh-cookie-consent').
 * No tracking cookies are used on this site — only a localStorage preference key.
 * RGAA 7.1 : focus trap complet sur le dialog + restauration du focus à la fermeture.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'mh-cookie-consent';
  var banner      = document.getElementById('cookie-banner');
  var acceptBtn   = document.getElementById('cookie-accept');
  var learnLink   = banner ? banner.querySelector('.cookie-banner-link') : null;

  if (!banner || !acceptBtn || !learnLink) return;

  var lastFocused = null;

  /* ── Focus trap : Tab cycle entre learnLink et acceptBtn ── */
  function onKeyDown(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      // Shift+Tab depuis le premier élément → aller au dernier
      if (document.activeElement === learnLink) {
        e.preventDefault();
        acceptBtn.focus();
      }
    } else {
      // Tab depuis le dernier élément → aller au premier
      if (document.activeElement === acceptBtn) {
        e.preventDefault();
        learnLink.focus();
      }
    }
  }

  /* ── Ouvrir la bannière ── */
  function openBanner() {
    banner.removeAttribute('hidden');
    lastFocused = document.activeElement;
    banner.addEventListener('keydown', onKeyDown);
    // Déplacer le focus sur le premier élément focusable du dialog
    setTimeout(function () { learnLink.focus(); }, 50);
  }

  /* ── Fermer la bannière ── */
  function closeBanner() {
    banner.setAttribute('hidden', '');
    banner.removeEventListener('keydown', onKeyDown);
    // Restaurer le focus sur l'élément qui l'avait avant l'ouverture
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  }

  /* ── Afficher seulement si le consentement n'a pas été donné ── */
  if (!localStorage.getItem(STORAGE_KEY)) {
    setTimeout(openBanner, 1200);
  }

  /* ── Accepter = fermer + sauvegarder ── */
  acceptBtn.addEventListener('click', function () {
    localStorage.setItem(STORAGE_KEY, '1');
    closeBanner();
  });

}());
