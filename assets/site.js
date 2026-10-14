(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.tg-rv, .tg-prose > p, .tg-prose > .tg-fig, .tg-prose > .tg-pair, .tg-prose > .tg-mosaic, .tg-prose > .tg-pull');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- scroll-driven effects ---------- */
  var bar = document.querySelector('.tg-progress span');
  var heroImg = document.querySelector('.tg-hero__img, .tg-phero__img');
  var heroCopy = document.querySelector('.tg-hero__copy');
  var route = document.querySelector('.tg-route');
  var segs = route ? Array.prototype.slice.call(route.querySelectorAll('.tg-seg')) : [];
  var lines = segs.map(function (s) { return s.querySelector('.tg-seg__line'); });
  var ports = route ? Array.prototype.slice.call(route.querySelectorAll('.tg-port')) : [];
  var label = route ? route.querySelector('[data-route-label]') : null;
  var names = segs.map(function (s) { return s.getAttribute('aria-label'); });
  var ticking = false;

  function onScroll() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    var max = doc.scrollHeight - vh;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (reduce) return;
    if (heroImg && y < vh * 1.2) {
      heroImg.style.transform = 'scale(' + (1.08 + y / vh * 0.14) + ') translateY(' + (y * 0.12) + 'px)';
    }
    if (heroCopy && y < vh) {
      heroCopy.style.opacity = String(Math.max(0, 1 - y / (vh * 0.7)));
      heroCopy.style.transform = 'translateY(' + (-y * 0.15) + 'px)';
    }
    if (route && window.innerWidth > 700) {
      var r = route.getBoundingClientRect();
      var total = r.height - vh;
      var p = Math.min(1, Math.max(0, -r.top / (total * 0.9)));
      var n = lines.length, f = p * n, cur = 0;
      for (var i = 0; i < n; i++) {
        var part = Math.min(1, Math.max(0, f - i));
        lines[i].style.strokeDashoffset = String(1 - part);
        if (part > 0) cur = i;
        if (ports[i]) ports[i].classList.toggle('is-on', part >= 1);
      }
      if (label) label.textContent = p <= 0 ? 'Zeebrugge, juni 2024' : (names[cur] || '');
    }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', req);
  onScroll();

  /* ---------- lightbox ---------- */
  var lb, lbImg, lbCount, list = [], idx = 0, lastFocus = null;
  function build() {
    lb = document.createElement('div');
    lb.className = 'tg-lb';
    lb.hidden = true;
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Foto op groot formaat');
    lb.innerHTML =
      '<div class="tg-lb__bar"><span class="tg-lb__count"></span>' +
      '<button type="button" data-a="close" aria-label="Sluiten"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
      '<div class="tg-lb__stage"><button type="button" data-a="prev" aria-label="Vorige foto"><svg width="24" height="24" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>' +
      '<img class="tg-lb__img" alt="">' +
      '<button type="button" data-a="next" aria-label="Volgende foto"><svg width="24" height="24" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button></div>';
    document.body.appendChild(lb);
    lbImg = lb.querySelector('.tg-lb__img');
    lbCount = lb.querySelector('.tg-lb__count');
    lb.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b) { var a = b.getAttribute('data-a'); if (a === 'close') close(); if (a === 'prev') go(-1); if (a === 'next') go(1); return; }
      if (e.target === lb || e.target.classList.contains('tg-lb__stage')) close();
    });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    });
    var sx = null;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      sx = null;
    });
  }
  function show() {
    lbImg.src = list[idx];
    lbCount.textContent = (idx + 1) + ' / ' + list.length;
    var nb = [list[(idx + 1) % list.length], list[(idx - 1 + list.length) % list.length]];
    nb.forEach(function (u) { var i = new Image(); i.src = u; });
  }
  function open(items, i) {
    if (!lb) build();
    list = items; idx = i; lastFocus = document.activeElement;
    lb.hidden = false; document.body.style.overflow = 'hidden';
    show();
    lb.querySelector('[data-a="close"]').focus();
  }
  function close() { lb.hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  function go(d) { idx = (idx + d + list.length) % list.length; show(); }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-full]');
    if (!t || t.closest('.tg-lb')) return;
    if (t.closest('a') && !t.closest('[data-lb-scope]') && !t.closest('[data-gallery]')) return;
    var scope = t.closest('[data-gallery], [data-lb-scope]') || document;
    var nodes = Array.prototype.slice.call(scope.querySelectorAll('[data-full]'));
    var urls = nodes.map(function (n) { return n.getAttribute('data-full'); });
    e.preventDefault();
    open(urls, Math.max(0, nodes.indexOf(t)));
  });
})();
