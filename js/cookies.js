/**
 * cookies.js — bannière de consentement RGPD
 *
 * Deux modes, choisis automatiquement selon la configuration de consent.js :
 *
 *   • Aucune balise configurée → bannière informative, un seul bouton.
 *     Le site n'utilise alors que du stockage local (thème, langue), qui est
 *     exempté de consentement : rien à accepter ni à refuser.
 *
 *   • Balises Google configurées → bannière de consentement, avec un bouton
 *     « Refuser » aussi accessible que « Accepter » (exigence CNIL : refuser
 *     doit être aussi simple qu'accepter).
 *
 * La bannière est créée en JavaScript si elle n'est pas déjà dans la page,
 * afin d'être présente sur l'ensemble du site sans dupliquer le balisage.
 *
 * RGAA 7.1 : focus trap complet sur le dialog + restauration du focus.
 */
(function () {
  'use strict';

  var T = window.MHTracking;
  if (!T) return;                      // consent.js absent : on ne fait rien
  if (T.status() !== null) return;     // choix déjà exprimé : pas de bannière

  var consentMode = T.isConfigured();

  /* ── Textes (repris par i18n.js si présent) ───────────────────── */
  var FR = {
    infoText:    'Ce site utilise uniquement un stockage local pour mémoriser votre préférence de thème (clair / sombre). Aucun cookie tiers ni outil de suivi.',
    consentText: 'Nous utilisons des cookies de mesure d’audience et publicitaires (Google) pour comprendre la fréquentation du site et évaluer nos campagnes. Vous pouvez accepter ou refuser librement.',
    learn:       'Politique de confidentialité',
    accept:      'Accepter',
    refuse:      'Refuser',
    ok:          'J’ai compris'
  };

  var banner = document.getElementById('cookie-banner');
  var created = false;

  /* ── Création de la bannière si absente de la page ─────────────── */
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'true');
    banner.setAttribute('aria-label', 'Consentement cookies');
    banner.hidden = true;
    banner.innerHTML =
      '<div class="cookie-banner-inner">' +
        '<div class="cookie-banner-text">' +
          '<svg class="cookie-banner-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
            '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>' +
          '</svg>' +
          '<p data-i18n="' + (consentMode ? 'cookie.consentText' : 'cookie.text') + '"></p>' +
        '</div>' +
        '<div class="cookie-banner-actions">' +
          '<a href="/politique-confidentialite" class="cookie-banner-link" data-i18n="cookie.learn"></a>' +
          (consentMode ? '<button id="cookie-refuse" class="cookie-banner-btn cookie-banner-btn-ghost" data-i18n="cookie.refuse"></button>' : '') +
          '<button id="cookie-accept" class="cookie-banner-btn" data-i18n="' + (consentMode ? 'cookie.accept' : 'cookie.ok') + '"></button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);
    created = true;
  }

  var acceptBtn = banner.querySelector('#cookie-accept');
  var refuseBtn = banner.querySelector('#cookie-refuse');
  var learnLink = banner.querySelector('.cookie-banner-link');
  var textEl    = banner.querySelector('.cookie-banner-text p');

  if (!acceptBtn || !learnLink) return;

  /* ── La page fournit déjà le balisage : on l'adapte au mode consentement ── */
  if (!created && consentMode) {
    if (textEl) {
      textEl.setAttribute('data-i18n', 'cookie.consentText');
      textEl.textContent = FR.consentText;
    }
    acceptBtn.setAttribute('data-i18n', 'cookie.accept');
    acceptBtn.textContent = FR.accept;
    if (!refuseBtn) {
      refuseBtn = document.createElement('button');
      refuseBtn.id = 'cookie-refuse';
      refuseBtn.className = 'cookie-banner-btn cookie-banner-btn-ghost';
      refuseBtn.setAttribute('data-i18n', 'cookie.refuse');
      refuseBtn.textContent = FR.refuse;
      acceptBtn.parentNode.insertBefore(refuseBtn, acceptBtn);
    }
  }

  /* ── Repli si i18n.js n'a pas encore rempli les libellés ───────── */
  if (created) {
    if (textEl)   textEl.textContent   = consentMode ? FR.consentText : FR.infoText;
    learnLink.textContent = FR.learn;
    acceptBtn.textContent = consentMode ? FR.accept : FR.ok;
    if (refuseBtn) refuseBtn.textContent = FR.refuse;
    if (window.MHi18n && typeof window.MHi18n.apply === 'function') {
      try { window.MHi18n.apply(banner); } catch (e) {}
    }
  }

  var lastFocused = null;

  /* ── Focus trap : cycle entre le premier et le dernier focusable ── */
  function focusables() {
    return [learnLink, refuseBtn, acceptBtn].filter(Boolean);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') { e.preventDefault(); choose(false); return; }
    if (e.key !== 'Tab') return;
    var f = focusables();
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function openBanner() {
    banner.removeAttribute('hidden');
    lastFocused = document.activeElement;
    banner.addEventListener('keydown', onKeyDown);
    setTimeout(function () { learnLink.focus(); }, 50);
  }

  function closeBanner() {
    banner.setAttribute('hidden', '');
    banner.removeEventListener('keydown', onKeyDown);
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  /* ── Enregistrement du choix ───────────────────────────────────── */
  function choose(granted) {
    if (consentMode) {
      granted ? T.grant() : T.deny();
    } else {
      T.acknowledge();  // rien à charger : on mémorise seulement que l'info est lue
    }
    closeBanner();
  }

  acceptBtn.addEventListener('click', function () { choose(true); });
  if (refuseBtn) refuseBtn.addEventListener('click', function () { choose(false); });

  setTimeout(openBanner, 1200);

}());
