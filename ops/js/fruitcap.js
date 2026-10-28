// 💰 과일 주문 한도선 (10/28 · 사장님 「과일 시즌 부분에 과일 주문 한도선 · 과일별 기준 g · 최저가 · 최고가」)
// 재고·발주 「🍓 과일 시즌」(#sk2) 아래 표 + 발주 화면 과일 칸 아래 한 줄(#skCapNow).
// 저장: cafesui.fruitcap = { it: { id: { n, u, use, mo, lo, hi, cap, m, o, del, ed, rec: { rid: { d, p, who, at } } } } }
//  · 처음 값(CAP0)은 크리스마스 재료 파일(2024 · 2025) · 발주 기준표 · 사장님 기준에서 찾은 것만 — 모르는 값은 비워 둠
//  · 고치기는 사장님 · 정항아님만, 「＋ 이번 값 적기」는 누구나(값이 쌓이면 최저 · 최고가 저절로 넓어짐)
(function () {
  var KEY = "cafesui.fruitcap", MGR = ["정항아", "사장님"];
  var box = document.getElementById("skCap"); if (!box) return;
  // mo: 쓰는 달(쉼표) · lo/hi/cap: 원(숫자만) · m: 근거
  var CAP0 = [
    { id: "f1", n: "딸기", u: "500g 1팩", use: "한판 560g", mo: "11,12,1,2,3,4", lo: 9000, hi: 10000, cap: 10000,
      m: "크리스마스 재료 파일: 2024 엄궁89 411팩 3,699,000원(팩당 9,000) · 2025 망고아저씨 290팩 2,900,000원(팩당 10,000) — 12월 대량 주문 값" },
    { id: "f2", n: "망고", u: "1박스 (10~14수)", use: "한판 12수짜리 3.5개", mo: "1,2,3,4,5,6,7,8,9,10,11,12", lo: "", hi: 58000, cap: 58000,
      m: "사장님 기준 「망고 1박스 58,000원 넘으면 안 됨」(발주 기준표) · 최저가 기록 없음" },
    { id: "f3", n: "애플망고 12과", u: "1박스 (12과)", use: "", mo: "", lo: 32000, hi: 32000, cap: 32000,
      m: "크리스마스 재료 파일: 2024 월드마켓 5박스 160,000원(박스당 32,000) · 기록 1번뿐" },
    { id: "f4", n: "샤인머스켓", u: "1박스 (3수 · 큰 알)", use: "한판 1손 (알 약간 큰 것)", mo: "7,8,9,10,11,12", lo: 20000, hi: 20000, cap: 20000,
      m: "크리스마스 재료 파일: 2024 엄궁89 5박스 100,000원(박스당 20,000) · 기록 1번뿐 · 여름 제철 값은 기록 없음" },
    { id: "f5", n: "무화과 (영암)", u: "500g 1팩", use: "한판 500g", mo: "8,9,10,11", lo: "", hi: "", cap: "", m: "기록 없음" },
    { id: "f6", n: "메론", u: "1개 (박스 단위 주문)", use: "한판 1.5kg 반통", mo: "5,6,7,8,9,10", lo: "", hi: "", cap: "", m: "기록 없음 · 당도 체크 필수" },
    { id: "f7", n: "체리", u: "1박스 (제일 알 큰 것)", use: "한판 22알", mo: "6,7,8", lo: "", hi: "", cap: "", m: "기록 없음" },
    { id: "f8", n: "복숭아 졸임 (미스터돌)", u: "1박스 (병조림 24병)", use: "한판 1병 반", mo: "6,7,8", lo: "", hi: "", cap: "", m: "기록 없음" },
    { id: "f9", n: "초당옥수수", u: "1개", use: "한판 반개~1개", mo: "6,7,8", lo: "", hi: "", cap: "", m: "기록 없음" },
    { id: "f10", n: "대추 방울토마토", u: "2kg (1/2번과 · 대과)", use: "", mo: "", lo: "", hi: "", cap: "", m: "기록 없음" },
    { id: "f11", n: "바나나", u: "1송이", use: "한판 긴 것 3.5개", mo: "5,6", lo: "", hi: "", cap: "", m: "기록 없음" },
    { id: "f12", n: "냉동망고", u: "1kg", use: "", mo: "", lo: "", hi: "", cap: "", m: "기록 없음 · 싼 것으로" },
    { id: "f13", n: "냉동딸기 (딜라잇가든 칠레산)", u: "1kg", use: "", mo: "", lo: "", hi: "", cap: "", m: "기록 없음" },
    { id: "f14", n: "망고퓨레", u: "1kg", use: "", mo: "", lo: 30000, hi: 30000, cap: "", m: "크리스마스 재료 파일: 2024 쿠팡 1kg 30,000원 · 기록 1번뿐" }
  ];
  function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
  function canEdit() { return MGR.indexOf(me()) >= 0; }
  function esc(v) { return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function N(v) { var n = parseFloat(String(v == null ? "" : v).replace(/[^0-9.]/g, "")); return isNaN(n) ? 0 : n; }
  function won(v) { var n = N(v); return n ? n.toLocaleString("ko-KR") + "원" : ""; }
  function money(v) { var t = String(v == null ? "" : v).replace(/[^\d]/g, ""); return t ? Number(t).toLocaleString("ko-KR") : ""; }
  function stamp() { var d = new Date(); return (d.getMonth() + 1) + "/" + d.getDate() + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } }
  function save(fn) { var o = load(); o.it = o.it || {}; fn(o); o.at = stamp(); o.by = me(); try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} draw(); }
  // 처음 값 위에 저장된 값을 얹어 보여 줌 (저장된 적 없는 줄은 처음 값 그대로)
  function rows() {
    var st = load().it || {}, out = [];
    CAP0.forEach(function (x, i) { var r = Object.assign({}, x, st[x.id] || {}); r.id = x.id; if (r.o == null) r.o = i; out.push(r); });
    Object.keys(st).forEach(function (k) { if (!CAP0.some(function (x) { return x.id === k; })) { var r = Object.assign({}, st[k]); r.id = k; if (r.o == null) r.o = 100; out.push(r); } });
    return out.filter(function (r) { return !r.del; }).sort(function (a, b) { return a.o - b.o; });
  }
  function recs(r) { return Object.keys(r.rec || {}).map(function (k) { return r.rec[k]; }).filter(function (x) { return x && N(x.p); }).sort(function (a, b) { return String(a.d).localeCompare(String(b.d)); }); }
  // 최저 · 최고 = 처음 값 + 적은 값들
  function range(r) {
    var ps = recs(r).map(function (x) { return N(x.p); }); if (N(r.lo)) ps.push(N(r.lo)); if (N(r.hi)) ps.push(N(r.hi));
    return ps.length ? [Math.min.apply(null, ps), Math.max.apply(null, ps)] : [0, 0];
  }
  function inSeason(r) { var m = new Date().getMonth() + 1; return String(r.mo || "").split(",").map(Number).indexOf(m) >= 0; }
  var EDIT = false;
  function draw() {
    var rs = rows(), ed = EDIT && canEdit();
    var h = '<div class="fch"><b>💰 과일 주문 한도선</b><span>한도선보다 비싸면 <mark>주문 전에 사장님께 먼저 확인</mark> · 지금 쓰는 과일은 진하게 · 주문할 때 「＋ 값 적기」로 남기면 최저가 · 최고가가 저절로 쌓입니다</span>' +
      (canEdit() ? '<button type="button" class="fcedit">' + (ed ? "✔ 다 고쳤어요" : "✏ 한도선 고치기") + "</button>" : "") + "</div>";
    h += '<div class="ztable-wrap"><table class="skref fctab"><thead><tr><th>과일</th><th>주문 기준 (단위 · g)</th><th>한판에 쓰는 양</th><th>최저가</th><th>최고가</th><th class="fccap">🚫 한도선</th><th>근거 · 최근 값</th>' + (ed ? "<th></th>" : "") + "</tr></thead><tbody>";
    rs.forEach(function (r) {
      var rg = range(r), rc = recs(r), last = rc[rc.length - 1], on = inSeason(r) ? " now" : "";
      if (ed) {
        h += '<tr data-id="' + r.id + '" class="fced">' +
          '<td><input class="fcin" data-f="n" value="' + esc(r.n) + '"></td><td><input class="fcin" data-f="u" value="' + esc(r.u) + '"></td>' +
          '<td><input class="fcin" data-f="use" value="' + esc(r.use) + '"></td>' +
          '<td><input class="fcin money" inputmode="numeric" data-f="lo" value="' + esc(money(r.lo)) + '"></td><td><input class="fcin money" inputmode="numeric" data-f="hi" value="' + esc(money(r.hi)) + '"></td>' +
          '<td><input class="fcin money" inputmode="numeric" data-f="cap" value="' + esc(money(r.cap)) + '"></td>' +
          '<td><textarea class="fcin" rows="2" data-f="m">' + esc(r.m) + '</textarea><input class="fcin fcmo" data-f="mo" value="' + esc(r.mo) + '" placeholder="쓰는 달 (예: 11,12,1,2)"></td>' +
          '<td><button type="button" class="fcdel" title="이 줄 빼기">🗑</button></td></tr>';
      } else {
        h += '<tr data-id="' + r.id + '" class="' + on.trim() + '">' +
          '<td class="fcn' + on + '"><b>' + esc(r.n) + "</b></td><td" + (on ? ' class="now"' : "") + ">" + esc(r.u) + "</td><td" + (on ? ' class="now"' : "") + ">" + esc(r.use || "—") + "</td>" +
          '<td class="fcp' + on + '">' + (rg[0] ? won(rg[0]) : '<i class="fcna">기록 없음</i>') + '</td><td class="fcp' + on + '">' + (rg[1] ? won(rg[1]) : '<i class="fcna">기록 없음</i>') + "</td>" +
          '<td class="fccap' + on + '">' + (N(r.cap) ? "<b>" + won(r.cap) + "</b>" : '<i class="fcna">정하기</i>') + "</td>" +
          '<td class="fcm' + on + '">' + esc(r.m) + (last ? '<span class="fclast' + (N(r.cap) && N(last.p) > N(r.cap) ? " over" : "") + '">최근 ' + esc(String(last.d).slice(5).replace("-", "/")) + " " + won(last.p) + (last.who ? " · " + esc(last.who) + (/님$/.test(last.who) ? "" : "님") : "") + "</span>" : "") +
          '<button type="button" class="fcadd">＋ 값 적기</button></td></tr>';
      }
    });
    h += "</tbody></table></div>";
    if (ed) h += '<div class="fcact"><button type="button" class="fcnew">＋ 과일 줄 추가</button><span>칸에서 나오면 바로 저장 · 쓰는 달은 숫자를 쉼표로 (지금 달이면 진하게)</span></div>';
    h += '<p class="fcnote">처음 값은 <b>크리스마스 재료 파일(2024 · 2025)</b> · 발주 기준표 · 사장님 기준에서 찾은 것만 넣었어요. 손익(회계) 파일은 과일을 품목 없이 달마다 결제 합계로만 적어서 과일별 값은 안 나와요 — 「기록 없음」 칸은 주문할 때 값을 적거나 사장님이 정해 주세요.</p>';
    var a = document.activeElement, keep = a && box.contains(a) && a.dataset && a.dataset.f ? [a.closest("tr").dataset.id, a.dataset.f] : null;
    box.innerHTML = h;
    if (keep) { var f = box.querySelector('tr[data-id="' + keep[0] + '"] [data-f="' + keep[1] + '"]'); if (f) f.focus(); }
    paintNow();
  }
  // 발주 화면 과일 칸 아래 — 지금 쓰는 과일의 한도선 한 줄
  function paintNow() {
    var el = document.getElementById("skCapNow"); if (!el) return;
    var xs = rows().filter(function (r) { return inSeason(r) && N(r.cap); });
    el.hidden = !xs.length;
    el.innerHTML = '🚫 <b>과일 한도선</b> ' + xs.map(function (r) { return esc(r.n) + " " + esc(r.u) + " <b>" + won(r.cap) + "</b>"; }).join(" · ") + ' <span>— 넘으면 사장님께 먼저 · <a href="#" class="fcgo">전체 보기</a></span>';
  }
  function put(id, f, v) {
    save(function (o) {
      var b = o.it[id] || {}; b[f] = v; b.ed = me() + " " + stamp(); o.it[id] = b;
    });
  }
  box.addEventListener("click", function (e) {
    if (e.target.closest(".fcedit")) { EDIT = !EDIT; draw(); return; }
    if (e.target.closest(".fcnew")) { var id = "u" + Date.now().toString(36); save(function (o) { o.it[id] = { n: "새 과일", u: "", use: "", mo: "", lo: "", hi: "", cap: "", m: "", o: 200, add: me() + " " + stamp() }; }); return; }
    var tr = e.target.closest("tr[data-id]"); if (!tr) return; var id = tr.dataset.id, r = rows().filter(function (x) { return x.id === id; })[0]; if (!r) return;
    if (e.target.closest(".fcdel")) { if (confirm("「" + r.n + "」 줄을 뺄까요? (기록은 남아요)")) put(id, "del", 1); return; }
    if (e.target.closest(".fcadd")) {
      var v = prompt(r.n + " · " + r.u + "\n이번에 주문한 값(원)을 적어 주세요" + (N(r.cap) ? "\n한도선: " + won(r.cap) : ""), ""); if (v == null) return;
      var p = N(v); if (!p) { alert("숫자로 적어 주세요 (예: 55000)"); return; }
      if (N(r.cap) && p > N(r.cap) && !confirm("⚠ 한도선 " + won(r.cap) + "보다 " + won(p - N(r.cap)) + " 비싸요.\n사장님께 먼저 확인하셨나요? (확인 = 그래도 적기)")) return;
      var rid = "r" + Date.now().toString(36);
      save(function (o) { var b = o.it[id] || {}; b.rec = b.rec || {}; b.rec[rid] = { d: today(), p: p, who: me(), at: stamp() }; o.it[id] = b; });
      if (window.__CS_TOAST) window.__CS_TOAST(r.n + " " + won(p) + " 적었어요");
    }
  });
  box.addEventListener("change", function (e) {
    var el = e.target, f = el.dataset && el.dataset.f; if (!f) return; var id = el.closest("tr").dataset.id;
    var v = el.value.trim(); if (/^(lo|hi|cap)$/.test(f)) v = v.replace(/[^\d]/g, "");
    put(id, f, v);
  });
  box.addEventListener("input", function (e) { var el = e.target; if (el.classList && el.classList.contains("money")) { var f = money(el.value); if (f !== el.value) el.value = f; } });
  document.addEventListener("click", function (e) {
    if (!e.target.closest || !e.target.closest(".fcgo")) return; e.preventDefault();
    var t = document.querySelector('#tp12 .sktab[data-c="sk2"]'); if (t) t.click();
    setTimeout(function () { box.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
  });
  window.addEventListener("cs:remote", function (e) {
    var ks = (e.detail && e.detail.keys) || []; if (ks.indexOf(KEY) < 0) return;
    var a = document.activeElement; if (a && box.contains(a) && /INPUT|TEXTAREA/.test(a.tagName)) return;
    draw();
  });
  draw();
})();
