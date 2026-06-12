/* Bouton "retour en haut" — autonome : injecte son style et son bouton.
   Utilise les variables CSS du site (--gold, --surface, --border) avec
   valeurs de repli pour fonctionner aussi sur les pages landing. */
(function () {
  'use strict';

  var style = document.createElement('style');
  style.textContent =
    '#backToTop{position:fixed;right:22px;bottom:22px;z-index:90;width:42px;height:42px;' +
    'display:flex;align-items:center;justify-content:center;border-radius:50%;cursor:pointer;' +
    'background:var(--surface,#141E35);border:1px solid var(--border,rgba(255,255,255,0.12));' +
    'color:var(--text2,#8899B4);opacity:0;visibility:hidden;transform:translateY(8px);' +
    'transition:opacity .25s,visibility .25s,transform .25s,color .2s,border-color .2s;' +
    'box-shadow:0 4px 16px rgba(0,0,0,0.25);}' +
    '#backToTop.visible{opacity:1;visibility:visible;transform:translateY(0);}' +
    '#backToTop:hover{color:var(--gold,#C9A84C);border-color:var(--border-g,rgba(201,168,76,0.4));}' +
    '#backToTop:focus-visible{outline:2px solid var(--gold,#C9A84C);outline-offset:3px;}' +
    '@media (max-width:540px){#backToTop{right:14px;bottom:14px;width:38px;height:38px;}}';
  document.head.appendChild(style);

  var btn = document.createElement('button');
  btn.id = 'backToTop';
  btn.setAttribute('aria-label', 'Revenir en haut de la page');
  btn.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<polyline points="18 15 12 9 6 15"/></svg>';
  document.body.appendChild(btn);

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      btn.classList.toggle('visible', window.scrollY > 600);
      ticking = false;
    });
  }, { passive: true });
})();
