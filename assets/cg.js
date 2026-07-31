
  var CG_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Scroll reveal, with stagger inside a grid so cards arrive in sequence ──
  (function () {
    var reveals = document.querySelectorAll('.reveal');
    if (CG_REDUCED || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    // stamp a stagger index on siblings that share a parent grid
    var seen = new Map();
    reveals.forEach(function (el) {
      var p = el.parentElement;
      if (!p) return;
      var n = (seen.get(p) || 0);
      if (n > 0 && n <= 5) el.setAttribute('data-d', String(n));
      seen.set(p, n + 1);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  })();

  // ── Nav condenses once you scroll past the hero lip ──
  (function () {
    var nav = document.querySelector('nav');
    if (!nav) return;
    var on = false;
    function check() {
      var should = window.scrollY > 60;
      if (should !== on) { on = should; nav.classList.toggle('scrolled', on); }
    }
    check();
    window.addEventListener('scroll', check, { passive: true });
  })();

  // ── Animated number counters.
  //    Only fires on stat values that are actually numeric, so labels like
  //    "24/7" or "ISO 42001" are left exactly as written. ──
  (function () {
    if (CG_REDUCED || !('IntersectionObserver' in window)) return;
    var nums = [].filter.call(document.querySelectorAll('.stat-num'), function (el) {
      return /^\s*[$]?\d[\d,]*\s*[%+kKmM]?\s*$/.test(el.textContent);
    });
    if (!nums.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        io.unobserve(el);
        var raw = el.textContent.trim();
        var pre = raw.charAt(0) === '$' ? '$' : '';
        var suf = (raw.match(/[%+kKmM]$/) || [''])[0];
        var target = parseFloat(raw.replace(/[^0-9.]/g, ''));
        if (!isFinite(target)) return;
        var hasComma = raw.indexOf(',') !== -1;
        var start = null, dur = 1100;
        el.classList.add('counting');
        function frame(ts) {
          if (start === null) start = ts;
          var t = Math.min(1, (ts - start) / dur);
          var eased = 1 - Math.pow(1 - t, 3);
          var v = Math.round(target * eased);
          el.textContent = pre + (hasComma ? v.toLocaleString('en-US') : String(v)) + suf;
          if (t < 1) requestAnimationFrame(frame);
          else el.textContent = raw;
        }
        requestAnimationFrame(frame);
      });
    }, { threshold: 0.55 });
    nums.forEach(function (el) { io.observe(el); });
  })();

  // ── Marquee: duplicate the track once so the -50% loop is seamless ──
  (function () {
    document.querySelectorAll('.mq-track').forEach(function (track) {
      if (track.dataset.cloned === '1') return;
      track.dataset.cloned = '1';
      track.innerHTML = track.innerHTML + track.innerHTML;
    });
  })();

  // ── Scroll journey: sticky panel follows the step in view ──
  (function () {
    var wrap = document.getElementById('journey');
    if (!wrap) return;
    var steps = [].slice.call(wrap.querySelectorAll('.jr-step'));
    var dots  = [].slice.call(wrap.querySelectorAll('.jr-dot'));
    if (!steps.length) return;

    // the sticky panel reads its copy from the steps, so there is one source of truth
    var data = steps.map(function (s) {
      return {
        n: s.querySelector('.jr-step-n').textContent,
        emoji: s.querySelector('.jr-step-emoji').textContent,
        title: s.querySelector('.jr-step-head h3').textContent,
        when: s.querySelector('.jr-step-when').textContent.split('·')[0].trim()
      };
    });

    var elNum = document.getElementById('jr-num');
    var elEmoji = document.getElementById('jr-emoji');
    var elTitle = document.getElementById('jr-title');
    var elWhen = document.getElementById('jr-when');
    var elFill = document.getElementById('jr-fill');
    var current = -1;

    function show(i) {
      if (i === current || !data[i]) return;
      current = i;
      var d = data[i];
      if (!CG_REDUCED) {
        elEmoji.style.transform = 'scale(.7)';
        elEmoji.style.opacity = '0';
        elTitle.style.opacity = '0';
        setTimeout(function () {
          elEmoji.textContent = d.emoji;
          elTitle.textContent = d.title;
          elEmoji.style.transform = '';
          elEmoji.style.opacity = '1';
          elTitle.style.opacity = '1';
        }, 160);
      } else {
        elEmoji.textContent = d.emoji;
        elTitle.textContent = d.title;
      }
      elNum.textContent = d.n;
      elWhen.textContent = d.when;
      elFill.style.width = Math.round(((i + 1) / data.length) * 100) + '%';
      dots.forEach(function (dot, k) {
        dot.classList.toggle('active', k === i);
        dot.classList.toggle('done', k < i);
      });
      steps.forEach(function (s, k) { s.classList.toggle('in', k === i); });
    }

    if (!('IntersectionObserver' in window)) {
      steps.forEach(function (s) { s.classList.add('in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      // pick the entry closest to the middle of the viewport
      var best = null, bestDist = Infinity;
      entries.forEach(function (e) { if (e.isIntersecting) trackVisible(e.target, true); else trackVisible(e.target, false); });
      visible.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var dist = Math.abs((r.top + r.height / 2) - window.innerHeight / 2);
        if (dist < bestDist) { bestDist = dist; best = el; }
      });
      if (best) show(steps.indexOf(best));
    }, { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '-15% 0px -25% 0px' });

    var visible = [];
    function trackVisible(el, isIn) {
      var i = visible.indexOf(el);
      if (isIn && i === -1) visible.push(el);
      if (!isIn && i !== -1) visible.splice(i, 1);
    }

    steps.forEach(function (s) { io.observe(s); });

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var i = +dot.getAttribute('data-go');
        if (steps[i]) steps[i].scrollIntoView({ behavior: CG_REDUCED ? 'auto' : 'smooth', block: 'center' });
      });
    });

    show(0);
  })();

  // ── Instant estimate calculator (pricing page) ──
  //    Rates are duplicated from pricing.py RATES. If you change one, change both.
  (function () {
    var el = document.getElementById('calc');
    if (!el) return;

    var RATES = {
      essential_user: 20, managed_user: 65, mssp_user: 95,
      workstation: 15, server: 85,
      m365: 22, backup: 6, voip: 20
    };
    var BAND = 0.15;

    var users = document.getElementById('c-users');
    var ws    = document.getElementById('c-ws');
    var srv   = document.getElementById('c-srv');
    var tier  = 'managed';

    function money(n) {
      return '$' + Math.round(n).toLocaleString('en-US');
    }

    function recalc() {
      var u = +users.value, w = +ws.value, s = +srv.value;
      document.getElementById('c-users-v').textContent = u;
      document.getElementById('c-ws-v').textContent = w;
      document.getElementById('c-srv-v').textContent = s;

      var perUser = RATES[tier + '_user'];
      var lines = [];
      var total = 0;

      var seat = u * perUser;
      total += seat;
      lines.push([u + ' user' + (u === 1 ? '' : 's') + ' at ' + money(perUser), seat]);

      if (w > 0) {
        var wsCost = w * RATES.workstation;
        total += wsCost;
        lines.push([w + ' workstation' + (w === 1 ? '' : 's') + ' at ' + money(RATES.workstation), wsCost]);
      }
      if (s > 0) {
        var srvCost = s * RATES.server;
        total += srvCost;
        lines.push([s + ' server' + (s === 1 ? '' : 's') + ' at ' + money(RATES.server), srvCost]);
      }
      if (document.getElementById('a-m365').checked) {
        var m = u * RATES.m365; total += m;
        lines.push(['Microsoft 365 licensing', m]);
      }
      if (document.getElementById('a-backup').checked) {
        var protectedCount = w + s;
        var b = protectedCount * RATES.backup; total += b;
        lines.push(['Immutable backup, ' + protectedCount + ' endpoint' + (protectedCount === 1 ? '' : 's'), b]);
      }
      if (document.getElementById('a-voip').checked) {
        var v = u * RATES.voip; total += v;
        lines.push(['Cloud VoIP, ' + u + ' extension' + (u === 1 ? '' : 's'), v]);
      }

      document.getElementById('calc-lo').textContent = money(total * (1 - BAND));
      document.getElementById('calc-hi').textContent = money(total * (1 + BAND));

      var html = '';
      for (var i = 0; i < lines.length; i++) {
        html += '<div class="calc-line"><span>' + lines[i][0] + '</span><span>' + money(lines[i][1]) + '</span></div>';
      }
      html += '<div class="calc-line calc-line-total"><span>Midpoint</span><span>' + money(total) + ' / month</span></div>';
      if (u > 40 || w > 50) {
        html += '<div class="calc-flag">Above 40 users this calculator stops being useful. At your size the number comes down per seat, so call and we will price it properly.</div>';
      }
      document.getElementById('calc-break').innerHTML = html;
    }

    [users, ws, srv].forEach(function (i) {
      i.addEventListener('input', recalc);
    });
    ['a-m365', 'a-backup', 'a-voip'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', recalc);
    });
    [].forEach.call(document.querySelectorAll('.calc-tier'), function (b) {
      b.addEventListener('click', function () {
        [].forEach.call(document.querySelectorAll('.calc-tier'), function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        tier = b.getAttribute('data-tier');
        recalc();
      });
    });

    recalc();
  })();

  // ── Toast helper ──
  function cgToast(msg) {
    var t = document.getElementById('cgToast');
    if (!t) { t = document.createElement('div'); t.id = 'cgToast'; t.className = 'cg-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    void t.offsetWidth;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  // ── Floating contact widget ──
  (function () {
    var wrap = document.getElementById('fabWrap'), btn = document.getElementById('fabBtn');
    if (!wrap || !btn) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = wrap.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) { wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    });
  })();

  // ── Phone links: on desktop tel: often has no handler, so also copy the number
  //    and confirm visibly. Default action is NOT blocked, so softphones still dial. ──
  (function () {
    var isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="tel:"]');
      if (!a) return;
      if (isTouch) return;                     // phones/tablets: just dial
      var num = '(732) 743-5472';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('+1 732 743 5472').then(function () {
          cgToast('Number copied: ' + num);
        }).catch(function () { cgToast('Call us: ' + num); });
      } else {
        cgToast('Call us: ' + num);
      }
    }, true);
  })();

  // ── Prefill the service dropdown from ?pkg= (or ?service=) ──
  (function () {
    var MAP = {
      'itservices': 'Managed IT Services',
      'managed-it': 'Managed IT Services',
      'managed-it-services': 'Managed IT Services',
      'small-business': 'Small Business Plan',
      'cybersecurity-audit': 'Cybersecurity Audit',
      'cybersecurity': 'Cybersecurity Audit',
      'security-audit': 'Cybersecurity Audit',
      'it-consulting': 'IT Cost Consulting',
      'cost-consulting': 'IT Cost Consulting',
      'leap-software-it-support': 'Law Firm IT Support',
      'law-firm': 'Law Firm IT Support',
      'law-firm-it': 'Law Firm IT Support',
      'email-migrations': 'Email & Cloud Migrations',
      'email-migration': 'Email & Cloud Migrations',
      'migrations': 'Email & Cloud Migrations',
      'ai-support-agent': 'AI Support Agent',
      'ai-agent': 'AI Support Agent',
      'iso-42001': 'ISO/IEC 42001 AIMS Certification',
      'aims': 'ISO/IEC 42001 AIMS Certification',
      'aims-readiness': 'ISO/IEC 42001 AIMS Certification',
      'aims-implementation': 'ISO/IEC 42001 AIMS Certification',
      'aims-maintained': 'ISO/IEC 42001 AIMS Certification',
      'structured-cabling': 'Structured Cabling',
      'cabling': 'Structured Cabling',
      'voip': 'VoIP Phone Systems',
      'phones': 'VoIP Phone Systems',
      'wireless-site-survey': 'Wireless Site Survey',
      'wireless': 'Wireless Site Survey',
      'wifi': 'Wireless Site Survey'
    };
    var sel = document.getElementById('services');
    if (!sel) return;
    var q = new URLSearchParams(window.location.search);
    var raw = (q.get('pkg') || q.get('service') || '').toLowerCase().trim();
    if (!raw) return;
    var want = MAP[raw];
    if (!want) return;
    var matched = false;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].text.replace(/&amp;/g, '&').trim() === want) {
        sel.selectedIndex = i;
        matched = true;
        break;
      }
    }
    if (!matched) return;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    var wrap = sel.closest('.fld');
    if (wrap) wrap.classList.add('prefilled');
    // tell the notification email which service this came from
    var subj = document.querySelector('input[name="_subject"]');
    if (subj) subj.value = subj.value + ': ' + want;
    var tier = q.get('tier');
    var msg = document.getElementById('message');
    if (msg && !msg.value) {
      msg.setAttribute('placeholder', 'Tell us about your ' + want + ' needs…');
    }
    if (tier && msg && !msg.value) { msg.value = 'Interested in the ' + tier + ' tier. '; }
  })();


/* ═══════════════════════════════════════════════════════════════
   INTRO SEQUENCE CONTROLLER
   The overlay ships in the HTML so it paints on the first frame.
   This decides whether it runs, and tears it down when it is done.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var el = document.getElementById('cgIntro');
  if (!el) return;

  var RAIL_MS = 8000;
  var KEY = 'cg_intro_seen';
  var WINDOW_MS = 8 * 60 * 60 * 1000;   /* one working day */
  var html = document.documentElement;
  var timer = null, running = false;

  function reduced() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
  }
  /* localStorage with a timestamp rather than sessionStorage, because
     sessionStorage is per tab: someone who middle-clicks a link into a new
     tab would otherwise sit through the whole thing a second time. */
  function seen() {
    try {
      var v = localStorage.getItem(KEY);
      return !!v && (Date.now() - (+v)) < WINDOW_MS;
    } catch (e) {
      try { return sessionStorage.getItem(KEY) === '1'; } catch (e2) { return false; }
    }
  }
  function mark() {
    try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {
      try { sessionStorage.setItem(KEY, '1'); } catch (e2) {}
    }
  }

  function teardown() {
    if (!running) return;
    running = false;
    clearTimeout(timer);
    el.classList.add('cgi-out');
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('wheel', end, { passive: true });
    window.removeEventListener('touchmove', end, { passive: true });
    setTimeout(function () {
      html.classList.remove('cgi-lock', 'cgi-pending');
      /* remove it outright so nothing is left covering the page */
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 620);
  }
  function end() { mark(); teardown(); }
  function onKey(e) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') end();
  }

  /* Replacing a node with its own clone is the only reliable way to restart
     a CSS timeline without clobbering the inline animation-delay values that
     stagger the mesh and the experience bar. On the very first autoplay we
     skip it: those animations already started at parse time, which is exactly
     what we want, and resetting them would show a visible hitch. */
  var first = true;
  function restart(sel) {
    var n = el.querySelector(sel);
    if (!n || !n.parentNode) return;
    n.parentNode.replaceChild(n.cloneNode(true), n);
  }

  function play() {
    if (running || reduced()) return;
    running = true;
    el.classList.remove('cgi-out');
    el.hidden = false;
    if (!first) { restart('.cgi-stage'); restart('.cgi-rail'); }
    first = false;
    html.classList.add('cgi-lock');
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('wheel', end, { passive: true });
    window.addEventListener('touchmove', end, { passive: true });
    /* The CSS timeline starts at parse; this script starts after the load
       event. On a slow connection those drift apart, so the end of the
       sequence is driven by the progress rail finishing, not by a timer.
       The timer below is only a backstop, and it is sized from how much of
       the rail is actually left so a very late script does not leave anyone
       staring at a finished overlay. */
    var left = RAIL_MS;
    try {
      var ra = el.querySelector('.cgi-rail i').getAnimations()[0];
      if (ra && typeof ra.currentTime === 'number') {
        left = Math.max(0, RAIL_MS - ra.currentTime);
      }
    } catch (e) {}
    timer = setTimeout(end, left + 900);
  }

  el.addEventListener('animationend', function (e) {
    if (e.animationName === 'cgiRail') end();
  });

  el.addEventListener('click', end);
  var skip = document.getElementById('cgiSkip');
  if (skip) skip.addEventListener('click', function (e) { e.stopPropagation(); end(); });

  /* replay triggers, wherever they appear */
  document.querySelectorAll('[data-cgi-replay]').forEach(function (b) {
    b.addEventListener('click', function () { play(); });
  });

  /* autoplay only where the page opted in, once per session */
  if (el.dataset.auto === '1' && !seen() && !reduced()) {
    mark();
    play();
  } else {
    /* not playing: make sure nothing is locked or covering the page */
    html.classList.remove('cgi-lock', 'cgi-pending');
    if (el.dataset.auto === '1' && el.parentNode && !el.querySelector('[data-cgi-keep]')) {
      /* keep the node only if a replay button exists somewhere on this page */
      if (!document.querySelector('[data-cgi-replay]')) el.parentNode.removeChild(el);
    }
  }
})();
