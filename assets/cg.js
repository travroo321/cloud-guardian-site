
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

      // Hand the result to /next-steps/. The estimate is the reason someone
      // is ready for the next step, so it travels with them.
      var range = money(total * (1 - BAND)) + ' to ' + money(total * (1 + BAND)) + ' / month';
      try { sessionStorage.setItem('cg_estimate', range); } catch (e) {}
      var ho = document.getElementById('calcNext');
      if (ho) {
        ho.classList.add('on');
        var link = document.getElementById('calcNextLink');
        if (link) link.href = '/next-steps/?est=' + encodeURIComponent(range);
        var lbl = document.getElementById('calcNextVal');
        if (lbl) lbl.textContent = range;
      }
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
   NEXT STEPS JOURNEY
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var fork = document.getElementById('fork');
  if (!fork) return;

  var branch  = document.getElementById('branch');
  var book    = document.getElementById('book');
  var rail    = document.getElementById('jrRail');
  var railF   = document.getElementById('jrRailFill');
  var carry   = document.getElementById('jrCarry');
  var carryV  = document.getElementById('jrCarryVal');
  var recapUl = document.getElementById('jrRecapList');
  var fSit    = document.getElementById('fSituation');
  var fEst    = document.getElementById('fEstimate');
  var chosen  = null;

  var LABELS = {};
  [].forEach.call(document.querySelectorAll('.jf-card'), function (c) {
    LABELS[c.dataset.pick] = c.querySelector('strong').textContent.trim();
  });

  /* ── 1. the estimate carried over from /pricing/ ── */
  function readEstimate() {
    var q = new URLSearchParams(location.search).get('est');
    if (q) return decodeURIComponent(q);
    try { return sessionStorage.getItem('cg_estimate') || ''; } catch (e) { return ''; }
  }
  var est = readEstimate();
  if (est) {
    carryV.textContent = est;
    carry.hidden = false;
    if (fEst) fEst.value = est;
  }

  /* ── 2. the fork ── */
  function choose(key, scroll) {
    chosen = key;
    [].forEach.call(branch.querySelectorAll('[data-path]'), function (sec) {
      sec.hidden = (sec.dataset.path !== key);
    });
    [].forEach.call(document.querySelectorAll('.jf-card'), function (c) {
      var on = c.dataset.pick === key;
      c.classList.toggle('picked', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    book.hidden = false;
    if (fSit) fSit.value = LABELS[key] || key;
    buildRecap();
    observePanels();
    if (rail) rail.classList.add('on');
    try { history.replaceState(null, '', '#path-' + key); } catch (e) {}
    if (scroll !== false) {
      var target = branch.querySelector('[data-path="' + key + '"]');
      if (target) {
        var y = target.getBoundingClientRect().top + window.pageYOffset - 84;
        window.scrollTo({ top: y, behavior: CG_PREFERS_STILL() ? 'auto' : 'smooth' });
      }
    }
  }
  function CG_PREFERS_STILL() {
    try { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
  }

  [].forEach.call(document.querySelectorAll('.jf-card'), function (c) {
    c.setAttribute('aria-pressed', 'false');
    c.addEventListener('click', function () { choose(c.dataset.pick, true); });
  });

  /* deep link straight to a path */
  var h = (location.hash || '').replace('#path-', '');
  if (h && branch.querySelector('[data-path="' + h + '"]')) choose(h, false);

  /* ── 3. the running brief ── */
  function buildRecap() {
    if (!recapUl) return;
    var items = [];
    if (chosen) items.push(['Situation', LABELS[chosen]]);
    if (est) items.push(['Estimated monthly', est]);
    var svc = [].filter.call(
      document.querySelectorAll('.jf-chip input:checked'),
      function () { return true; }).map(function (i) { return i.value; });
    if (svc.length) items.push(['Wants covered', svc.join(', ')]);
    var day = document.getElementById('f-day');
    var slot = document.getElementById('f-slot');
    if (day && day.value && slot && slot.value) {
      items.push(['Meeting', day.value + ', ' + slot.value]);
    }
    recapUl.innerHTML = items.map(function (kv) {
      return '<li><span>' + kv[0] + '</span><strong></strong></li>';
    }).join('');
    /* set text rather than interpolating, so user input can never be markup */
    [].forEach.call(recapUl.querySelectorAll('li'), function (li, i) {
      li.querySelector('strong').textContent = items[i][1];
    });
  }
  document.addEventListener('change', function (e) {
    if (e.target.closest && e.target.closest('.jr-form')) buildRecap();
  });

  /* ── 4. panels assemble as they enter the frame ── */
  var seen = new WeakSet();
  function observePanels() {
    if (CG_PREFERS_STILL()) {
      [].forEach.call(document.querySelectorAll('.jp-panel'), function (p) {
        p.classList.add('in');
      });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !seen.has(en.target)) {
          seen.add(en.target);
          en.target.classList.add('in');
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    [].forEach.call(document.querySelectorAll('.jp-panel:not(.in)'), function (p) {
      io.observe(p);
    });
  }

  /* ── 5. progress rail across the chosen path ── */
  function railTick() {
    if (!railF || !chosen) return;
    var sec = branch.querySelector('[data-path="' + chosen + '"]');
    if (!sec || sec.hidden) return;
    var start = sec.offsetTop - 120;
    var stop  = book.offsetTop + book.offsetHeight - window.innerHeight;
    var p = (window.pageYOffset - start) / Math.max(1, stop - start);
    railF.style.width = (Math.min(1, Math.max(0, p)) * 100).toFixed(1) + '%';
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { railTick(); ticking = false; });
  }, { passive: true });

  /* ── 6. the meeting date must be a real future weekday ── */
  var day = document.getElementById('f-day');
  if (day) {
    var d = new Date();
    d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    var iso = function (x) {
      return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') +
             '-' + String(x.getDate()).padStart(2, '0');
    };
    day.min = iso(d);
    var max = new Date(); max.setDate(max.getDate() + 90);
    day.max = iso(max);
    day.value = iso(d);
    day.addEventListener('change', function () {
      var picked = new Date(day.value + 'T12:00:00');
      var hint = document.getElementById('dayHint');
      if (picked.getDay() === 0 || picked.getDay() === 6) {
        hint.textContent = 'That is a weekend. We will call to arrange a weekday slot, or sooner if it is urgent.';
        hint.classList.add('warn');
      } else {
        hint.textContent = 'Weekdays only. We confirm by phone within one business hour.';
        hint.classList.remove('warn');
      }
    });
  }

  /* ── 7. submit ── */
  var form = document.getElementById('jrForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      if (!chosen) {
        e.preventDefault();
        document.getElementById('fork').scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (window.cgToast) window.cgToast('Pick your situation first, it takes one click.');
        return;
      }
      var btn = form.querySelector('.jr-submit');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending your brief...'; }
    });
  }
})();


/* ═══════════════════════════════════════════════════════════════
   WHY CHOOSE US PLAYER
   A JavaScript timeline rather than CSS delays, so a voiceover can
   become the clock later without touching the markup. Drop an mp3 at
   /assets/why-choose-us.mp3 and audio drives it; with no file it runs
   silently off requestAnimationFrame and the captions carry the story.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var stage = document.getElementById('wuStage');
  if (!stage) return;

  var CH = [[0.0, 5.02], [5.02, 9.64], [9.64, 14.26], [14.26, 19.938], [19.938, 24.958], [24.958, 30.0]];
  var RUNTIME = +stage.dataset.runtime;
  var scenes  = [].slice.call(stage.querySelectorAll('.wu-scene'));
  var caps    = [].slice.call(stage.querySelectorAll('.wu-cap'));
  var dots    = [].slice.call(stage.querySelectorAll('.wu-dotnav'));
  var fill    = document.getElementById('wuFill');
  var track   = document.getElementById('wuTrack');
  var timeL   = document.getElementById('wuTime');
  var chapL   = document.getElementById('wuChapter');
  var toggle  = document.getElementById('wuToggle');
  var muteBtn = document.getElementById('wuMute');
  var replay  = document.getElementById('wuReplay');
  var playBtn = document.getElementById('wuPlay');
  var audio   = document.getElementById('wuAudio');
  var bed     = document.getElementById('wuBed');
  /* the bank screen appears in three shots, so there are three copies of
     the amount. an id would only ever have found the first one, and the
     other two sat at zero for the rest of the scene. */
  var amts    = [].slice.call(stage.querySelectorAll('.ct-amt-live'));
  var amt     = amts[0];

  var t = 0, last = 0, raf = null, playing = false, current = -1;
  var haveAudio = false, muted = false;

  /* ── narration ──────────────────────────────────────────────────────
     Preference order: a recorded mp3, then the browser speech synthesiser,
     then silence with captions. LINES is the same text the captions and
     the transcript use, so the three can never drift. */
  var LINES = ["Tuesday. Susan runs accounts payable. A client emails about an invoice.", "Their bank has changed. Pay the new account by Friday.", "Not the client. R N, not M. Six days old.", "Cloud Guardian blocked it in two seconds. Susan never saw it.", "Eighty four thousand stayed put. No claim. Susan keeps her job.", "Cloud Guardian. Twice the quality. Half the price."];
  var speech = ('speechSynthesis' in window) ? window.speechSynthesis : null;
  var voice = null, spoken = -1;

  /* The robotic voice is the operating system's old formant synthesiser:
     Microsoft David and Zira on Windows, which every browser lists first.
     The good ones are the neural voices, and they are identifiable without
     hardcoding a list: they are served rather than installed, so
     localService is false, and Microsoft names its own with the word
     Natural. Score every voice and take the best, rather than walking a
     list of names that goes stale. */
  function pickVoice() {
    if (!speech) return;
    var vs = speech.getVoices().filter(function (v) { return /^en(-|_|$)/i.test(v.lang); });
    if (!vs.length) return;
    function score(v) {
      var n = v.name, s = 0;
      if (/natural|neural/i.test(n)) s += 60;      /* Microsoft's neural set */
      if (v.localService === false) s += 40;       /* served, not a SAPI voice */
      if (/^Google/i.test(n)) s += 35;             /* Chrome's own */
      if (/Samantha|Ava|Allison|Serena|Jenny|Aria|Sonia|Emma/i.test(n)) s += 20;
      if (/en[-_]US/i.test(v.lang)) s += 10;
      if (/David|Zira|Mark|Hazel|compact|eSpeak/i.test(n)) s -= 50;  /* the robots */
      return s;
    }
    vs.sort(function (a, b) { return score(b) - score(a); });
    voice = vs[0];
  }
  if (speech) {
    pickVoice();
    speech.onvoiceschanged = pickVoice;
  }

  /* Speak, do not interrupt.

     The previous version cancelled the running utterance on every scene
     change, which is exactly what chopped the last few words off each line:
     a fifteen word sentence does not fit a five second box. The scenes are
     now sized to their own word counts with air at the end, and this queues
     rather than cancels, so a line that runs a little long finishes and the
     next one follows it. cancel() is now reserved for the cases where the
     audience actually asked for silence: pause, seek, mute and the end. */
  function say(i) {
    if (haveAudio || muted || !speech || i === spoken || !LINES[i]) return;
    spoken = i;
    try {
      var u = new SpeechSynthesisUtterance(LINES[i]);
      if (voice) u.voice = voice;
      u.rate = 1.0;
      u.pitch = 1.0;
      u.volume = 1.0;
      speech.speak(u);
    } catch (e) {}
  }
  function hush() { if (speech) { try { speech.cancel(); } catch (e) {} } spoken = -1; }

  /* space the chapter dots along the track by their real start time */
  dots.forEach(function (d, i) {
    d.style.left = (CH[i][0] / RUNTIME * 100) + '%';
  });

  function fmt(s) {
    s = Math.max(0, Math.round(s));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function chapterAt(time) {
    for (var i = CH.length - 1; i >= 0; i--) if (time >= CH[i][0]) return i;
    return 0;
  }

  /* the shots of every scene, resolved once. paintShots runs on every frame
     and used to hit querySelectorAll each time, which forces a style pass. */
  var SHOTS = scenes.map(function (s) {
    return [].slice.call(s.querySelectorAll('.ct-shot'));
  });
  SHOTS.forEach(function (list, i) {
    var d = ((CH[i][1] - CH[i][0]) / Math.max(1, list.length));
    list.forEach(function (sh) { sh.style.setProperty('--shot', d + 's'); });
  });

  /* A parked scene is skipped by the renderer: no layout, no paint, no style
     resolution for several hundred SVG nodes. The scene about to play is
     always unparked one scene early, so the work of laying it out never
     lands on the frame where the cut happens. */
  var parkT = null, turnT = null;
  function stageScenes(i) {
    scenes[i].classList.remove('parked');
    if (scenes[i + 1]) scenes[i + 1].classList.remove('parked');
    clearTimeout(parkT);
    parkT = setTimeout(function () {
      scenes.forEach(function (s, k) {
        if (k !== i && k !== i + 1) s.classList.add('parked');
      });
    }, 700);
  }

  function showChapter(i) {
    if (i === current) return;
    current = i;
    stageScenes(i);
    scenes.forEach(function (s, k) { s.classList.toggle('on', k === i); });
    /* Every shot outside the live scene is released. The outgoing one keeps
       dissolving under the incoming scene's first shot rather than being cut
       off mid fade, and nothing is left holding visibility:visible inside a
       hidden parent, which is the one way a stale frame can survive a cut.

       A chapter turn gets a longer dissolve than a beat cut: the outgoing
       shot is marked on its way out and the incoming one on its way in, and
       both marks clear once the handover is finished so the quick beat cuts
       inside the scene are unaffected. */
    var turning = [];
    for (var k = 0; k < SHOTS.length; k++) {
      if (k === i) continue;
      for (var j = 0; j < SHOTS[k].length; j++) {
        var sh = SHOTS[k][j];
        if (sh.classList.contains('on')) {
          sh.classList.add('chapter-out');
          turning.push(sh);
        }
        sh.classList.remove('on');
      }
    }
    if (SHOTS[i] && SHOTS[i][0]) {
      SHOTS[i][0].classList.add('chapter-in');
      turning.push(SHOTS[i][0]);
    }
    clearTimeout(turnT);
    turnT = setTimeout(function () {
      turning.forEach(function (sh) {
        sh.classList.remove('chapter-out', 'chapter-in');
      });
    }, 700);
    caps.forEach(function (c, k) { c.classList.toggle('on', k === i); });
    dots.forEach(function (d, k) {
      d.classList.toggle('now', k === i);
      d.classList.toggle('done', k < i);
    });
    chapL.textContent = 'Scene ' + (i + 1) + ' of ' + CH.length;
    if (playing) say(i);
    shotOf = -1;
    if (i === 2 && amt) countUp();
  }

  /* the wire amount climbs while chapter three is up */
  var counted = false;
  function countUp() {
    if (counted) return;
    counted = true;
    var target = 84000, t0 = null, dur = 1050;
    function put(v) { for (var i = 0; i < amts.length; i++) amts[i].textContent = v; }
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      put('84,000'); return;
    }
    function step(ts) {
      if (t0 === null) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur);
      put(Math.round(target * (1 - Math.pow(1 - k, 3))).toLocaleString('en-US'));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* Each scene holds up to three shots. They swap on their own sub clock so
     the picture keeps moving while a single narration line is being read. */
  var shotOf = -1;
  function paintShots(sceneIdx, time) {
    var shots = SHOTS[sceneIdx];
    if (!shots || !shots.length) return;
    var a = CH[sceneIdx][0], b = CH[sceneIdx][1];
    var k = Math.min(shots.length - 1,
                     Math.floor((time - a) / ((b - a) / shots.length)));
    var key = sceneIdx * 100 + k;
    if (key === shotOf) return;
    shotOf = key;
    /* only two writes per cut rather than one per shot: the frame that
       changes a class is the frame the browser has to restyle */
    for (var i = 0; i < shots.length; i++) {
      var want = (i === k);
      if (shots[i].classList.contains('on') !== want) {
        shots[i].classList.toggle('on', want);
      }
    }
  }

  /* Everything below runs sixty times a second, so anything that is not
     visibly different from the previous frame does not get written. Writing
     the clock label and the aria value only when the whole second changes
     removes two style invalidations per frame. */
  var lastSec = -1, lastPct = -1, TOTAL = fmt(RUNTIME);
  function paint() {
    var p = Math.min(1, t / RUNTIME);
    var pct = Math.round(p * 1000) / 10;
    if (pct !== lastPct) { lastPct = pct; fill.style.width = pct + '%'; }
    var sec = Math.round(t);
    if (sec !== lastSec) {
      lastSec = sec;
      timeL.textContent = fmt(t) + ' / ' + TOTAL;
      track.setAttribute('aria-valuenow', sec);
    }
    var ci = chapterAt(t);
    showChapter(ci);
    paintShots(ci, t);
  }

  function tick(ts) {
    if (!playing) return;
    if (haveAudio && !audio.paused) {
      t = audio.currentTime;
    } else {
      if (!last) last = ts;
      t += (ts - last) / 1000;
    }
    last = ts;
    if (t >= RUNTIME) { t = RUNTIME; paint(); stop(true); return; }
    paint();
    syncBed(ts);
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (playing) return;
    playing = true; last = 0;
    stage.classList.add('playing');
    stage.classList.remove('paused');
    toggle.classList.remove('is-paused');
    toggle.setAttribute('aria-label', 'Pause');
    if (haveAudio && !muted) { audio.currentTime = t; audio.play().catch(function () {}); }
    else if (!muted) { spoken = -1; say(chapterAt(t)); }
    playBed();
    raf = requestAnimationFrame(tick);
  }

  /* the underscore. it is a track, not a loop, so it is kept on the same
     clock as the picture: seeking the story seeks the music with it. */
  function playBed() {
    if (!bed || muted) return;
    try {
      if (Math.abs(bed.currentTime - t) > 0.35) bed.currentTime = Math.min(t, 31);
      bed.volume = 0.34;
      var pr = bed.play();
      if (pr && pr.catch) pr.catch(function () {});
    } catch (e) {}
  }
  function stopBed() { if (bed) { try { bed.pause(); } catch (e) {} } }

  /* Setting currentTime once at the moment of a seek is not enough: the
     element may still be buffering, or a pending play() promise can land
     afterwards and put the head back where it was. Checking once a second
     costs nothing and makes drift impossible whatever the cause. */
  var bedCheck = 0;
  function syncBed(ts) {
    if (!bed || muted || ts - bedCheck < 1000) return;
    bedCheck = ts;
    try {
      if (bed.paused && playing) { var pr = bed.play(); if (pr && pr.catch) pr.catch(function () {}); }
      if (Math.abs(bed.currentTime - t) > 0.4) bed.currentTime = Math.min(t, 31);
    } catch (e) {}
  }

  function stop(ended) {
    playing = false;
    cancelAnimationFrame(raf);
    if (haveAudio) audio.pause();
    stopBed();
    hush();
    toggle.classList.add('is-paused');
    toggle.setAttribute('aria-label', 'Play');
    if (ended) { stage.classList.remove('playing'); playBtn.hidden = false; current = -1; hush(); }
    else { stage.classList.add('paused'); }
  }

  function seek(time) {
    t = Math.max(0, Math.min(RUNTIME, time));
    counted = (t < CH[2][0]) ? false : counted;
    if (haveAudio) audio.currentTime = t; else hush();
    if (bed) { try { bed.currentTime = Math.min(t, 31); } catch (e) {} }
    lastSec = -1; lastPct = -1;
    paint();
  }

  /* audio is optional: probe it once and carry on either way */
  audio.addEventListener('canplay', function () { haveAudio = true; });
  audio.addEventListener('error', function () {
    haveAudio = false;
    if (speech) {
      muteBtn.setAttribute('aria-label', 'Mute narration');
      muteBtn.title = 'Narration, read by your browser';
    } else {
      muteBtn.classList.add('muted');
      muteBtn.title = 'This browser cannot speak, captions only';
    }
  });
  try { audio.load(); } catch (e) {}

  playBtn.addEventListener('click', function () {
    playBtn.hidden = true;
    if (t >= RUNTIME) t = 0;
    start();
  });
  toggle.addEventListener('click', function () { playing ? stop(false) : start(); });
  replay.addEventListener('click', function () { seek(0); playBtn.hidden = true; start(); });
  muteBtn.addEventListener('click', function () {
    muted = !muted;
    muteBtn.classList.toggle('muted', muted);
    if (haveAudio) { audio.muted = muted; if (!muted && playing) audio.play().catch(function () {}); }
    else if (muted) { hush(); }
    else if (playing) { spoken = -1; say(chapterAt(t)); }
    if (muted) stopBed(); else if (playing) playBed();
  });

  dots.forEach(function (d, i) {
    d.addEventListener('click', function (e) {
      e.stopPropagation();
      seek(CH[i][0]); playBtn.hidden = true;
      if (!playing) start();
    });
  });

  track.addEventListener('click', function (e) {
    if (e.target.closest('.wu-dotnav')) return;
    var r = track.getBoundingClientRect();
    seek((e.clientX - r.left) / r.width * RUNTIME);
    playBtn.hidden = true;
    if (!playing) start();
  });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { seek(t + 5); e.preventDefault(); }
    if (e.key === 'ArrowLeft')  { seek(t - 5); e.preventDefault(); }
    if (e.key === 'Home')       { seek(0); e.preventDefault(); }
    if (e.key === 'End')        { seek(RUNTIME); e.preventDefault(); }
  });

  /* stop when it scrolls out of view; nobody wants audio from off screen */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting && playing) stop(false);
    }, { threshold: 0.15 }).observe(stage);
  }

  paint();
  showChapter(0);
})();
