/* ========================================================================
   🗓️ 일정 탭 보조 기능 (pages/plan.html 전용)
   · 날짜 칩 스트립 — 날짜 점프 + 스크롤에 따라 현재 날짜 표시
   · 일정 행마다 🧭길찾기 · 📍지도 · 📅캘린더(.ics) · 📖상세
   · 이동 행에 도보 거리·소요시간 뱃지 · 📍지금
   좌표·검색어·도보 거리는 assets/route-data.js 에 미리 구워둔 값을 쓴다.
   (오버뷰 지도는 현지 활용도가 없어 걷어냈다.)
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
  plbar.parentNode.insertBefore(chips, plbar);

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
        '<button type="button" class="ics" data-di="' + di + '" data-i="' + i + '">📅 캘린더</button>');
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
  });

  /* ---------- 날짜 이동 ---------- */

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

  chips.addEventListener('click', function (e) {
    var c = e.target.closest('.dchip'); if (!c) return;
    var d = c.getAttribute('data-d');
    var dc = dcards[d]; if (!dc) return;
    dc.open = true;
    dc.scrollIntoView({ behavior: 'smooth', block: 'start' });
    markChips(d, true);
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
    if (ticking) return;
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
