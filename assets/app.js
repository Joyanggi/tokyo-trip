/* ================= 지역 정규화 · 색상 =================
   .bdg 뱃지 텍스트나 .zgrp의 data-rg를 표준 지역명 배열로 바꾸고,
   지역명마다 안정적인(해시 기반) 색을 하나만 부여한다 — .bdg/.litem 띠/.zgrp가 전부 이 색을 공유. */
var REGION_ALIAS = { '전국 공통':'전국' };
var REGION_DROP = ['지점 다수', "Sac's Bar", 'ABC마트', '지바']; /* 지역이 아니라 브랜드·설명 토큰 */
function regionsOf(el){
  if(!el) return [];
  var cached = el.getAttribute('data-rg');
  if(cached===null){
    var raw = el.textContent.split(/[·\/]/).map(function(s){return s.trim();}).filter(Boolean);
    var out=[];
    raw.forEach(function(s){
      if(REGION_DROP.indexOf(s)>=0) return;
      var r = REGION_ALIAS[s] || s;
      if(out.indexOf(r)<0) out.push(r);
    });
    cached = out.join('|');
    el.setAttribute('data-rg', cached); /* 재계산 방지 캐시 */
  }
  return cached ? cached.split('|') : [];
}
function regionColor(name){
  if(!name || name==='전국') return '#8a8272'; /* 전국 체인은 중립 회색 */
  var h=0;
  for(var i=0;i<name.length;i++){ h=(h*31 + name.charCodeAt(i))|0; }
  h=((h%360)+360)%360;
  return 'hsl('+h+',48%,42%)';
}

/* ================= 공용 크롬 주입 (하단 nav·지역 필터바·라이트박스·footer) ================= */
(function(){
  var BASE = /\/pages\//.test(location.pathname) ? '../' : './';
  var sheet = document.querySelector('.sheet');
  var header = sheet && sheet.querySelector('header');

  if(header && !document.getElementById('fbar-wrap')){
    header.insertAdjacentHTML('afterend',
      '<div id="fbar-wrap">' +
        '<div id="fbar">' +
          '<button id="fbar-toggle" type="button"><span class="ico">📍</span><span id="flab">지역 전체</span><span class="car">▾</span></button>' +
          '<span class="x" id="fbar-clear" title="필터 해제">✕</span>' +
          '<button id="nv-hide" type="button"><span class="ico">✅</span>숨김</button>' +
        '</div>' +
        '<div id="chips"></div>' +
      '</div>' +
      '<div class="empty" id="fempty"></div>'
    );
  }
  if(sheet && !sheet.querySelector('footer')){
    sheet.insertAdjacentHTML('beforeend',
      '<footer>작성: 도쿄 탐방 준비위원회 · 항목이 추가되면 계속 업데이트됩니다 📋<br>' +
      '가격·재고는 변동될 수 있으니 방문 시 현장 기준으로 재확인하세요.</footer>'
    );
  }

  var TABS = [
    ['home','🏠','개요','index.html'],
    ['plan','🗓️','일정','pages/plan.html'],
    ['buy','🛍️','사고','pages/buy.html'],
    ['eat','🍜','먹고','pages/eat.html'],
    ['go','🗺️','가고','pages/go.html'],
    ['trip','🚃','근교','pages/trip.html'],
    ['local','🤖','로컬','pages/local.html']
  ];
  var curTab = document.body.getAttribute('data-tab') || 'home';
  if(!document.getElementById('nav')){
    var navHtml = TABS.map(function(t){
      var cls = (t[0]===curTab) ? ' class="on"' : '';
      return '<a'+cls+' href="'+BASE+t[3]+'"><span class="ico">'+t[1]+'</span>'+t[2]+'</a>';
    }).join('');
    document.body.insertAdjacentHTML('beforeend', '<nav id="nav">'+navHtml+'</nav>');
  }
  if(!document.getElementById('lb')){
    document.body.insertAdjacentHTML('beforeend',
      '<div id="lb"><span class="hint">✕ 닫기 (아무 곳이나 탭)</span><img alt="확대 이미지"></div>'
    );
  }

  /* 📍 지역 칩 — 이 페이지에 실제로 있는 지역만, 등장 빈도순으로 만든다(하드코딩 목록 대신) */
  var chips = document.getElementById('chips');
  if(chips && !chips.childElementCount){
    var counts={}, order=[];
    function tally(el){
      regionsOf(el).forEach(function(r){
        if(!(r in counts)){ counts[r]=0; order.push(r); }
        counts[r]++;
      });
    }
    document.querySelectorAll('.sheet > section .bdg').forEach(tally);
    document.querySelectorAll('.zgrp[data-rg]').forEach(tally);
    order.sort(function(a,b){ return counts[b]-counts[a]; });
    chips.insertAdjacentHTML('beforeend', '<button class="chip all" type="button" data-r="">전체 보기</button>' +
      order.map(function(r){ return '<button class="chip" type="button" data-r="'+r+'">'+r+'</button>'; }).join(''));
  }
})();

/* ================= 라이트박스 ================= */
(function(){
  var lb=document.getElementById('lb'), big=lb.querySelector('img');
  document.addEventListener('click',function(e){
    var t=e.target;
    if(t.tagName==='IMG' && !lb.contains(t)){ big.src=t.currentSrc||t.src; lb.classList.add('open'); }
    else if(lb.classList.contains('open')){ lb.classList.remove('open'); }
  });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') lb.classList.remove('open'); });
})();

/* ================= 체크박스 저장 (이름 기반 키) ================= */
(function(){
  var KEY='tokyoTripChecks', saved={};
  try{ saved=JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){}
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(saved)); }catch(e){} }
  function slugOld(t){ return (t||'').replace(/\s+/g,' ').trim().slice(0,80); }
  /* 이름 기반 안정 키 — 가격·품절 표시가 바뀌어도 체크 유지. data-ck 속성이 있으면 최우선. */
  function nameOf(item){
    var d=item.getAttribute('data-ck'); if(d) return d;
    var el=item.querySelector('.pnm,.lnm,.nm,h3')||item;
    var c=el.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll('.jp,.psold,.bdg,.lsub,.ppr,.pmeta,.pdesc,.ld,.ljp,input'),function(x){ x.parentNode.removeChild(x); });
    return c.textContent.replace(/\s+/g,' ').trim().slice(0,60);
  }
  function attach(item, cl){
    if(item.getAttribute('data-ckd')) return; item.setAttribute('data-ckd','1');
    var k = cl + '##' + nameOf(item);
    var kOld = cl + '::' + slugOld(item.textContent);
    if(saved[kOld] && !saved[k]){ saved[k]=1; delete saved[kOld]; save(); } /* 구버전 키 이관 */
    var cb = document.createElement('input'); cb.type='checkbox'; cb.className='ckbox';
    if(saved[k]){ cb.checked=true; item.classList.add('ckd'); }
    cb.addEventListener('click', function(e){ e.stopPropagation(); });
    cb.addEventListener('change', function(){ if(cb.checked){saved[k]=1;} else {delete saved[k];} save(); item.classList.toggle('ckd', cb.checked); updateCounts(); });
    item.insertBefore(cb, item.firstChild);
  }
  document.querySelectorAll('[data-cl]').forEach(function(c){
    var cl=c.getAttribute('data-cl');
    var kids=c.querySelectorAll(':scope > .n, :scope > .prow, :scope > .item, :scope > .litem');
    if(kids.length){ Array.prototype.forEach.call(kids, function(k){ attach(k, cl); }); }
    else { attach(c, cl); }
  });
  /* 섹션별 진행률 (h2에 n/m) */
  function updateCounts(){
    document.querySelectorAll('.sheet > section').forEach(function(sec){
      var boxes=sec.querySelectorAll('input.ckbox'); if(!boxes.length) return;
      var h2=sec.querySelector('h2'); if(!h2) return;
      var done=0; Array.prototype.forEach.call(boxes,function(b){ if(b.checked) done++; });
      var c=h2.querySelector('.cnt');
      if(!c){ c=document.createElement('span'); c.className='cnt'; h2.insertBefore(c, h2.querySelector('.bdg')); }
      c.textContent=done+'/'+boxes.length;
    });
  }
  updateCounts();
})();

/* ================= 구글맵 핀 ================= */
(function(){
  function mapUrl(q){ return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q); }
  function pin(q){ var a=document.createElement('a'); a.className='mappin'; a.href=mapUrl(q); a.target='_blank'; a.rel='noopener'; a.title='구글맵에서 보기'; a.textContent='📍'; a.addEventListener('click',function(e){e.stopPropagation();}); return a; }
  document.querySelectorAll('[data-map] .litem').forEach(function(it){
    if(it.querySelector('a.mappin')) return;
    var nm=it.querySelector('.lnm'); if(!nm) return;
    var lt=it.querySelector('.lt')||nm.parentNode;
    var jp=it.querySelector('.ljp'); var extra=(jp && /[぀-ヿ㐀-鿿]/.test(jp.textContent)) ? ' '+jp.textContent.trim().split(/[·\/]/)[0] : '';
    lt.appendChild(pin(nm.textContent.trim()+extra+' 東京'));
  });
  document.querySelectorAll('[data-mapq]').forEach(function(el){
    if(el.querySelector('a.mappin')) return;
    el.appendChild(pin(el.getAttribute('data-mapq')));
  });
})();

/* ================= 지역 필터 & 표시 바 (탭을 넘어가도 유지) ================= */
(function(){
  var RK='tokyoTripRegion', HK='tokyoTripHide';
  var fbarWrap=document.getElementById('fbar-wrap'), fbar=document.getElementById('fbar'),
      fbarToggle=document.getElementById('fbar-toggle'), flab=document.getElementById('flab'),
      fempty=document.getElementById('fempty'), chips=document.getElementById('chips'),
      btnHide=document.getElementById('nv-hide');
  var cur=null; /* 활성 필터: 표준 지역명 배열 또는 null */

  function matches(regions){
    if(!cur) return true;
    if(!regions || !regions.length) return true; /* 지역 정보 없음 — 필터와 무관, 항상 표시 */
    for(var i=0;i<cur.length;i++){ if(regions.indexOf(cur[i])>=0) return true; }
    /* 전국 체인(몽벨·편의점·쿠라스시 등)은 어느 지역에서나 이용 가능하므로 항상 표시 */
    if(cur.indexOf('전국')<0 && regions.indexOf('전국')>=0) return true;
    return false;
  }

  function updateChipStates(){
    if(!chips) return;
    Array.prototype.forEach.call(chips.querySelectorAll('.chip'), function(c){
      var r=c.getAttribute('data-r');
      var on = cur===null ? (r==='') : (r!=='' && cur.indexOf(r)>=0);
      c.classList.toggle('on', on);
    });
  }

  function apply(segs, opts){
    cur=(segs&&segs.length)?segs:null;
    var hasFilterable=false, hasVisibleMatch=(cur===null);

    document.querySelectorAll('.sheet > section').forEach(function(sec){
      var h2=sec.querySelector('h2'); var hb=h2?h2.querySelector('.bdg'):null;
      var rows=sec.querySelectorAll('.litem');
      var hasBdgRow=false;
      Array.prototype.forEach.call(rows,function(r){ if(r.querySelector('.bdg')) hasBdgRow=true; });

      if(!hb && !hasBdgRow){
        /* 지역 뱃지 체계가 없는 섹션(개요·일정·긴급 등) — 필터와 무관, 항상 표시 */
        sec.style.display='';
        Array.prototype.forEach.call(rows,function(r){ r.style.display=''; });
        return;
      }
      hasFilterable=true;
      if(cur===null){ sec.style.display=''; Array.prototype.forEach.call(rows,function(r){r.style.display='';}); return; }
      if(hb){
        var vis=matches(regionsOf(hb));
        sec.style.display = vis ? '' : 'none';
        Array.prototype.forEach.call(rows,function(r){ r.style.display=''; }); /* tier-1 섹션의 행은 항상 리셋 */
        if(vis) hasVisibleMatch=true;
        return;
      }
      var anyVis=false;
      Array.prototype.forEach.call(rows,function(r){
        var b=r.querySelector('.bdg'); var v=b?matches(regionsOf(b)):true;
        r.style.display=v?'':'none'; if(v)anyVis=true;
      });
      sec.style.display = anyVis ? '' : 'none';
      if(anyVis) hasVisibleMatch=true;
    });

    document.querySelectorAll('.bigcat').forEach(function(band){
      var el=band.nextElementSibling, any=false;
      while(el && !(el.classList && el.classList.contains('bigcat')) && !(el.getAttribute && el.getAttribute('data-solo'))){ if(el.tagName==='SECTION' && el.style.display!=='none') any=true; el=el.nextElementSibling; }
      band.style.display = (cur===null || any) ? '' : 'none';
    });

    /* 일정 타임라인 — 지역 존 단위로 필터, 매칭 존이 없는 날짜 카드는 접는다 */
    window.__rgFiltering=true; /* 아래에서 건드리는 .open 변화는 '전체펼치기' 저장 로직이 무시하도록 */
    document.querySelectorAll('.dcard').forEach(function(card){
      var zones=card.querySelectorAll('.zgrp'); if(!zones.length) return;
      if(cur===null){ Array.prototype.forEach.call(zones,function(z){ z.style.display=''; }); return; }
      var cardVis=false, filterable=false;
      Array.prototype.forEach.call(zones,function(z){
        var rg=regionsOf(z);
        if(!rg.length){ z.style.display=''; return; } /* 이동 존은 중립 — 필터 판정에서 제외 */
        filterable=true;
        var vis=matches(rg);
        z.style.display=vis?'':'none';
        if(vis) cardVis=true;
      });
      if(filterable){
        hasFilterable=true;
        if(cardVis){ card.open=true; hasVisibleMatch=true; }
        else { card.open=false; }
      }
    });
    window.__rgFiltering=false;

    if(cur===null){
      fbar.classList.remove('active');
      flab.textContent='지역 전체';
      if(fempty) fempty.style.display='none';
    } else {
      fbar.classList.add('active');
      flab.textContent=cur.join(' · ');
      if(fempty){
        if(!hasFilterable || hasVisibleMatch){ fempty.style.display='none'; }
        else { fempty.textContent='😶 이 탭엔 '+cur.join(' · ')+' 항목이 없어요.'; fempty.style.display='block'; }
      }
      /* 다른 탭에서 걸어둔 지역이 이 탭 칩엔 없을 수 있음 — 그래도 해제할 수 있게 맨 앞에 끼워 넣는다 */
      if(chips){
        cur.forEach(function(r){
          if(!chips.querySelector('.chip[data-r="'+r+'"]')){
            chips.insertAdjacentHTML('afterbegin', '<button class="chip" type="button" data-r="'+r+'">'+r+'</button>');
          }
        });
      }
      if(!(opts && opts.restore)) window.scrollTo({top:0,behavior:'smooth'});
    }
    updateChipStates();
    try{ localStorage.setItem(RK, cur ? JSON.stringify(cur) : ''); }catch(e){}
  }
  window.__applyFilter=apply;

  /* 📍 토글 — 칩 서랍 열고 닫기 */
  if(fbarToggle && chips){
    fbarToggle.addEventListener('click', function(){
      var open=chips.classList.toggle('open');
      if(fbarWrap) fbarWrap.classList.toggle('chips-open', open);
    });
  }
  /* 뱃지 클릭 → 그 지역들로 필터 (안내문 예시 뱃지는 제외) */
  document.addEventListener('click', function(e){
    var t=e.target;
    if(t.classList && t.classList.contains('bdg')){
      if(t.hasAttribute('data-demo')) return;
      e.stopPropagation();
      apply(regionsOf(t));
    } else if(t.id==='fbar-clear'){
      apply(null);
    }
  });
  /* 칩 클릭 */
  if(chips){
    chips.addEventListener('click', function(e){
      var c=e.target.closest('.chip'); if(!c) return;
      var r=c.getAttribute('data-r');
      apply(r?[r]:null);
      chips.classList.remove('open');
      if(fbarWrap) fbarWrap.classList.remove('chips-open');
    });
  }
  /* ✅숨김 — 다녀온(체크한) 항목 감추기, 설정 저장 */
  function setHide(on){ document.body.classList.toggle('hideck',on); if(btnHide) btnHide.classList.toggle('on',on); try{ localStorage.setItem(HK,on?'1':''); }catch(e){} }
  if(btnHide) btnHide.addEventListener('click', function(){ setHide(!document.body.classList.contains('hideck')); });
  try{ if(localStorage.getItem(HK)==='1') setHide(true); }catch(e){}

  window.__updateChipStates=updateChipStates;
})();

/* ================= 지역 색상 적용 (뱃지 배경 · 목록 좌측 띠 · 일정 존 색) =================
   3군데 흩어져 있던 팔레트를 없애고, 지역명마다 regionColor()로 딱 하나의 색을 계산해 공유한다. */
(function(){
  document.querySelectorAll('.bdg').forEach(function(b){
    var rg=regionsOf(b);
    b.style.background=regionColor(rg[0]);
  });
  document.querySelectorAll('.lcard .litem').forEach(function(it){
    var b=it.querySelector('.bdg'); if(!b) return;
    it.style.borderLeftColor = b.style.background || '#5b6b7a';
  });
  document.querySelectorAll('.zgrp[data-rg]').forEach(function(z){
    var rg=regionsOf(z);
    z.style.setProperty('--zc', rg.length ? regionColor(rg[0]) : '#8a8272');
  });
})();

/* ================= 하단 바 동작 (일정 카드 펼침 · 오프라인 캐시) ================= */
(function(){
  /* 일정 카드 접기/펼치기 — plan.html에서만 대상이 있음 */
  var cards=[].slice.call(document.querySelectorAll('.dcard[data-d]'));
  if(cards.length){
    var PK='tokyoTripPlanOpen';
    function setAll(open){ cards.forEach(function(c){ c.open=open; }); }
    function todayKey(){ var n=new Date(); return ('0'+(n.getMonth()+1)).slice(-2)+'-'+('0'+n.getDate()).slice(-2); }
    function showToday(){
      var k=todayKey(), hit=false;
      cards.forEach(function(c){ var m=c.getAttribute('data-d')===k; c.open=m; if(m)hit=true; });
      if(!hit){ setAll(true); return false; }
      var el=document.querySelector('.dcard[data-d="'+k+'"]');
      if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
      return true;
    }
    var bOpen=document.getElementById('pl-open'), bClose=document.getElementById('pl-close'), bToday=document.getElementById('pl-today');
    function save(){ try{ localStorage.setItem(PK, JSON.stringify(cards.map(function(c){return c.open?1:0;}))); }catch(e){} }
    if(bOpen){
      bOpen.addEventListener('click', function(){ setAll(true); save(); });
      bClose.addEventListener('click', function(){ setAll(false); save(); });
      bToday.addEventListener('click', function(){ if(!showToday()) alert('여행 기간(9/5~9/9)이 아니라 전체를 펼쳤어요.'); save(); });
    }
    /* 지역 필터가 강제로 여닫는 동안(window.__rgFiltering)은 저장하지 않음 — 필터 해제 후 원래 펼침 상태로 복귀 */
    cards.forEach(function(c){ c.addEventListener('toggle', function(){ if(!window.__rgFiltering) save(); }); });
    /* 첫 방문: 여행 기간이면 오늘만, 아니면 저장된 상태 복원 */
    (function(){
      var saved=null;
      try{ saved=JSON.parse(localStorage.getItem(PK)||'null'); }catch(e){}
      if(saved && saved.length===cards.length){ cards.forEach(function(c,i){ c.open=!!saved[i]; }); }
      else if(cards.some(function(c){ return c.getAttribute('data-d')===todayKey(); })){ showToday(); }
    })();
  }

  /* 오프라인 캐시 — GitHub Pages(https)에서만 동작 */
  var BASE = /\/pages\//.test(location.pathname) ? '../' : './';
  if('serviceWorker' in navigator && location.protocol==='https:'){ try{ navigator.serviceWorker.register(BASE+'sw.js'); }catch(e){} }
})();

/* ================= 지역 필터 복원 =================
   위 "일정 카드 펼침" 복원보다 반드시 나중에 실행해, 활성 필터가 있으면
   저장된 펼침 상태 대신 필터가 최종적으로 어떤 날짜 카드를 여닫을지 결정하게 한다. */
(function(){
  var RK='tokyoTripRegion', saved=null;
  try{ var raw=localStorage.getItem(RK); if(raw) saved=JSON.parse(raw); }catch(e){}
  if(!window.__applyFilter) return;
  if(saved && saved.length) window.__applyFilter(saved, {restore:true});
  else window.__applyFilter(null, {restore:true});
})();
