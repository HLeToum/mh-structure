/**
 * MH-Structure — Main JavaScript
 * GSAP animations, navbar, counters, form
 */
document.addEventListener('DOMContentLoaded', () => {

  // ── GSAP ScrollTrigger ────────────────────────────────
  gsap.registerPlugin(ScrollTrigger);

  // ── Navbar scroll effect ──────────────────────────────
  const navbar = document.getElementById('navbar');
  ScrollTrigger.create({
    start: 'top -60px',
    onUpdate(self) {
      navbar.classList.toggle('scrolled', self.progress > 0);
    },
  });

  // ── Mobile hamburger ──────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });

  // ── Hero entrance animation ───────────────────────────
  const heroTl = gsap.timeline({ delay: 0.15 });
  heroTl
    .to('.hero-tag',  { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', from: { y: 20 } })
    .fromTo('.hero-line', { opacity: 0, y: 44 }, { opacity: 1, y: 0, duration: 0.85, stagger: 0.12, ease: 'power3.out' }, '-=0.3')
    .fromTo('.hero-desc',  { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.4')
    .fromTo('.hero-btns',  { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.4')
    .fromTo('.scroll-ind', { opacity: 0 },        { opacity: 1,       duration: 0.8 }, '-=0.2');

  // ── Counter animation ─────────────────────────────────
  ScrollTrigger.create({
    trigger: '.stats-section',
    start: 'top 82%',
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

  // ── About section ─────────────────────────────────────
  gsap.from('.about-img-wrap', {
    scrollTrigger: { trigger: '.about-section', start: 'top 72%' },
    opacity: 0, x: -60, duration: 1, ease: 'power3.out',
  });
  gsap.from('.about-text-col > *', {
    scrollTrigger: { trigger: '.about-section', start: 'top 72%' },
    opacity: 0, x: 40, duration: 0.8, stagger: 0.13, ease: 'power3.out',
  });

  // ── Services ──────────────────────────────────────────
  gsap.from('.service-card', {
    scrollTrigger: { trigger: '.services-section', start: 'top 72%' },
    opacity: 0, y: 50, duration: 0.7, stagger: 0.09, ease: 'power3.out',
  });

  // ── Portfolio ─────────────────────────────────────────
  gsap.from('.project-card', {
    scrollTrigger: { trigger: '.portfolio-section', start: 'top 72%' },
    opacity: 0, y: 60, duration: 0.75, stagger: 0.1, ease: 'power3.out',
  });

  // ── Contact ───────────────────────────────────────────
  gsap.from('.contact-info > *', {
    scrollTrigger: { trigger: '.contact-section', start: 'top 72%' },
    opacity: 0, x: -40, duration: 0.8, stagger: 0.1, ease: 'power3.out',
  });
  gsap.from('.contact-form-wrap', {
    scrollTrigger: { trigger: '.contact-section', start: 'top 72%' },
    opacity: 0, x: 40, duration: 0.9, ease: 'power3.out',
  });

  // ── Section headings ──────────────────────────────────
  document.querySelectorAll('.section-head').forEach(head => {
    gsap.from(Array.from(head.children), {
      scrollTrigger: { trigger: head, start: 'top 82%' },
      opacity: 0, y: 30, duration: 0.7, stagger: 0.12, ease: 'power3.out',
    });
  });

  // ── Active nav link on scroll ─────────────────────────
  const sections    = document.querySelectorAll('section[id]');
  const navLinkEls  = document.querySelectorAll('.nav-link');

  function updateActiveLink() {
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    navLinkEls.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }
  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();

  // ── Contact form ──────────────────────────────────────
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('.submit-btn');
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Envoi en cours...';

    // Simulate async send (replace with real backend / FormSubmit / EmailJS)
    setTimeout(() => {
      btn.innerHTML = '✓ Demande envoyée avec succès !';
      btn.style.background = '#22c55e';
      btn.style.color = '#fff';
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.style.background = '';
        btn.style.color = '';
        btn.disabled = false;
        form.reset();
      }, 3500);
    }, 1400);
  });

  // ── Smooth hover tilt on project cards ───────────────
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect   = card.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) / (rect.width  / 2);
      const dy     = (e.clientY - cy) / (rect.height / 2);
      gsap.to(card, { rotateY: dx * 4, rotateX: -dy * 4, duration: 0.4, ease: 'power1.out', transformPerspective: 800 });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.5, ease: 'power2.out' });
    });
  });

});
