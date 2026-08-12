/* ========================================================================
   🗺️ 오버뷰 지도 — 일자별 동선을 안내문에 첨부된 인쇄 지도처럼 보여준다.
   · 좌표·도보 경로는 assets/route-data.js 에 미리 구워둠 (현지 네트워크 호출 0)
   · Leaflet 은 오버뷰를 처음 열 때만 지연 로드 (일정 탭 초기 렌더 보호)
   · 지역 색은 app.js 의 regionColor() 를 그대로 재사용 → 타임라인과 색이 일치
   ======================================================================== */
(function () {
  if (document.body.getAttribute('data-tab') !== 'plan') return;
  var R = window.TRIP_ROUTE;
  if (!R || !R.length) return;

  var BASE = '../';
  var V = '?v=53';
  var TZ = 9;                    /* 일본 표준시 */
  var TRIP_Y = 2026;

  /* ---------- 유틸 ---------- */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function mins(t) { var p = t.split(':'); return (+p[0]) * 60 + (+p[1]); }

  /* Google encoded polyline (precision 5) 디코더 */
  function decodePoly(s) {
    var i = 0, lat = 0, lng = 0, out = [];
    while (i < s.length) {
      var b, sh = 0, res = 0;
      do { b = s.charCodeAt(i++) - 63; res |= (b & 31) << sh; sh += 5; } while (b >= 32);
      lat += (res & 1) ? ~(res >> 1) : (res >> 1);
      sh = 0; res = 0;
      do { b = s.charCodeAt(i++) - 63; res |= (b & 31) << sh; sh += 5; } while (b >= 32);
      lng += (res & 1) ? ~(res >> 1) : (res >> 1);
      out.push([lat / 1e5, lng / 1e5]);
    }
    return out;
  }

  /* 일정 타임라인의 .ev 행을 (날짜, 시각)으로 찾아 지역·색을 물려받는다 */
  var dcards = {}, evIndex = {};
  function eventTimeKey(timeEl) {
    /* 시간 아래의 점심/카페/[선택] 라벨은 .t 안에 중첩되어 있다.
       textContent 전체를 쓰면 "13:00점심"이 되어 route-data의 "13:00"과
       매칭되지 않으므로 실제 시각만 키로 사용한다. */
    var raw = timeEl.getAttribute('data-time') || timeEl.textContent || '';
    var match = raw.match(/\b\d{1,2}:\d{2}\b/);
    return match ? match[0] : raw.trim();
  }
  document.querySelectorAll('.dcard[data-d]').forEach(function (dc) {
    var d = dc.getAttribute('data-d');
    dcards[d] = dc;
    evIndex[d] = {};
    dc.querySelectorAll('.zgrp').forEach(function (zg) {
      var rg = zg.getAttribute('data-rg') || '';
      zg.querySelectorAll('.ev').forEach(function (ev) {
        var t = ev.querySelector('.t');
        if (!t) return;
        var key = eventTimeKey(t);
        if (!evIndex[d][key]) evIndex[d][key] = { el: ev, rg: rg, zg: zg };
      });
    });
  });

  function colorOf(d, t) {
    var m = evIndex[d] && evIndex[d][t];
    var rg = m && m.rg;
    return (typeof regionColor === 'function') ? regionColor(rg) : '#8a8272';
  }
  function regionsOfDay(day) {
    var seen = [];
    day.pts.forEach(function (p) {
      var m = evIndex[day.d] && evIndex[day.d][p.t];
      var rg = m && m.rg;
      if (rg && seen.indexOf(rg) < 0) seen.push(rg);
    });
    return seen;
  }

  /* ---------- 상단 뷰 전환 + 날짜 칩 ---------- */
  var sec = document.getElementById('sec-plan');
  var plbar = sec.querySelector('.plbar');

  var vtabs = el('div', 'vtabs',
    '<button type="button" class="vtab" data-v="map">🗺️ 오버뷰</button>' +
    '<button type="button" class="vtab on" data-v="list">📋 일정</button>');
  plbar.parentNode.insertBefore(vtabs, plbar);

  var chips = el('div', 'dchips');
  R.forEach(function (day) {
    var wd = day.label.match(/\(([^)]+)\)/);
    var md = day.label.split(' ')[0];
    var rgs = regionsOfDay(day);
    var c = el('button', 'dchip', '<i>' + (wd ? wd[1] : '') + '</i><b>' + md + '</b><u>' +
      (rgs.slice(0, 2).join('·') || '이동') + '</u>');
    c.type = 'button';
    c.setAttribute('data-d', day.d);
    c.style.setProperty('--cc', colorOf(day.d, day.pts[Math.min(1, day.pts.length - 1)].t));
    chips.appendChild(c);
  });
  vtabs.parentNode.insertBefore(chips, vtabs.nextSibling);

  /* ---------- 지도 패널 ---------- */
  var panel = el('div', 'mapwrap',
    '<div class="mhead"><span class="mtit">📍 <b class="mdate"></b></span>' +
    '<span class="mprog"><i></i></span><span class="mcnt"></span></div>' +
    '<div class="mapbox"><div id="tmap"></div><div class="mapoff">지도는 <b>인터넷 연결</b>이 필요해요 · 경로와 좌표는 이미 저장돼 있어요</div></div>' +
    '<div class="mnow"></div>' +
    '<div class="mctl"><button type="button" class="mprev">◀ 이전</button>' +
    '<button type="button" class="mgo">▶ 이어보기</button>' +
    '<button type="button" class="mnext">다음 ▶</button>' +
    '<button type="button" class="mall" title="그날 전체 보기">🔍</button></div>' +
    '<p class="mfoot">핀을 누르면 그 일정으로 이동해요 · <b>도보 구간은 실제 보행 경로</b>, 전철·항공은 점선이에요.</p>');
  panel.hidden = true;
  plbar.parentNode.insertBefore(panel, plbar.nextSibling);

  /* ---------- 일정 행에 액션 버튼(길찾기·지도·캘린더) 심기 ---------- */
  R.forEach(function (day, di) {
    day.pts.forEach(function (p, i) {
      var m = evIndex[day.d] && evIndex[day.d][p.t];
      /* data-noact: 공항 도착처럼 길찾기·캘린더가 무의미한 행은 버튼을 달지 않는다 */
      if (!m || m.el.querySelector('.evact') || m.el.hasAttribute('data-noact')) return;
      var prev = i > 0 ? day.pts[i - 1] : null;
      var leg = i > 0 ? day.legs[i - 1] : null;
      var mode = leg && leg.mv === 'walk' ? 'walking' : 'transit';
      /* 좌표로 넘기면 구글맵이 이름 없는 핀으로 떠서, 그 지점이 맞는지 확인할 수가 없다.
         가게 이름(일본어)으로 넘겨야 상호·영업시간·리뷰가 함께 뜬다. */
      var dq = encodeURIComponent(p.q || (p.ll[0] + ',' + p.ll[1]));
      var oq = prev ? encodeURIComponent(prev.q || (prev.ll[0] + ',' + prev.ll[1])) : '';
      var dir = 'https://www.google.com/maps/dir/?api=1' +
        (prev ? '&origin=' + oq : '') + '&destination=' + dq + '&travelmode=' + mode;
      var q = 'https://www.google.com/maps/search/?api=1&query=' + dq;
      var act = el('div', 'evact',
        '<a href="' + dir + '" target="_blank" rel="noopener">🧭 길찾기</a>' +
        '<a href="' + q + '" target="_blank" rel="noopener">📍 지도</a>' +
        '<button type="button" class="ics" data-di="' + di + '" data-i="' + i + '">📅 캘린더</button>' +
        '<button type="button" class="onmap" title="오버뷰 지도에서 보기" data-d="' + day.d + '" data-i="' + i + '">🗺️</button>');
      m.el.querySelector('.d').appendChild(act);
    });
    /* 이동 행에 수단 뱃지 */
    day.legs.forEach(function (leg, i) {
      var p = day.pts[i + 1];
      var m = evIndex[day.d] && evIndex[day.d][p.t];
      if (!m) return;
      var row = m.el;
      if (!row.classList.contains('move') || row.querySelector('.mvb')) return;
      var ico = leg.mv === 'walk' ? '🚶' : leg.mv === 'stay' ? '📍' : '🚃';
      var txt = leg.mv === 'walk'
        ? '도보 ' + (leg.m || leg.d) + 'm · 약 ' + Math.max(1, Math.round((leg.s || (leg.d / 1.25)) / 60)) + '분'
        : leg.mv === 'stay' ? '같은 장소' : '직선 ' + (leg.d >= 1000 ? (leg.d / 1000).toFixed(1) + 'km' : leg.d + 'm');
      row.querySelector('.d').insertBefore(
        el('span', 'mvb', ico + ' ' + txt), row.querySelector('.d').firstChild);
    });
  });

  /* route-data에 아직 좌표가 없는 신규 일정도 지도 검색어(data-mapq)가 있으면
     길찾기·지도·캘린더 3개는 제공한다. 오버뷰 지도 버튼만 좌표가 있을 때 노출한다. */
  document.querySelectorAll('.dcard[data-d] .ev:not(.move)').forEach(function (row) {
    if (row.querySelector('.evact') || row.hasAttribute('data-noact')) return;
    var target = row.querySelector('.ev-titlemain > [data-mapq]');
    var timeEl = row.querySelector('.t');
    if (!target || !timeEl) return;
    var destination = target.getAttribute('data-mapq');
    var date = row.closest('.dcard').getAttribute('data-d');
    var time = eventTimeKey(timeEl);
    var titleCopy = target.cloneNode(true);
    titleCopy.querySelectorAll('a,button,.mappin').forEach(function (control) { control.remove(); });
    var title = titleCopy.textContent.replace(/\s+/g, ' ').trim();
    var dq = encodeURIComponent(destination);
    var act = el('div', 'evact');
    var dirLink = el('a');
    dirLink.href = 'https://www.google.com/maps/dir/?api=1&destination=' + dq + '&travelmode=transit';
    dirLink.target = '_blank'; dirLink.rel = 'noopener'; dirLink.textContent = '🧭 길찾기';
    var mapLink = el('a');
    mapLink.href = 'https://www.google.com/maps/search/?api=1&query=' + dq;
    mapLink.target = '_blank'; mapLink.rel = 'noopener'; mapLink.textContent = '📍 지도';
    var calendar = el('button', 'ics');
    calendar.type = 'button'; calendar.textContent = '📅 캘린더';
    calendar.setAttribute('data-date', date); calendar.setAttribute('data-time', time);
    calendar.setAttribute('data-title', title); calendar.setAttribute('data-location', destination);
    act.append(dirLink, mapLink, calendar);
    row.querySelector('.d').appendChild(act);
  });

  /* .ics 내보내기 */
  function icsFor(di, i) {
    var day = R[di], p = day.pts[i];
    var md = day.d.split('-'), hm = p.t.split(':');
    var st = Date.UTC(TRIP_Y, +md[0] - 1, +md[1], +hm[0] - TZ, +hm[1]);
    var en = st + 60 * 60 * 1000;
    function z(ms) {
      var x = new Date(ms);
      return x.getUTCFullYear() + pad(x.getUTCMonth() + 1) + pad(x.getUTCDate()) + 'T' +
        pad(x.getUTCHours()) + pad(x.getUTCMinutes()) + '00Z';
    }
    var body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//tokyo-trip//KO', 'BEGIN:VEVENT',
      'UID:' + day.d + '-' + p.t.replace(':', '') + '@tokyo-trip',
      'DTSTAMP:' + z(st), 'DTSTART:' + z(st), 'DTEND:' + z(en),
      'SUMMARY:' + p.i + ' ' + p.n,
      'LOCATION:' + p.ll[0] + ',' + p.ll[1],
      'DESCRIPTION:2026 도쿄 여행 · ' + day.label + ' ' + day.sub,
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var url = URL.createObjectURL(new Blob([body], { type: 'text/calendar;charset=utf-8' }));
    var a = document.createElement('a');
    a.href = url; a.download = day.d + '_' + p.t.replace(':', '') + '.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function icsForStandalone(button) {
    var date = button.getAttribute('data-date'), time = button.getAttribute('data-time');
    var md = date.split('-'), hm = time.split(':');
    var st = Date.UTC(TRIP_Y, +md[0] - 1, +md[1], +hm[0] - TZ, +hm[1]);
    var en = st + 60 * 60 * 1000;
    function z(ms) {
      var x = new Date(ms);
      return x.getUTCFullYear() + pad(x.getUTCMonth() + 1) + pad(x.getUTCDate()) + 'T' +
        pad(x.getUTCHours()) + pad(x.getUTCMinutes()) + '00Z';
    }
    var title = button.getAttribute('data-title') || '도쿄 여행 일정';
    var location = button.getAttribute('data-location') || '';
    var body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//tokyo-trip//KO', 'BEGIN:VEVENT',
      'UID:' + date + '-' + time.replace(':', '') + '-standalone@tokyo-trip',
      'DTSTAMP:' + z(st), 'DTSTART:' + z(st), 'DTEND:' + z(en),
      'SUMMARY:' + title, 'LOCATION:' + location,
      'DESCRIPTION:2026 도쿄 여행 일정', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var url = URL.createObjectURL(new Blob([body], { type: 'text/calendar;charset=utf-8' }));
    var a = document.createElement('a');
    a.href = url; a.download = date + '_' + time.replace(':', '') + '.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.evact .ics');
    if (b) {
      e.preventDefault();
      if (b.hasAttribute('data-di')) icsFor(+b.getAttribute('data-di'), +b.getAttribute('data-i'));
      else icsForStandalone(b);
      return;
    }
    var m = e.target.closest && e.target.closest('.evact .onmap');
    if (m) { e.preventDefault(); setView('map'); selectDay(m.getAttribute('data-d'), +m.getAttribute('data-i')); }
  });

  /* ---------- 상태 ---------- */
  var view = 'list', curD = R[0].d, curI = 0, map = null, layer = null, marks = [], charM = null, anim = null, fitAll = [];

  function dayByD(d) { for (var i = 0; i < R.length; i++) if (R[i].d === d) return R[i]; return R[0]; }

  /* 여행 중이면 오늘, 아니면 첫날 */
  function todayD() {
    var n = new Date();
    var k = pad(n.getMonth() + 1) + '-' + pad(n.getDate());
    return (n.getFullYear() === TRIP_Y && dcards[k]) ? k : null;
  }
  /* 현재 시각에 가장 가까운(지나온) 일정 index */
  function nowIndex(day) {
    var n = new Date(), cur = n.getHours() * 60 + n.getMinutes(), best = 0;
    for (var i = 0; i < day.pts.length; i++) if (mins(day.pts[i].t) <= cur) best = i;
    return best;
  }

  /* ---------- 뷰 전환 ---------- */
  function setView(v) {
    view = v;
    vtabs.querySelectorAll('.vtab').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === v); });
    panel.hidden = (v !== 'map');
    /* 지도 뷰에선 펼치기/접기가 의미 없으므로 감춘다 ('지금'은 양쪽 다 쓴다) */
    ['pl-open', 'pl-close'].forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.style.display = (v === 'map') ? 'none' : '';
    });
    Object.keys(dcards).forEach(function (d) { dcards[d].hidden = (v === 'map'); });
    sec.querySelectorAll(':scope > .warn, :scope > .muted').forEach(function (n) { n.hidden = (v === 'map'); });
    if (v === 'map') ensureMap();
  }
  vtabs.addEventListener('click', function (e) {
    var b = e.target.closest('.vtab'); if (!b) return;
    setView(b.getAttribute('data-v'));
    if (b.getAttribute('data-v') === 'map') selectDay(curD, curI);
  });

  chips.addEventListener('click', function (e) {
    var c = e.target.closest('.dchip'); if (!c) return;
    var d = c.getAttribute('data-d');
    if (view === 'map') { selectDay(d, 0); }
    else {
      var dc = dcards[d]; if (!dc) return;
      dc.open = true;
      dc.scrollIntoView({ behavior: 'smooth', block: 'start' });
      markChips(d, true);
    }
  });
  /* doScroll 은 사용자가 직접 날짜를 고른 경우에만 true.
     스크롤 동기화에서까지 칩을 움직이면 안 된다 — scrollIntoView 는 페이지까지 같이
     스크롤해버려서, 타임라인을 내리는 순간 칩 스트립을 보이려고 화면을 도로 위로
     끌어올린다(= 일정이 스크롤되지 않는 것처럼 보임). 그래서 스트립만 가로로 민다. */
  var chipD = null;
  function markChips(d, doScroll) {
    if (d === chipD) return;
    chipD = d;
    chips.querySelectorAll('.dchip').forEach(function (c) { c.classList.toggle('on', c.getAttribute('data-d') === d); });
    if (!doScroll) return;
    var on = chips.querySelector('.dchip.on');
    if (!on) return;
    var want = on.offsetLeft - (chips.clientWidth - on.offsetWidth) / 2;
    var max = chips.scrollWidth - chips.clientWidth;
    chips.scrollTo({ left: Math.max(0, Math.min(want, max)), behavior: 'smooth' });
  }

  /* ---------- Leaflet 지연 로드 ---------- */
  var loading = false;
  function ensureMap() {
    if (map || loading) {
      if (map) setTimeout(function () { map.invalidateSize({ animate: false, pan: false }); }, 60);
      return;
    }
    if (window.L) { initMap(); return; }
    loading = true;
    var cs = el('link'); cs.rel = 'stylesheet'; cs.href = BASE + 'assets/leaflet.css' + V;
    document.head.appendChild(cs);
    var s = document.createElement('script');
    s.src = BASE + 'assets/leaflet.js' + V;
    s.onload = function () { loading = false; initMap(); };
    s.onerror = function () { loading = false; panel.querySelector('.mapoff').classList.add('show'); };
    document.head.appendChild(s);
  }

  function initMap() {
    map = L.map('tmap', { zoomControl: true, attributionControl: true, tap: true });
    var tiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19, subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap · &copy; CARTO'
    }).addTo(map);
    /* 타일이 계속 실패하면(현지 데이터 끊김) 안내를 띄운다 — 경로·핀은 그대로 동작 */
    var fails = 0;
    tiles.on('tileerror', function () {
      if (++fails > 6) panel.querySelector('.mapoff').classList.add('show');
    });
    tiles.on('tileload', function () { fails = 0; });
    layer = L.layerGroup().addTo(map);
    selectDay(curD, curI);
  }

  /* 그날의 '본 무대'를 골라 첫 화면을 맞춘다.
     나리타·마이하마처럼 멀리 떨어진 지점이 하나라도 끼면 전체에 맞출 때 간토 전역이
     나와서 정작 동선이 안 보인다.
     대상은 '실제로 걸어다니는 지점'만 — 숙소·공항처럼 타고 지나가는 곳까지 넣으면
     (예: 9/9 숙소는 시부야에서 3.6km) 화면이 넓어져 상점 핀이 뭉친다.
     그 지점들을 8km 단일연결로 묶고 가장 큰 덩어리에 맞춘다. (🔍로 전체 보기) */
  var LINK = 8000;
  function hav(a, b) {
    var R6 = 6371000, p1 = a[0] * Math.PI / 180, p2 = b[0] * Math.PI / 180;
    var dp = p2 - p1, dl = (b[1] - a[1]) * Math.PI / 180;
    var h = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return 2 * R6 * Math.asin(Math.sqrt(h));
  }
  function mainCluster(day, legPts) {
    var n = day.pts.length, par = [], cand = [], isc = {};
    day.legs.forEach(function (leg, i) {
      if (leg.mv !== 'walk') return;
      [i, i + 1].forEach(function (k) { if (!isc[k]) { isc[k] = 1; cand.push(k); } });
    });
    if (cand.length < 2) { cand = []; for (var j = 0; j < n; j++) cand.push(j); }
    for (var i = 0; i < n; i++) par.push(i);
    function find(x) { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; }
    for (var a = 0; a < cand.length; a++) for (var b = a + 1; b < cand.length; b++) {
      if (hav(day.pts[cand[a]].ll, day.pts[cand[b]].ll) <= LINK) par[find(cand[a])] = find(cand[b]);
    }
    var groups = {};
    cand.forEach(function (k) { var r = find(k); (groups[r] = groups[r] || []).push(k); });
    var best = null;
    Object.keys(groups).forEach(function (g) { if (!best || groups[g].length > best.length) best = groups[g]; });
    if (!best || best.length < 2) return null;
    var inb = {}, out = [];
    best.forEach(function (k) { inb[k] = 1; out.push(day.pts[k].ll); });
    /* 덩어리 안에서 끝나는 도보 경로선도 함께 담아야 화면이 잘리지 않는다 */
    legPts.forEach(function (lp) {
      if (inb[lp.n] && inb[lp.n + 1]) out = out.concat(lp.pts);
    });
    return out;
  }

  /* ---------- 하루 그리기 ---------- */
  function selectDay(d, i) {
    curD = d; markChips(d, true);
    var day = dayByD(d);
    curI = Math.max(0, Math.min(i || 0, day.pts.length - 1));
    panel.querySelector('.mdate').textContent = day.label + ' · ' + day.sub;
    if (!map) { ensureMap(); return; }

    layer.clearLayers(); marks = []; charM = null;
    if (anim) { cancelAnimationFrame(anim); anim = null; }

    var all = [], legPts = [];
    /* 경로선 */
    day.legs.forEach(function (leg, n) {
      var a = day.pts[n].ll, b = day.pts[n + 1].ll;
      if (leg.mv === 'stay') return;
      var col = colorOf(d, day.pts[n + 1].t);
      var pts = leg.g ? decodePoly(leg.g) : [a, b];
      leg._pts = pts;
      legPts.push({ n: n, pts: pts });
      L.polyline(pts, {
        color: '#2b2b2b', weight: leg.mv === 'walk' ? 6 : 4, opacity: .18, lineCap: 'round'
      }).addTo(layer);
      L.polyline(pts, {
        color: col, weight: leg.mv === 'walk' ? 4 : 3, opacity: .95, lineCap: 'round',
        dashArray: leg.mv === 'walk' ? null : '2,9'
      }).addTo(layer);
      all = all.concat(pts);
    });
    /* 핀 */
    day.pts.forEach(function (p, n) {
      var col = colorOf(d, p.t);
      var mk = L.marker(p.ll, {
        icon: L.divIcon({
          className: 'mpin-wrap',
          html: '<span class="mpin" style="background:' + col + '">' + (n + 1) + '</span>',
          iconSize: [28, 28], iconAnchor: [14, 14]
        }),
        zIndexOffset: 100 + n
      }).addTo(layer);
      mk.bindTooltip(p.t + ' ' + p.i + ' ' + p.n, { direction: 'top', offset: [0, -14], className: 'mtip' });
      mk.on('click', function () { goto(n, false); });
      marks.push(mk);
      all.push(p.ll);
    });
    /* 캐릭터 */
    charM = L.marker(day.pts[curI].ll, {
      icon: L.divIcon({ className: 'mchar-wrap', html: '<span class="mchar">🚶</span>', iconSize: [30, 30], iconAnchor: [15, 22] }),
      zIndexOffset: 900, interactive: false
    }).addTo(layer);

    fitAll = all;
    var fit = mainCluster(day, legPts) || all;
    /* fitBounds 전에 컨테이너 크기를 먼저 갱신해야 한다 —
       숨겨진 상태에서 초기화된 지도는 크기를 0으로 캐시하고 있어 화면 밖으로 튄다 */
    map.invalidateSize({ animate: false, pan: false });
    if (fit.length) map.fitBounds(L.latLngBounds(fit).pad(.16));
    goto(curI, false, true);
  }

  /* ---------- 스텝 이동 ---------- */
  function goto(n, animate, noPan) {
    var day = dayByD(curD);
    n = Math.max(0, Math.min(n, day.pts.length - 1));
    var from = curI;
    curI = n;
    var p = day.pts[n];

    marks.forEach(function (m, k) {
      var e = m.getElement && m.getElement();
      if (e) e.classList.toggle('on', k === n);
      /* 가까운 가게끼리 핀이 겹치므로 현재 지점을 항상 맨 위로 */
      m.setZIndexOffset(k === n ? 1000 : 100 + k);
      if (k === n) m.openTooltip(); else m.closeTooltip();
    });
    panel.querySelector('.mnow').innerHTML =
      '<b>' + p.t + '</b> ' + p.i + ' ' + p.n +
      (n > 0 ? '<span class="mvia">' + legLabel(day.legs[n - 1]) + '</span>' : '');
    panel.querySelector('.mcnt').textContent = (n + 1) + ' / ' + day.pts.length;
    panel.querySelector('.mprog i').style.width = ((n + 1) / day.pts.length * 100) + '%';
    panel.querySelector('.mprev').disabled = (n === 0);
    panel.querySelector('.mnext').disabled = (n === day.pts.length - 1);

    if (animate && n === from + 1 && day.legs[from]) walk(day.legs[from], p.ll);
    else {
      if (charM) charM.setLatLng(p.ll);
      if (!noPan) map.panTo(p.ll, { animate: true, duration: .5 });
    }
  }
  function legLabel(leg) {
    if (!leg) return '';
    if (leg.mv === 'stay') return '📍 같은 장소';
    if (leg.mv === 'walk') return '🚶 도보 ' + (leg.m || leg.d) + 'm · ' + Math.max(1, Math.round((leg.s || leg.d / 1.25) / 60)) + '분';
    return '🚃 이동 ' + (leg.d >= 1000 ? (leg.d / 1000).toFixed(1) + 'km' : leg.d + 'm');
  }

  function walk(leg, dest) {
    var pts = leg._pts || [charM.getLatLng(), dest];
    if (pts.length < 2) { charM.setLatLng(dest); return; }
    var ico = charM.getElement() && charM.getElement().querySelector('.mchar');
    if (ico) ico.textContent = leg.mv === 'walk' ? '🚶' : '🚃';
    var dur = leg.mv === 'walk' ? 2200 : 1400, t0 = null;
    map.panTo(pts[Math.floor(pts.length / 2)], { animate: true, duration: .6 });
    if (anim) cancelAnimationFrame(anim);
    function step(ts) {
      if (t0 == null) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur);
      var f = k * (pts.length - 1), i = Math.floor(f), r = f - i;
      var a = pts[i], b = pts[Math.min(i + 1, pts.length - 1)];
      charM.setLatLng([a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r]);
      if (k < 1) anim = requestAnimationFrame(step);
      else { anim = null; charM.setLatLng(dest); map.panTo(dest, { animate: true, duration: .4 }); }
    }
    anim = requestAnimationFrame(step);
  }

  panel.querySelector('.mall').addEventListener('click', function () {
    if (map && fitAll.length) map.fitBounds(L.latLngBounds(fitAll).pad(.16));
  });
  panel.querySelector('.mprev').addEventListener('click', function () { goto(curI - 1, false); });
  panel.querySelector('.mnext').addEventListener('click', function () { goto(curI + 1, true); });
  panel.querySelector('.mgo').addEventListener('click', function () {
    var day = dayByD(curD), n = curI;
    if (n >= day.pts.length - 1) { goto(0, false); return; }
    (function chain() {
      n++; goto(n, true);
      if (n < day.pts.length - 1) setTimeout(chain, day.legs[n - 1] && day.legs[n - 1].mv === 'walk' ? 2600 : 1800);
    })();
  });

  /* ---------- 📍 지금 ---------- */
  var oldToday = document.getElementById('pl-today');
  if (oldToday) {
    /* app.js가 이미 붙여둔 '오늘만 보기' 핸들러를 떼려고 노드를 교체한다 */
    var todayBtn = oldToday.cloneNode(true);
    oldToday.parentNode.replaceChild(todayBtn, oldToday);
    var td = todayD();
    todayBtn.textContent = td ? '📍 지금' : '📍 첫날부터';
    todayBtn.addEventListener('click', function () {
      var d = td || R[0].d, day = dayByD(d);
      var i = td ? nowIndex(day) : 0;
      if (view === 'map') { selectDay(d, i); return; }
      Object.keys(dcards).forEach(function (k) { dcards[k].open = (k === d); });
      markChips(d, true);
      var m = evIndex[d] && evIndex[d][day.pts[i].t];
      var target = (m && m.el) || dcards[d];
      document.querySelectorAll('.ev.nowhit').forEach(function (x) { x.classList.remove('nowhit'); });
      if (m && m.el) m.el.classList.add('nowhit');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* 일정 뷰에서 스크롤에 따라 날짜 칩 동기화 */
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (view !== 'list' || ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var best = null, bestTop = 1e9;
      Object.keys(dcards).forEach(function (d) {
        var r = dcards[d].getBoundingClientRect();
        if (r.bottom > 120 && r.top < bestTop) { bestTop = r.top; best = d; }
      });
      if (best) markChips(best);
    });
  }, { passive: true });

  markChips(todayD() || R[0].d, true);
})();
