/**
 * MH-Structure — Main JS (redesign)
 */
document.addEventListener('DOMContentLoaded', () => {

  gsap.registerPlugin(ScrollTrigger);

  // ── Navbar ────────────────────────────────────────────
  const navbar = document.getElementById('navbar');
  ScrollTrigger.create({
    start: 'top -60px',
    onUpdate(self) {
      navbar.classList.toggle('scrolled', self.progress > 0);
    },
  });

  // ── Hamburger ─────────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('.nav-link').forEach(l =>
    l.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    })
  );

  // ── Hero entrance ─────────────────────────────────────
  const tl = gsap.timeline({ delay: 0.1 });
  tl.to('.hero-tag',  { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', fromVars: { y: 16 } })
    .fromTo('.hero-line', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out' }, '-=0.3')
    .fromTo('.hero-desc',  { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.5')
    .fromTo('.hero-btns',  { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.4')
    .fromTo('.hero-right', { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
    .fromTo('.scroll-ind', { opacity: 0 },        { opacity: 1, duration: 0.6 }, '-=0.2');

  // ── Counter animation ─────────────────────────────────
  ScrollTrigger.create({
    trigger: '.hero-metrics',
    start: 'top 90%',
    once: true,
    onEnter() {
      document.querySelectorAll('.counter').forEach(el => {
        const target = parseInt(el.dataset.target, 10);
        gsap.to({ val: 0 }, {
          val: target,
          duration: 1.8,
          ease: 'power2.out',
          onUpdate() { el.textContent = Math.round(this.targets()[0].val); },
        });
      });
    },
  });

  // ── About ─────────────────────────────────────────────
  gsap.from('.about-left', {
    scrollTrigger: { trigger: '.about-section', start: 'top 72%' },
    opacity: 0, x: -50, duration: 1, ease: 'power3.out',
  });
  gsap.from('.about-right > *', {
    scrollTrigger: { trigger: '.about-section', start: 'top 72%' },
    opacity: 0, y: 30, duration: 0.8, stagger: 0.12, ease: 'power3.out',
  });

  // ── Section labels ────────────────────────────────────
  gsap.utils.toArray('.section-label').forEach(el => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 85%' },
      opacity: 0, x: -20, duration: 0.7, ease: 'power2.out',
    });
  });

  // ── Section headers ───────────────────────────────────
  gsap.utils.toArray('.section-header-row').forEach(el => {
    gsap.from(el.children, {
      scrollTrigger: { trigger: el, start: 'top 80%' },
      opacity: 0, y: 24, duration: 0.7, stagger: 0.15, ease: 'power3.out',
    });
  });

  // ── Service rows ──────────────────────────────────────
  gsap.from('.svc-row', {
    scrollTrigger: { trigger: '.svc-list', start: 'top 75%' },
    opacity: 0, y: 30, duration: 0.6, stagger: 0.08, ease: 'power3.out',
  });

  // ── Portfolio cards ───────────────────────────────────
  gsap.from('.project-card', {
    scrollTrigger: { trigger: '.portfolio-grid', start: 'top 75%' },
    opacity: 0, y: 40, duration: 0.7, stagger: 0.1, ease: 'power3.out',
  });

  // ── Contact ───────────────────────────────────────────
  gsap.from('.contact-left > *', {
    scrollTrigger: { trigger: '.contact-section', start: 'top 72%' },
    opacity: 0, x: -40, duration: 0.8, stagger: 0.1, ease: 'power3.out',
  });
  gsap.from('.contact-right', {
    scrollTrigger: { trigger: '.contact-section', start: 'top 72%' },
    opacity: 0, x: 40, duration: 0.9, ease: 'power3.out',
  });

  // ── Active nav link ───────────────────────────────────
  const sections   = document.querySelectorAll('section[id]');
  const navEls     = document.querySelectorAll('.nav-link');
  function updateNav() {
    let cur = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 120) cur = s.id;
    });
    navEls.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + cur));
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // ── Contact form ──────────────────────────────────────
  document.getElementById('contactForm').addEventListener('submit', e => {
    e.preventDefault();
    const btn = e.target.querySelector('.submit-btn');
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Envoi en cours...';
    setTimeout(() => {
      btn.innerHTML = '✓ Demande envoyée !';
      btn.style.background = '#22c55e';
      btn.style.color = '#fff';
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.style.background = '';
        btn.style.color = '';
        btn.disabled = false;
        e.target.reset();
      }, 3200);
    }, 1400);
  });

  // ── Marquee pause on hover ────────────────────────────
  const marqueeTrack = document.querySelector('.marquee-track');
  if (marqueeTrack) {
    marqueeTrack.addEventListener('mouseenter', () => marqueeTrack.style.animationPlayState = 'paused');
    marqueeTrack.addEventListener('mouseleave', () => marqueeTrack.style.animationPlayState = 'running');
  }

  // ── Hero bg text parallax ─────────────────────────────
  const bgText = document.querySelector('.hero-bg-text');
  if (bgText) {
    window.addEventListener('scroll', () => {
      bgText.style.transform = `translateX(-50%) translateY(${window.scrollY * 0.15}px)`;
    }, { passive: true });
  }

});
