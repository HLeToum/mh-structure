/**
 * tracking.js — remontée des conversions Google Ads
 *
 * Trois conversions sont suivies :
 *   • devis  : formulaire de contact envoyé — déclenché sur la page /merci
 *   • appel  : clic sur un lien tel:
 *   • email  : clic sur un lien mailto:
 *
 * Tout passe par window.MHTracking.conversion(), qui n'envoie rien tant que
 * le visiteur n'a pas consenti ou que les identifiants ne sont pas renseignés.
 * Ce fichier est donc sans effet — et sans risque — avant configuration.
 */
(function () {
  'use strict';

  var T = window.MHTracking;
  if (!T) return;

  /* ── Conversion « devis » : atterrissage sur la page de remerciement ──
        Web3Forms redirige vers /merci après un envoi réussi, ce qui en fait
        un signal fiable : la page n'est atteinte qu'après soumission. ── */
  var path = window.location.pathname.replace(/\/+$/, '');
  if (path === '/merci' || /\/merci\.html$/.test(path)) {
    T.conversion('devis');
  }

  /* ── Conversions « appel » et « email » : délégation sur le document,
        pour couvrir aussi les liens ajoutés dynamiquement. ── */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;

    var href = (a.getAttribute('href') || '').trim().toLowerCase();
    if (href.indexOf('tel:') === 0) {
      T.conversion('appel');
    } else if (href.indexOf('mailto:') === 0) {
      T.conversion('email');
    }
  }, true);

}());
