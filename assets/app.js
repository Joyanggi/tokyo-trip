/* ================= 날짜별 확정 식사 · 대안 펼침 표 =================
   아래 식사 후보 표의 상태 문구를 읽어 자동 생성한다.
   원본 표에서 📌/↔ 배치만 바꾸면 이 요약도 함께 갱신된다. */
(function(){
  var host=document.getElementById('meal-plan-list');
  var source=document.getElementById('sec-meal');

  var rows=source ? Array.prototype.slice.call(source.querySelectorAll('.mrow:not(.mh)')) : [];
  var slotOrder={ '아침':0, '점심':1, '저녁':2, '카페':3, '디저트':4 };
  function statusOf(row){
    var el=row.querySelector('.status');
    return el ? el.textContent.replace(/\s+/g,' ').trim() : '';
  }
  function datesOf(text){ return text.match(/9\/\d+/g) || []; }
  function slotsOf(text){ return text.match(/아침|점심|저녁|카페|디저트/g) || []; }
  function mapKeyOf(row){
    var name=row.children[1];
    return name ? (name.getAttribute('data-mapq') || name.textContent.replace(/\s+/g,' ').trim()) : '';
  }
  function cloneCell(row, index, className){
    var cell=row.children[index].cloneNode(true);
    if(className) cell.classList.add(className);
    return cell;
  }

  /* 확정 매장 상세 — 추천 메뉴는 공식 메뉴와 최근 후기에서 반복 언급된 항목을 우선한다. */
  var MEAL_DETAIL={
    '宮武讃岐うどん 成田空港第3ターミナル店':{
      name:'미야타케 사누키 우동', image:'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWntAv6KaRdpxk9yq2Z3xfRCJcplYDuRThyki64H8R0xZDiNFV0vnR7iZuw0EtvP5EGk_iTW0e1zsqDlCBPPjesTUbf9kf2tu2ZJnMj8fdSUXFuADzC-VS-gWuZEXIjjTujvzwkB=w408-h271-k-no', foodImage:'https://tblg.k-img.com/restaurant/images/Rvw/361887/640x640_rect_8e46d3b00012669539118fd2396621a9.jpg',
      order:'차가운 붓카케 우동 + 반숙 달걀튀김', review:'후기에서 면의 탄력과 이리코 육수가 가장 잘 드러나는 조합으로 자주 언급돼요. 첫 끼라면 무거운 고기 토핑보다 이쪽이 편해요.',
      hours:'매일 05:00–21:00 (L.O.)', reservation:'예약 불가·불필요 · T3 푸드코트', payment:'카드·전자머니·QR 가능', cashOnly:false
    },
    '風雲児 新宿本店':{
      name:'후운지', image:'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWmzPRI5wbckwirwtMf8tu6bXvXJS-A4Ya0dTFbS4eIii1nC9dXcCCvQO3lbjGjYG4sCULa1bsq-XPJ85Cec3AzXD0oKzgHU_gN-pqOWrpiUwJ5W6d8KtBwzhGsqAWgLhp0dh4STyFgZoVRp=w408-h306-k-no', foodImage:'https://tblg.k-img.com/restaurant/images/Rvw/48587/640x640_rect_48587364.jpg',
      order:'得製つけめん(토쿠세이 츠케멘) · 보통 200g', review:'진한 닭백탕·어패류 국물과 굵은 면이 핵심. 得製은 맛달걀·김·멘마·차슈가 모두 늘어나 처음 한 번 먹기 좋아요.',
      hours:'매일 11:00–15:00 / 17:00–21:00', reservation:'예약 불가 · 보통 30–40분 대기', payment:'현금·교통계 IC 가능', cashOnly:false
    },
    'タカマル鮮魚店 西新宿':{
      name:'타카마루 센교텐', image:'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnQgEpq1qdiWIQQf5ZgtftPKtOng_XcYYLdhhE_O4Dwnsa9coNwXmvp-9NmJ5d7avxU_29HwZh4pl7Xs_BBCi-ZY4R0rUDXssJlZF9ASl_zFkhUUe2hIyUnZvQ-XAunt2zUCDm1PqTfWv_R=w408-h306-k-no', foodImage:'https://tblg.k-img.com/restaurant/images/Rvw/374467/640x640_rect_920044e38ab1f467b2cc85117b63fbaa.jpg',
      order:'タカマル定食(타카마루 정식)', review:'큰 접시에 두툼한 회가 넉넉하게 나오고 밥·아라지루가 붙는 대표 메뉴예요. 후기에서도 양과 회 두께가 가장 많이 언급돼요.',
      hours:'매일 11:00–23:00', reservation:'예약 가능 · 저녁은 예약 권장', payment:'카드 가능', cashOnly:false
    },
    '但馬屋珈琲店 本店 西新宿':{
      name:'타지마야 코히텐 본점', image:'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkCci3EnxMeSx-wBkqAOb9LZPchQ1K0bhovdMH56kW7E6W_9QsQNoSdpCBCHRNHiBXalMRDdRac55H144dPjG3cgVvUr7jLgOgQwc6Vvn1YTtw75iAdSxADGP6woZ2rmtWh181gOJNZq7I3=w408-h284-k-no', foodImage:'https://tblg.k-img.com/restaurant/images/Rvw/149050/640x640_rect_149050985.jpg',
      order:'오리지널 블렌드 핸드드립 + 오늘의 케이크', review:'후기에서는 진하게 내려 주는 커피와 노포 다방 분위기가 강점으로 꼽혀요. 원두 취향을 말하면 잔과 커피를 골라 주기도 해요.',
      hours:'10:00–23:00 (L.O. 22:30) · 1/1 휴무', reservation:'예약 불가 · 현장 이용', payment:'💴 현금만', cashOnly:true
    },
    '追分だんご本舗 新宿本店':{
      name:'오이와케 당고 혼포', image:'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnCy3xPp0UAKPO-qcadL8VVqg2fFdbjqVTszjsIuTdUwWZK5IcYTHDq_7LsI0BL8R7Mp9bOX7aFN5djKGHI1qTrfpriK3-qaZJy733tVLo3DHWeU_7xl_yDtaH96ZyAEO2opT0L3DacFW8T=w408-h306-k-no', foodImage:'https://tblg.k-img.com/restaurant/images/Rvw/195826/640x640_rect_303096773c2cb951396f56e177baa173.jpg',
      order:'だんご2本盛 ¥847~ · 미타라시 + 요모기 츠부앙',
      review:'당고 2개를 골라 담는 기본 세트예요. 당일 아침 만든 쫀득한 당고라 짠단·팥 조합을 한 번에 비교하기 좋아요. 찻집 자리에서 먹으면 짭조름한 시오콘부(소금다시마)가 함께 나와서 단짠으로 이어 먹기 좋은데, 포장만 하면 이건 못 받아요. 여름엔 카키고리가 가장 인기고 안미츠 ¥1,155, 味の散歩(당고+안미츠+토코로텐) ¥1,496 같은 세트도 있어요. 한국어 메뉴판은 없습니다.',
      history:'뿌리는 1698년(겐로쿠 11년) — 무로마치 시대 오타 도칸에게 헌상했다는 「도칸 당고」를 팔던 찻집이 이 무렵 고슈카이도와 오메카이도가 갈라지는 신주쿠 追分으로 옮겨오면서 「오이와케 당고」가 됐어요. 약 330년 내력이지만 지금 가게 자체는 1947년 창업 — 창업자가 동네 어르신들에게 그 유래를 듣고 맛을 되살린 곳입니다. 찻집 입구 왼편의 가마쿠라보리 조각이 옛날 이 자리에서 당고 만들던 모습이에요.',
      hours:'토·일·공휴 찻집 11:30–18:00 (L.O. 17:30) · 포장 매대는 10:30–19:00 · 품절 시 조기 마감',
      reservation:'찻집 좌석 예약 불가 · 상품은 전화 예약 가능', payment:'카드·교통계 IC 등 가능', cashOnly:false
    },
    'ベルク BERG 新宿 ルミネエスト B1':{
      name:'BERG 신주쿠', image:'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWmSy_LmzRhzO53Ogp_xWuMOT0pYG1rxuelj_XxkA75ybRQqtDZaQVqhKZDI0vxSETOqAnkBrAzSQ6Sp9kPKX6XstXQgpeboWgDzcGr_K_28vrMD3tXjIhSvOaQN6Vt2jxgLxkxs9Fm819Xm=w426-h240-k-no', foodImage:'https://tblg.k-img.com/restaurant/images/Rvw/208118/640x640_rect_4f5a8bfd74098193f257d811769774e8.jpg',
      order:'모닝 세트(토스트·달걀·커피)', review:'빠르고 저렴한 역 구내 아침으로 후기가 많은 메뉴예요. 소시지를 더 먹고 싶으면 핫도그를 추가하면 돼요.',
      hours:'매일 07:00–23:00 (L.O. 22:30)', reservation:'예약 불가 · 서서 먹는 자리도 있음', payment:'카드·교통계 IC·QR 가능', cashOnly:false
    },
    '茶屋かど 鎌倉 山ノ内':{
      name:'차야카도', image:'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnaLs3_IOQQmjs6QAUQhRsu0dBIthqujvoqkmjsMger_Jc5Hasd0RGlyAzAq7YOz7lJgj6zF13r6SuplAyhNnxiXINssMyWa7K_UYZFZoOG0e_Z1Q63qZkOWjsuo9C17w0m1Io=w426-h240-k-no', foodImage:'https://tblg.k-img.com/restaurant/images/Rvw/141733/640x640_rect_141733634.jpg',
      order:'대나무 나가시소멘', review:'4–10월에만 먹는 간판 메뉴예요. 직원이 면을 흘려 주는 옛 방식 자체가 핵심이라 일반 소바보다 나가시소멘을 우선하세요.',
      hours:'10:00–16:30 · 나가시소멘 4–10월', reservation:'예약 불가 · 오픈런 권장', payment:'💴 현금만', cashOnly:true
    },
    'LONCAFE 江ノ島本店':{
      name:'LONCAFE 에노시마 본점', image:'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWlVD-gMBtVzk2NfCXK-KPJ8WpV5D3YyPQ94_lRXoMOY4hmc73I-3mU6-dmVH81joq1R5twPLVQOlHs1P7Cd7DEbN-qte2NRZ0YH17w9IHPr2zvsvNr6Tb67FbA90Fao-sxKfBBG=w408-h306-k-no', foodImage:'https://tblg.k-img.com/restaurant/images/Rvw/165719/640x640_rect_6c31989a444de7d31a59377a03194226.jpg',
      order:'플레인 프렌치토스트 + 바닐라 아이스크림', review:'겉은 캐러멜처럼 바삭하고 속은 부드럽다는 후기가 많은 기본 시그니처예요. 첫 방문은 토핑이 많은 메뉴보다 플레인이 좋아요.',
      hours:'휴일 10:00–20:00 (L.O. 19:30)', reservation:'예약 불가 · 일몰 전 대기 감안', payment:'캐시리스 가능', cashOnly:false
    },
    '海光庵 長谷寺 鎌倉':{
      name:'카이코안', image:'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWk7ngm1VyFEob00BJ_3eCp7IDJ9_VWL2XU7lcVLsQXAX-8Ul6hIZQQrLGpXS4N1xryT_kdV82LKhJLQFsgBA1HJqb2SkVttw8wWDZ8Iwkw3oK4HEMzHRNgrqY8GMCDOwBi_gPMmkzsNbGvY=w408-h306-k-no', foodImage:'https://tblg.k-img.com/restaurant/images/Rvw/325033/640x640_rect_bf9fdea6cfb387b0a48c9a5a6a0e8a9b.jpg',
      order:'抹茶와 와가시(¥800) + 당고(¥200)', review:'여기는 13:55 카페 자리라 가벼운 감미로 충분해요. 유이가하마가 내려다보이는 창가에서 말차 한 잔이 목적입니다. 배가 고프면 간판 메뉴인 お寺のカレー(¥1,250 · 고기·생선 안 쓰는 정진식)나 お寺パスタ로 바꿔도 되는데, 식사는 L.O. 15:00이에요.',
      hours:'10:00–16:00 · 식사 L.O. 15:00 · 감미는 16:00까지', reservation:'예약 불필요 · 하세데라 입장 후 이용', payment:'현금 only 안내 없음 · 현장 확인', cashOnly:false
    },
    'MAISON CACAO 鎌倉小町店':{
      name:'MAISON CACAO 가마쿠라 코마치점', image:'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWlGz87Dobs-Vtu9puvP6gUfh9oDhHAX3SzyTFow2JGmlWVYrVopCKAgr5vdJg1UbgHG4cLOppzx5HeVzyFl-sKgwMyLq8ZXbGMD0pcTi2L2f6RGA6hstFeHY_EmpFp8KW753MeXKxT-pFI=w408-h290-k-no', foodImage:'https://tblg.k-img.com/restaurant/images/Rvw/65772/640x640_rect_65772384.jpg',
      order:'생초콜릿 타르트 + 코마치점 한정 생초콜릿 에클레어', review:'매장에서 갓 만든 질감이 강점인 두 메뉴예요. 후기에서도 진한 카카오와 얇고 바삭한 겉면의 대비가 자주 언급돼요.',
      hours:'매일 10:00–18:00 · 부정기 휴무', reservation:'예약 불가 · 테이크아웃 중심', payment:'카드·QR 가능', cashOnly:false
    },
    'くら寿司 浅草ROX店':{
      name:'쿠라스시 아사쿠사 ROX점', image:'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnsRlSKSM_nlSU3l1IFRb7Jgl98HdSAvsBP93Bd7tEOBdlTI_3BjdaEMSUKAY3OS6xzqhnDhZG3yoKXks8sQKvDTxxiVtMVmZH7-cnSeiHKFQ6e9-ybVGApkH0kDXgTsKqQnWny=w408-h272-k-no', foodImage:'https://tblg.k-img.com/restaurant/images/Rvw/367677/640x640_rect_1d3a46288e46e30669a1b1129d7a6734.jpg',
      order:'極み熟成まぐろ + 제철 추천 + 5접시 빗쿠라퐁', review:'대표 참치부터 시작하고 당일 화면의 제철 추천을 섞는 게 안전해요. 이 매장은 맛만큼 5접시마다 하는 빗쿠라퐁 체험이 목적이에요.',
      hours:'월 11:00–23:00 · 입장 마감 22:30', reservation:'필수 아님 · 앱/WEB 시간 예약 권장', payment:'카드·전자머니·QR 가능', cashOnly:false
    },
    'イマカツ 六本木本店':{
      name:'이마카츠 롯폰기 본점', image:'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkQAs_ZsPodRVJaMhX_TPKDGnThpjDalyu0D1ffA6e96FsNWBGoCjHp8IHmjRp1y0-l-8kCvSyIj0Opqy6q7NTj9YvQpgX3_Henm1KOZfaLpAxTzFJ47zgmV4NP5PQpqX_DeU1CPMTBkLU=w408-h306-k-no', foodImage:'https://tblg.k-img.com/restaurant/images/Rvw/156211/640x640_rect_156211813.jpg',
      order:'명물 사사미카츠 정식', review:'닭 안심인데도 매우 촉촉하고 부드럽다는 후기가 압도적인 간판 메뉴예요. 일반 돈카츠보다 이 매장만의 사사미카츠를 우선하세요.',
      hours:'월 11:30–16:00 / 18:00–22:30', reservation:'저녁 예약 가능 · 예약 권장', payment:'카드 가능', cashOnly:false
    },
    '雷一茶 浅草本店':{
      name:'카미나리 잇사 아사쿠사 본점', image:'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWmYsHtGqgr5At9pat_xu8IYajOVBjW7kx69tYyqkbp37BjMPzdLjPC-GlQSGTpKummkBiAb3Z-L0hQY_xs9BI4omRbAW9pzHIBlEhMYec_fJSzgBbFT7DwAEZjw5WCiGcbzsMYbMA=w408-h306-k-no', foodImage:'https://tblg.k-img.com/restaurant/images/Rvw/309152/640x640_rect_09c95443e701744d44ba46b158cb0bcd.jpg',
      order:'お濃茶ゼリー + お濃茶タルト', review:'좋은 말차는 쓰기만 하지 않다는 매장의 방향을 가장 잘 느낄 조합이에요. 진한 차향과 과하지 않은 단맛을 좋게 본 후기가 많아요.',
      hours:'매일 10:00–17:00', reservation:'예약 불필요 · 현장 이용', payment:'카드·전자머니·QR 가능', cashOnly:false
    },
    '廚 くろぎ 上野パルコヤ':{
      name:'쿠리야 쿠로기', image:'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWla33henrVVHF3lR-BzGNKM6H4hGSpe_lj_R4_sV-G6_JBivfCxpb0rveJ8lDWgS467j07NiEgPOH5VvsDQpDU70Nucd3g2KAZdpGW5g8DTiXqgkV7fqM5oM9YYb35T8J8Opbiw=w408-h408-k-no', foodImage:'https://tblg.k-img.com/restaurant/images/Rvw/313260/640x640_rect_794b8d3ef4bc8a613d51d8976af1052c.jpg',
      order:'미타라시 밀크 카키고리(또는 흑당·키나코 계열)', review:'짭짤한 미타라시와 진한 우유 얼음의 대비가 최근 후기에서 특히 많이 언급돼요. 계절 메뉴가 바뀌면 흑당·키나코 계열을 고르면 안전해요.',
      hours:'매일 10:00–21:00 (L.O. 20:00)', reservation:'예약 불가 · 현장 발권 후 대기', payment:'카드·전자머니·QR 가능', cashOnly:false
    },
    'らぁ麺や 嶋 本町':{
      name:'라아멘야 시마', image:'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnjTOZdjAy3oqsxXdIMVRiOIz3HsP9zRPuB0jTyh9fbZZtDZDbVHsrQDLAA3_aC5p0ESSw7YXMAGMksAxSWRozIAQStlcqbDJXdqBzbVWOhTJC6qSXslth0Izg1_Cwx6Gi9Xw1ETw=w408-h306-k-no', foodImage:'https://tblg.k-img.com/restaurant/images/Rvw/314643/640x640_rect_5767555569730a7b3b5c44145fe73b70.jpg',
      order:'特上醤油らぁ麺(특상 쇼유 라멘)', review:'맑지만 층이 깊은 쇼유 국물과 완탕·여러 종류 차슈를 한 번에 먹는 대표 구성이라 첫 방문에 가장 적합해요.',
      hours:'월–금 08:15–14:30 · 예약 시간제', reservation:'완전예약제 · 전날 08:00 TableCheck 오픈', payment:'💴 현금만 · 예약료는 온라인 결제', cashOnly:true
    },
    '神泉いちのや 渋谷':{
      name:'신센 이치노야', image:'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkcRuMYQnUQDJuQ4zeOPDBygPg1bQj_0B8a3eoNg1uMkPRTo7i-8jJiZBZq2B5_18MHL7jQ5heb4IxIrGSLbpqVZapTxjXdsyu-88nPL9rVo1g1Q9aZj8uUDDZr1eJ2qU_kDzrGuFhU99nt=w408-h306-k-no', foodImage:'https://tblg.k-img.com/restaurant/images/Rvw/93159/640x640_rect_93159137.jpg',
      order:'弐段(니단) 우나주', review:'밥과 장어를 두 층으로 쌓아 끝까지 장어가 이어지는 이 집다운 메뉴예요. 양이 부담되면 기본 우나주로 낮추면 돼요.',
      hours:'11:30–15:00 (L.O.13:30) / 17:30–22:00 (L.O.20:30) · 월 휴무', reservation:'예약 강력 권장 · 메뉴도 미리 선택하면 대기 단축', payment:'카드 가능', cashOnly:false
    },
    '茶亭 羽當 渋谷':{
      name:'사테이 하토우', image:'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkdjilXWXtrw27umB11qhnWvDVaEfgpmnJLh-QJ6QIfczACDcghFzt1yqfYvZOrJsViVfXGgU157MQk74r7qGVv9-yfVEsuOzLtHhy91EMCy5lqJhUS6Tim6eHwk_vmrp8YH5pW8g=w426-h240-k-no', foodImage:'https://tblg.k-img.com/restaurant/images/Rvw/271891/640x640_rect_0a1f3fb788adc1093ca221cc4a850b65.jpg',
      order:'블렌드 커피 + 시폰 케이크(오렌지·홍차 중 재고 있는 맛)', review:'주문에 맞춰 고른 잔에 내주는 핸드드립과 가볍고 촉촉한 시폰 조합이 후기에 가장 많이 등장해요. 시폰은 이른 시간일수록 선택지가 많아요.',
      hours:'매일 11:00–23:00', reservation:'예약 불가 · 피크 시간 대기 가능', payment:'💴 현금만', cashOnly:true
    }
  };

  /* 먹고 표에 표시한 평점과 리뷰 수를 상세 카드에서도 동일하게 쓴다. */
  var MEAL_METRICS={
    '宮武讃岐うどん 成田空港第3ターミナル店':['3.28/324','3.4/334'],
    '風雲児 新宿本店':['3.77/5,274','4.3/5,637'],
    'タカマル鮮魚店 西新宿':['3.49/1,549','4.1/2,142'],
    '但馬屋珈琲店 本店 西新宿':['3.54/806','4.1/1,241'],
    '追分だんご本舗 新宿本店':['3.76/2,200','4.4/1,551'],
    'ベルク BERG 新宿 ルミネエスト B1':['3.73/2,935','4.2/2,233'],
    '茶屋かど 鎌倉 山ノ内':['3.20/86','3.8/253'],
    'LONCAFE 江ノ島本店':['3.50/830','4.1/975'],
    '海光庵 長谷寺 鎌倉':['3.44/219','4.1/252'],
    'MAISON CACAO 鎌倉小町店':['3.68/906','4.3/663'],
    'くら寿司 浅草ROX店':['3.08/145','4.1/3,991'],
    'イマカツ 六本木本店':['3.59/1,052','4.3/1,670'],
    '雷一茶 浅草本店':['3.47/272','4.2/369'],
    '廚 くろぎ 上野パルコヤ':['3.80/1,638','3.8/810'],
    'らぁ麺や 嶋 本町':['4.03/2,135','4.3/755'],
    '神泉いちのや 渋谷':['3.66/771','4.1/432'],
    '茶亭 羽當 渋谷':['3.76/2,190','4.1/2,108']
  };
  Object.keys(MEAL_METRICS).forEach(function(key){
    if(!MEAL_DETAIL[key]) return;
    MEAL_DETAIL[key].tabelog=MEAL_METRICS[key][0];
    MEAL_DETAIL[key].google=MEAL_METRICS[key][1];
  });

  function buildMealDetail(data, details, headingText){
    if(!data) return null;
    var block=document.createElement('section'); block.className='meal-plan-detail';
    /* 가게 사진 + 음식 사진 2장. 한쪽이 깨지면 그 칸만 접고 남은 한 장이 폭을 다 쓴다. */
    var photo=document.createElement('div'); photo.className='meal-plan-detail-photo';
    [['place',data.image,data.name+' 가게 사진','가게'],
     ['food',data.foodImage,data.name+' 음식 사진','음식']].forEach(function(info){
      if(!info[1]) return;
      var shot=document.createElement('figure'); shot.className='meal-plan-shot is-'+info[0];
      var img=document.createElement('img'); img.alt=info[2]; img.loading='lazy'; img.decoding='async';
      img.referrerPolicy='no-referrer'; img.setAttribute('data-src',info[1]);
      img.addEventListener('error',function(){ shot.remove(); if(!photo.childElementCount) photo.hidden=true; });
      var cap=document.createElement('figcaption'); cap.textContent=info[3];
      shot.appendChild(img); shot.appendChild(cap); photo.appendChild(shot);
    });
    if(photo.childElementCount) block.appendChild(photo); else photo.hidden=true;

    var body=document.createElement('div'); body.className='meal-plan-detail-body';
    var heading=document.createElement('div'); heading.className='meal-plan-detail-heading'; heading.textContent=headingText || '확정 맛집 상세'; body.appendChild(heading);
    var ratings=document.createElement('div'); ratings.className='meal-plan-detail-ratings';
    [['타베',data.tabelog,' tabe'],['구글',data.google,' google']].forEach(function(info){
      if(!info[1]) return;
      var parts=info[1].split('/');
      var rating=document.createElement('span'); rating.className='meal-plan-detail-rating'+info[2];
      rating.setAttribute('aria-label',info[0]+' 평점 '+parts[0]+', 리뷰 '+parts[1]+'개');
      var source=document.createElement('span'); source.textContent=info[0];
      var score=document.createElement('strong'); score.textContent=parts[0];
      var reviews=document.createElement('small'); reviews.textContent='리뷰 '+parts[1];
      rating.appendChild(source); rating.appendChild(score); rating.appendChild(reviews); ratings.appendChild(rating);
    });
    if(ratings.childElementCount) body.appendChild(ratings);
    var order=document.createElement('div'); order.className='meal-plan-detail-order';
    var orderLabel=document.createElement('strong'); orderLabel.textContent='🍽 추천 주문';
    var orderName=document.createElement('span'); orderName.textContent=data.order;
    var review=document.createElement('p'); review.textContent=data.review;
    order.appendChild(orderLabel); order.appendChild(orderName); order.appendChild(review); body.appendChild(order);

    var meta=document.createElement('dl'); meta.className='meal-plan-detail-meta';
    var metaRows=[
      ['운영 시간',data.hours,''],
      ['예약',data.reservation,''],
      ['결제',data.payment,data.cashOnly ? ' is-cash-only' : '']
    ];
    /* 노포는 내력이 방문 이유의 절반이라, 있는 가게만 맨 위에 한 줄 붙인다 */
    if(data.history) metaRows.unshift(['내력',data.history,'']);
    metaRows.forEach(function(info){
      var row=document.createElement('div'); row.className='meal-plan-detail-meta-row'+info[2];
      var dt=document.createElement('dt'); dt.textContent=info[0];
      var dd=document.createElement('dd'); dd.textContent=info[1];
      row.appendChild(dt); row.appendChild(dd); meta.appendChild(row);
    });
    body.appendChild(meta); block.appendChild(body);

    function loadShots(){
      photo.querySelectorAll('img[data-src]').forEach(function(el){
        if(!el.getAttribute('src')) el.setAttribute('src',el.getAttribute('data-src'));
      });
    }
    if(details){
      details.addEventListener('toggle',function(){ if(details.open) loadShots(); });
      /* 펼치는 순간 만들어진 패널은 그 toggle 이벤트를 이미 놓쳤다 — 열려 있으면 바로 불러온다 */
      if(details.open) loadShots();
    }
    else loadShots();
    return block;
  }

  /* 먹고·일정에서 같은 사진과 추천 정보를 공유한다. */
  window.TRIP_MEAL_DETAIL=MEAL_DETAIL;
  window.buildTripMealDetail=buildMealDetail;
  if(!host || !source) return;

  var fixed=[], seen={};
  rows.forEach(function(row){
    var status=statusOf(row);
    if(status.indexOf('📌')<0) return;
    var dates=datesOf(status), slots=slotsOf(status);
    dates.forEach(function(date){
      slots.forEach(function(slot){
        var key=date+'|'+slot+'|'+mapKeyOf(row);
        if(seen[key]) return;
        seen[key]=1;
        fixed.push({ date:date, slot:slot, row:row });
      });
    });
  });
  fixed.sort(function(a,b){
    var ad=parseInt(a.date.split('/')[1],10), bd=parseInt(b.date.split('/')[1],10);
    return ad-bd || slotOrder[a.slot]-slotOrder[b.slot];
  });

  var weekday={ '9/5':'토', '9/6':'일', '9/7':'월', '9/8':'화', '9/9':'수' };
  var dayRegion={
    '9/5':'신주쿠',
    '9/6':'가마쿠라·에노시마',
    '9/7':'아사쿠사·우에노·롯폰기',
    '9/8':'도쿄 디즈니랜드',
    '9/9':'시부야·하라주쿠'
  };
  var groupLists={};
  fixed.forEach(function(item){
    if(!groupLists[item.date]){
      var day=document.createElement('section');
      day.className='meal-plan-day';
      day.setAttribute('data-date',item.date);
      var dayTitle=document.createElement('h3');
      dayTitle.className='meal-plan-day-title';
      dayTitle.textContent=item.date+(weekday[item.date] ? ' ('+weekday[item.date]+')' : '')+(dayRegion[item.date] ? ' - '+dayRegion[item.date] : '');
      day.appendChild(dayTitle);
      var table=document.createElement('div'); table.className='meal-plan-table';
      var head=document.createElement('div'); head.className='meal-plan-head';
      ['구분','확정 맛집','타베/리뷰','구글/리뷰','대안'].forEach(function(label){
        var span=document.createElement('span'); span.textContent=label; head.appendChild(span);
      });
      table.appendChild(head);
      var list=document.createElement('div'); list.className='meal-plan-day-list';
      table.appendChild(list);
      day.appendChild(table);
      host.appendChild(day);
      groupLists[item.date]=list;
    }
    var alternatives=rows.filter(function(row){
      var status=statusOf(row);
      return status.indexOf('↔')>=0 &&
        datesOf(status).indexOf(item.date)>=0 &&
        slotsOf(status).indexOf(item.slot)>=0;
    });

    var details=document.createElement('details');
    details.className='meal-plan-item';
    details.setAttribute('data-date',item.date);
    details.setAttribute('data-slot',item.slot);

    var summary=document.createElement('summary');
    summary.className='meal-plan-row';
    var slotClass={ '아침':'morning', '점심':'lunch', '저녁':'dinner', '카페':'cafe', '디저트':'dessert' }[item.slot] || '';
    var slot=document.createElement('span'); slot.className='meal-plan-slot '+slotClass; slot.textContent=item.slot;
    summary.appendChild(slot);
    summary.appendChild(cloneCell(item.row,1,'meal-plan-name'));
    summary.appendChild(cloneCell(item.row,3,'meal-plan-rating'));
    summary.appendChild(cloneCell(item.row,4,'meal-plan-rating'));
    var count=document.createElement('span'); count.className='meal-plan-count';
    count.innerHTML=alternatives.length ? '대안 '+alternatives.length+' <i>⌄</i>' : '대안 없음 <i>⌄</i>';
    summary.appendChild(count);
    details.appendChild(summary);

    var panel=document.createElement('div'); panel.className='meal-plan-alts';
    var detail=buildMealDetail(MEAL_DETAIL[mapKeyOf(item.row)],details);
    if(detail) panel.appendChild(detail);
    var title=document.createElement('div'); title.className='meal-plan-alt-title';
    title.textContent=item.date+' '+item.slot+' 대체 후보'+(alternatives.length ? ' · '+alternatives.length+'곳' : '');
    panel.appendChild(title);
    if(!alternatives.length){
      var empty=document.createElement('p'); empty.className='meal-plan-alt-empty'; empty.textContent='현재 표에 등록된 같은 시간대 대안이 없어요.';
      panel.appendChild(empty);
    }else{
      alternatives.forEach(function(row){
        var alt=document.createElement('div'); alt.className='meal-plan-alt-row';
        alt.appendChild(cloneCell(row,1,'meal-plan-alt-name'));
        alt.appendChild(cloneCell(row,3,'meal-plan-alt-rating'));
        alt.appendChild(cloneCell(row,4,'meal-plan-alt-rating'));
        alt.appendChild(cloneCell(row,5,'meal-plan-alt-note'));
        panel.appendChild(alt);
      });
    }
    details.appendChild(panel);
    groupLists[item.date].appendChild(details);
  });
})();

/* 일정 제목과 설명을 시각적으로 분리한다.
   제목은 첫 줄에 남기고, 설명은 항상 다음 줄에서 시작한다. */
(function(){
  function removeDescriptionDashes(detail){
    var walker=document.createTreeWalker(detail,NodeFilter.SHOW_TEXT);
    var node;
    while((node=walker.nextNode())){
      var parent=node.parentElement;
      if(parent && parent.closest('.ev-titleline')) continue;
      node.nodeValue=node.nodeValue
        .replace(/\s*—\s*/g,' ')
        .replace(/(^|\s)-(?=\s|$)/g,'$1');
    }
  }

  /* 요일 접두(토 / 화~일 / 평일)와 (L.O. 13:30) 꼬리까지 한 덩어리로 잡아야
     시간을 들어냈을 때 "토 (L.O. 17:30)" 같은 부스러기가 남지 않는다. */
  var DAY='(?:평일|주말|공휴일|[월화수목금토일](?:\\s*[~〜–—-]\\s*[월화수목금토일])?)';
  var LO='(?:\\s*\\(\\s*L\\.O\\.[^)]*\\))?';
  function hoursRe(core){ return new RegExp('(?:'+DAY+'\\s*)?'+core+LO); }
  var HOURS_PATTERNS=[
    hoursRe('\\d{1,2}:\\d{2}\\s*[~〜–—-]\\s*\\d{1,2}:\\d{2}(?:\\s*\\/\\s*\\d{1,2}:\\d{2}\\s*[~〜–—-]\\s*\\d{1,2}:\\d{2})?'),
    hoursRe('\\d{1,2}\\s*[~〜–—-]\\s*\\d{1,2}시'),
    hoursRe('[~〜]\\s*\\d{1,2}:\\d{2}'),   /* "~19:00" 처럼 마감만 적힌 표기 */
    hoursRe('[~〜]\\s*\\d{1,2}시'),        /* "~22시" */
    /\d{1,2}:\d{2}\s*(?:오픈|개장|마감)/,
    /(?:오픈|개장|막입장|최종\s*입장|마감)\s*\d{1,2}:\d{2}/,
    /\d{1,2}시\s*(?:오픈|개장|마감)/,
    /24시간(?!\s*전)/
  ];

  /* 설명에서 운영시간을 뽑고, 같은 문구를 원문에서 지운다.
     제목 우측 ⏰ 뱃지 하나로 모으기 위함 — 태그(<b> 등)를 넘나드는 매치도 처리한다. */
  function extractOperatingHours(detail){
    var nodes=[];
    var walker=document.createTreeWalker(detail,NodeFilter.SHOW_TEXT,null);
    var node;
    while((node=walker.nextNode())){
      if(node.parentElement && node.parentElement.closest('.ev-titleline,.alt,.evact')) continue;
      nodes.push(node);
    }
    var joined=nodes.map(function(n){ return n.nodeValue; }).join('');
    var match=null;
    for(var i=0;i<HOURS_PATTERNS.length && !match;i++) match=joined.match(HOURS_PATTERNS[i]);
    if(!match) return '';

    var label=match[0]
      .replace(/(\d)\s*[~〜]\s*(\d)/g,'$1–$2')  /* 범위일 때만 물결→대시. "~19:00"은 그대로 둔다 */
      .replace(/\s{2,}/g,' ').trim();

    /* 스펙 나열(· 구분 / 괄호 안)일 때만 원문에서 지운다.
       "동굴은 16시 마감이라 스킵" 같은 문장 속 시간은 지우면 말이 깨진다. */
    var start=match.index, end=start+match[0].length;
    var before=joined.slice(0,start).replace(/\s+$/,'');
    var after=joined.slice(end).replace(/^\s+/,'');
    var listLike=(!before || /[·(]$/.test(before)) || (!after || /^[·)]/.test(after));
    if(!listLike) return label;

    var pos=0, touched=[];
    nodes.forEach(function(n){
      var from=pos, to=pos+n.nodeValue.length;
      pos=to;
      if(to<=start || from>=end) return;
      n.nodeValue=n.nodeValue.slice(0,Math.max(0,start-from))+n.nodeValue.slice(Math.max(0,Math.min(end,to)-from));
      touched.push(n);
    });
    touched.forEach(function(n){
      n.nodeValue=n.nodeValue.replace(/\s{2,}/g,' ').replace(/\(\s*\)/g,'');
    });

    /* 노드를 넘나들며 생긴 "· ·", 앞뒤에 달랑 남은 구분자 정리 */
    var live=nodes.filter(function(n){ return n.nodeValue.trim(); });
    var prevEndsSep=false;
    live.forEach(function(n,idx){
      if(prevEndsSep) n.nodeValue=n.nodeValue.replace(/^\s*·\s*/,' ');
      if(idx===0) n.nodeValue=n.nodeValue.replace(/^\s*·\s*/,'');
      n.nodeValue=n.nodeValue.replace(/·\s*·/g,' · ').replace(/\(\s*·\s*/g,'(').replace(/\s*·\s*\)/g,')').replace(/ ·(?=\S)/g,' · ').replace(/\s{2,}/g,' ');
      var next=n.nextSibling;
      if(!next || (next.nodeType===1 && next.tagName==='BR')) n.nodeValue=n.nodeValue.replace(/\s*·\s*$/,'');
      prevEndsSep=/·\s*$/.test(n.nodeValue);
    });
    detail.querySelectorAll('b,strong').forEach(function(el){
      if(!el.textContent.trim() && !el.children.length) el.remove();
    });
    return label;
  }

  document.querySelectorAll('.tl .fix').forEach(function(badge){ badge.remove(); });

  document.querySelectorAll('.tl .ev .d').forEach(function(detail){
    removeDescriptionDashes(detail);
    var eventRow=detail.closest('.ev');
    var kindCopy=detail.cloneNode(true);
    kindCopy.querySelectorAll('.alt').forEach(function(alternative){ alternative.remove(); });
    var detailText=kindCopy.textContent;
    var isFood=/[🍜🍡🍽☕🥐🎋🍰🍣🍧🍱🥞]/u.test(detailText);
    var isCafe=/☕|카페\s*·/.test(detailText);
    var isDessert=/[🍡🍰🍧🥞]|디저트\s*·?/u.test(detailText);
    if(isFood) eventRow.classList.add('ev-food');
    if(isCafe) eventRow.classList.add('ev-cafe');
    else if(isDessert) eventRow.classList.add('ev-dessert');
    else if(isFood) eventRow.classList.add('ev-meal');
    var primaryTitle=detail.querySelector(':scope > b');
    var primaryText=primaryTitle ? primaryTitle.textContent.replace(/\s+/g,' ').trim() : '';
    if(/몽벨|키노쿠니야|ABC마트|유니클로|돈키호테|잔파라|소프맵|북오프|빅카메라|갓파바시|코마치도리|아메요코|야나카 긴자|サミットストア|스탠다드 프로덕츠|시부야\s*109|아트모스|래그태그|미야시타 파크|파르코|로프트|핸즈|ハンズ|2nd STREET|아식스|스투시|Seria|세리아|DAISO|다이소/i.test(primaryText)){
      eventRow.classList.add('ev-shopping');
    }
    /* 사진 스팟 — 제목이나 설명에 "뷰 스팟 / 사진 명소 / 포토스팟"이 있으면 시간 아래에 📷 */
    if(/뷰\s*스팟|사진\s*명소|포토\s*스팟|촬영\s*명소/.test(detailText)) eventRow.classList.add('ev-photo');
    var timeIcons=[];
    if(eventRow.classList.contains('ev-photo')) timeIcons.push('📷');
    if(eventRow.classList.contains('ev-shopping')) timeIcons.push('🛒');
    if(eventRow.classList.contains('ev-cafe')) timeIcons.push('☕');
    else if(eventRow.classList.contains('ev-dessert')) timeIcons.push('🍡');
    else if(eventRow.classList.contains('ev-meal')) timeIcons.push('🍽️');
    /* 시간 아래에 이미 끼니 라벨(점심·카페…)이 있으면 같은 뜻의 아이콘은 뺀다 */
    var timeCell=eventRow.querySelector(':scope > .t');
    var slotLabel=timeCell ? timeCell.querySelector('.slot') : null;
    if(slotLabel && /아침|점심|저녁|카페|디저트/.test(slotLabel.textContent)){
      timeIcons=timeIcons.filter(function(icon){ return icon!=='🍽️' && icon!=='☕' && icon!=='🍡'; });
    }
    if(timeIcons.length){
      var iconText=timeIcons.join(' ');
      eventRow.setAttribute('data-time-icon',iconText);
      /* attr()는 의사요소가 붙은 그 요소에서만 읽힌다 — .t 에도 같이 심어야 렌더된다 */
      if(timeCell) timeCell.setAttribute('data-time-icon',iconText);
    }
    if(eventRow.classList.contains('move')) return;
    /* 펼침카드 행은 제목이 <summary> 안에 있다 — 제목줄·운영시간 칩도 그 안에 만들어야 한다.
       (본문 .fb 까지 훑으면 상세 문장에서 시간을 뜯어내 문장이 깨진다) */
    var fold=detail.firstElementChild && detail.firstElementChild.matches('details.evfold') ? detail.firstElementChild : null;
    var titleHost=fold ? fold.querySelector(':scope > summary') : detail;
    if(!titleHost) return;
    if(titleHost.querySelector(':scope > .ev-titleline')) return;

    var first=titleHost.firstChild;
    while(first && first.nodeType===3 && !first.nodeValue.trim()) first=first.nextSibling;
    if(!first || first.nodeType!==1 || first.tagName!=='B') return;

    var titleLine=document.createElement('span');
    titleLine.className='ev-titleline';
    var titleMain=document.createElement('span');
    titleMain.className='ev-titlemain';
    titleHost.insertBefore(titleLine,first);
    titleLine.appendChild(titleMain);
    titleMain.appendChild(first);

    var next=titleLine.nextSibling;
    while(next && next.nodeType===3 && !next.nodeValue.trim()){
      var after=next.nextSibling;
      titleMain.appendChild(next);
      next=after;
    }
    var hours=extractOperatingHours(titleHost);
    if(hours){
      var hoursLabel=document.createElement('span');
      hoursLabel.className='ev-hours';
      hoursLabel.textContent='⏰ '+hours;
      hoursLabel.setAttribute('aria-label','운영시간 '+hours);
      titleLine.appendChild(hoursLabel);
    }
  });
})();

/* 펼침카드(details.evfold) 안의 제목이면 패널을 카드 본문(.fb) 안에 넣는다.
   그래야 제목 한 번 누르면 카드와 패널이 같이 열리고, 접힘 상태에선 아무것도 안 보인다. */
function tripFoldOf(name){
  var summary=name.closest('summary');
  if(!summary) return null;
  var fold=summary.parentNode;
  return (fold && fold.classList && fold.classList.contains('evfold')) ? fold : null;
}
function tripPanelHost(name){
  var fold=tripFoldOf(name);
  return fold ? (fold.querySelector(':scope > .fb') || fold) : name.closest('.d');
}

/* 일정 속 식당명을 누르면 먹고 페이지와 같은 상세 정보를 행 하단에 펼친다. */
(function(){
  var meals=window.TRIP_MEAL_DETAIL;
  var build=window.buildTripMealDetail;
  var timelines=document.querySelectorAll('.tl');
  if(!timelines.length || !meals || !build) return;

  var aliases={
    'くら寿司 浅草ROX店':['쿠라스시 아사쿠사'],
    '廚 くろぎ 上野パルコヤ':['廚 くろぎ']
  };
  var koreanNames={
    '宮武讃岐うどん 成田空港第3ターミナル店':'미야타케 사누키 우동',
    '風雲児 新宿本店':'후운지',
    'タカマル鮮魚店 西新宿':'타카마루 센교텐',
    '但馬屋珈琲店 本店 西新宿':'타지마야 코히텐 본점',
    '追分だんご本舗 新宿本店':'오이와케 당고 혼포',
    'ベルク BERG 新宿 ルミネエスト B1':'베르크',
    '茶屋かど 鎌倉 山ノ内':'차야카도',
    'LONCAFE 江ノ島本店':'롱카페 에노시마 본점',
    '海光庵 長谷寺 鎌倉':'카이코안',
    'MAISON CACAO 鎌倉小町店':'메종 카카오 가마쿠라 코마치점',
    'くら寿司 浅草ROX店':'쿠라스시 아사쿠사 ROX점',
    'イマカツ 六本木本店':'이마카츠 롯폰기 본점',
    '雷一茶 浅草本店':'카미나리 잇사 아사쿠사 본점',
    '廚 くろぎ 上野パルコヤ':'쿠리야 쿠로기',
    'らぁ麺や 嶋 本町':'라아멘야 시마',
    '神泉いちのや 渋谷':'신센 이치노야',
    '茶亭 羽當 渋谷':'사테이 하토우'
  };
  var keys=Object.keys(meals);
  var panelSeq=0;

  function cleanMealMetadata(name,detail){
    var hasHours=!!detail.querySelector('.ev-hours');
    var metadata=null, passedName=false;
    Array.prototype.forEach.call(detail.children,function(child){
      if(metadata) return;
      if(child===name || child.contains(name)){ passedName=true; return; }
      if(passedName && child.classList.contains('muted')) metadata=child;
      if(passedName && (child.classList.contains('alt') || child.classList.contains('evact'))) passedName=false;
    });
    if(!metadata) return;

    var probe=document.createElement('span');
    var kept=metadata.innerHTML.split('·').filter(function(html){
      probe.innerHTML=html;
      var part=probe.textContent.replace(/\s+/g,' ').trim();
      if(!part || /^타베(?:로그)?\s*\d/.test(part)) return false;
      if(!hasHours) return true;
      var timeRange=/(?:\d{1,2}:\d{2}\s*[~〜–—-]\s*\d{1,2}:\d{2}|\d{1,2}\s*[~〜–—-]\s*\d{1,2}시)/;
      var address=/[A-Za-z가-힣ぁ-んァ-ヶ一-龯々]+\d+(?:-\d+){1,3}/;
      var location=/(?:역|도보|경내|바로 옆|이동\s*0|길목|숙소 방향|가까운 맛집|파르코야|루미네에스트|코마치도리 안|동쪽\s*\d+m|개찰 안쪽)/;
      return !timeRange.test(part) && !address.test(part) && !location.test(part);
    });
    if(kept.length) metadata.innerHTML=kept.map(function(part){ return part.trim(); }).join(' · ');
    else metadata.remove();

    if(hasHours){
      Array.prototype.forEach.call(detail.childNodes,function(child){
        if(child.nodeType!==3) return;
        child.nodeValue=child.nodeValue.replace(/\s*기타카마쿠라역\s*도보\s*\d+분(?:\(\d+m\))?\s*/g,' ');
      });
    }
  }

  function mealKeyOf(name){
    var text=name.textContent.replace(/\s+/g,' ').trim();
    if(!/[🍜🍡🍽☕🥐🎋🍰🍣🍧🍱]/.test(text)) return '';
    var mapq=name.getAttribute('data-mapq') || '';
    for(var i=0;i<keys.length;i++){
      var key=keys[i];
      if(mapq && (mapq===key || mapq.indexOf(key)>=0 || key.indexOf(mapq)>=0)) return key;
      var token=key.split(/\s+/)[0];
      if(token.length>1 && text.indexOf(token)>=0) return key;
      var extra=aliases[key] || [];
      for(var j=0;j<extra.length;j++) if(text.indexOf(extra[j])>=0) return key;
    }
    return '';
  }

  function addKoreanName(name,key){
    if(name.querySelector('.ev-meal-kr') || !koreanNames[key]) return;
    if(key==='くら寿司 浅草ROX店'){
      var walker=document.createTreeWalker(name,NodeFilter.SHOW_TEXT);
      var node;
      while((node=walker.nextNode())){
        if(node.nodeValue.indexOf('쿠라스시 아사쿠사점')<0) continue;
        node.nodeValue=node.nodeValue.replace('쿠라스시 아사쿠사점','くら寿司 浅草ROX店');
        break;
      }
    }
    var korean=document.createElement('span');
    korean.className='ev-meal-kr';
    korean.textContent=' ('+koreanNames[key]+')'+(name.querySelector('u') ? ' ' : '');
    name.insertBefore(korean,name.querySelector('u'));
  }

  function toggleMeal(name,key){
    var detail=name.closest('.d');
    detail.querySelectorAll(':scope > .ev-place-panel').forEach(function(place){ place.hidden=true; });
    detail.querySelectorAll('.ev-place-link[aria-expanded="true"]').forEach(function(link){
      link.setAttribute('aria-expanded','false');
    });
    var host=tripPanelHost(name);
    var panel=host.querySelector(':scope > .ev-meal-panel');
    var isSame=panel && panel.getAttribute('data-meal-key')===key;
    var willOpen=!isSame || panel.hidden;

    detail.querySelectorAll('.ev-meal-link[aria-expanded="true"]').forEach(function(link){
      link.setAttribute('aria-expanded','false');
    });

    if(!willOpen){
      panel.hidden=true;
      return;
    }

    if(!panel){
      panel=document.createElement('div');
      panel.className='ev-meal-panel';
      panel.id='ev-meal-panel-'+(++panelSeq);
      host.appendChild(panel);
    }
    if(!isSame){
      var fold=tripFoldOf(name);
      var block=build(meals[key],fold,fold ? '📸 사진 · 추천 메뉴' : '맛집 상세');
      /* 카드 본문이 이미 평점·영업시간을 적고 있으니 패널에선 지운다 (같은 값을 두 번 읽게 하지 않는다) */
      if(fold && block){
        var dupRatings=block.querySelector('.meal-plan-detail-ratings');
        if(dupRatings) dupRatings.remove();
        block.querySelectorAll('.meal-plan-detail-meta-row').forEach(function(metaRow){
          var dt=metaRow.querySelector('dt');
          if(dt && dt.textContent.trim()==='운영 시간') metaRow.remove();
        });
      }
      panel.replaceChildren(block);
      var alternatives=detail.querySelectorAll(':scope > .ev-meal-alt-source');
      if(alternatives.length){
        var altSection=document.createElement('section');
        altSection.className='ev-meal-alts';
        var altTitle=document.createElement('div');
        altTitle.className='ev-meal-alts-title';
        altTitle.textContent='대안';
        altSection.appendChild(altTitle);
        alternatives.forEach(function(source){
          var copy=source.cloneNode(true);
          copy.className='ev-meal-alt-item';
          altSection.appendChild(copy);
        });
        panel.appendChild(altSection);
      }
      panel.setAttribute('data-meal-key',key);
    }
    panel.hidden=false;
    name.setAttribute('aria-expanded','true');
    name.setAttribute('aria-controls',panel.id);
  }

  document.querySelectorAll('.tl .ev .d b').forEach(function(name){
    var key=mealKeyOf(name);
    if(!key) return;
    addKoreanName(name,key);
    name.classList.add('ev-meal-link');
    var foldEl=tripFoldOf(name);
    if(!foldEl){
      name.setAttribute('role','button');
      name.setAttribute('tabindex','0');
      name.setAttribute('aria-expanded','false');
      name.setAttribute('title','사진과 추천 메뉴 보기');
    }
    var detail=name.closest('.d');
    if(!detail.hasAttribute('data-meal-summary-cleaned')){
      cleanMealMetadata(name,detail);
      detail.setAttribute('data-meal-summary-cleaned','');
    }
    detail.querySelectorAll(':scope > .alt').forEach(function(alternative){
      alternative.classList.add('ev-meal-alt-source');
    });
    /* 펼침카드는 <summary>가 여닫이를 맡는다 — 제목에 클릭 핸들러를 또 달면 두 번 토글된다 */
    if(foldEl){
      foldEl.addEventListener('toggle',function(){
        if(!foldEl.open) return;
        var body=foldEl.querySelector(':scope > .fb') || foldEl;
        var built=body.querySelector(':scope > .ev-meal-panel');
        if(!built || built.hidden) toggleMeal(name,key);
      });
      return;
    }
    name.addEventListener('click',function(event){
      if(event.target.closest('a,button')) return;
      toggleMeal(name,key);
    });
    name.addEventListener('keydown',function(event){
      if(event.key!=='Enter' && event.key!==' ') return;
      event.preventDefault();
      toggleMeal(name,key);
    });
  });
})();

/* 일정 속 관광지·거리·전망대 제목을 누르면 대표 사진과 현장 팁을 펼친다. */
(function(){
  if(!document.querySelector('.tl')) return;

  var places=[
    {
      aliases:['전철 뷰 스팟 · 센다가야'], name:'센다가야 4-26 전철 뷰 스팟',
      image:'https://mtrl.tokyo/wp-content/uploads/2025/05/yoyogi_fumikiri-750x500.jpg',
      source:'https://mtrl.tokyo/column/97871',
      summary:'서로 다른 높이의 선로를 지나는 열차 두 대를 한 화면에 담는 촬영 포인트. 건널목과 고가선이 겹쳐 도쿄다운 장면이 나와요.',
      highlight:'주오·소부선 + 야마노테선 동시 구도 · 건널목', stay:'10–20분', admission:'상시 · 무료 · 일반 보행로',
      tip:'두 열차가 동시에 들어오는 순간은 운이 필요하니 동영상이나 연사로 찍는 편이 좋아요. 보행자 통로와 차도를 막지 말고 건널목 바깥에서 촬영하세요.'
    },
    {
      aliases:['오모이데 요코초'], name:'오모이데 요코초 · 골든가이',
      image:'https://img.lavietaste.com/cmt/c49fe11248f230238110cd7168f68737_s.jpg',
      source:'https://www.shinjuku-omoide.com/',
      summary:'신주쿠 서쪽 출구의 좁은 야키토리 골목. 쇼와 시대 분위기와 촘촘한 간판을 짧게 둘러보기 좋아요.',
      highlight:'입구 간판 · 좁은 골목 풍경 · 야키토리 연기', stay:'10–20분', admission:'거리 관람 무료 · 저녁부터 분위기가 살아남',
      tip:'사진만 찍는다면 큰길 쪽 입구에서 안쪽으로 한 번 통과하면 충분해요. 좌석이 매우 좁고 작은 가게는 현금만 받는 경우가 많습니다.'
    },
    {
      aliases:['도쿄 도청 전망대'], name:'도쿄 도청 전망대',
      image:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Tokyo_Metropolitan_Government_Building_2024.jpg/1280px-Tokyo_Metropolitan_Government_Building_2024.jpg',
      source:'https://www.yokoso.metro.tokyo.lg.jp/en/tenbou/',
      summary:'제1본청사 45층의 무료 전망실. 신주쿠 고층 빌딩과 도쿄 야경을 비용 부담 없이 볼 수 있어요.',
      highlight:'무료 45층 전망 · 신주쿠 야경 · 기념품 숍', stay:'30–45분', admission:'무료 · 일정 기준 최종 입장 21:30',
      tip:'전용 엘리베이터 앞 보안검색 대기를 감안해 최종 입장보다 20분 먼저 도착하세요. 맑은 낮에는 후지산 방향도 확인해보세요.'
    },
    {
      aliases:['엔가쿠지'], name:'엔가쿠지(円覚寺)',
      image:'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Stairs_to_Sanmon%2C_Engaku-ji.jpg/1280px-Stairs_to_Sanmon%2C_Engaku-ji.jpg',
      source:'https://www.engakuji.or.jp/',
      summary:'기타카마쿠라역 바로 앞의 선종 사찰. 숲에 둘러싸인 산몬과 고요한 경내가 핵심이에요.',
      highlight:'산몬 · 불전 · 숲길', stay:'30–40분', admission:'배관료 ¥300 · 야외 계단 있음',
      tip:'이날 동선에서 유일하게 되돌아가는 선택지예요. 시간이 밀렸다면 과감히 생략하고 츠루가오카하치만구로 바로 가는 편이 좋습니다.'
    },
    {
      aliases:['츠루가오카하치만구'], name:'츠루가오카하치만구',
      image:'https://upload.wikimedia.org/wikipedia/commons/5/5e/TsurugaokaHachiman-M8867.jpg',
      source:'https://www.hachimangu.or.jp/',
      summary:'가마쿠라 중심의 대표 신사. 긴 참배로와 붉은 본궁이 이어져 코마치도리와 함께 보기 좋아요.',
      highlight:'단카즈라 참배로 · 본궁 · 연못', stay:'35–50분', admission:'경내 무료 · 보물전은 별도',
      tip:'본궁 앞 계단 위에서 아래쪽 참배로를 내려다보는 구도가 좋아요. 코마치도리는 갈 때보다 나올 때 지나면 동선이 매끄럽습니다.'
    },
    {
      aliases:['하세데라'], name:'하세데라',
      image:'https://upload.wikimedia.org/wikipedia/commons/0/0b/HasederaKannondo20120716.jpg',
      source:'https://www.hasedera.jp/',
      summary:'관음당과 가마쿠라 바다를 함께 볼 수 있는 언덕 사찰. 경내 카페와 전망 산책로가 있어 쉬어가기 좋아요.',
      highlight:'관음당 · 바다 전망대 · 지장당', stay:'45–60분', admission:'유료 입장 · 계단과 경사 있음',
      tip:'먼저 전망대로 올라간 뒤 내려오며 관음당과 카페를 보는 순서가 편해요. 비가 오면 돌계단이 미끄러우니 신발에 주의하세요.'
    },
    {
      aliases:['고토쿠인 대불'], name:'고토쿠인 대불',
      image:'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/230128_Kamakura_Daibutsu_Japan04s3.jpg/1280px-230128_Kamakura_Daibutsu_Japan04s3.jpg',
      source:'https://www.kotoku-in.jp/',
      summary:'가마쿠라를 대표하는 청동 대불. 경내가 크지 않아 짧은 일정에도 핵심만 보기 쉬워요.',
      highlight:'청동 아미타 대불 · 정면 사진 · 대불 태내', stay:'25–35분', admission:'유료 입장 · 태내 관람은 현장 확인',
      tip:'정면만 보지 말고 대불 뒤쪽까지 한 바퀴 돌아보세요. 하세데라에서 도보 이동 후 에노덴을 타기 전 넣기 좋습니다.'
    },
    {
      aliases:['에노시마 신사'], name:'에노시마 신사',
      image:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Enoshimajinja_-05.jpg/1280px-Enoshimajinja_-05.jpg',
      source:'https://enoshimajinja.or.jp/',
      summary:'섬의 경사를 따라 세 궁이 이어지는 신사. 상점가에서 씨캔들로 올라가는 길 자체가 관람 동선이에요.',
      highlight:'즈이신몬 · 헤쓰미야 · 섬 경사 풍경', stay:'40–60분', admission:'경내 무료 · 에스카는 유료',
      tip:'체력을 아끼려면 에스카를 타고 올라가며 보고, 내려올 때 골목을 천천히 걷는 편이 좋아요. 씨캔들 일몰 시간을 우선하세요.'
    },
    {
      aliases:['씨캔들 전망등대'], name:'에노시마 씨캔들 전망등대',
      image:'https://enoden.co.jp/kr/common/images/tourism/spot/sea-candle/img-01.jpg',
      source:'https://www.enoden.co.jp/kr/tourism/spot/sea-candle/',
      summary:'쇼난 해안과 사가미만을 한눈에 보는 에노시마의 전망등대. 일몰부터 야간 조명까지 이어서 보기 좋아요.',
      highlight:'실내 전망층 · 야외 데크 · 쇼난 일몰', stay:'45–70분', admission:'사무엘 코킹원과 전망대 입장권 필요',
      tip:'일몰 25분 전에는 전망층에 올라가 자리를 잡으세요. 바람이 강하면 야외 데크가 춥고 통제될 수 있으니 얇은 겉옷을 챙기세요.'
    },
    {
      aliases:['기요스미 정원'], name:'기요스미 정원',
      image:'https://www.gotokyo.org/de/spot/25/images/25_sub001.jpg',
      source:'https://www.tokyo-park.or.jp/park/kiyosumi/',
      summary:'연못과 명석을 따라 걷는 메이지 시대 회유식 정원. 도심 일정 중 조용한 아침 산책을 넣고 싶을 때 좋아요.',
      highlight:'대천수 연못 · 이소와타리 징검돌 · 료테이', stay:'35–50분', admission:'09:00–17:00 · 입장 ¥150',
      tip:'연못 가장자리의 징검돌에서 거북이와 잉어를 가까이 볼 수 있어요. 다만 이 코스를 넣으면 뒤 일정이 약 1시간 밀립니다.'
    },
    {
      aliases:['갓파바시 도구가이'], name:'갓파바시 도구가이',
      image:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Kappabashi-dori_streetcorner_%28Kitchen_town_-_southern_end%29_Tokyo_Japan.jpg/1280px-Kappabashi-dori_streetcorner_%28Kitchen_town_-_southern_end%29_Tokyo_Japan.jpg',
      source:'https://www.kappabashi.or.jp/',
      summary:'칼·그릇·조리도구·식품 모형 전문점이 이어지는 상점가. 구경보다 살 물건을 정해두면 효율이 크게 좋아져요.',
      highlight:'일본 식칼 · 도자기 · 식품 모형', stay:'60–90분', admission:'거리 무료 · 개별 점포는 대체로 10–17시',
      tip:'칼을 사면 기내 반입이 안 되므로 위탁수하물 포장을 요청하세요. 같은 물건도 점포별 가격이 달라 초반엔 사진만 찍고 비교하세요.',
      shopsTitle:'🛍️ 남단 → 북단 순서로 들를 5곳',
      shopsNote:'9/7은 월요일이라 아래 다섯 곳 모두 영업합니다. ④⑤가 있는 북단 갓파바시 교차로에서 아사쿠사 가미나리몬까지는 도보 12분이에요.',
      shops:[
        { n:'①', name:'ニイミ洋食器店', kr:'니이미 양식기점', addr:'松が谷1-1-1 · 거리 남단 입구', hours:'10:00–18:00', desc:'지붕 위 대형 요리사 얼굴이 갓파바시 랜드마크. 유리잔·사케잔이 다른 가게보다 싸다는 후기가 많아요.' },
        { n:'②', name:'飯田屋', kr:'이이다야', addr:'西浅草2-21-6 · 중간', hours:'10:00–18:00', desc:'조리도구 8,000종의 6층 백화점. 계량·베이킹·1인용 냄비 같은 소품이 강해요.' },
        { n:'③', name:'釜浅商店', kr:'가마아사 상점', addr:'松が谷2-24-1 · 중간~북', hours:'10:00–17:30', desc:'난부테츠키(남부철기)와 칼. 칼을 사면 이름을 새겨 주는데 시간이 걸려요.' },
        { n:'④', name:'ユニオン', kr:'유니온', addr:'西浅草3-7-3 · 북단', hours:'평일 9:00–18:00', desc:'커피 기구 전문(드리퍼·주전자·서버). 길 건너 별관은 원두·차를 계량 판매해요.' },
        { n:'⑤', name:'元祖食品サンプル屋', kr:'음식모형', addr:'西浅草3-7-6 · 북단', hours:'10:00–17:30', desc:'열쇠고리·자석 기념품. 제작 체험은 예약제라 워크인은 구경만 됩니다.' }
      ]
    },
    {
      aliases:['아사쿠사'], name:'아사쿠사 · 센소지',
      image:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Sensoji_2023.jpg/1280px-Sensoji_2023.jpg',
      source:'https://www.senso-ji.jp/',
      summary:'가미나리몬에서 나카미세를 지나 본당까지 이어지는 도쿄의 대표 사찰 코스예요.',
      highlight:'가미나리몬 · 나카미세 · 센소지 본당', stay:'60–90분', admission:'경내 무료 · 상점은 저녁 전 순차 마감',
      tip:'가미나리몬 정면은 늘 붐비니 문을 통과한 뒤 뒤돌아보는 사진도 좋아요. 본당에서는 향 연기를 몸 쪽으로 쐬는 체험도 할 수 있습니다.'
    },
    {
      aliases:['아메요코'], name:'아메요코',
      image:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Ueno_20241210_133139.jpg/1280px-Ueno_20241210_133139.jpg',
      source:'https://www.ameyoko.net/',
      summary:'우에노와 오카치마치 사이 고가 아래에 식품·잡화·화장품 상점이 밀집한 시장 거리예요.',
      highlight:'고가 아래 시장 · 과자와 건어물 · 활기찬 간판', stay:'30–50분', admission:'거리 무료 · 점포별 영업시간 상이',
      tip:'메인 골목만 보지 말고 고가 아래 평행 골목도 확인하세요. 가격표가 없는 식품은 양과 금액을 먼저 확인하고 주문하는 편이 안전합니다.'
    },
    {
      aliases:['야나카 긴자'], name:'야나카 긴자',
      image:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Tokyo_-_Yanaka_143.jpg/1280px-Tokyo_-_Yanaka_143.jpg',
      source:'https://www.yanakaginza.com/',
      summary:'옛 도쿄 분위기의 작은 상점가. 닛포리 쪽 유야케 단단에서 내려다보는 노을 풍경이 대표 장면이에요.',
      highlight:'유야케 단단 · 고양이 모티프 · 동네 간식', stay:'35–50분', admission:'거리 무료 · 작은 상점은 일찍 닫을 수 있음',
      tip:'닛포리역에서 접근하면 계단 위에서 상점가 전체를 먼저 볼 수 있어요. 해질녘 사진을 우선하고 간식은 열린 곳 위주로 가볍게 고르세요.'
    },
    {
      aliases:['오차노미즈'], name:'오차노미즈 성교(聖橋) 전철 뷰',
      image:'https://pds.exblog.jp/pds/1/201009/25/93/f0100593_1949113.jpg',
      source:'https://www.gotokyo.org/en/spot/79/index.html',
      summary:'간다강 위로 JR 주오·소부선과 지하철 마루노우치선이 교차하는 도쿄의 대표 전철 촬영 지점이에요.',
      highlight:'3색 전철 교차 · 간다강 · 성교 난간 뷰', stay:'10–20분', admission:'상시 · 무료',
      tip:'열차 세 대가 동시에 겹치는 장면은 운이 필요해요. 난간 앞을 오래 점유하지 말고 연속 촬영으로 짧게 기다리는 편이 좋습니다.'
    },
    {
      aliases:['롯폰기 모리타워 전망대'], name:'롯폰기 모리타워 전망대',
      image:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Roppongi_Hills_2013-12-01.jpg/1280px-Roppongi_Hills_2013-12-01.jpg',
      source:'https://art-view.roppongihills.com/en/tcv/',
      summary:'롯폰기 힐스 고층에서 도쿄타워 방향의 야경을 보는 실내 전망대. 비가 와도 실내 관람은 가능해요.',
      highlight:'도쿄타워 정면 뷰 · 52층 실내 전망층 · 야경', stay:'60–90분', admission:'¥2,000+ · 10:00–22:00 · 최종 입장 21:30',
      tip:'도쿄타워가 보이는 창가부터 먼저 확보하세요. 유리 반사를 줄이려면 휴대폰을 창에 가깝게 붙이고 화면 밝기를 낮추면 좋아요.'
    },
    {
      aliases:['개장·입장'], name:'도쿄 디즈니랜드',
      image:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Tokyo_Disneyland_Cinderella_Castle_2023-07-02.jpg/1280px-Tokyo_Disneyland_Cinderella_Castle_2023-07-02.jpg',
      source:'https://www.tokyodisneyresort.jp/en/tdl/',
      summary:'하루 전체를 쓰는 테마파크 일정. 입장 직후 앱에서 대기시간과 유료·무료 패스를 먼저 확인하는 것이 핵심이에요.',
      highlight:'신데렐라성 · 인기 어트랙션 · 야간 퍼레이드', stay:'하루', admission:'모바일 티켓 QR 준비 · 당일 운영 캘린더 확인',
      tip:'입장 직후 사진보다 DPA와 패스부터 처리하세요. 보조배터리와 우비를 챙기고, 굿즈는 폐장 직전보다 오후에 미리 사는 편이 덜 붐빕니다.'
    },
    {
      aliases:['미야시타 파크'], name:'미야시타 파크',
      image:'https://res.klook.com/image/upload/fl_lossy.progressive,q_85/c_fill,w_1000/v1696399283/c5depkxlghsumdc6rv7y.jpg',
      source:'https://www.miyashita-park.tokyo/',
      summary:'쇼핑몰 옥상에 공원과 스포츠 시설을 올린 시부야의 입체형 복합 공간. 이동 중 짧게 들르기 좋아요.',
      highlight:'옥상 공원 · 시부야 스카이라인 · 시부야 요코초', stay:'15–30분', admission:'옥상 공원 무료 · 일정 기준 08:00–23:00',
      tip:'시간이 짧으면 엘리베이터로 바로 옥상에 올라가 한 바퀴만 도세요. 파르코 방향으로 내려오면 다음 쇼핑 동선이 자연스럽습니다.'
    },
    {
      aliases:['키노쿠니야 신주쿠본점'], name:'A BATHING APE HYBRID CAMO 대용량 토트',
      kicker:'쇼핑 상세', sourceLabel:'부록 상세 정보 ↗',
      image:'https://travel.watch.impress.co.jp/img/trw/list/2112/081/00.jpg',
      source:'https://travel.watch.impress.co.jp/docs/news/2112081.html',
      summary:'smart 2026년 8·9월 합병호에 포함된 베이프 부록. 내추럴 컬러 몸판에 손잡이와 바닥의 멀티컬러 HYBRID CAMO가 포인트예요.',
      highlight:'smart 2026 8·9월 합병호 · JAN 4912155210967', stay:'약 45×37×14cm', admission:'정가 ¥1,890 · 2026년 6월 25일 발매',
      labels:['찾을 제품','크기','구매 정보'], tipTitle:'🔎 찾는 팁',
      tip:'잡지 표지보다 부록 사진과 JAN 코드를 직원에게 보여주는 게 빨라요. 9월에는 차기호로 교체됐을 가능성이 있어 재고가 없으면 다른 대형서점·편의점 순으로 확인하세요.'
    },
    {
      aliases:['ABC마트 그랜드 스테이지'], name:'VANS COASTAL V5131 TATAMI',
      kicker:'쇼핑 상세', sourceLabel:'쇼핑 목록에서 보기 ↗',
      image:'https://img.apim.abc-mart.biz/img/6748/6748290001/674829000101.jpg',
      source:'buy.html',
      summary:'네이비 스트랩과 실제 다다미에 쓰는 골풀 소재 발판을 조합한 일본 한정형 플립플롭. 일반 반스 스니커즈가 아니라 샌들이에요.',
      highlight:'품번 V5131 · NAVY/TATAMI', stay:'유니섹스 23–28cm', admission:'ABC마트 전용 · 매장 재고 별도 확인',
      labels:['찾을 제품','사이즈','구매 정보'], tipTitle:'🔎 찾는 팁',
      tip:'직원에게 사진과 “V5131 TATAMI” 품번을 함께 보여주세요. 온라인 품절이어도 오프라인 잔여 재고가 있을 수 있어 대형 그랜드 스테이지부터 확인하는 편이 좋습니다.'
    },
    {
      aliases:['래그태그 시부야','2nd STREET 하라주쿠'], name:'PORTER FREE STYLE 카드케이스',
      kicker:'쇼핑 상세', sourceLabel:'쇼핑 목록에서 보기 ↗',
      image:'https://shopping.c.yimg.jp/lib/selection/707-08227-70.jpg',
      source:'buy.html',
      summary:'검은색 캔버스처럼 보이지만 표면을 코팅한 포터 스테디셀러 카드케이스. 스냅으로 여는 납작한 직사각형 형태예요.',
      highlight:'품번 707-08227 · BLACK', stay:'W115×H75×D20mm', admission:'중고는 품번보다 상태와 가격 우선',
      labels:['찾을 제품','크기','구매 정보'], tipTitle:'🔎 중고 확인 팁',
      tip:'모서리 코팅 벗겨짐, 스냅 강도, 내부 오염을 먼저 보세요. 중고가가 신품 정가의 60%를 넘으면 신품 매장 가격과 비교하는 편이 좋습니다.'
    },
    {
      aliases:['스투시 하라주쿠'], name:'Stüssy Stock Tokyo Tee · Black',
      kicker:'쇼핑 상세', sourceLabel:'쇼핑 목록에서 보기 ↗',
      image:'https://images.stockx.com/images/stussy-stock-tokyo-tee-black-3.jpg',
      source:'buy.html',
      summary:'검은색 몸판 앞면에 작은 스톡 로고, 뒷면에 흰색 Stüssy Tokyo 그래픽이 크게 들어간 도쿄 챕터 티셔츠예요.',
      highlight:'스타일코드 3903987 · BLACK', stay:'M/L 인기 사이즈 우선 확인', admission:'도쿄 챕터 매장 한정 · 재고 변동 큼',
      labels:['찾을 제품','사이즈','구매 정보'], tipTitle:'🔎 찾는 팁',
      tip:'비슷한 검정 스톡 티가 많으니 뒷면의 TOKYO 표기와 스타일코드를 함께 확인하세요. 원하는 사이즈가 있으면 매장 도착 직후 먼저 물어보는 게 좋아요.'
    },
    {
      aliases:['요요기공원'], name:'요요기공원',
      image:'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Tokyo_%E6%9D%B1%E4%BA%AC_%2851335433586%29.jpg/1280px-Tokyo_%E6%9D%B1%E4%BA%AC_%2851335433586%29.jpg',
      source:'https://www.tokyo-park.or.jp/park/yoyogi/',
      summary:'하라주쿠 옆의 넓은 도심 공원. 출국 전 일정에서는 관광보다 잠깐 쉬어가는 용도로 쓰기 좋아요.',
      highlight:'넓은 잔디 · 느티나무 길 · 사람 구경', stay:'15–30분', admission:'무료 · 상시 출입 가능 구역 중심',
      tip:'이번 일정은 공원 안쪽까지 들어가면 공항 이동이 빠듯해요. 하라주쿠문 근처 벤치에서 10–15분 쉬고 바로 돌아오는 정도로 제한하세요.'
    },
    {
      aliases:['일렉트리컬 퍼레이드'], name:'일렉트리컬 퍼레이드 드림라이츠', kicker:'밤 퍼레이드',
      image:'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Tokyo_Disneyland_Tokyo_Disneyland_Electrical_Parade_Dreamlights_%2853441979653%29.jpg/1280px-Tokyo_Disneyland_Tokyo_Disneyland_Electrical_Parade_Dreamlights_%2853441979653%29.jpg',
      source:'https://commons.wikimedia.org/wiki/File:Tokyo_Disneyland_Tokyo_Disneyland_Electrical_Parade_Dreamlights_(53441979653).jpg',
      sourceLabel:'사진 © Dick Thomas Johnson · CC BY 2.0 ↗',
      summary:'전구로 뒤덮인 플로트가 줄지어 퍼레이드 루트를 도는 야간 퍼레이드. 2001년에 시작해 25년째 이어지는 도쿄 디즈니랜드의 밤 대표 콘텐츠이고, 참고한 후기 세 편이 모두 "무조건 봐야 한다"로 꼽았어요.',
      labels:['볼거리','공연','비용'],
      highlight:'피터팬 해적선 · 신데렐라 호박마차 · 미키 기차 등 전구 플로트 행렬',
      stay:'약 45분 · 9/8은 19:45 시작 예정',
      admission:'입장권에 포함(무료) · 쇼 DPA는 1인 ¥2,500이지만 안 사도 충분',
      tipTitle:'💡 자리 잡는 요령',
      tip:'시작 30분쯤 전에 루트 가장자리에 앉으면 DPA 없이도 잘 보여요. 플로트가 높아서 앞줄이 아니어도 시야가 열립니다. 신데렐라성 앞 광장이 경쟁이 가장 심하니 웨스턴랜드·투모로우랜드 쪽 직선 구간이 편해요. 강풍·우천이면 중지되니 당일 앱 공지를 확인하세요.'
    }
  ];

  var panelSeq=0;
  function placeFor(title){
    var text=title.textContent.replace(/\s+/g,' ').trim();
    for(var i=0;i<places.length;i++){
      for(var j=0;j<places[i].aliases.length;j++) if(text.indexOf(places[i].aliases[j])>=0) return places[i];
    }
    return null;
  }
  function fact(label,value){
    var row=document.createElement('div'); row.className='ev-place-fact';
    var dt=document.createElement('dt'); dt.textContent=label;
    var dd=document.createElement('dd'); dd.textContent=value;
    row.append(dt,dd); return row;
  }
  function buildPanel(place){
    var panel=document.createElement('div');
    panel.className='ev-place-panel'; panel.id='ev-place-panel-'+(++panelSeq); panel.hidden=true;
    var detail=document.createElement('section'); detail.className='ev-place-detail';
    var photo=document.createElement('figure'); photo.className='ev-place-photo';
    var credit=document.createElement('a'); credit.href=place.source; credit.target='_blank'; credit.rel='noopener'; credit.textContent=place.sourceLabel || '사진·공식 정보 ↗';
    /* 자유 이용 사진을 못 구한 항목(신작 쇼 등)은 사진칸 자체를 접고, 출처 링크만 본문 끝에 남긴다 */
    if(place.image){
      var img=document.createElement('img'); img.src=place.image; img.alt=place.name+' 대표 사진'; img.loading='lazy'; img.decoding='async';
      img.addEventListener('error',function(){ photo.hidden=true; });
      photo.append(img,credit);
    } else {
      /* 사진칸을 display:none 시켜도 그리드의 168px 열은 남는다 — 한 열짜리로 바꿔줘야 본문이 안 눌린다 */
      photo.hidden=true; detail.classList.add('ev-place-detail--nophoto');
    }
    var body=document.createElement('div'); body.className='ev-place-body';
    var kicker=document.createElement('div'); kicker.className='ev-place-kicker'; kicker.textContent=place.kicker || '장소 상세';
    var heading=document.createElement('h4'); heading.textContent=place.name;
    var summary=document.createElement('p'); summary.className='ev-place-summary'; summary.textContent=place.summary;
    var facts=document.createElement('dl'); facts.className='ev-place-facts';
    var labels=place.labels || ['볼거리','권장 체류','입장·운영'];
    facts.append(fact(labels[0],place.highlight),fact(labels[1],place.stay),fact(labels[2],place.admission));
    var tip=document.createElement('div'); tip.className='ev-place-tip';
    var tipTitle=document.createElement('strong'); tipTitle.textContent=place.tipTitle || '💡 현장 팁';
    var tipText=document.createElement('p'); tipText.textContent=place.tip;
    tip.append(tipTitle,tipText);
    body.append(kicker,heading,summary,facts,tip);
    if(!place.image && place.source){
      var srcRow=document.createElement('p'); srcRow.className='ev-place-srclink';
      srcRow.appendChild(credit); body.appendChild(srcRow);
    }
    /* 들를 상점 목록 — 있으면 상세보기 맨 아래에 붙인다 */
    if(place.shops && place.shops.length){
      var shops=document.createElement('div'); shops.className='ev-place-shops';
      var shopsTitle=document.createElement('strong'); shopsTitle.textContent=place.shopsTitle || '🛍️ 들를 상점';
      shops.appendChild(shopsTitle);
      var list=document.createElement('ol'); list.className='ev-shop-list';
      place.shops.forEach(function(shop){
        var li=document.createElement('li');
        var head=document.createElement('div'); head.className='ev-shop-head';
        var num=document.createElement('span'); num.className='ev-shop-no'; num.textContent=shop.n;
        var nm=document.createElement('b'); nm.textContent=shop.name;
        nm.setAttribute('data-mapq',shop.name+' かっぱ橋');
        var kr=document.createElement('span'); kr.className='krn'; kr.textContent='('+shop.kr+')';
        var hrs=document.createElement('span'); hrs.className='ev-shop-hours'; hrs.textContent='⏰ '+shop.hours;
        head.append(num,nm,kr,hrs);
        var meta=document.createElement('div'); meta.className='ev-shop-addr'; meta.textContent=shop.addr;
        var desc=document.createElement('p'); desc.className='ev-shop-desc'; desc.textContent=shop.desc;
        li.append(head,meta,desc); list.appendChild(li);
      });
      shops.appendChild(list);
      if(place.shopsNote){
        var note=document.createElement('p'); note.className='ev-shop-note'; note.textContent=place.shopsNote;
        shops.appendChild(note);
      }
      body.appendChild(shops);
    }
    detail.append(photo,body); panel.appendChild(detail); return panel;
  }
  function togglePlace(title,place){
    var detail=title.closest('.d');
    var host=tripPanelHost(title);
    var panel=host.querySelector(':scope > .ev-place-panel');
    if(!panel){ panel=buildPanel(place); host.appendChild(panel); }
    var willOpen=panel.hidden;
    detail.querySelectorAll(':scope > .ev-meal-panel').forEach(function(meal){ meal.hidden=true; });
    detail.querySelectorAll('.ev-meal-link[aria-expanded="true"]').forEach(function(link){ link.setAttribute('aria-expanded','false'); });
    panel.hidden=!willOpen;
    title.setAttribute('aria-expanded',willOpen ? 'true' : 'false');
    title.setAttribute('aria-controls',panel.id);
  }

  document.querySelectorAll('.tl .ev:not(.move) .ev-titlemain > b:first-child').forEach(function(title){
    if(title.classList.contains('ev-meal-link')) return;
    var place=placeFor(title); if(!place) return;
    title.classList.add('ev-place-link');
    /* 펼침카드는 <summary>가 여닫이를 맡는다 — 제목에 클릭 핸들러를 또 달면 두 번 토글된다 */
    var foldEl=tripFoldOf(title);
    if(foldEl){
      foldEl.addEventListener('toggle',function(){
        if(!foldEl.open) return;
        var body=foldEl.querySelector(':scope > .fb') || foldEl;
        var built=body.querySelector(':scope > .ev-place-panel');
        if(!built || built.hidden) togglePlace(title,place);
      });
      return;
    }
    title.setAttribute('role','button'); title.setAttribute('tabindex','0'); title.setAttribute('aria-expanded','false');
    title.setAttribute('title',place.kicker==='쇼핑 상세' ? '상품 사진과 구매 팁 보기' : '사진과 현장 팁 보기');
    title.addEventListener('click',function(event){
      if(event.target.closest('a,button')) return;
      togglePlace(title,place);
    });
    title.addEventListener('keydown',function(event){
      if(event.key!=='Enter' && event.key!==' ') return;
      event.preventDefault(); togglePlace(title,place);
    });
  });
})();

/* ================= 지역 정규화 · 색상 =================
   .bdg 뱃지 텍스트나 .zgrp의 data-rg를 표준 지역명 배열로 바꾸고,
   지역명마다 안정적인(해시 기반) 색을 하나만 부여한다 — .bdg/.litem 띠/.zgrp가 전부 이 색을 공유. */
var REGION_ALIAS = { '전국 공통':'전국' };
var REGION_DROP = ['지점 다수', "Sac's Bar", 'ABC마트', '지바', '서밋', '숙소 근처']; /* 지역이 아니라 브랜드·설명 토큰 */
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

/* ================= 공용 크롬 주입 (하단 nav·지역 필터바·라이트박스) ================= */
(function(){
  var BASE = /\/pages\//.test(location.pathname) ? '../' : './';
  var sheet = document.querySelector('.sheet');
  var header = sheet && sheet.querySelector('header');

  /* 일정 탭엔 지역 필터가 필요 없다 — 하루 안에서 지역이 바뀌는 게 정상이라
     필터를 걸면 오히려 그날 동선이 잘려 보인다. 개요·지출은 필터 대상이 없다. */
  var NO_FILTER = { plan:1, home:1, money:1 };
  if(header && !NO_FILTER[document.body.getAttribute('data-tab')] && !document.getElementById('fbar-wrap')){
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

  var TABS = [
    ['home','🏠','개요','index.html'],
    ['plan','🗓️','일정','pages/plan.html'],
    ['buy','🛍️','사고','pages/buy.html'],
    ['eat','🍜','먹고','pages/eat.html'],
    ['go','🗺️','가고','pages/go.html'],
    ['trip','🚃','근교','pages/trip.html'],
    ['money','💴','지출','pages/money.html'],
    /* 날씨만 외부 사이트(tenki.jp 도쿄 예보)라 맨 끝에 둔다. '://'가 있으면 BASE를 붙이지 않고
       새 탭으로 연다 — 홈 화면에 설치한 PWA에서 같은 창으로 나가면 돌아올 수단이 없어서. */
    ['weather','☀️','날씨','https://tenki.jp/forecast/3/16/?date=2']
  ];
  var curTab = document.body.getAttribute('data-tab') || 'home';
  if(!document.getElementById('nav')){
    var navHtml = TABS.map(function(t){
      var ext = t[3].indexOf('://') > -1;
      var cls = (t[0]===curTab) ? ' class="on"' : '';
      var href = ext ? t[3] : (BASE + t[3]);
      var tgt = ext ? ' target="_blank" rel="noopener"' : '';
      return '<a'+cls+' href="'+href+'"'+tgt+'><span class="ico">'+t[1]+'</span>'+t[2]+'</a>';
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
    /* 체크박스 자체는 24px이라 손가락엔 작다. 보이는 크기는 그대로 두고
       label 로 감싸 히트 영역만 넓힌다(음수 마진으로 레이아웃은 거의 그대로). */
    var wrap = document.createElement('label');
    wrap.className = 'ckwrap';
    wrap.appendChild(cb);
    item.insertBefore(wrap, item.firstChild);
  }
  document.querySelectorAll('[data-cl]').forEach(function(c){
    var cl=c.getAttribute('data-cl');
    var kids=c.querySelectorAll(':scope > .n, :scope > .prow, :scope > .item, :scope > .litem');
    if(kids.length){ Array.prototype.forEach.call(kids, function(k){ attach(k, cl); }); }
    else { attach(c, cl); }
  });
  /* 섹션별 진행률 (h2에 n/m). 접히는 소제목(details.acc)은 닫아두면 안이 안 보이므로
     summary 에도 같은 방식으로 제 몫만 세어 붙인다. */
  function updateCounts(){
    document.querySelectorAll('.sheet > section, details.acc').forEach(function(sec){
      var boxes=sec.querySelectorAll('input.ckbox'); if(!boxes.length) return;
      /* 'h2, summary' 한 방에 찾으면 details.fold 처럼 summary 가 h2 를 감싼 경우
         트리 순서상 조상인 summary 가 먼저 잡힌다 — h2 를 먼저 본다. */
      var h2=sec.querySelector('h2')||sec.querySelector('summary'); if(!h2) return;
      var done=0; Array.prototype.forEach.call(boxes,function(b){ if(b.checked) done++; });
      var c=h2.querySelector('.cnt');
      if(!c){
        c=document.createElement('span'); c.className='cnt';
        var ref=h2.querySelector('.bdg');
        h2.insertBefore(c, (ref && ref.parentNode===h2) ? ref : null);
      }
      c.textContent=done+'/'+boxes.length;
    });
  }
  updateCounts();
})();

/* ================= 섹션 접기 (details.fold) =================
   다녀온 매장을 접어두면 남은 곳만 보인다. 접힘 상태는 탭+제목 기준으로 저장해
   페이지를 다시 열어도 유지된다. */
(function(){
  var folds=document.querySelectorAll('details.fold'); if(!folds.length) return;
  var KEY='tokyoTripFolds', saved={};
  try{ saved=JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){}
  var tab=document.body.getAttribute('data-tab')||'';
  Array.prototype.forEach.call(folds, function(d){
    var h2=d.querySelector('summary h2'); if(!h2) return;
    /* 진행률(.cnt)·지역 뱃지는 내용이 바뀌므로 키에서 뺀다 */
    var c=h2.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll('.cnt,.bdg'), function(x){ x.parentNode.removeChild(x); });
    var k=tab+'##'+c.textContent.replace(/\s+/g,' ').trim().slice(0,60);
    if(saved[k]===0) d.open=false;
    d.addEventListener('toggle', function(){
      if(d.open) delete saved[k]; else saved[k]=0;   /* 펼침이 기본이라 접힌 것만 저장 */
      try{ localStorage.setItem(KEY, JSON.stringify(saved)); }catch(e){}
    });
  });
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
  /* 로그인 후 주입되는 블록(숙소 행 등)에도 핀을 달아야 해서 밖에서 다시 부를 수 있게 열어 둔다 */
  window.attachMapPins=function(root){
    (root||document).querySelectorAll('[data-mapq]').forEach(function(el){
      if(el.querySelector('a.mappin')) return;
      var mapPin=pin(el.getAttribute('data-mapq'));
      if(el.classList.contains('ev-meal-link')) el.insertAdjacentElement('afterend',mapPin);
      else el.appendChild(mapPin);
    });
  };
  window.attachMapPins(document);
})();

/* ================= 지역 필터 & 표시 바 (탭을 넘어가도 유지) ================= */
(function(){
  var RK='tokyoTripRegion', HK='tokyoTripHide';
  var fbarWrap=document.getElementById('fbar-wrap'), fbar=document.getElementById('fbar'),
      fbarToggle=document.getElementById('fbar-toggle'), flab=document.getElementById('flab'),
      fempty=document.getElementById('fempty'), chips=document.getElementById('chips'),
      btnHide=document.getElementById('nv-hide');
  if(!fbarWrap) return;   /* 필터 바가 없는 탭(일정·개요·지출)에선 동작하지 않는다 */
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
/* 로그인 후 받아 온 비공개 블록을 담아 두는 곳 — 오프라인에서도 숙소 주소·긴급연락처가 보여야 한다 */
var SECRET_K='tokyoTripSecrets';
var SB={
  url:'https://jiwtfwkbfraolwxbnzzv.supabase.co',
  key:'sb_publishable_vu6Al-Urwr_eymf6K77ouQ_PhJfKIaV',
  SK:'tokyoTripSbSession',
  session:null,
  init:function(){ try{ this.session=JSON.parse(localStorage.getItem(this.SK)||'null'); }catch(e){} return this.session; },
  setSession:function(s){
    this.session=s;
    try{ s ? localStorage.setItem(this.SK, JSON.stringify(s)) : localStorage.removeItem(this.SK); }catch(e){}
    /* 로그아웃·갱신 실패로 세션이 끊기면 받아 둔 비공개 블록도 이 기기에서 지운다 */
    if(!s) try{ localStorage.removeItem(SECRET_K); }catch(e){}
  },
  email:function(){ return this.session && this.session.email; },
  loggedIn:function(){ return !!(this.session && this.session.refresh_token); },
  /* Supabase가 돌려주는 영문 메시지를 그대로 보여주면 불친절해서 자주 나오는 건 바꿔 준다 */
  MSG:{
    'Invalid login credentials':'이메일 또는 비밀번호가 맞지 않아요',
    'Email not confirmed':'이메일 확인이 안 된 계정이에요 (대시보드에서 Auto Confirm 체크)',
    'Failed to fetch':'네트워크에 연결할 수 없어요'
  },
  /* .then(this._json)으로 넘기면 this가 끊기므로 SB를 직접 참조한다 —
     안 그러면 MSG 한글 변환이 아니라 TypeError 메시지가 사용자에게 보인다 */
  _json:function(r){
    var self=SB;
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

/* ================= 로그인 전용 영역 =================
   [data-authonly] 블록은 로그인한 기기에서만 펼치고, 아니면 그 자리에 안내를 대신 넣는다.
   [data-secret="키"]가 붙은 블록은 내용 자체가 이 저장소에 없다 — Supabase의
   private_blocks 테이블(로그인한 사용자만 읽을 수 있는 RLS)에서 받아 와 채운다.
   그래서 공개 파일·저장소 히스토리에는 숙소 주소·증권번호·예약번호가 남지 않는다.
   로그인은 💴 지출 탭 한 곳에서만 받는다. */
var secretErr=null;
/* 마지막으로 받아온 키 목록 — 요청은 성공했는데 그 블록이 없는 경우와
   아직 못 받아온 경우를 구분해야 ⏳에서 영원히 멈추지 않는다 */
var secretKeys=null;

function readSecrets(){
  try{ return JSON.parse(localStorage.getItem(SECRET_K)||'null') || null; }catch(e){ return null; }
}

function paintAuthOnly(){
  var boxes=document.querySelectorAll('[data-authonly],[data-secret]');
  if(!boxes.length) return;
  var on=SB.loggedIn();
  var href=(/\/pages\//.test(location.pathname)?'':'pages/')+'money.html';
  var cache=on ? readSecrets() : null;
  Array.prototype.forEach.call(boxes, function(box){
    /* [data-secret]만 붙은 요소는 문장 속 인라인 값 — 자물쇠 안내 대신 대체 문구를 쓴다 */
    if(!box.hasAttribute('data-authonly')){ fillInlineSecret(box, cache); return; }
    box.hidden=!on;
    var lock=box.previousElementSibling;
    if(lock && lock.className!=='authlock') lock=null;
    if(on){
      if(lock) lock.remove();
      fillSecret(box, cache);
      return;
    }
    /* 로그아웃 상태에선 받아 둔 내용을 화면에서도 비운다 */
    if(box.hasAttribute('data-secret')){
      box.innerHTML=''; box.removeAttribute('data-filled'); box.classList.remove('authlock');
    }
    if(!lock){
      lock=document.createElement('div');
      lock.className='authlock';
      lock.innerHTML='🔒 <b>로그인해야 보이는 내용이에요</b><br>' +
        '<span class="muted">'+(box.getAttribute('data-authonly')||'개인 정보라 로그인한 기기에서만 보여요.')+'</span><br>' +
        '<a class="lockbtn" href="'+href+'">💴 지출 탭에서 로그인하기 →</a>';
      box.parentNode.insertBefore(lock, box);
    }
  });
}

/* 문장 속 값(숙소·역 이름, 공항버스 노선처럼 한 줄 안에 박힌 것) —
   정적 HTML에는 「숙소」처럼 무해한 대체 문구를 적어 두고, 로그인하면 그것만 갈아 끼운다.
   블록 방식과 달리 자물쇠 안내나 ⏳를 문장 중간에 끼워 넣지 않는다. */
function fillInlineSecret(box, cache){
  var key=box.getAttribute('data-secret'); if(!key) return;
  /* 원래 문구는 처음 만났을 때 보관해 둔다 — 로그아웃하면 되돌려야 한다 */
  if(!box.hasAttribute('data-fb')) box.setAttribute('data-fb', box.innerHTML);
  var html=cache && cache.blocks && cache.blocks[key];
  if(html){
    if(box.getAttribute('data-filled')===key) return;
    box.innerHTML=html;
    box.setAttribute('data-filled', key);
    if(window.attachMapPins) window.attachMapPins(box);
  } else if(box.getAttribute('data-filled')){
    box.innerHTML=box.getAttribute('data-fb');
    box.removeAttribute('data-filled');
  }
}

/* 받아 온 블록을 그려 넣는다. 아직 없으면 그 자리에 상태만 알려 준다. */
function fillSecret(box, cache){
  var key=box.getAttribute('data-secret');
  if(!key) return;                                /* 서버에서 받아올 게 없는 잠금 블록 */
  var html=cache && cache.blocks && cache.blocks[key];
  if(html){
    if(box.getAttribute('data-filled')===key) return; /* 이미 같은 내용이면 다시 그리지 않는다 */
    box.classList.remove('authlock');               /* 아래 안내 상태에서 붙였을 수 있다 */
    box.innerHTML=html;
    box.setAttribute('data-filled', key);
    if(window.attachMapPins) window.attachMapPins(box);  /* 주입된 숙소 행에 📍 달기 */
    return;
  }
  if(box.getAttribute('data-filled')) return;     /* 잠깐 실패했더라도 이미 보이는 내용은 지우지 않는다 */
  box.classList.add('authlock');
  var retry='<button type="button" class="lockbtn" onclick="loadSecrets()">다시 시도</button>';
  box.innerHTML = !navigator.onLine
      ? '📴 <b>오프라인이라 아직 못 받아왔어요</b><br><span class="muted">온라인일 때 한 번 열어 두면 이후엔 오프라인에서도 보여요.</span>'
    : secretErr
      ? '⚠️ <b>내용을 불러오지 못했어요</b><br><span class="muted">'+secretErr+'</span><br>'+retry
    /* 요청은 성공했는데 이 키가 없다 — 테이블에 행이 없거나 키가 다른 경우다 */
    : (secretKeys && secretKeys.indexOf(key)<0)
      ? '🗄️ <b>서버에 이 내용이 없어요</b><br><span class="muted">private_blocks 테이블에 <b>'+key+'</b> 행이 있는지 확인해 주세요' +
        (secretKeys.length ? ' (받아온 키: '+secretKeys.join(', ')+')' : ' (받아온 행이 0개예요)') +
        '.</span><br>'+retry
      : '⏳ <span class="muted">불러오는 중…</span>';
}

/* Supabase에서 비공개 블록을 받아 이 기기에 담아 둔다(오프라인 대비). */
function loadSecrets(){
  if(!document.querySelector('[data-secret]')) return Promise.resolve();
  if(!SB.loggedIn()){ paintAuthOnly(); return Promise.resolve(); }
  secretErr=null; secretKeys=null;
  paintAuthOnly();
  return SB.rest('private_blocks?select=key,html').then(function(rows){
    var blocks={};
    (rows||[]).forEach(function(r){ blocks[r.key]=r.html; });
    secretKeys=Object.keys(blocks);
    /* 빈 응답으로 이미 받아 둔 내용을 덮어쓰지 않는다 — 정책이 잠깐 조여졌을 수도 있다 */
    if(secretKeys.length) try{ localStorage.setItem(SECRET_K, JSON.stringify({ blocks:blocks, at:Date.now() })); }catch(e){}
    secretErr=null;
  }).catch(function(e){
    /* fetch 자체가 실패하면 영문 메시지가 그대로 오므로 한 번 더 우리 말로 바꿔 준다 */
    secretErr=SB.MSG[e.message]||e.message||'불러오기 실패';
  }).then(function(){
    /* 토큰이 만료돼 세션이 끊겼을 수도 있다 — 그러면 이름도 별명으로 되돌려야 한다 */
    paintAuthOnly(); paintNames();
  });
}

/* ================= 이름 표기 =================
   로그인 전에는 별명(감자·햄찌)만 보이고, 로그인한 기기에서만 실제 호칭을 쓴다.
   정적 텍스트는 [data-nm="y|b"]에 별명을 적어 두고 여기서 갈아 끼운다. */
var NICK={ b:'햄찌', y:'감자' }, REAL={ b:'보람', y:'양기' };
function NAMES(){ return SB.loggedIn() ? REAL : NICK; }
/* 「보람이 결제」/「감자가 결제」 — 받침에 따라 주격 조사가 달라진다 */
function subj(name){
  var last=name.charCodeAt(name.length-1)-0xAC00;
  var batchim=(last>=0 && last<11172) && (last%28!==0);
  return name+(batchim?'이':'가');
}
function paintNames(){
  var m=NAMES();
  document.querySelectorAll('[data-nm]').forEach(function(el){
    var name=m[el.getAttribute('data-nm')]; if(!name) return;
    el.textContent=(el.hasAttribute('data-nm-p') ? subj(name) : name) + (el.getAttribute('data-nm-sfx')||'');
  });
}

paintAuthOnly();
paintNames();
loadSecrets();

/* ================= 지출·정산 (pages/money.html 전용) =================
   기존 체크 시스템(data-cl → attach → updateCounts)은 정적 항목 전용이라 쓰지 않는다.
   attach()는 로드 시 한 번만 도는 querySelectorAll 결과에만 붙고 IIFE에 갇혀 있으며,
   저장 형식이 {키:1} 불리언 맵이라 금액을 담을 수 없다. 별도 키·별도 IIFE로 만든다. */
(function(){
  var form=document.getElementById('exp-add'); if(!form) return; /* 다른 탭에선 아무것도 안 함 */

  var EK='tokyoTripExpenses';
  /* 이름은 로그인 여부에 따라 별명↔실제 호칭이 바뀌므로 그릴 때마다 NAMES()를 본다 */
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
    var PEOPLE=NAMES();
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
      var from=(c.net>0)?PEOPLE.y:PEOPLE.b, to=(c.net>0)?PEOPLE.b:PEOPLE.y, amt=Math.abs(c.net);
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
      /* 갱신 실패로 로그아웃됐으면 로그인 폼·별명 표기로 되돌린다 */
      if(!SB.loggedIn()){ paintAuth(); paintNames(); render(); }
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
        /* 세션을 지우면 비공개 블록 캐시도 함께 사라지고, 이름도 별명으로 돌아간다 */
        SB.signOut(); paintAuth(); paintSync(); paintAuthOnly(); paintNames(); render();
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
          paintAuth(); paintAuthOnly(); paintNames(); loadSecrets();
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
  /* 과거 설명 뱃지에서 잘못 저장된 비지역 필터는 원래 '지역 전체' 상태로 되돌린다. */
  if(saved && saved.length){
    saved=saved.filter(function(r){ return REGION_DROP.indexOf(r)<0; });
    if(!saved.length){ try{ localStorage.removeItem(RK); }catch(e){} }
  }
  if(!window.__applyFilter) return;
  if(saved && saved.length) window.__applyFilter(saved, {restore:true});
  else window.__applyFilter(null, {restore:true});
})();
