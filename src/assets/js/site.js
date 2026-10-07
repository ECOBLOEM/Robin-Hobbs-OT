/* Shared behaviour for every page: mobile menu + reveal-on-scroll */
(() => {
  const nav = document.querySelector('nav.top');
  const btn = nav && nav.querySelector('.menu-btn');
  if (btn) {
    const set = open => { nav.toggleAttribute('data-open', open); btn.setAttribute('aria-expanded', open); };
    btn.addEventListener('click', () => set(!nav.hasAttribute('data-open')));
    nav.querySelectorAll('.navlinks a').forEach(a => a.addEventListener('click', () => set(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape' && nav.hasAttribute('data-open')) { set(false); btn.focus(); } });
  }

  const els = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15 });
  els.forEach(el => io.observe(el));
})();
