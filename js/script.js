(function () {
  'use strict';

  var doc = document;
  var win = window;
  var body = doc.body;
  var reduce = win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var burger = doc.getElementById('burgerBtn');
  var overlay = doc.getElementById('menuOverlay');
  var closeBtn = doc.getElementById('menuClose');

  function setMenu(open) {
    overlay.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    body.style.overflow = open ? 'hidden' : '';
  }
  if (burger && overlay && closeBtn) {
    burger.addEventListener('click', function () {
      setMenu(!overlay.classList.contains('open'));
    });
    closeBtn.addEventListener('click', function () { setMenu(false); });
    overlay.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  var reveals = doc.querySelectorAll('.reveal');
  reveals.forEach(function (el) {
    var d = parseInt(el.getAttribute('data-delay') || '0', 10);
    el.style.setProperty('--d', (d * 0.1) + 's');
  });
  try {
    doc.documentElement.classList.add('js');
    if ('IntersectionObserver' in win && !reduce) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('in');
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('in'); });
    }
  } catch (e) {
    doc.documentElement.classList.remove('js');
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  var navLinks = doc.querySelectorAll('.nav a');
  var pairs = [];
  navLinks.forEach(function (a) {
    var s = doc.querySelector(a.getAttribute('href'));
    if (s) pairs.push({ a: a, s: s });
  });
  if ('IntersectionObserver' in win && pairs.length) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          pairs.forEach(function (p) {
            p.a.classList.toggle('active', p.s === en.target);
          });
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    pairs.forEach(function (p) { so.observe(p.s); });
  }

  var hero = doc.querySelector('.hero');
  var heroImg = doc.getElementById('heroImg');
  var stack = doc.querySelector('.stack');
  var cards = [].slice.call(doc.querySelectorAll('.stack-card'));
  var dims = cards.map(function (c) { return c.querySelector('.stack-card__dim'); });

  var M = { heroH: 0, tops: [], heights: [], sticky: [] };
  var cur = { hero: 0, p: cards.map(function () { return 0; }) };
  var tgt = { hero: 0, p: cards.map(function () { return 0; }) };
  var running = false;

  function measure() {
    if (hero) M.heroH = hero.offsetHeight;
    if (!stack || !cards.length) return;
    var y = win.scrollY || win.pageYOffset || 0;
    var sr = stack.getBoundingClientRect();
    var cs = getComputedStyle(stack);
    var acc = sr.top + y + (parseFloat(cs.paddingTop) || 0);
    var gap = parseFloat(cs.rowGap) || 22;
    M.heights = cards.map(function (c) { return c.offsetHeight; });
    M.sticky = cards.map(function (c, i) { return 22 + i * 18; });
    M.tops = cards.map(function (c, i) {
      var t = acc;
      acc += M.heights[i] + gap;
      return t;
    });
  }

  function targets() {
    var y = win.scrollY || win.pageYOffset || 0;
    tgt.hero = Math.min(y, M.heroH) * 0.14;
    for (var i = 0; i < cards.length - 1; i++) {
      var nextTop = M.tops[i + 1] - y;
      var p = (M.sticky[i] + M.heights[i] - nextTop) / M.heights[i];
      tgt.p[i] = p < 0 ? 0 : p > 1 ? 1 : p;
    }
  }

  function write() {
    if (heroImg) heroImg.style.transform = 'translate3d(0,' + cur.hero.toFixed(2) + 'px,0)';
    for (var i = 0; i < cards.length - 1; i++) {
      var p = cur.p[i];
      cards[i].style.transform = 'scale(' + (1 - p * 0.06).toFixed(4) + ')';
      if (dims[i]) dims[i].style.opacity = (p * 0.38).toFixed(3);
    }
  }

  function frame() {
    var active = false;
    cur.hero += (tgt.hero - cur.hero) * 0.14;
    if (Math.abs(tgt.hero - cur.hero) > 0.05) active = true; else cur.hero = tgt.hero;
    for (var i = 0; i < cards.length; i++) {
      cur.p[i] += (tgt.p[i] - cur.p[i]) * 0.16;
      if (Math.abs(tgt.p[i] - cur.p[i]) > 0.001) active = true; else cur.p[i] = tgt.p[i];
    }
    write();
    if (active) requestAnimationFrame(frame); else running = false;
  }

  function kick() {
    if (reduce) return;
    targets();
    if (!running) {
      running = true;
      requestAnimationFrame(frame);
    }
  }

  var resizeRaf = 0;
  function remeasure() {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(function () {
      measure();
      targets();
      cur.hero = tgt.hero;
      cur.p = tgt.p.slice();
      write();
    });
  }

  if (!reduce && cards.length) {
    measure();
    targets();
    cur.hero = tgt.hero;
    cur.p = tgt.p.slice();
    write();
    win.addEventListener('scroll', kick, { passive: true });
    win.addEventListener('resize', remeasure, { passive: true });
    win.addEventListener('load', remeasure);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(remeasure);
  }

  function status() {
    var now = new Date();
    var h = now.getHours() + now.getMinutes() / 60;
    var open = h >= 8 && h < 20;
    var text = open ? 'Открыто · до 20:00' : 'Закрыто · откроемся в 08:00';
    doc.querySelectorAll('.js-status').forEach(function (el) { el.textContent = text; });
    doc.querySelectorAll('.js-dot').forEach(function (el) {
      el.classList.toggle('is-open', open);
      el.classList.toggle('is-closed', !open);
    });
  }
  status();
  setInterval(status, 60000);

  var cookie = doc.getElementById('cookie');
  var accepted = false;
  try { accepted = localStorage.getItem('dushechka_cookie') === '1'; } catch (e) {}
  if (cookie && !accepted) setTimeout(function () { cookie.classList.add('show'); }, 1400);
  function hideCookie() {
    if (cookie) cookie.classList.remove('show');
    try { localStorage.setItem('dushechka_cookie', '1'); } catch (e) {}
  }
  var ca = doc.getElementById('cookieAccept');
  var cc = doc.getElementById('cookieClose');
  if (ca) ca.addEventListener('click', hideCookie);
  if (cc) cc.addEventListener('click', hideCookie);

  var year = doc.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();