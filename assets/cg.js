
  var CG_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  // ── Simple quote builder (pricing page) ──
  // Written for somebody who does not want a spreadsheet: plain questions,
  // one big number, and a PDF they can hold. Prices: $25 per user with an
  // email address, $9.99 per user for integrated phones if wanted, $50 flat
  // for server hosting. Support is hourly and deliberately NOT in the
  // monthly number, the note under the total says so in words.
  (function () {
    var root = document.getElementById('sq');
    if (!root) return;
    var P_USER = 25, P_PHONE = 4.99, P_SERVER = 50;
    function $(id) { return document.getElementById(id); }
    function money(n) {
      return '$' + n.toLocaleString('en-US', { minimumFractionDigits: (n % 1 ? 2 : 0), maximumFractionDigits: 2 });
    }
    function num(id, lo, hi) {
      var v = parseInt($(id).value, 10);
      if (isNaN(v)) v = lo;
      return Math.max(lo, Math.min(hi, v));
    }
    var provider = '';
    [].forEach.call(root.querySelectorAll('.sq-pill'), function (b) {
      b.addEventListener('click', function () {
        provider = b.getAttribute('data-v');
        [].forEach.call(root.querySelectorAll('.sq-pill'), function (x) {
          x.classList.toggle('active', x === b);
        });
        recalc();
      });
    });
    function lines() {
      var users = num('sq-users', 1, 25);
      var out = [['Email protection, ' + users + ' user' + (users === 1 ? '' : 's') + ' x $25', users * P_USER]];
      if ($('sq-phones').checked) out.push(['Integrated phones, ' + users + ' x $4.99, first 30 days FREE', +(users * P_PHONE).toFixed(2)]);
      if ($('sq-server').checked) out.push(['Server hosting', P_SERVER]);
      return out;
    }
    function recalc() {
      var ls = lines();
      var total = 0, html = '';
      for (var k = 0; k < ls.length; k++) {
        total += ls[k][1];
        html += '<div class="calc-line"><span>' + ls[k][0] + '</span><span>' + money(ls[k][1]) + '</span></div>';
      }
      var shared = num('sq-shared', 0, 20);
      if (shared > 0) html += '<div class="calc-line"><span>Shared mailboxes, ' + shared + '</span><span>confirmed on your quote</span></div>';
      if ($('sq-phones').checked) html += '<div class="calc-flag">Your first 30 days of phones are FREE with our no-commit, month to month IT services. Every user gets the cell phone app, an extension, and voicemail to email with transcription.</div>';
      if ($('sq-staff').checked) html += '<div class="calc-flag">Helping or replacing existing IT staff is normal work for us. We will ask about them on the call.</div>';
      total = +total.toFixed(2);
      $('sq-total').textContent = money(total);
      $('sq-break').innerHTML = html;
      try { sessionStorage.setItem('cg_estimate', money(total) + ' / month, Small Business Standard'); } catch (e) {}
      var ho = $('calcNext'); if (ho) ho.classList.add('on');
      var lv = $('calcNextVal'); if (lv) lv.textContent = money(total) + ' / month';
      var lk = $('calcNextLink'); if (lk) lk.href = '/next-steps/?est=' + encodeURIComponent(money(total) + ' / month');
      return { total: total, items: ls };
    }
    ['sq-users', 'sq-comp', 'sq-shared'].forEach(function (id) {
      $(id).addEventListener('input', function () {
        var v = $(id + '-v'); if (v) v.textContent = $(id).value;
        recalc();
      });
    });
    ['sq-server', 'sq-staff', 'sq-self', 'sq-phones'].forEach(function (id) { $(id).addEventListener('change', recalc); });
    recalc();

    // ── The quote PDF ──
    // Styled after the Managed IT Services Proposal: navy cover page with
    // the winged logo, white inner page, site cyan and the proposal's amber.
    var NAVY = [10, 18, 32], CYAN = [0, 212, 255], AMBER = [232, 163, 61];
    var INK = [30, 42, 58], MUT = [96, 110, 128];
    var logoData = null;
    function getLogo(cb) {
      if (logoData) return cb(logoData);
      fetch('/assets/cg-logo.png').then(function (r) { return r.blob(); }).then(function (bl) {
        var fr = new FileReader();
        fr.onload = function () { logoData = fr.result; cb(logoData); };
        fr.readAsDataURL(bl);
      }).catch(function () { cb(null); });
    }
    function quoteState() {
      var r = recalc();
      return {
        items: r.items, total: r.total,
        biz: ($('sq-biz').value || '').trim(),
        users: num('sq-users', 1, 25), comp: num('sq-comp', 0, 25),
        shared: num('sq-shared', 0, 20), provider: provider,
        server: $('sq-server').checked, staff: $('sq-staff').checked,
        self: $('sq-self').checked, phones: $('sq-phones').checked,
        notes: ($('sq-notes').value || '').trim()
      };
    }
    function buildPdf(cb) {
      var J = window.jspdf && window.jspdf.jsPDF;
      if (!J) { window.print(); return; }
      var q = quoteState();
      getLogo(function (logo) {
        var doc = new J({ unit: 'pt', format: 'letter' });
        var W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
        var x = 58, cx = W / 2;

        // ── page 1: the navy cover-quote ──
        doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
        doc.rect(0, 0, W, H, 'F');
        if (logo) doc.addImage(logo, 'PNG', cx - 115, 46, 230, 95);
        var y = 178;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(27); doc.setTextColor(255, 255, 255);
        doc.text('MANAGED IT SERVICES', cx, y, { align: 'center' }); y += 32;
        doc.setTextColor(CYAN[0], CYAN[1], CYAN[2]);
        doc.text('ESTIMATED QUOTE', cx, y, { align: 'center' }); y += 26;
        doc.setFontSize(10.5); doc.setTextColor(AMBER[0], AMBER[1], AMBER[2]);
        doc.text('ONE-STOP IT SERVICES & SOLUTIONS', cx, y, { align: 'center' }); y += 14;
        doc.setFont('helvetica', 'normal'); doc.setTextColor(170, 182, 198);
        doc.text('SMALL BUSINESS STANDARD PLAN', cx, y, { align: 'center' }); y += 36;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(CYAN[0], CYAN[1], CYAN[2]);
        doc.text('P R E P A R E D   F O R', cx, y, { align: 'center' }); y += 20;
        doc.setFontSize(15); doc.setTextColor(255, 255, 255);
        doc.text(q.biz || 'Your Business', cx, y, { align: 'center' }); y += 17;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(170, 182, 198);
        var today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.text(today + '   |   Estimate valid 30 days', cx, y, { align: 'center' });

        // white quote panel
        var py = y + 34, ph = 210 + q.items.length * 26;
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x - 10, py, W - 2 * x + 20, ph, 8, 8, 'F');
        var iy = py + 34;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(INK[0], INK[1], INK[2]);
        doc.text('YOUR MONTHLY QUOTE', x + 6, iy); iy += 10;
        doc.setDrawColor(CYAN[0], CYAN[1], CYAN[2]); doc.setLineWidth(2);
        doc.line(x + 6, iy, x + 130, iy); iy += 24;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5);
        for (var k = 0; k < q.items.length; k++) {
          doc.setTextColor(INK[0], INK[1], INK[2]);
          doc.text(q.items[k][0], x + 6, iy);
          doc.text(money(q.items[k][1]), W - x - 6, iy, { align: 'right' });
          iy += 9; doc.setDrawColor(224, 230, 238); doc.setLineWidth(1);
          doc.line(x + 6, iy, W - x - 6, iy); iy += 17;
        }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
        doc.text('Estimated total per month', x + 6, iy);
        doc.setTextColor(0, 150, 190);
        doc.text(money(q.total), W - x - 6, iy, { align: 'right' }); iy += 24;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(MUT[0], MUT[1], MUT[2]);
        var envline = 'Email users: ' + q.users + '   |   Computer users: ' + q.comp
          + (q.shared ? '   |   Shared mailboxes: ' + q.shared + ' (confirmed on your quote)' : '')
          + (q.provider ? '   |   ' + q.provider : '');
        doc.text(doc.splitTextToSize(envline, W - 2 * x - 12), x + 6, iy); iy += 26;
        var flags = [];
        if (q.phones) flags.push('Phones: first 30 days FREE, then $4.99 per user per month. Cell phone app, extension, voicemail to email with transcription for every user.');
        if (q.server) flags.push('Server: $50.00 per month.');
        if (q.staff) flags.push('Looking to help or replace existing IT staff: we do both, and will cover it on the call.');
        flags.push('Support is billed separately at $90 per hour, per incident, in half hour increments. If you do not need our support that month, you do not pay for any incidents. We are proactively preventing issues for you at this locked in rate.');
        for (var f = 0; f < flags.length; f++) {
          var wr = doc.splitTextToSize(flags[f], W - 2 * x - 12);
          doc.text(wr, x + 6, iy); iy += wr.length * 11 + 5;
        }

        doc.setFontSize(9.5); doc.setTextColor(170, 182, 198);
        doc.text('(732) 743-5472    |    cloud-guardian.com    |    sales@cloud-guardian.com', cx, H - 64, { align: 'center' });
        doc.setTextColor(120, 132, 148);
        doc.text('North Brunswick, NJ  ·  Onsite across the Tri-State area  ·  Remote support globally', cx, H - 48, { align: 'center' });

        // ── page 2: white, what is covered + next steps ──
        doc.addPage();
        doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
        doc.rect(0, 0, W, 84, 'F');
        if (logo) doc.addImage(logo, 'PNG', W - x - 133, 14, 133, 55);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(255, 255, 255);
        doc.text('WHAT YOUR PLAN COVERS', x, 50);
        var y2 = 122;
        doc.setFontSize(11); doc.setTextColor(INK[0], INK[1], INK[2]);
        doc.text('SMALL BUSINESS STANDARD PLAN - $25 PER USER / MONTH', x, y2); y2 += 8;
        doc.setDrawColor(CYAN[0], CYAN[1], CYAN[2]); doc.setLineWidth(2);
        doc.line(x, y2, x + 200, y2); y2 += 20;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5);
        var covered = [
          'Security for the email you host today, Google Workspace or Microsoft 365, with no migration and no change of provider',
          'Cybersecurity protections: phishing and impersonation defense, SPF, DKIM and DMARC enforced',
          'Monitoring and alerting for the threats that actually hit small businesses',
          'No contract, cancel any month',
          'Step up to Gold or Platinum whenever you are ready'
        ];
        for (var c = 0; c < covered.length; c++) {
          doc.setFillColor(0, 150, 190); doc.circle(x + 3, y2 - 3, 2.6, 'F');
          doc.setTextColor(INK[0], INK[1], INK[2]);
          var cw = doc.splitTextToSize(covered[c], W - 2 * x - 18);
          doc.text(cw, x + 16, y2); y2 += cw.length * 13 + 8;
        }
        if (q.notes) {
          y2 += 8; doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
          doc.text('YOUR NOTE TO US', x, y2); y2 += 16;
          doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(MUT[0], MUT[1], MUT[2]);
          var nw = doc.splitTextToSize(q.notes, W - 2 * x);
          doc.text(nw, x, y2); y2 += nw.length * 13 + 10;
        }
        y2 += 14;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(INK[0], INK[1], INK[2]);
        doc.text('NEXT STEPS', x, y2); y2 += 18;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(MUT[0], MUT[1], MUT[2]);
        var steps = [
          '01  Send us this quote, or call. We reply the same business day.',
          '02  A free look at what you have. No obligation, nothing is signed.',
          '03  Your final quote, confirmed in writing. Protection usually starts within days.'
        ];
        for (var s = 0; s < steps.length; s++) { doc.text(steps[s], x, y2); y2 += 17; }
        y2 += 16;
        doc.setDrawColor(CYAN[0], CYAN[1], CYAN[2]); doc.setLineWidth(1.5);
        doc.roundedRect(x, y2, W - 2 * x, 74, 6, 6, 'S');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(INK[0], INK[1], INK[2]);
        doc.text('READY TO GET STARTED?', cx, y2 + 28, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(0, 150, 190);
        doc.text('(732) 743-5472       sales@cloud-guardian.com       cloud-guardian.com', cx, y2 + 50, { align: 'center' });
        doc.setFontSize(8.5); doc.setTextColor(150, 158, 170);
        doc.text('This is an estimate, not a binding quote. Getting a quote carries no obligation to use our services.', cx, H - 46, { align: 'center' });
        doc.text('Cloud Guardian LLC  ·  North Brunswick, NJ', cx, H - 33, { align: 'center' });
        cb(doc, q);
      });
    }
    $('sq-pdf').addEventListener('click', function () {
      buildPdf(function (doc, q) {
        var fname = (q.biz ? q.biz.replace(/[^A-Za-z0-9 ]/g, '').trim().replace(/ +/g, '-') + '-' : '') + 'Cloud-Guardian-Quote.pdf';
        doc.save(fname);
      });
    });

    // ── Send the quote in. First click reveals name + contact, second click
    // posts the whole quote to the same inbox the contact form uses. ──
    $('sq-send').addEventListener('click', function () {
      var box = $('sq-contact'), msg = $('sq-sent');
      if (box.hidden) { box.hidden = false; $('sq-name').focus(); return; }
      var name = ($('sq-name').value || '').trim();
      var reach = ($('sq-reach').value || '').trim();
      if (!reach) { msg.hidden = false; msg.classList.add('err');
        msg.textContent = 'Add an email or phone number so we can reply to you.'; return; }
      var q = quoteState();
      var body = {
        _subject: 'SIMPLE QUOTE - ' + (q.biz || name || 'website visitor') + ' - ' + money(q.total) + '/mo',
        name: name, contact: reach, business: q.biz,
        email_users: q.users, computer_users: q.comp, shared_mailboxes: q.shared,
        provider: q.provider || 'not chosen',
        server: q.server ? 'yes (+$50/mo)' : 'no',
        help_or_replace_it_staff: q.staff ? 'yes' : 'no', no_existing_it: q.self ? 'yes' : 'no',
        phones: q.phones ? 'yes (+$4.99/user, first 30 days free)' : 'no',
        estimated_total: money(q.total) + ' / month', notes: q.notes
      };
      msg.hidden = false; msg.classList.remove('err'); msg.textContent = 'Sending...';
      fetch('https://formspree.io/f/xkoezydq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body)
      }).then(function (r) {
        if (r.ok) { msg.textContent = 'Sent. We reply the same business day. Your PDF copy is one click away above.'; }
        else { throw new Error(); }
      }).catch(function () {
        msg.classList.add('err');
        msg.textContent = 'That did not go through. Call (732) 743-5472 or email sales@cloud-guardian.com and we will take it from there.';
      });
    });

  })();

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

  // The floating contact menu used to live here. It opened a list of
  // channels from the same button the chat panel now uses, so both handlers
  // fired on every click and closing the panel left the menu open behind
  // it. Everything the menu offered is inside the panel: WhatsApp, Text and
  // Email are the send buttons, Call and Free assessment are the footer.

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

  // ── Chat panel ──
  (function () {
    var panel = document.getElementById('cgChat');
    var wrap  = document.getElementById('fabWrap');
    var btn   = document.getElementById('fabBtn');
    if (!panel || !btn) return;

    var TAWK = "";
    var SMS  = "+17327435472";
    var MAIL = "sales@cloud-guardian.com";
    var AWAY = "Outside 9 to 5 we still read everything and reply first thing.";
    var box  = document.getElementById('cgcText');

    /* Business hours are a claim the widget makes, so it should be true.
       Nine to five Monday to Friday, in New Jersey rather than in whatever
       timezone the visitor happens to be sitting in. */
    function openNow() {
      var s = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
      var d = new Date(s), h = d.getHours(), day = d.getDay();
      return day >= 1 && day <= 5 && h >= 9 && h < 17;
    }
    if (!openNow()) {
      var w = document.getElementById('cgcWhen');
      if (w) w.textContent = 'Away right now';
      var g = document.getElementById('cgcGreet');
      if (g) g.textContent = g.textContent + ' ' + AWAY;
      var dot = panel.querySelector('.cgc-dot');
      if (dot) { dot.style.background = '#e8a33d';
                 dot.style.boxShadow = '0 0 0 3px rgba(232,163,61,.18)'; }
    }

    /* Every channel gets the same message. Rebuilt on each keystroke rather
       than on click, so the href is real and a middle click or a long press
       opens the right thing. */
    function refresh() {
      var t = (box.value || '').trim();
      var body = t || 'Hi Cloud Guardian, I have a question.';
      var enc = encodeURIComponent(body);
      [].forEach.call(panel.querySelectorAll('.cgc-send a'), function (a) {
        var ch = a.getAttribute('data-ch'), href = '#';
        if (ch === 'wa')  href = 'https://wa.me/' + a.getAttribute('data-num') + '?text=' + enc;
        if (ch === 'tg')  href = 'https://t.me/' + a.getAttribute('data-user');
        if (ch === 'sms') href = 'sms:' + SMS + (/iPhone|iPad|Mac/.test(navigator.userAgent) ? '&' : '?') + 'body=' + enc;
        if (ch === 'em')  href = 'mailto:' + MAIL + '?subject=' +
              encodeURIComponent('Website chat') + '&body=' + enc;
        a.setAttribute('href', href);
        a.removeAttribute('aria-disabled');
        if (ch === 'wa' || ch === 'tg') { a.target = '_blank'; a.rel = 'noopener'; }
      });
    }
    box.addEventListener('input', refresh);
    refresh();

    function show(on) {
      panel.classList.toggle('on', on);
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      if (on) { wrap.classList.remove('open'); setTimeout(function () { box.focus(); }, 180); }
    }

    /* A real agent widget, if one is configured, replaces all of this. It is
       fetched on the first click rather than on page load: a visitor who
       never opens the chat should not pay for the script. */
    var tawkLoaded = false;
    function loadTawk() {
      if (tawkLoaded) return true;
      tawkLoaded = true;
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://embed.tawk.to/' + TAWK;
      s.charset = 'UTF-8';
      s.setAttribute('crossorigin', '*');
      document.head.appendChild(s);
      return true;
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (TAWK) {
        loadTawk();
        if (window.Tawk_API && window.Tawk_API.toggle) { window.Tawk_API.toggle(); return; }
      }
      show(!panel.classList.contains('on'));
    });
    var x = document.getElementById('cgChatX');
    if (x) x.addEventListener('click', function () { show(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('on')) show(false);
    });
    document.addEventListener('click', function (e) {
      if (panel.classList.contains('on') && !panel.contains(e.target) &&
          !wrap.contains(e.target)) show(false);
    });
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
    var ei = document.getElementById('jrEstInline');
    if (ei) ei.textContent = ' of ' + est;
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

  var CH = [[0.0, 8.625], [8.625, 20.095], [20.095, 27.16], [27.16, 36.365], [36.365, 44.535], [44.535, 52.275]];
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
  var endCard = document.getElementById('wuEnd');
  var againBtn = document.getElementById('wuAgain');
  var skipBtn = document.getElementById('wuSkip');
  var soundBtn = document.getElementById('wuSound');
  var mini    = document.getElementById('wuMini');
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
  var LINES = ["Tuesday, eight in the morning. Susan runs accounts payable. An email from a client she has paid for years.", "Their bank has changed. Pay by Friday. Nothing seems off. Look closely. That is an R and an N, not an M.", "Susan never sees it. She sends the wire. Eighty four thousand.", "Wait. Cloud Guardian is their MSSP. It blocks the wire and the email. Susan never knew.", "The money stayed put. Nothing to disclose. That was never her job. It is ours.", "Cloud Guardian. New Jersey and New York. Twice the quality, half the price."];
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
    stage.classList.remove('ended');
    if (endCard) endCard.hidden = true;
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
     clock as the picture: seeking the story seeks the music with it.

     The seek target is clamped to the score's real duration rather than a
     literal, because a literal goes stale the moment the edit changes
     length and then silently caps the music halfway through the film. */
  function bedAt(time) {
    var d = (bed && isFinite(bed.duration) && bed.duration > 0) ? bed.duration : RUNTIME;
    return Math.max(0, Math.min(time, d - 0.05));
  }
  function playBed() {
    if (!bed || muted) return;
    try {
      if (Math.abs(bed.currentTime - t) > 0.35) bed.currentTime = bedAt(t);
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
      if (Math.abs(bed.currentTime - t) > 0.4) bed.currentTime = bedAt(t);
    } catch (e) {}
  }

  /* ── once per browser visit ──
     sessionStorage rather than localStorage on purpose: a visit means a
     browser session, and next week the film should get its full opening
     again. If storage is unavailable the film behaves as already seen,
     which fails toward the quiet page rather than toward autoplay. */
  function seen() {
    try { return sessionStorage.getItem('cgWuSeen') === '1'; }
    catch (e) { return true; }
  }
  function markSeen() {
    try { sessionStorage.setItem('cgWuSeen', '1'); } catch (e) {}
  }

  /* the film is the first thing on the page, so leaving it means bringing
     up whatever follows rather than parking the visitor on a spent player */
  function scrollPast() {
    var sec = stage.closest('section');
    var next = sec && sec.nextElementSibling;
    if (!next || !next.scrollIntoView) return;
    var reduce = window.matchMedia &&
                 matchMedia('(prefers-reduced-motion: reduce)').matches;
    next.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth',
                          block: 'start' });
  }

  function minimize() {
    if (!mini) return;
    stage.hidden = true;
    mini.hidden = false;
  }

  function stop(ended) {
    playing = false;
    cancelAnimationFrame(raf);
    if (haveAudio) audio.pause();
    stopBed();
    hush();
    toggle.classList.add('is-paused');
    toggle.setAttribute('aria-label', 'Play');
    if (ended) {
      /* the film is over: give the page its height back and offer the two
         things somebody actually wants next */
      stage.classList.remove('playing');
      stage.classList.add('ended');
      if (endCard) endCard.hidden = false;
      playBtn.hidden = true;
      current = -1; hush();
      markSeen();
      if (soundBtn) soundBtn.hidden = true;
      /* Wait for the frame to finish collapsing into the end card, then
         bring whatever follows up into view. */
      setTimeout(scrollPast, 620);
    } else { stage.classList.add('paused'); }
  }

  function seek(time) {
    t = Math.max(0, Math.min(RUNTIME, time));
    counted = (t < CH[2][0]) ? false : counted;
    if (haveAudio) audio.currentTime = t; else hush();
    if (bed) { try { bed.currentTime = bedAt(t); } catch (e) {} }
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
  function restart() { seek(0); playBtn.hidden = true; start(); }
  replay.addEventListener('click', restart);
  if (againBtn) againBtn.addEventListener('click', restart);
  /* Skip: the visitor has decided not to watch. Put the film away as the
     strip, remember that for the session, and bring the page up. The scroll
     waits one frame so it measures the layout with the stage already gone. */
  if (skipBtn) skipBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    markSeen();
    if (soundBtn) soundBtn.hidden = true;
    stop(false);
    stage.classList.remove('paused');
    minimize();
    requestAnimationFrame(scrollPast);
  });

  /* Sound: this click is the gesture the browser has been waiting for, so
     the narration can start mid film from wherever the clock is now. */
  if (soundBtn) soundBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    soundBtn.hidden = true;
    muted = false;
    muteBtn.classList.remove('muted');
    if (haveAudio) {
      audio.muted = false;
      audio.currentTime = t;
      if (playing) audio.play().catch(function () {});
    } else if (playing) { spoken = -1; say(chapterAt(t)); }
    if (playing) playBed();
  });

  /* The strip: bring the stage back at full size and play from the top,
     with sound, because this click unlocks audio. */
  if (mini) mini.addEventListener('click', function () {
    mini.hidden = true;
    stage.hidden = false;
    playBtn.hidden = true;
    muted = false;
    muteBtn.classList.remove('muted');
    if (haveAudio) audio.muted = false;
    seek(0);
    start();
  });

  muteBtn.addEventListener('click', function () {
    if (soundBtn) soundBtn.hidden = true;
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

  /* ── the opening ──
     First view of a session: the film starts itself, silent, captions on,
     with the sound invitation up. It is marked seen the moment it starts,
     so a reload mid film gets the quiet page rather than a second opening.
     Every later view this session: the strip stands in for the stage.
     Reduced motion never autoplays anything, and gets the poster. */
  (function () {
    var reduce = window.matchMedia &&
                 matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (seen()) { minimize(); return; }
    if (reduce) return;
    setTimeout(function () {
      if (playing || seen()) return;
      markSeen();
      muted = true;
      muteBtn.classList.add('muted');
      if (haveAudio) audio.muted = true;
      if (soundBtn) soundBtn.hidden = false;
      playBtn.hidden = true;
      start();
    }, 600);
  })();
})();
