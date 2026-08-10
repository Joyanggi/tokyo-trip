#!/usr/bin/env python3
"""일정 좌표 + 도보 구간 실제 경로를 미리 계산해 assets/route-data.js 로 굽는다.
현지에서는 네트워크 호출 0 (타일만 필요)."""
import json, math, time, subprocess, urllib.parse, urllib.request

UA = "tokyo-trip-planner/1.0 (github.com/Joyanggi/tokyo-trip)"
FOOT = "https://routing.openstreetmap.de/routed-foot/route/v1/foot/"
OUT = "/Users/joyanggi/claude_chat/tokyo-trip/assets/route-data.js"

# key: (lat, lng)  — Nominatim 확인 완료 + 일부 주소기준 보정
P = {
 "nrt":   (35.775871, 140.393310),
 "apa":   (35.689983, 139.684639),
 "sjeki": (35.689607, 139.700571),
 "mb-sj": (35.686650, 139.701850),   # 千駄ヶ谷5-17-6 주소 기준
 "kino":  (35.692237, 139.703024),
 "abc":   (35.692197, 139.702289),
 "janp":  (35.688654, 139.698491),
 "din1":  (35.686890, 139.696686),
 "caf1":  (35.692677, 139.699733),
 "tocho": (35.689739, 139.692997),
 "bicsj": (35.691367, 139.702697),

 "enga":  (35.337936, 139.547820),
 "chaya": (35.331600, 139.551800),   # 建長寺 인근 · 기타카마쿠라역 도보 10분
 "hachi": (35.325184, 139.556179),
 "komac": (35.319652, 139.551561),
 "hase":  (35.312269, 139.533309),
 "daibu": (35.316499, 139.535729),
 "enosh": (35.300340, 139.479845),
 "candl": (35.299756, 139.478479),

 "kappa": (35.714723, 139.789144),
 "senso": (35.713403, 139.795526),
 "kura":  (35.712986, 139.792797),
 "caf2":  (35.712911, 139.796893),
 "mb-ok": (35.706953, 139.774630),
 "ameyo": (35.710059, 139.774543),
 "din3":  (35.665925, 139.729151),
 "mori":  (35.660373, 139.729178),

 "maiha": (35.635640, 139.883330),
 "tdl":   (35.632659, 139.881417),

 "sbeki": (35.660569, 139.702533),
 "stdp":  (35.658258, 139.698640),
 "s109":  (35.659600, 139.698680),
 "atmos": (35.660418, 139.698776),
 "ragta": (35.663163, 139.699872),
 "parco": (35.661927, 139.698749),
 "loft":  (35.661054, 139.699564),
 "lun5":  (35.657109, 139.693586),
 "caf5":  (35.660303, 139.702211),
 "2nd":   (35.669253, 139.708121),
 "asics": (35.670600, 139.705800),   # 神宮前1-13-12 주소 기준
 "stu":   (35.669661, 139.707366),
 "uniql": (35.670526, 139.703066),
}

# (키, 시각, 표시명, 아이콘, 이동수단) — mv: walk|train|air|"" (직전 지점에서 여기까지)
DAYS = [
 ("09-05", "9/5 (토)", "도착 + 신주쿠 반나절", [
   ("nrt",   "12:15", "나리타 T3 도착",            "✈️", ""),
   ("apa",   "15:00", "APA 호텔 체크인",           "🏨", "train"),
   ("mb-sj", "16:00", "몽벨 신주쿠 남구점",         "🛍️", "train"),
   ("kino",  "16:50", "키노쿠니야 신주쿠본점",       "📚", "walk"),
   ("abc",   "17:30", "ABC마트 그랜드 스테이지",     "👟", "walk"),
   ("janp",  "17:55", "잔파라·소프맵 신주쿠",        "📱", "walk"),
   ("din1",  "18:40", "저녁 (신주쿠)",              "🍽️", "walk"),
   ("caf1",  "19:50", "카페 (신주쿠)",              "☕", "walk"),
   ("tocho", "21:00", "도쿄 도청 전망대",           "🌃", "walk"),
   ("apa",   "22:00", "숙소 복귀",                  "🏨", "walk"),
 ]),
 ("09-06", "9/6 (일)", "근교 DAY · 가마쿠라 + 에노시마", [
   ("apa",   "07:30", "숙소 출발",                  "🏨", ""),
   ("enga",  "09:10", "엔가쿠지 (円覚寺)",          "⛩️", "train"),
   ("chaya", "10:50", "나가시소멘 · 茶屋かど",       "🎋", "walk"),
   ("hachi", "12:30", "츠루가오카하치만구",          "⛩️", "walk"),
   ("komac", "13:20", "코마치도리",                 "🍰", "walk"),
   ("hase",  "14:15", "하세데라",                   "🛕", "train"),
   ("daibu", "15:00", "고토쿠인 대불",              "🗿", "walk"),
   ("enosh", "16:10", "에노시마 신사",              "⛩️", "train"),
   ("candl", "17:00", "씨캔들 전망등대",            "🌅", "walk"),
   ("sjeki", "19:50", "저녁 (신주쿠 복귀)",         "🍽️", "train"),
   ("bicsj", "21:00", "빅카메라 신주쿠",            "🛍️", "walk"),
   ("apa",   "21:40", "숙소 복귀",                  "🏨", "train"),
 ]),
 ("09-07", "9/7 (월)", "아사쿠사·갓파바시 + 우에노 + 롯폰기", [
   ("apa",   "09:30", "숙소 출발",                  "🏨", ""),
   ("kappa", "10:15", "갓파바시 도구가이",          "🍽️", "train"),
   ("senso", "11:45", "아사쿠사 · 센소지",          "⛩️", "walk"),
   ("kura",  "13:00", "쿠라스시 아사쿠사점",        "🍣", "walk"),
   ("caf2",  "14:15", "카페 (아사쿠사)",            "☕", "walk"),
   ("mb-ok", "15:30", "몽벨 오카치마치점",          "🛍️", "train"),
   ("ameyo", "16:20", "아메요코",                   "🏮", "walk"),
   ("din3",  "17:40", "저녁 (롯폰기)",              "🍽️", "train"),
   ("mori",  "19:00", "롯폰기 모리타워 전망대",      "🌃", "walk"),
   ("apa",   "21:30", "숙소 복귀",                  "🏨", "train"),
 ]),
 ("09-08", "9/8 (화)", "디즈니 DAY", [
   ("apa",   "07:30", "숙소 출발",                  "🏨", ""),
   ("maiha", "08:45", "마이하마역 도착",            "🚉", "train"),
   ("tdl",   "09:00", "도쿄 디즈니랜드 개장·입장",   "🎢", "walk"),
   ("maiha", "21:00", "폐장 → 마이하마역",          "🚉", "walk"),
   ("apa",   "22:30", "숙소 복귀",                  "🏨", "train"),
 ]),
 ("09-09", "9/9 (수)", "쇼핑 DAY → 출국", [
   ("apa",   "09:00", "체크아웃",                   "🏨", ""),
   ("sbeki", "09:30", "시부야역 코인락커",          "🧳", "train"),
   ("stdp",  "10:00", "스탠다드 프로덕츠 마크시티",  "✏️", "walk"),
   ("s109",  "10:25", "시부야 109 · MAGNET 가챠",   "🎰", "walk"),
   ("atmos", "11:00", "아트모스 시부야",            "👟", "walk"),
   ("ragta", "11:20", "래그태그 시부야",            "🎒", "walk"),
   ("parco", "11:55", "시부야 파르코 6F",           "🎮", "walk"),
   ("loft",  "12:30", "로프트 시부야",              "✏️", "walk"),
   ("lun5",  "12:40", "점심 (시부야)",              "🍽️", "walk"),
   ("caf5",  "13:40", "카페 (시부야)",              "☕", "walk"),
   ("2nd",   "14:20", "2nd STREET 하라주쿠",        "🎒", "train"),
   ("asics", "14:35", "아식스 하라주쿠",            "👟", "walk"),
   ("stu",   "14:40", "스투시 하라주쿠",            "🧢", "walk"),
   ("uniql", "14:45", "유니클로 하라주쿠",          "👕", "walk"),
   ("sbeki", "15:10", "시부야발 N'EX 탑승",         "🚄", "train"),
   ("nrt",   "16:30", "나리타 T3 · 체크인",         "✈️", "train"),
 ]),
]


def hav(a, b):
    R = 6371000.0
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dp = p2 - p1
    dl = math.radians(b[1] - a[1])
    h = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*R*math.asin(math.sqrt(h))


cache = {}
def foot_route(a, b):
    """도보 경로 encoded polyline + 거리(m). 실패하면 None."""
    ck = (a, b)
    if ck in cache: return cache[ck]
    url = FOOT + "%f,%f;%f,%f" % (a[1], a[0], b[1], b[0]) + "?overview=full&geometries=polyline"
    res = None
    for _ in range(3):
        try:
            raw = subprocess.run(["curl", "-sS", "--max-time", "25", "-A", UA, url],
                                 capture_output=True, timeout=30).stdout
            r = json.loads(raw)
            if r.get("code") == "Ok" and r["routes"]:
                rt = r["routes"][0]
                res = {"g": rt["geometry"], "m": round(rt["distance"]), "s": round(rt["duration"])}
            break
        except Exception as e:
            print("   retry:", e); time.sleep(2)
    cache[ck] = res
    time.sleep(0.7)
    return res


days = []
for d, label, sub, stops in DAYS:
    pts, legs = [], []
    for i, (k, t, name, ico, mv) in enumerate(stops):
        lat, lng = P[k]
        pts.append({"k": k, "t": t, "n": name, "i": ico, "ll": [lat, lng]})
        if i == 0: continue
        a, b = P[stops[i-1][0]], P[k]
        straight = hav(a, b)
        leg = {"mv": mv or "walk", "d": round(straight)}
        if a == b:
            leg["mv"] = "stay"
        elif mv == "walk" and straight < 3000:
            fr = foot_route(a, b)
            if fr:
                leg["g"], leg["m"], leg["s"] = fr["g"], fr["m"], fr["s"]
        legs.append(leg)
        print(" %s  %-6s %5dm %s" % (d, leg["mv"], leg["d"], "route✓" if "g" in leg else ""))
    days.append({"d": d, "label": label, "sub": sub, "pts": pts, "legs": legs})

js = ("/* 일정 좌표 + 도보 실제 경로 — build_route.py 가 생성 (수동 편집 금지)\n"
      "   좌표: Nominatim/OSM · 도보 경로: FOSSGIS routed-foot (OSRM)\n"
      "   현지에서 네트워크 호출 없이 쓰려고 미리 구워둔 데이터입니다. */\n"
      "window.TRIP_ROUTE = " + json.dumps(days, ensure_ascii=False, separators=(",", ":")) + ";\n")
open(OUT, "w").write(js)
print("\n=> %s  (%.1f KB, %d일)" % (OUT, len(js.encode())/1024, len(days)))
