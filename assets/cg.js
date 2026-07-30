
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
