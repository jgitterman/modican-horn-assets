/* Webflow: restore inline markup the builder can't hold (hero line break + emphasis, menu burger) */
(function(){
  var h=document.querySelector('.hcontent h1');
  if(h && !h.querySelector('em')) h.innerHTML='Your exposure,<br>our <em>defense</em>';
  var im=document.querySelector('.hero .bg');
  if(im){ im.id='heroImg'; im.loading='eager'; im.setAttribute('fetchpriority','high'); }
  var sb=document.querySelector('.contact form input[type=submit]');
  if(sb && sb.value==='Submit') sb.value='Send Us a Case \u2192';
  var mb=document.getElementById('menuBtn');
  if(mb && !mb.querySelector('.burger')){
    mb.setAttribute('role','button');
    mb.innerHTML='<span class="burger" aria-hidden="true"><i></i><i></i><i></i></span><span class="mlabel">Menu</span>';
  }
})();

(function(){
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  // reveals, counters, timeline
  if (reduced){
    document.querySelectorAll('.rv').forEach(function(el){ el.classList.add('in'); });
    document.querySelectorAll('.count').forEach(function(el){ el.textContent = el.dataset.n; });
  } else {
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); },{threshold:.12, rootMargin:'0px 0px -8% 0px'});
    document.querySelectorAll('.rv').forEach(function(el){ io.observe(el); });
    var cio = new IntersectionObserver(function(es){ es.forEach(function(e){
      if(!e.isIntersecting) return; var el=e.target, n=+el.dataset.n, t0=null;
      (function step(t){ if(!t0) t0=t; var p=Math.min((t-t0)/1400,1); p=1-Math.pow(1-p,3); el.textContent=Math.round(n*p); if(p<1) requestAnimationFrame(step); })(performance.now());
      cio.unobserve(el); }); },{threshold:.6});
    document.querySelectorAll('.count').forEach(function(el){ cio.observe(el); });
  }

  // sticky nav: a copy of the header nav slides in when scrolling up
  var srcNav = document.querySelector('.hnav');
  if (srcNav){
    var bar = document.createElement('div'); bar.className = 'stickynav'; bar.inert = true;
    var clone = srcNav.cloneNode(true);
    clone.querySelectorAll('[id]').forEach(function(el){ el.id = el.id + '-s'; });
    clone.querySelectorAll('[aria-controls]').forEach(function(el){ el.setAttribute('aria-controls', el.getAttribute('aria-controls') + '-s'); });
    bar.appendChild(clone); document.body.appendChild(bar);
    var lastY = scrollY, heroEnd = (document.querySelector('.hero, .pagehead') || srcNav).getBoundingClientRect().bottom + scrollY;
    addEventListener('resize', function(){ heroEnd = (document.querySelector('.hero, .pagehead') || srcNav).getBoundingClientRect().bottom + scrollY; });
    addEventListener('scroll', function(){
      var y = scrollY, up = y < lastY - 4, down = y > lastY + 4;
      if (y < heroEnd - 40){ show(false); }
      else if (up) show(true);
      else if (down && !bar.querySelector('.menupanel.open')) show(false);
      if (up || down) lastY = y;
    }, {passive:true});
    function show(o){ bar.classList.toggle('show', o); bar.inert = !o; if (!o) closeMenus(bar); }
  }

  // menus (header and sticky copy)
  function closeMenus(scope){ (scope || document).querySelectorAll('.navwrap').forEach(function(w){ var b = w.querySelector('.menubtn'), p = w.querySelector('.menupanel'); b.setAttribute('aria-expanded', false); p.classList.remove('open'); }); }
  document.querySelectorAll('.navwrap').forEach(function(w){
    var b = w.querySelector('.menubtn'), p = w.querySelector('.menupanel');
    b.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); var o = b.getAttribute('aria-expanded') !== 'true'; closeMenus(); b.setAttribute('aria-expanded', o); p.classList.toggle('open', o); });
    p.addEventListener('click', function(e){ e.stopPropagation(); });
    p.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ closeMenus(); }); });
  });
  document.addEventListener('click', function(){ closeMenus(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeMenus(); });

  document.querySelectorAll('.mtoggle').forEach(function(tg){
    tg.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); var o = tg.getAttribute('aria-expanded') !== 'true'; tg.setAttribute('aria-expanded', o); document.getElementById(tg.getAttribute('aria-controls')).classList.toggle('open', o); });
  });

  // timeline: wait until the section is well into view, then draw slowly
  var tl = document.querySelector('.timeline');
  if (tl){
    if (reduced) tl.classList.add('in');
    else new IntersectionObserver(function(es, o){ es.forEach(function(e){ if (e.isIntersecting){ tl.classList.add('in'); o.disconnect(); } }); }, {threshold:.6, rootMargin:'0px 0px -6% 0px'}).observe(tl);
  }

  // FAQ: animate height on open/close
  document.querySelectorAll('.faq details').forEach(function(d){
    var s = d.querySelector('summary'), anim = null;
    s.addEventListener('click', function(e){
      if (reduced) return;
      e.preventDefault();
      if (anim) anim.cancel();
      var start = d.offsetHeight;
      if (!d.open){
        d.open = true;
        var end = d.offsetHeight;
        anim = d.animate({height:[start+'px', end+'px']}, {duration:420, easing:'cubic-bezier(.2,.65,.3,1)'});
      } else {
        d.classList.add('closing');
        var end = s.offsetHeight + 2;
        anim = d.animate({height:[start+'px', end+'px']}, {duration:340, easing:'cubic-bezier(.4,0,.2,1)'});
        anim.onfinish = function(){ d.open = false; d.classList.remove('closing'); };
      }
      anim.oncancel = function(){ d.classList.remove('closing'); };
    });
  });

  // results: multi-select filters, practice sub-filters, load more
  var grid = document.getElementById('rgrid');
  if (grid){
    var PAGE = 4, shown = PAGE, cat = 'all', sel = {outcome:[], county:[], team:[], area:[]};
    var cards = [].slice.call(grid.querySelectorAll('.rcard'));
    var more = document.getElementById('loadmore'), cnt = document.getElementById('fcount'), empty = document.getElementById('fempty');
    /* Webflow turns buttons into links: stop them navigating */
    document.querySelectorAll('#fbar a, #subs a, .more-row a, #fempty a').forEach(function(a){ a.addEventListener('click', function(e){ e.preventDefault(); }); });
    /* Webflow drops mixed inline content in the dropdown buttons: rebuild label + value */
    (function(){
      var L={outcome:'Outcome',county:'County',team:'Attorney'};
      document.querySelectorAll('#fbar .ms').forEach(function(m){
        var b=m.querySelector('.msbtn'); if(!b||b.querySelector('.mslbl')) return;
        b.innerHTML='<span class="mslbl">'+L[m.dataset.k]+'</span><b class="msval">All</b>';
      });
    })();
    /* Webflow can't hold checkboxes outside a form, so the filter options are generated here from the cards. */
    (function(){
      var names={horn:'Daniel C. Horn',modican:'JoeMarie R. Modican',latham:'Terese M. Latham'};
      document.querySelectorAll('#fbar .ms').forEach(function(m){
        var p=m.querySelector('.mspanel'); if(!p||p.querySelector('.opt')) return;
        var k=m.dataset.k, set={};
        cards.forEach(function(c){ var v=c.dataset[k]||''; (k==='team'?v.split(' '):[v]).forEach(function(x){ if(x) set[x]=1; }); });
        if(k==='team'){ set.horn=set.modican=set.latham=1; }
        var foot=p.querySelector('.msfoot');
        Object.keys(set).sort(function(x,y){ return (names[x]||x).localeCompare(names[y]||y); }).forEach(function(v){
          var l=document.createElement('label'); l.className='opt';
          var i=document.createElement('input'); i.type='checkbox'; i.value=v;
          var t=document.createElement('span'); t.textContent=names[v]||v;
          l.appendChild(i); l.appendChild(t); p.insertBefore(l,foot);
        });
      });
    })();
    var mss = [].slice.call(document.querySelectorAll('#fbar .ms')), subs = [].slice.call(document.querySelectorAll('#subs .subf'));
    function ok(c, skipArea){
      return (cat === 'all' || c.dataset.cat === cat) &&
        (!sel.outcome.length || sel.outcome.indexOf(c.dataset.outcome) > -1) &&
        (!sel.county.length || sel.county.indexOf(c.dataset.county) > -1) &&
        (!sel.team.length || c.dataset.team.split(' ').some(function(t){ return sel.team.indexOf(t) > -1; })) &&
        (skipArea || !sel.area.length || sel.area.indexOf(c.dataset.area) > -1);
    }
    function apply(){
      var match = cards.filter(function(c){ return ok(c); });
      cards.forEach(function(c){ c.classList.add('hide'); c.classList.remove('paged'); });
      match.forEach(function(c, i){ c.classList.remove('hide'); if (i >= shown) c.classList.add('paged'); c.classList.add('in'); });
      cnt.textContent = match.length ? ('Showing ' + Math.min(shown, match.length) + ' of ' + match.length + (match.length === 1 ? ' result' : ' results')) : 'No matching results';
      more.parentNode.hidden = match.length <= shown;
      empty.hidden = match.length > 0;
      var subsEl = document.getElementById('subs'), h0 = subsEl.offsetHeight;
      document.querySelectorAll('#subs .subrow').forEach(function(r){ r.hidden = r.dataset.for !== cat; });
      document.getElementById('fbar').classList.toggle('hassub', cat !== 'all');
      var h1 = subsEl.offsetHeight;
      if (h0 !== h1 && !reduced){
        subsEl.animate({height:[h0 + 'px', h1 + 'px']}, {duration:420, easing:'cubic-bezier(.2,.65,.3,1)'});
        var vis = subsEl.querySelector('.subrow:not([hidden])');
        if (vis) vis.animate({opacity:[0,1], transform:['translateY(-6px)','none']}, {duration:380, delay:60, easing:'cubic-bezier(.2,.65,.3,1)', fill:'backwards'});
      }
      subs.forEach(function(b){
        var n = cards.filter(function(c){ return ok(c, true) && c.dataset.area === b.dataset.v; }).length;
        b.innerHTML = b.dataset.v + '<span class="c">' + n + '</span>'; b.disabled = n === 0 && !b.classList.contains('on'); b.classList.toggle('dis', b.disabled);
      });
      mss.forEach(function(m){
        var v = sel[m.dataset.k], out = m.querySelector('.msval');
        out.textContent = !v.length ? 'All' : v.length === 1 ? m.querySelector('input[value="' + v[0] + '"]').nextElementSibling.textContent : v.length + ' selected';
      });
    }
    function closeAll(except){ mss.forEach(function(m){ if (m !== except){ m.classList.remove('open'); m.querySelector('.msbtn').setAttribute('aria-expanded', false); } }); }
    mss.forEach(function(m){
      var k = m.dataset.k, btn = m.querySelector('.msbtn');
      btn.addEventListener('click', function(e){ e.stopPropagation(); var o = !m.classList.contains('open'); closeAll(m); m.classList.toggle('open', o); btn.setAttribute('aria-expanded', o); });
      m.querySelector('.mspanel').addEventListener('click', function(e){ e.stopPropagation(); });
      m.querySelectorAll('input').forEach(function(ch){ ch.addEventListener('change', function(){
        sel[k] = [].slice.call(m.querySelectorAll('input:checked')).map(function(x){ return x.value; }); shown = PAGE; apply(); }); });
      m.querySelector('.msclear').addEventListener('click', function(){ m.querySelectorAll('input').forEach(function(x){ x.checked = false; }); sel[k] = []; shown = PAGE; apply(); });
    });
    document.addEventListener('click', function(){ closeAll(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeAll(); });
    document.querySelectorAll('#fbar .seg [data-f]').forEach(function(b){
      b.addEventListener('click', function(){ document.querySelectorAll('#fbar .seg [data-f]').forEach(function(x){ x.classList.remove('on'); }); b.classList.add('on');
        cat = b.dataset.f; sel.area = []; subs.forEach(function(s){ s.classList.remove('on'); }); shown = PAGE; apply(); });
    });
    subs.forEach(function(b){ b.addEventListener('click', function(){ b.classList.toggle('on'); sel.area = subs.filter(function(s){ return s.classList.contains('on'); }).map(function(s){ return s.dataset.v; }); shown = PAGE; apply(); }); });
    function reset(){ cat = 'all'; sel = {outcome:[], county:[], team:[], area:[]}; shown = PAGE;
      document.querySelectorAll('#fbar .seg [data-f]').forEach(function(x,i){ x.classList.toggle('on', i === 0); });
      document.querySelectorAll('#fbar input').forEach(function(x){ x.checked = false; }); subs.forEach(function(s){ s.classList.remove('on'); }); apply(); }
    document.getElementById('freset').addEventListener('click', reset);
    document.getElementById('freset2').addEventListener('click', reset);
    more.addEventListener('click', function(){ shown += PAGE; apply(); });
    apply();
  }

  // testimonial carousel: starts when in view; the active dot fills as a countdown
  var qs = document.getElementById('qstage');
  if (qs){
    var qc = [].slice.call(qs.querySelectorAll('.qcard')), qn = document.getElementById('qnav'), qd = [].slice.call(qn.querySelectorAll('a,button')), n = qc.length, cur = 0;
    qd.forEach(function(b){ b.appendChild(document.createElement('i')); });
    function show(k){
      cur = (k + n) % n;
      qc.forEach(function(c, i){ var d = (i - cur + n) % n; if (d > n/2) d -= n; c.dataset.pos = Math.max(-2, Math.min(2, d)); c.setAttribute('aria-hidden', d !== 0); c.querySelectorAll('a').forEach(function(a){ if (d !== 0) a.setAttribute('tabindex', '-1'); else a.removeAttribute('tabindex'); }); });
      qd.forEach(function(b, i){ b.classList.toggle('on', i === cur); var old = b.querySelector('i'), fresh = document.createElement('i'); b.replaceChild(fresh, old);
        if (i === cur) fresh.addEventListener('animationend', function(){ show(cur + 1); }); });
      qs.dispatchEvent(new Event('qshow'));
    }
    if (reduced) qn.classList.add('static');
    else {
      new IntersectionObserver(function(es){ es.forEach(function(e){ qn.classList.toggle('running', e.isIntersecting); }); }, {threshold:.5}).observe(qs);
      var hov = null;
      qc.forEach(function(c){
        c.addEventListener('mouseenter', function(){ hov = c; qn.classList.toggle('paused', c.dataset.pos === '0'); });
        c.addEventListener('mouseleave', function(){ if (hov === c) hov = null; qn.classList.remove('paused'); });
      });
      qs.addEventListener('qshow', function(){ qn.classList.toggle('paused', !!hov && hov.dataset.pos === '0'); });
    }
    qc.forEach(function(c, i){ c.addEventListener('click', function(e){ if (+c.dataset.pos !== 0){ e.preventDefault(); show(i); } }); });
    qd.forEach(function(b, i){ b.addEventListener('click', function(e){ e.preventDefault(); show(i); }); });
    show(0);
  }

  // widow control
  document.querySelectorAll('h1,h2,h3,p,.fine,.notice').forEach(function(el){
    if (el.querySelector('br')) return;
    var last = el.lastChild;
    while (last && last.nodeType !== 3 && last.lastChild) last = last.lastChild;
    if (!last || last.nodeType !== 3) return;
    var t = last.nodeValue.replace(/\s+$/,''), i = t.lastIndexOf(' ');
    if (i > 0 && t.length - i < 24) last.nodeValue = t.slice(0,i) + '\u00A0' + t.slice(i+1);
  });

  // ===== Hero: reframed photo + water ripples (fountain stays static) =====
  var hero = document.getElementById('hero'), cv = document.getElementById('heroCanvas'), img = document.getElementById('heroImg');
  if (!cv || !cv.getContext){ if (cv) cv.style.display='none'; return; }
  var ctx = cv.getContext('2d');
  var IW, IH, WL = 0.557, FX = 0.4395, FB = 0.515;
  var TX = 0.52, TY = 0.64;               // where the fountain sits in the hero
  var W, H, dpr, s, ox, oy, running = false, visible = true, last = 0, t = 0, STEP = 2;
  function size(){
    IW = img.naturalWidth; IH = img.naturalHeight;
    var lite = innerWidth < 760 || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.connection && navigator.connection.saveData);
    dpr = lite ? 1 : Math.min(window.devicePixelRatio || 1, 2); STEP = lite ? 3 : 2;
    W = hero.clientWidth; H = hero.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    s = Math.max(W / IW, H / IH, TX * W / (FX * IW));
    ox = Math.min(0, Math.max(W - IW * s, TX * W - FX * IW * s));
    oy = Math.min(0, Math.max(H - IH * s, TY * H - FB * IH * s));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function draw(){
    ctx.drawImage(img, ox, oy, IW * s, IH * s);
    var wl = oy + WL * IH * s, span = Math.max(H - wl, 1), step = STEP;
    for (var y = Math.floor(wl); y < H; y += step){
      var d = (y - wl) / span;
      var ph = 58 * Math.sqrt(d);                        // ripples widen toward the viewer
      var offx = Math.sin(ph * 0.7 + t * 0.9 + Math.sin(y * 0.021 + t * 0.4)) * (0.8 + d * 7.5);
      var dy = Math.sin(ph - t * 1.7) * (1.2 + d * 9) + Math.sin(ph * 2.3 + t * 1.1) * (0.4 + d * 3);
      var sy = Math.max(0, (y - oy) / s + dy);
      ctx.drawImage(img, 0, sy, IW, step / s, ox + offx - 10, y, IW * s + 20, step + 0.6);
      var band = Math.pow(Math.max(0, Math.sin(ph * 1.25 - t * 2.1)), 10) * (0.035 + d * 0.05);
      if (band > 0.004){ ctx.fillStyle = 'rgba(255,214,176,' + band.toFixed(3) + ')'; ctx.fillRect(0, y, W, step); }
    }
  }
  function frame(now){
    if (!running) return;
    var dt = Math.min((now - (last || now)) / 1000, 0.05); last = now; t += dt;
    draw(); requestAnimationFrame(frame);
  }
  function start(){ if (reduced || running || !visible || document.hidden) return; running = true; last = 0; requestAnimationFrame(frame); }
  function stop(){ running = false; }
  function go(){ size(); draw(); start(); }
  function later(){ (window.requestIdleCallback || function(f){ setTimeout(f, 200); })(go, {timeout: 1500}); }
  if (document.readyState === 'complete' && img.naturalWidth) later(); else addEventListener('load', later);
  addEventListener('resize', function(){ size(); draw(); });
  new IntersectionObserver(function(es){ visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(hero);
  document.addEventListener('visibilitychange', function(){ document.hidden ? stop() : start(); });
})();

/* Webflow: stagger delays come from data attributes (Webflow can't store inline CSS variables) */
(function(){
  document.querySelectorAll('[data-d]').forEach(function(el){ el.style.setProperty('--d', el.getAttribute('data-d')); });
  document.querySelectorAll('[data-td]').forEach(function(el){ el.style.setProperty('--td', el.getAttribute('data-td')); });
  document.querySelectorAll('[data-sd]').forEach(function(el){ el.style.setProperty('--sd', el.getAttribute('data-sd')); });
})();
(function(){
  var svg='<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>';
  document.querySelectorAll('.tile .pill[title="LinkedIn"]').forEach(function(a){ a.innerHTML = svg; });
})();

// anchor scrolling: one eased animation (native smooth-scroll stalls then jumps on long pages with reveals)
(function(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var raf = 0;
  function targetTop(el){ var m = parseFloat(getComputedStyle(el).scrollMarginTop) || 0; return Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - m); }
  function go(el, push){
    var from = window.pageYOffset, to = targetTop(el), d = to - from;
    if (Math.abs(d) < 2) return;
    var dur = Math.min(900, Math.max(450, Math.abs(d) * 0.45)), t0 = null;
    cancelAnimationFrame(raf);
    function step(t){
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = p < .5 ? 4*p*p*p : 1 - Math.pow(-2*p + 2, 3) / 2;
      window.scrollTo({top: from + d * e, behavior: 'instant'});
      if (p < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    if (push) history.pushState(null, '', '#' + el.id);
  }
  ['wheel','touchstart','keydown'].forEach(function(ev){ addEventListener(ev, function(){ cancelAnimationFrame(raf); }, {passive:true}); });
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    var u = new URL(a.href, location.href);
    if (u.pathname.replace(/\/$/, '') !== location.pathname.replace(/\/$/, '') || !u.hash || u.hash === '#') return;
    var el = document.getElementById(decodeURIComponent(u.hash.slice(1)));
    if (!el) return;
    e.preventDefault(); go(el, true);
  });
})();
