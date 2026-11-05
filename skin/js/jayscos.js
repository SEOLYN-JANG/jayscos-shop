/* =====================================================================
   JAYSCOS (제이즈코스) Cafe24 skin — jayscos.js
   의존성 없음(바닐라 JS). 카페24 기본 jQuery/EC 스크립트와 충돌하지 않도록 전역은 window.JAYSCOS 하나만 사용.
   ===================================================================== */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var num = function (v) { var n = parseInt(String(v == null ? '' : v).replace(/[^0-9]/g, ''), 10); return isNaN(n) ? 0 : n; };
  var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };

  /* ---------- 헤더: 드로어 / 검색 / 현재 메뉴 / 스크롤 ---------- */
  function header() {
    var drawer = $('#drawer');
    $$('[data-open-drawer]').forEach(function (b) { b.addEventListener('click', function () { drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }); });
    $$('[data-close-drawer]').forEach(function (b) { b.addEventListener('click', function () { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }); });
    var sl = $('#searchLayer');
    $$('[data-toggle-search]').forEach(function (b) { b.addEventListener('click', function () { sl.classList.toggle('open'); if (sl.classList.contains('open')) { var i = $('input', sl); i && i.focus(); } }); });
    var curCate = (location.search.match(/cate_no=(\d+)/) || [])[1];
    $$('.gnb > li > a, .gnb .xans-layout-category > a, .cate-tabs a').forEach(function (a) {
      var ac = ((a.getAttribute('href') || '').match(/cate_no=(\d+)/) || [])[1];
      if (curCate && ac === curCate) a.classList.add('on');
    });
    /* 분류 링크 자동 연결: 드로어에 카페24가 출력한 Layout_category N번째 링크를 data-cat="N" 요소의 href 로 복사 (cate_no 하드코딩 회피) */
    var cats = $$('.drawer .xans-layout-category a');
    if (cats.length) $$('[data-cat]').forEach(function (a) { var c = cats[parseInt(a.dataset.cat, 10)]; if (c) a.setAttribute('href', c.getAttribute('href')); });
    /* 스크롤 시 헤더 그림자 + 맨 위로 버튼 */
    var hd = $('#header'), top = $('[data-scroll-top]');
    var onScroll = function () { var y = window.pageYOffset; if (hd) hd.classList.toggle('scrolled', y > 10); if (top) top.classList.toggle('show', y > 600); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    top && top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    /* 같은 페이지 앵커(/#faq)를 메인에서 눌렀을 때 헤더 높이만큼 보정 */
    $$('a[href^="/#"], a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').replace(/^\/?#/, ''); var t = id && document.getElementById(id);
        if (!t) return; e.preventDefault();
        var hh = (hd ? hd.offsetHeight : 0) + 8;
        window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - hh, behavior: 'smooth' });
        if (drawer && drawer.classList.contains('open')) { drawer.classList.remove('open'); document.body.style.overflow = ''; }
      });
    });
  }

  /* ---------- 히어로 슬라이더 ---------- */
  function heroSlider() {
    var h = $('.hero-slider'); if (!h) return;
    var slides = $$('.slide', h), dots = $('.hero-dots', h), idx = 0, timer = null;
    var iv = parseInt(h.dataset.interval || '5000', 10);
    h.style.setProperty('--hero-interval', iv + 'ms');
    if (slides.length < 2) { if (dots) dots.style.display = 'none'; var nv = $('.hero-nav', h); if (nv) nv.style.display = 'none'; return; }
    slides.forEach(function (s, i) { var li = document.createElement('li'); li.setAttribute('aria-label', (i + 1) + '번 슬라이드'); li.addEventListener('click', function () { go(i); restart(); }); dots.appendChild(li); });
    var dl = $$('li', dots);
    var go = function (i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('on', k === idx); });
      dl.forEach(function (d, k) { d.classList.remove('on'); if (k === idx) { void d.offsetWidth; d.classList.add('on'); } });
      h.setAttribute('data-slide', idx + 1);
    };
    var start = function () { if (document.documentElement.hasAttribute('data-shot')) return; timer = setInterval(function () { go(idx + 1); }, iv); };
    var stop = function () { clearInterval(timer); };
    var restart = function () { stop(); start(); };
    $('.hero-nav .prev', h).addEventListener('click', function () { go(idx - 1); restart(); });
    $('.hero-nav .next', h).addEventListener('click', function () { go(idx + 1); restart(); });
    h.addEventListener('mouseenter', stop); h.addEventListener('mouseleave', start);
    var sx = 0;
    h.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; stop(); }, { passive: true });
    h.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(dx < 0 ? idx + 1 : idx - 1); start(); });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : restart(); });
    go(0); start();
  }

  /* ---------- 가로 트랙 (리뷰) 좌우 버튼 + 자동 ---------- */
  function tracks() {
    $$('.track-wrap').forEach(function (w) {
      var t = $('.track', w); if (!t) return;
      var step = function () { var card = t.firstElementChild; return card ? card.getBoundingClientRect().width + 16 : 300; };
      var next = function () {
        if (t.scrollLeft + t.clientWidth >= t.scrollWidth - 4) t.scrollTo({ left: 0, behavior: 'smooth' });
        else t.scrollBy({ left: step(), behavior: 'smooth' });
      };
      $$('.track-nav button', w).forEach(function (b) {
        b.addEventListener('click', function () { if (b.dataset.dir === 'prev') t.scrollBy({ left: -step(), behavior: 'smooth' }); else next(); restart(); });
      });
      var iv = parseInt(w.dataset.auto || '0', 10), timer = null;
      var start = function () { if (iv > 0 && !document.documentElement.hasAttribute('data-shot')) timer = setInterval(next, iv); };
      var stop = function () { clearInterval(timer); };
      var restart = function () { stop(); start(); };
      if (iv > 0) {
        w.addEventListener('mouseenter', stop); w.addEventListener('mouseleave', start);
        t.addEventListener('touchstart', stop, { passive: true }); t.addEventListener('touchend', start);
        document.addEventListener('visibilitychange', function () { document.hidden ? stop() : restart(); });
        start();
      }
    });
  }

  /* ---------- 피부 고민별 탭 ---------- */
  function concernTabs() {
    var root = $('.concern'); if (!root) return;
    var btns = $$('.tabs button', root), panels = $$('.panel', root);
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
        panels.forEach(function (p) { p.classList.toggle('on', p.dataset.panel === b.dataset.tab); });
      });
    });
  }

  /* ---------- 상품 카드: 할인율 + 베스트 순위 배지 ---------- */
  function cards() {
    $$('.prd').forEach(function (p) {
      var c = num(($('.custom', p) || {}).textContent), s = num(($('.sale', p) || {}).textContent), r = $('.rate', p);
      if (r && c > s && s > 0) r.textContent = Math.round((1 - s / c) * 100) + '%';
      var sm = $('.summary', p); if (sm && /요약설명이 입력됩니다/.test(sm.textContent)) sm.textContent = '';
    });
    $$('.prdList.ranked > li').forEach(function (li, i) { var rk = $('.rank', li); if (rk) rk.textContent = i + 1; });
  }

  /* ---------- 상품 상세 ---------- */
  function detail() {
    var root = $('.detail'); if (!root) return;
    var box = $('.price-box', root);
    var sale = $('#span_product_price_text') || $('.product_price_css td');
    var custom = $('#span_product_price_custom') || $('.product_custom_css td');
    var s = num(sale && sale.textContent), c = num(custom && custom.textContent);
    if (box) {
      if (s) { $('.sale', box).innerHTML = fmt(s) + '<em>원</em>'; }
      if (c > s && s) { $('.custom', box).textContent = fmt(c) + '원'; $('.rate', box).textContent = Math.round((1 - s / c) * 100) + '%'; }
      var ml = $('#span_product_mileage_text') || $('.product_mileage_css td');
      if (ml && ml.textContent.trim()) { var m = $('.mileage', box); if (m) m.textContent = '적립금 ' + ml.textContent.trim(); }
    }
    /* 배지: 상품 요약설명("a | b | c")을 칩으로 */
    var bd = $('.badges[data-summary]', root);
    if (bd) {
      var parts = (bd.getAttribute('data-summary') || '').split('|').map(function (x) { return x.trim(); }).filter(function (x) { return x && !/요약설명이 입력됩니다/.test(x); });
      parts.forEach(function (t) { var sp = document.createElement('span'); sp.textContent = t; bd.appendChild(sp); });
      if (!bd.children.length) bd.style.display = 'none';
    }
    /* Product JSON-LD: 서버 변수 + 가격을 읽어 구조화 데이터 생성 */
    try {
      var name = ($('.info h1', root) || {}).textContent || '';
      var img = ($('.gallery .BigImage', root) || {}).src || '';
      var ld = { '@context': 'https://schema.org', '@type': 'Product', '@id': location.origin + location.pathname + location.search + '#product',
        name: name.trim(), image: img, brand: { '@type': 'Brand', name: '마이리에 (Myrie)' },
        manufacturer: { '@id': 'https://jayscos.com/#organization' },
        description: (document.querySelector('meta[name="description"]') || {}).content || name.trim(),
        offers: { '@type': 'Offer', url: location.href.split('#')[0], priceCurrency: 'KRW', price: s || 0, availability: 'https://schema.org/InStock', seller: { '@id': 'https://jayscos.com/#organization' } } };
      var sc = document.createElement('script'); sc.type = 'application/ld+json'; sc.textContent = JSON.stringify(ld); document.head.appendChild(sc);
    } catch (e) {}
    /* PC 구매 창 sticky 높이 보정 */
    var infoEl = $('.detail-top > .info', root);
    if (infoEl) {
      var fitInfo = function () {
        if (window.innerWidth < 1024) { infoEl.style.top = ''; return; }
        var hh = ($('#header') || {}).offsetHeight || 80;
        var want = hh + 12, room = window.innerHeight - infoEl.offsetHeight - 12;
        infoEl.style.top = Math.min(want, room) + 'px';
      };
      fitInfo(); window.addEventListener('resize', fitInfo); window.addEventListener('load', fitInfo);
      if ('MutationObserver' in window) new MutationObserver(fitInfo).observe(infoEl, { childList: true, subtree: true, attributes: true });
    }
    /* 갤러리 */
    var g = $('.gallery', root);
    if (g) {
      var slides = $('.slides', g), thumbs = $$('.thumbs li', g), idx = 0, counter = $('.counter', g);
      var go = function (i) {
        if (!thumbs.length) return;
        idx = (i + thumbs.length) % thumbs.length;
        slides.style.transform = 'translateX(' + (-100 * idx) + '%)';
        thumbs.forEach(function (t, k) { t.classList.toggle('on', k === idx); });
        if (counter) counter.textContent = (idx + 1) + ' / ' + thumbs.length;
      };
      thumbs.forEach(function (t, k) { t.addEventListener('click', function () { go(k); }); });
      var pv = $('.arrow.prev', g), nx = $('.arrow.next', g);
      pv && pv.addEventListener('click', function () { go(idx - 1); });
      nx && nx.addEventListener('click', function () { go(idx + 1); });
      var sx = 0;
      slides.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
      slides.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(dx < 0 ? idx + 1 : idx - 1); });
      go(0);
    }
    /* 옵션 아코디언 (옵션 없는 상품은 숨김) */
    $$('.opt-acc', root).forEach(function (a) {
      var h = $('.head', a); h && h.addEventListener('click', function () { a.classList.toggle('open'); });
      if (!$('.xans-product-option select, .xans-product-option ul li', a)) a.style.display = 'none';
    });
    /* 탭 스크롤 */
    var tabs = $$('.dtabs li', root);
    tabs.forEach(function (li) {
      var a = $('a', li);
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href'); var tg = id && $(id);
        if (tg) { e.preventDefault(); window.scrollTo({ top: tg.getBoundingClientRect().top + window.pageYOffset - 130, behavior: 'smooth' }); }
      });
    });
    var secs = tabs.map(function (li) { return $($('a', li).getAttribute('href')); });
    window.addEventListener('scroll', function () {
      var y = window.pageYOffset + 160, cur = 0;
      secs.forEach(function (sec, i) { if (sec && sec.offsetTop <= y) cur = i; });
      tabs.forEach(function (li, i) { li.classList.toggle('on', i === cur); });
    }, { passive: true });
    /* 상세 더보기 */
    var mw = $('#prdDetail .more-wrap'), mb = $('#prdDetail .more-btn button');
    if (mw && mb) {
      if (mw.scrollHeight <= 3600) { mw.classList.add('open'); mb.parentNode.style.display = 'none'; }
      mb.addEventListener('click', function () { mw.classList.toggle('open'); mb.querySelector('span').textContent = mw.classList.contains('open') ? '상세정보 접기' : '상세정보 더보기'; });
    }
    $$('.fold .ttl', root).forEach(function (t) { t.addEventListener('click', function () { t.parentNode.classList.toggle('open'); }); });
    /* 모바일 하단 고정 구매바 → 실제 카페24 버튼 클릭 위임 */
    var sb = $('.sticky-buy');
    if (sb) {
      document.body.classList.add('has-sticky');
      $$('[data-proxy]', sb).forEach(function (b) { b.addEventListener('click', function () { var t = $(b.dataset.proxy); if (t) t.click(); }); });
    }
    /* 선택 상품 금액 콤마 */
    var tp = $('#totalProducts');
    var fmtPrices = function () {
      $$('#totalProducts td.right > span:first-child, #totalProducts .quantity_price', tp).forEach(function (sp) { var t = sp.textContent.trim(); if (/^\d+$/.test(t)) sp.textContent = fmt(t) + '원'; });
    };
    if (tp) { fmtPrices(); if ('MutationObserver' in window) new MutationObserver(fmtPrices).observe(tp, { childList: true, subtree: true }); }
    var tpo = $('#totalProductsOption');
    if (tpo && !tpo.textContent.trim() && !$('select,input', tpo)) tpo.style.display = 'none';
    /* 리뷰/Q&A 탭 카운트 */
    var rvRows = $$('#prdReview .board-list tbody tr'), rvCnt = $('.dtabs .cnt-review');
    if (rvCnt && !rvCnt.textContent.trim() && rvRows.length) rvCnt.textContent = rvRows.length;
    var qnRows = $$('#prdQnA .board-list tbody tr'), qnCnt = $('.dtabs .cnt-qna');
    if (qnCnt && !qnCnt.textContent.trim() && qnRows.length) qnCnt.textContent = qnRows.length;
    /* 링크 복사 */
    var cp = $('[data-copy-url]', root);
    cp && cp.addEventListener('click', function () {
      var u = location.href;
      if (navigator.clipboard) navigator.clipboard.writeText(u).then(function () { alert('상품 링크가 복사되었습니다.'); });
      else { var i = document.createElement('input'); i.value = u; document.body.appendChild(i); i.select(); document.execCommand('copy'); i.remove(); alert('상품 링크가 복사되었습니다.'); }
    });
  }

  /* ---------- 스크롤 등장 ---------- */
  function reveal() {
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .12 });
    if (document.documentElement.hasAttribute('data-shot')) return;
    $$('.section').forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
  }

  function init() { header(); heroSlider(); tracks(); concernTabs(); cards(); detail(); reveal(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.JAYSCOS = { init: init };
})();
