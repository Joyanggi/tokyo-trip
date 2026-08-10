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
/* 지역 색은 이 문서에서 장식이 아닌 유일한 색 — 필터 정체성을 담는다.
   나머지 색을 흑백으로 눌렀으므로 채도를 낮춰 '찍힌 잉크'처럼 보이게 한다. */
function regionColor(name){
  if(!name || name==='전국') return '#8a877c'; /* 전국 체인은 중립 회색 */
  var h=0;
  for(var i=0;i<name.length;i++){ h=(h*31 + name.charCodeAt(i))|0; }
  h=((h%360)+360)%360;
  return 'hsl('+h+',34%,36%)';
}

/* ================= 여행 일자 ================= */
var TRIP = {
  y:2026, m:8, d:5,                       /* 2026-09-05 (월은 0-based) */
  start:Date.UTC(2026,8,5), end:Date.UTC(2026,8,9),
  /* 출발 전이면 D-n, 여행 중이면 n일차, 끝났으면 종료 */
  dday:function(){
    var n=new Date(), t=Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
    var left=Math.round((this.start-t)/86400000);
    if(left>0) return 'D-'+left;
    if(t>this.end) return '여행 종료';
    return '여행 '+(Math.round((t-this.start)/86400000)+1)+'일차';
  }
};

/* ================= 공용 크롬 주입 =================
   문서 머리(문서번호·수신·발신)·관인·지역 필터바·하단 nav·라이트박스·
   절취선 확인 회신서를 전부 여기서 넣는다 — 8개 페이지가 구조적으로 같아진다. */
(function(){
  var BASE = /\/pages\//.test(location.pathname) ? '../' : './';
  var sheet = document.querySelector('.sheet');
  var header = sheet && sheet.querySelector('header');

  var TABS = [
    ['home','🏠','개요','index.html'],
    ['plan','🗓️','일정','pages/plan.html'],
    ['buy','🛍️','사고','pages/buy.html'],
    ['eat','🍜','먹고','pages/eat.html'],
    ['go','🗺️','가고','pages/go.html'],
    ['trip','🚃','근교','pages/trip.html'],
    ['local','🤖','로컬','pages/local.html'],
    ['money','💴','지출','pages/money.html']
  ];
  var curTab = document.body.getAttribute('data-tab') || 'home';
  var tabIdx = 0;
  TABS.forEach(function(t,i){ if(t[0]===curTab) tabIdx=i; });
  var DOCNO = '제2026-'+(11+tabIdx)+'호';

  /* ── 문서 머리 · 수신/발신 · 관인 ── */
  if(header && !document.querySelector('.dochead')){
    header.insertAdjacentHTML('beforebegin',
      '<div class="dochead">' +
        '<span class="docno">'+DOCNO+'</span>' +
        '<span class="docdate">시행 2026. 9. 5.</span>' +
      '</div>'
    );
    header.insertAdjacentHTML('beforeend',
      '<dl class="docto">' +
        '<dt>수신</dt><dd>***REMOVED*** · ***REMOVED*** 귀하</dd>' +
        '<dt>발신</dt><dd>도쿄 탐방 준비위원회</dd>' +
        '<dt>기간</dt><dd class="num">2026. 9. 5. ~ 9. 9. (4박 5일)</dd>' +
      '</dl>' +
      '<div class="gwanin" aria-hidden="true">도쿄<i>준비위</i></div>'
    );
  }

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
  /* ── 절취선 확인 회신서 ──
     가정통신문의 회신란을 그대로 가져왔다. 이 페이지의 확인 진행률과 남은 날을
     보여주고, 전부 확인하면 관인이 찍힌다. */
  if(sheet && !sheet.querySelector('footer')){
    sheet.insertAdjacentHTML('beforeend',
      '<div class="tear"><span>✂</span></div>' +
      '<div class="reply">' +
        '<div class="rtit">확 인 회 신 서</div>' +
        '<div class="rgrid">' +
          '<table class="rtab"><tbody>' +
            '<tr><th>문서번호</th><td>'+DOCNO+'</td></tr>' +
            '<tr id="rp-row"><th>확인 항목</th><td id="rp-val">0 / 0</td></tr>' +
            '<tr><th>출발까지</th><td id="rp-dday"></td></tr>' +
            '<tr><th>확인자</th><td class="kr">***REMOVED*** · ***REMOVED***</td></tr>' +
          '</tbody></table>' +
          '<div class="rseal" id="rp-seal">확 인</div>' +
        '</div>' +
        '<p class="rnote">위 안내문의 내용을 확인하였습니다. 가격·재고·영업시간은 변동될 수 있으니 방문 시 현장 기준으로 재확인하세요.</p>' +
      '</div>' +
      '<footer>도쿄 탐방 준비위원회 · 항목이 추가되면 계속 업데이트됩니다</footer>'
    );
    document.getElementById('rp-dday').textContent = TRIP.dday();

    /* 체크박스가 없는 페이지(개요·일정·지출)는 확인할 항목 자체가 없으므로
       그 줄을 빼고 관인을 찍은 상태로 둔다. */
    var seal=document.getElementById('rp-seal'), row=document.getElementById('rp-row'), val=document.getElementById('rp-val');
    var wasDone=false;
    function paintReply(){
      var boxes=document.querySelectorAll('input.ckbox');
      if(!boxes.length){ row.style.display='none'; seal.classList.add('on'); wasDone=true; return; }
      var done=0;
      Array.prototype.forEach.call(boxes,function(b){ if(b.checked) done++; });
      val.textContent=done+' / '+boxes.length;
      var full=(done===boxes.length);
      /* 이미 찍혀 있으면 다시 애니메이션하지 않는다 — 첫 방문에 쿵 찍히는 건 한 번뿐 */
      if(full && !wasDone){ seal.classList.remove('on'); void seal.offsetWidth; seal.classList.add('on'); }
      else if(!full) seal.classList.remove('on');
      wasDone=full;
    }
    /* 체크박스는 나중에 붙으므로 다음 틱에 한 번, 이후엔 변경마다 */
    setTimeout(paintReply,0);
    document.addEventListener('change', function(e){
      if(e.target.classList && e.target.classList.contains('ckbox')) paintReply();
    });
  }

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

/* ================= Supabase 접속 (SDK 없이 fetch만) =================
   SDK를 CDN에서 불러오면 오프라인에서 스크립트를 못 받아 앱이 통째로 깨진다.
   필요한 건 auth 토큰 발급/갱신과 REST 두 가지뿐이라 직접 부른다.
   publishable key는 공개돼도 안전 — 테이블에 RLS가 걸려 있어 로그인 없이는
   읽기도 쓰기도 거부된다(42501). 로그인 정보는 저장소에 없고 각자 기기에만 있다. */
var SB={
  url:'https://jiwtfwkbfraolwxbnzzv.supabase.co',
  key:'sb_publishable_vu6Al-Urwr_eymf6K77ouQ_PhJfKIaV',
  SK:'tokyoTripSbSession',
  session:null,
  init:function(){ try{ this.session=JSON.parse(localStorage.getItem(this.SK)||'null'); }catch(e){} return this.session; },
  setSession:function(s){
    this.session=s;
    try{ s ? localStorage.setItem(this.SK, JSON.stringify(s)) : localStorage.removeItem(this.SK); }catch(e){}
  },
  email:function(){ return this.session && this.session.email; },
  loggedIn:function(){ return !!(this.session && this.session.refresh_token); },
  /* Supabase가 돌려주는 영문 메시지를 그대로 보여주면 불친절해서 자주 나오는 건 바꿔 준다 */
  MSG:{
    'Invalid login credentials':'이메일 또는 비밀번호가 맞지 않아요',
    'Email not confirmed':'이메일 확인이 안 된 계정이에요 (대시보드에서 Auto Confirm 체크)',
    'Failed to fetch':'네트워크에 연결할 수 없어요'
  },
  _json:function(r){
    var self=this;
    return r.text().then(function(txt){
      var j=null; try{ j=txt?JSON.parse(txt):null; }catch(e){}
      if(!r.ok){
        var m=(j&&(j.error_description||j.msg||j.message||j.error))||('HTTP '+r.status);
        var err=new Error(self.MSG[m]||m); err.status=r.status; throw err;
      }
      return j;
    });
  },
  signIn:function(email, pw){
    var self=this;
    return fetch(this.url+'/auth/v1/token?grant_type=password',{
      method:'POST', headers:{'apikey':this.key,'Content-Type':'application/json'},
      body:JSON.stringify({ email:email, password:pw })
    }).then(this._json).then(function(j){
      self.setSession({ access_token:j.access_token, refresh_token:j.refresh_token,
                        exp:Date.now()+((j.expires_in||3600)*1000), email:email });
      return j;
    });
  },
  refresh:function(){
    var self=this;
    if(!this.loggedIn()) return Promise.reject(new Error('로그인이 필요해요'));
    return fetch(this.url+'/auth/v1/token?grant_type=refresh_token',{
      method:'POST', headers:{'apikey':this.key,'Content-Type':'application/json'},
      body:JSON.stringify({ refresh_token:this.session.refresh_token })
    }).then(this._json).then(function(j){
      self.setSession({ access_token:j.access_token, refresh_token:j.refresh_token,
                        exp:Date.now()+((j.expires_in||3600)*1000), email:self.session.email });
      return j;
    }).catch(function(e){ self.setSession(null); throw e; });
  },
  signOut:function(){ this.setSession(null); },
  /* REST 호출 — 만료가 임박했거나 401이면 한 번 갱신하고 재시도 */
  rest:function(path, opts, _retried){
    var self=this;
    if(!this.loggedIn()) return Promise.reject(new Error('로그인이 필요해요'));
    var go=function(){
      opts=opts||{};
      var h={ 'apikey':self.key, 'Content-Type':'application/json',
              'Authorization':'Bearer '+self.session.access_token };
      for(var k in (opts.headers||{})) h[k]=opts.headers[k];
      return fetch(self.url+'/rest/v1/'+path, { method:opts.method||'GET', headers:h, body:opts.body })
        .then(self._json)
        .catch(function(e){
          if(e.status===401 && !_retried) return self.refresh().then(function(){ return self.rest(path, opts, true); });
          throw e;
        });
    };
    if(this.session.exp && Date.now() > this.session.exp-60000 && !_retried){
      return this.refresh().then(go, function(e){ throw e; });
    }
    return go();
  }
};
SB.init();

/* ================= 지출·정산 (pages/money.html 전용) =================
   기존 체크 시스템(data-cl → attach → updateCounts)은 정적 항목 전용이라 쓰지 않는다.
   attach()는 로드 시 한 번만 도는 querySelectorAll 결과에만 붙고 IIFE에 갇혀 있으며,
   저장 형식이 {키:1} 불리언 맵이라 금액을 담을 수 없다. 별도 키·별도 IIFE로 만든다. */
(function(){
  var form=document.getElementById('exp-add'); if(!form) return; /* 다른 탭에선 아무것도 안 함 */

  var EK='tokyoTripExpenses';
  var PEOPLE={ b:'보람', y:'양기' };
  var DAYS={ '09-05':'9/5 (토)', '09-06':'9/6 (일)', '09-07':'9/7 (월)', '09-08':'9/8 (화)', '09-09':'9/9 (수)', 'etc':'기타' };
  var DAY_ORDER=['09-05','09-06','09-07','09-08','09-09','etc']; /* 입력 순서와 무관하게 날짜순으로 묶는다 */

  var elD=document.getElementById('exp-d'), elT=document.getElementById('exp-t'), elA=document.getElementById('exp-a'),
      elP=document.getElementById('exp-p'), elK=document.getElementById('exp-k'),
      elList=document.getElementById('exp-list'), elEmpty=document.getElementById('exp-empty'),
      elTotal=document.getElementById('exp-sum-total'), elBy=document.getElementById('exp-sum-by'), elSettle=document.getElementById('exp-sum-settle');

  var data={ items:[] };
  try{
    var raw=JSON.parse(localStorage.getItem(EK)||'null');
    if(raw && raw.items instanceof Array) data.items=raw.items;
  }catch(e){}
  function save(){ try{ localStorage.setItem(EK, JSON.stringify(data)); }catch(e){} }

  /* 삭제는 tombstone(deleted=1)으로 남긴다 — 안 그러면 다른 기기에서 되살아난다.
     화면·계산은 전부 live()만 본다. */
  function live(){ return data.items.filter(function(x){ return !x.deleted; }); }
  /* 로컬에서 바뀐 항목은 dirty로 표시했다가 동기화 때 밀어 올린다 */
  function touch(it){ it.dirty=1; it.updated_at=Date.now(); return it; }

  function num(v){ var n=parseInt(String(v).replace(/[^\d]/g,''),10); return isFinite(n)?n:0; }
  function yen(n){ return '¥'+n.toLocaleString('ko-KR'); }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  /* 정산 계산 — 각 항목이 만드는 채권은 (금액 − 결제자가 부담해야 할 몫).
     부담이 공동이면 절반, 결제자 본인이면 전액이라 0, 상대방이면 전액이 채권이 된다. */
  function calc(){
    var total=0,
        paid={b:0,y:0},  /* 카드에서 실제로 나간 돈 */
        own={b:0,y:0},   /* 정산까지 끝났을 때 각자 실제로 쓴 돈 */
        net=0;           /* net > 0 이면 보람이 받을 돈 */
    live().forEach(function(it){
      total+=it.a;
      paid[it.p]+=it.a;
      if(it.k==='g'){ own.b+=it.a/2; own.y+=it.a/2; } else { own[it.k]+=it.a; }
      if(it.s) return; /* 정산 완료 항목은 잔액에서 제외 (총 지출·실부담엔 남는다) */
      var mine = (it.k==='g') ? it.a/2 : (it.k===it.p ? it.a : 0);
      var credit = it.a - mine;
      net += (it.p==='b') ? credit : -credit;
    });
    own.b=Math.round(own.b); own.y=Math.round(own.y);
    return { total:total, paid:paid, own:own, net:Math.round(net) };
  }

  function render(){
    var c=calc();
    var L=live();
    /* 새로고침 버튼은 로그인했을 때만 — 안 했으면 받아올 곳이 없다 */
    elTotal.innerHTML='<span>총 지출 <span class="muted">'+L.length+'건</span></span>' +
      '<span class="tr"><b>'+yen(c.total)+'</b>' +
      (SB.loggedIn() ? '<button type="button" id="exp-refresh" title="새로고침">⟳</button>' : '') +
      '</span>';
    paintRefresh();
    /* 「결제」는 카드에서 나간 돈, 「실부담」은 정산까지 끝났을 때 실제로 쓴 돈.
       양기가 반반짜리를 결제하면 결제엔 전액이 잡히지만 실부담은 절반만 잡힌다. */
    elBy.innerHTML=['b','y'].map(function(k){
      /* 줄 것/받을 것은 아래 「미정산」 줄과 같은 기준 — 정산 완료 항목은 빠진다.
         c.net은 보람이 받을 돈이라 양기 쪽은 부호를 뒤집는다. */
      var diff = (k==='b') ? c.net : -c.net;
      var other = PEOPLE[k==='b' ? 'y' : 'b'];
      var note = diff>0 ? '<span class="df plus">'+other+'에게서 '+yen(diff)+' 받을 것</span>'
               : diff<0 ? '<span class="df minus">'+other+'에게 '+yen(-diff)+' 줄 것</span>' : '';
      return '<div class="expperson">' +
        '<div class="who">'+PEOPLE[k]+'</div>' +
        '<div class="ln"><span>결제</span><b>'+yen(c.paid[k])+'</b></div>' +
        '<div class="ln"><span>실부담</span><b class="hi">'+yen(c.own[k])+'</b></div>' +
        note +
      '</div>';
    }).join('');

    if(!L.length){
      elSettle.style.display='none';
    } else if(c.net===0){
      elSettle.style.display='';
      elSettle.className='expsettle done';
      elSettle.innerHTML='✅ 정산할 게 없어요';
    } else {
      elSettle.style.display='';
      var from=(c.net>0)?'양기':'보람', to=(c.net>0)?'보람':'양기', amt=Math.abs(c.net);
      elSettle.className='expsettle';
      elSettle.innerHTML='💸 <b>'+from+' → '+to+'</b> <b class="amt">'+yen(amt)+'</b> <span class="muted">미정산</span>';
    }

    elEmpty.style.display=L.length?'none':'block';
    elList.style.display=L.length?'':'none';

    /* 날짜별로 묶어서 그린다. 날짜 머리글이 날짜를 보여주므로 각 행의 메타에선 뺀다. */
    function rowHtml(it){
      var burden=(it.k==='g')?'공동 부담':(PEOPLE[it.k]+' 부담');
      return '<div class="prow exprow'+(it.s?' expdone':'')+'" data-id="'+it.id+'">' +
        '<input type="checkbox" class="expck"'+(it.s?' checked':'')+' title="정산 완료">' +
        '<div class="pb">' +
          '<div class="prtop"><span class="pnm">'+esc(it.t)+'</span><span class="ppr">'+yen(it.a)+'</span></div>' +
          '<div class="pmeta">'+PEOPLE[it.p]+' 결제 · '+burden+
            (it.s?' · <b style="color:var(--accent2);">정산완료</b>':'')+'</div>' +
        '</div>' +
        '<button type="button" class="expdel" title="삭제">🗑</button>' +
      '</div>';
    }
    var groups={};
    L.forEach(function(it){ (groups[it.d]=groups[it.d]||[]).push(it); });
    elList.innerHTML=DAY_ORDER.map(function(d){
      var g=groups[d]; if(!g || !g.length) return '';
      var sum=0; g.forEach(function(x){ sum+=x.a; });
      return '<div class="expday"><span>'+DAYS[d]+'</span><span>'+g.length+'건 · '+yen(sum)+'</span></div>' +
             g.map(rowHtml).join('');
    }).join('');
  }

  function add(){
    var t=elT.value.trim(), a=num(elA.value);
    if(!t){ alert('항목 이름을 적어주세요.'); elT.focus(); return; }
    if(a<=0){ alert('금액을 숫자로 적어주세요.'); elA.focus(); return; }
    data.items.push(touch({ id:'e'+Date.now()+Math.floor(Math.random()*1000), d:elD.value, t:t, a:a, p:elP.value, k:elK.value, s:0, deleted:0 }));
    save(); render(); queueSync();
    elT.value=''; elA.value=''; elT.focus(); /* 날짜·결제자·부담은 연속 입력을 위해 유지 */
  }

  form.addEventListener('click', add);
  elA.addEventListener('keydown', function(e){ if(e.key==='Enter') add(); });
  elT.addEventListener('keydown', function(e){ if(e.key==='Enter') elA.focus(); });

  /* 목록 상호작용 — 행이 동적이라 위임으로 처리 */
  elList.addEventListener('click', function(e){
    var row=e.target.closest('.exprow'); if(!row) return;
    var id=row.getAttribute('data-id');
    var it=data.items.filter(function(x){ return x.id===id; })[0]; if(!it) return;

    if(e.target.classList.contains('expck')){
      e.stopPropagation(); /* 라이트박스가 document 레벨에서 클릭을 받는다 */
      it.s=e.target.checked?1:0; touch(it); save(); render(); queueSync();
    } else if(e.target.classList.contains('expdel')){
      e.stopPropagation();
      if(confirm('"'+it.t+'" '+yen(it.a)+' 기록을 지울까요?\n되돌릴 수 없어요.')){
        /* 물리 삭제 대신 tombstone — 안 그러면 다른 기기 동기화 때 되살아난다 */
        it.deleted=1; touch(it);
        save(); render(); queueSync();
      }
    }
  });

  /* ================= 동기화 =================
     localStorage가 주 저장소고 Supabase는 그 위에 얹은 계층이다. 오프라인에서도
     입력이 되고, 온라인이 되면 dirty 항목을 밀어 올린 뒤 전체를 내려받아 합친다.
     규모가 작아(한 여행에 수십~수백 건) 전체 동기화로 충분하다. */
  var elAuth=document.getElementById('exp-auth'), elSync=document.getElementById('exp-sync');
  var syncing=false, pending=false, lastErr=null;

  function toRow(it){
    return { id:it.id, d:it.d, t:it.t, a:it.a, p:it.p, k:it.k, s:!!it.s, deleted:!!it.deleted };
  }
  function fromRow(r){
    return { id:r.id, d:r.d, t:r.t, a:r.a, p:r.p, k:r.k, s:r.s?1:0, deleted:r.deleted?1:0,
             updated_at:Date.parse(r.updated_at)||0 };
  }

  function sync(){
    if(!SB.loggedIn() || syncing) return Promise.resolve();
    if(!navigator.onLine){ lastErr='오프라인'; paintSync(); return Promise.resolve(); }
    syncing=true; lastErr=null; paintSync();

    var dirty=data.items.filter(function(x){ return x.dirty; });
    var push = dirty.length
      ? SB.rest('expenses', { method:'POST',
          headers:{ 'Prefer':'resolution=merge-duplicates,return=minimal' },
          body:JSON.stringify(dirty.map(toRow)) })
      : Promise.resolve();

    return push.then(function(){
      dirty.forEach(function(x){ delete x.dirty; });
      return SB.rest('expenses?select=*');
    }).then(function(rows){
      /* 병합 — 로컬이 아직 dirty면 로컬 우선(밀어 올리는 중), 아니면 서버 우선 */
      var byId={};
      data.items.forEach(function(x){ byId[x.id]=x; });
      (rows||[]).forEach(function(r){
        var remote=fromRow(r), local=byId[r.id];
        if(!local){ data.items.push(remote); byId[r.id]=remote; }
        else if(!local.dirty){
          local.d=remote.d; local.t=remote.t; local.a=remote.a; local.p=remote.p;
          local.k=remote.k; local.s=remote.s; local.deleted=remote.deleted;
          local.updated_at=remote.updated_at;
        }
      });
      data.lastSync=Date.now();
      save(); render();
    }).catch(function(e){
      lastErr=e.message||'동기화 실패';
    }).then(function(){
      syncing=false; paintSync();
      if(pending){ pending=false; return sync(); }
    });
  }
  /* 입력 직후 연달아 부르지 않도록 살짝 묶어서 보낸다 */
  var syncTimer=null;
  function queueSync(){
    if(!SB.loggedIn()) return;
    if(syncing){ pending=true; return; }
    clearTimeout(syncTimer);
    syncTimer=setTimeout(sync, 600);
  }

  function ago(ts){
    if(!ts) return '';
    var s=Math.round((Date.now()-ts)/1000);
    if(s<60) return '방금';
    if(s<3600) return Math.floor(s/60)+'분 전';
    if(s<86400) return Math.floor(s/3600)+'시간 전';
    return Math.floor(s/86400)+'일 전';
  }
  /* 총 지출 바의 ⟳ 버튼 — 동기화 중엔 돌아가는 표시로 바꾸고 눌리지 않게 */
  function paintRefresh(){
    var b=document.getElementById('exp-refresh');
    if(!b) return;
    b.disabled=syncing;
    b.textContent=syncing?'⏳':'⟳';
  }
  function paintSync(){
    paintRefresh();
    if(!elSync) return;
    if(!SB.loggedIn()){ elSync.style.display='none'; return; }
    elSync.style.display='';
    var un=data.items.filter(function(x){ return x.dirty; }).length;
    if(syncing){ elSync.className='expsync busy'; elSync.textContent='☁️ 동기화 중…'; }
    else if(lastErr){ elSync.className='expsync err'; elSync.textContent='⚠️ '+lastErr+(un?(' · 대기 '+un+'건'):'')+' — 눌러서 재시도'; }
    else { elSync.className='expsync ok'; elSync.textContent='☁️ '+SB.email()+' · 동기화됨 '+ago(data.lastSync); }
  }

  function paintAuth(){
    if(!elAuth) return;
    if(SB.loggedIn()){
      elAuth.innerHTML='<button type="button" id="exp-signout" class="expauthlink">로그아웃</button>';
      document.getElementById('exp-signout').addEventListener('click', function(){
        if(!confirm('로그아웃할까요?\n이 기기의 기록은 그대로 남고, 동기화만 멈춥니다.')) return;
        SB.signOut(); paintAuth(); paintSync();
      });
    } else {
      elAuth.innerHTML=
        '<div class="expauth">' +
          '<div class="hd">☁️ <b>기록 공유</b> — 로그인하면 두 사람 폰의 기록이 합쳐져요</div>' +
          '<div class="rw">' +
            '<input type="email" id="exp-email" placeholder="이메일" autocomplete="username">' +
            '<input type="password" id="exp-pw" placeholder="비밀번호" autocomplete="current-password">' +
            '<button type="button" id="exp-signin">로그인</button>' +
          '</div>' +
          '<div class="msg" id="exp-authmsg"></div>' +
        '</div>';
      var msg=document.getElementById('exp-authmsg');
      var go=function(){
        var em=document.getElementById('exp-email').value.trim();
        var pw=document.getElementById('exp-pw').value;
        if(!em || !pw){ msg.textContent='이메일과 비밀번호를 모두 넣어주세요.'; return; }
        msg.textContent='로그인 중…';
        SB.signIn(em, pw).then(function(){
          paintAuth();
          /* 로그인 시점의 로컬 기록은 전부 올려보낸다 */
          data.items.forEach(function(x){ if(!x.updated_at) x.updated_at=Date.now(); x.dirty=1; });
          save(); return sync();
        }).catch(function(e){
          msg.textContent='⚠️ '+(e.message||'로그인 실패');
        });
      };
      document.getElementById('exp-signin').addEventListener('click', go);
      document.getElementById('exp-pw').addEventListener('keydown', function(e){ if(e.key==='Enter') go(); });
    }
  }

  if(elSync) elSync.addEventListener('click', function(){ if(!syncing) sync(); });
  /* 버튼이 render()마다 새로 그려지므로 위임으로 받는다 */
  elTotal.addEventListener('click', function(e){
    if(e.target.id==='exp-refresh' && !syncing) sync();
  });
  window.addEventListener('online', function(){ lastErr=null; queueSync(); });
  window.addEventListener('offline', function(){ lastErr='오프라인'; paintSync(); });
  /* 탭을 다시 보면 상대가 올린 내용을 받아온다 — Realtime 없이도 충분하다 */
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) queueSync(); });

  paintAuth(); paintSync();
  render();
  if(SB.loggedIn()) sync();
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
