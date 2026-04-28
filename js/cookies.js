/**
 * cookies.js — RGPD cookie consent banner
 * Shows a banner on first visit; hides after acceptance.
 * Stores consent in localStorage('mh-cookie-consent').
 * No tracking cookies are used on this site — only a localStorage preference key.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'mh-cookie-consent';
  var banner = document.getElementById('cookie-banner');
  var acceptBtn = document.getElementById('cookie-accept');

  if (!banner || !acceptBtn) return;

  // Show banner only if consent not yet given
  if (!localStorage.getItem(STORAGE_KEY)) {
    // Slight delay so the page loads first
    setTimeout(function () {
      banner.removeAttribute('hidden');
    }, 1200);
  }

  acceptBtn.addEventListener('click', function () {
    localStorage.setItem(STORAGE_KEY, '1');
    banner.setAttribute('hidden', '');
  });
}());
