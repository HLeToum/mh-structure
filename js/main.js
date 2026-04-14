/**
 * MH-Structure — Main JS
 */

// ── Thème clair / sombre ──────────────────────────────
(function () {
  const root     = document.documentElement;
  const themeBtn = document.getElementById('themeToggle');
  if (!themeBtn) return;

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('mh-theme', theme);
    themeBtn.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'
    );
    if (window.mhSceneSetTheme) window.mhSceneSetTheme(theme);
  }

  // Synchronise avec l'attribut déjà posé par l'anti-FOUC
  applyTheme(root.getAttribute('data-theme') || 'dark');

  themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });
})();

document.addEventListener('DOMContentLoaded', () => {

  gsap.registerPlugin(ScrollTrigger);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Navbar scroll ─────────────────────────────────────
  const navbar = document.getElementById('navbar');
  ScrollTrigger.create({
    start: 'top -60px',
    onUpdate(self) {
      navbar.classList.toggle('scrolled', self.progress > 0);
    },
  });

  // ── Hamburger menu ────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    navLinks.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    hamburger.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
  });
  navLinks.querySelectorAll('.nav-link').forEach(l =>
    l.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Ouvrir le menu');
    })
  );

  // ── Fermeture menu mobile (touche Escape) ─────────────
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && hamburger.classList.contains('open')) {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Ouvrir le menu');
      hamburger.focus();
    }
  });

  // ── Hero entrance ─────────────────────────────────────
  if (reducedMotion) {
    gsap.set(['.hero-tag', '.hero-h1', '.hero-desc', '.hero-actions', '.hero-scroll'], { opacity: 1, x: 0, y: 0 });
  } else {
    const tl = gsap.timeline({ delay: 0.15 });
    tl.fromTo('.hero-tag',     { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })
      .fromTo('.hero-h1',      { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.3')
      .fromTo('.hero-desc',    { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.5')
      .fromTo('.hero-actions', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.4')
      .fromTo('.hero-scroll',  { opacity: 0 },        { opacity: 1, duration: 0.5 }, '-=0.2');
  }

  // ── Counters ──────────────────────────────────────────
  ScrollTrigger.create({
    trigger: '.metrics-strip',
    start: 'top 90%',
    once: true,
    onEnter() {
      document.querySelectorAll('.counter').forEach(el => {
        const target = parseInt(el.dataset.target, 10);
        if (reducedMotion) { el.textContent = target; return; }
        gsap.to({ val: 0 }, {
          val: target,
          duration: 1.8,
          ease: 'power2.out',
          onUpdate() { el.textContent = Math.round(this.targets()[0].val); },
        });
      });
    },
  });

  // ── Scroll animations ─────────────────────────────────
  if (!reducedMotion) {

    // About
    gsap.from('.about-visual', {
      scrollTrigger: { trigger: '.about-section', start: 'top 72%' },
      opacity: 0, x: -40, duration: 0.9, ease: 'power3.out',
    });
    gsap.from('.about-text > *', {
      scrollTrigger: { trigger: '.about-section', start: 'top 68%' },
      opacity: 0, y: 24, duration: 0.7, stagger: 0.1, ease: 'power3.out',
    });

    // Section headers
    gsap.utils.toArray('.section-header').forEach(el => {
      gsap.from(el.children, {
        scrollTrigger: { trigger: el, start: 'top 82%' },
        opacity: 0, y: 20, duration: 0.7, stagger: 0.12, ease: 'power3.out',
      });
    });

    // Service cards
    gsap.from('.svc-card', {
      scrollTrigger: { trigger: '.services-grid', start: 'top 78%' },
      opacity: 0, y: 28, duration: 0.6, stagger: 0.07, ease: 'power3.out',
    });

    // Prevention
    gsap.from('.prevention-disclaimer', {
      scrollTrigger: { trigger: '.prevention-section', start: 'top 78%' },
      opacity: 0, y: 16, duration: 0.6, ease: 'power3.out',
    });
    gsap.from('.patho-card', {
      scrollTrigger: { trigger: '.pathology-grid', start: 'top 80%' },
      opacity: 0, y: 28, duration: 0.6, stagger: 0.07, ease: 'power3.out',
    });

    // Contact
    gsap.from('.contact-left > *', {
      scrollTrigger: { trigger: '.contact-section', start: 'top 74%' },
      opacity: 0, x: -32, duration: 0.8, stagger: 0.1, ease: 'power3.out',
    });
    gsap.from('.contact-right', {
      scrollTrigger: { trigger: '.contact-section', start: 'top 74%' },
      opacity: 0, x: 32, duration: 0.85, ease: 'power3.out',
    });
  }

  // ── Active nav link ───────────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navEls   = document.querySelectorAll('.nav-link');
  function updateNav() {
    let cur = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 130) cur = s.id;
    });
    navEls.forEach(l => {
      const isActive = l.getAttribute('href') === '#' + cur;
      l.classList.toggle('active', isActive);
      if (isActive) {
        l.setAttribute('aria-current', 'page');
      } else {
        l.removeAttribute('aria-current');
      }
    });
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // ── Contact form — Web3Forms ──────────────────────────
  document.getElementById('contactForm').addEventListener('submit', async e => {
    e.preventDefault();
    const form   = e.target;
    const btn    = form.querySelector('.submit-btn');
    const status = form.querySelector('.form-status');
    const orig   = btn.innerHTML;

    // ── Validation HTML5 + aria-invalid ──────────────────
    const requiredFields = form.querySelectorAll('[required]');
    let hasError = false;
    requiredFields.forEach(field => {
      if (!field.validity.valid) {
        field.setAttribute('aria-invalid', 'true');
        hasError = true;
      } else {
        field.removeAttribute('aria-invalid');
      }
    });
    if (hasError) {
      // Focus sur le premier champ invalide
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    btn.disabled  = true;
    btn.innerHTML = 'Envoi en cours\u2026';
    if (status) status.textContent = '';

    try {
      const res  = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form),
      });
      const json = await res.json();
      if (json.success) {
        btn.innerHTML = '✓ Demande envoyée !';
        btn.classList.add('submit-btn--success');
        if (status) status.textContent = 'Votre demande a bien été envoyée. Réponse sous 48h.';
        // Retire tous les aria-invalid au succès
        requiredFields.forEach(f => f.removeAttribute('aria-invalid'));
        setTimeout(() => {
          btn.innerHTML = orig;
          btn.classList.remove('submit-btn--success');
          btn.disabled = false;
          if (status) status.textContent = '';
          form.reset();
        }, 2500);
      } else { throw new Error(); }
    } catch {
      btn.innerHTML = '✗ Erreur — réessayez';
      btn.classList.add('submit-btn--error');
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.classList.remove('submit-btn--error');
        btn.disabled = false;
      }, 3000);
    }
  });

  // ── Retire aria-invalid en temps réel quand le champ est corrigé ─
  document.getElementById('contactForm').querySelectorAll('[required]').forEach(field => {
    field.addEventListener('input', () => {
      if (field.validity.valid) field.removeAttribute('aria-invalid');
    });
  });

  // ── Marquee pause on hover ────────────────────────────
  const marquee = document.querySelector('.marquee-track');
  if (marquee && !reducedMotion) {
    marquee.addEventListener('mouseenter', () => marquee.classList.add('marquee--paused'));
    marquee.addEventListener('mouseleave', () => marquee.classList.remove('marquee--paused'));
  }

});
