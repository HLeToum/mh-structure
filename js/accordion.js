/**
 * accordion.js — patho-card collapsible panels
 * Toggles aria-expanded on .patho-toggle and [data-open] on .patho-details
 * Uses CSS grid-template-rows: 0fr → 1fr for smooth animation
 */
(function () {
  'use strict';

  var grid = document.querySelector('.pathology-grid');
  if (!grid) return;

  grid.addEventListener('click', function (e) {
    var btn = e.target.closest('.patho-toggle');
    if (!btn) return;

    var isOpen   = btn.getAttribute('aria-expanded') === 'true';
    var details  = btn.closest('.patho-body').querySelector('.patho-details');

    btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');

    if (isOpen) {
      details.removeAttribute('data-open');
    } else {
      details.setAttribute('data-open', '');
    }
  });
}());
