// 💰 가격표 (10/22 사장님 「직원들이 금액을 잘 모르는 것 같은데 · 스마트플레이스 판매하는 것들 금액을 시스템에 가격이라고 넣어줄 수 있니」)
// 탭 tp19 — 찾기 · 분류 단추 · 분류별 이름 + 가격(천 원 쉼표). 고치기는 사장님 · 정항아님만(✏ 가격 고치기 · ＋ 줄 · 🗑 빼기 = del 표시).
// 「📋 한 번에 붙여넣기」: 스마트플레이스 메뉴 글을 그대로 붙여 넣으면 「이름 … 가격」 줄을 찾아 넣음(가격 없는 줄은 분류 이름으로) — 같은 이름은 가격만 바뀌면 묻고 바꿈.
// 저장: cafesui.price = { it: { id: { c 분류, n 이름, p 가격(숫자만), m 메모, o 순서, ed "누가 언제", del } }, at, by }
(function () {
  var box = document.getElementById("prBox"); if (!box) return;
  var KEY = "cafesui.price", EDIT = ["사장님", "정항아"], CATS0 = ["에그타르트", "에그타르트 세트", "조각 케이크", "케이크 (홀)", "🎄 크리스마스 케이크 (한정)", "디저트", "선물 · 세트", "커피", "음료", "빙수", "추가 · 굿즈", "포장", "기타"];
  var q = "", cat = "", editing = false;
  function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
  function can() { return EDIT.indexOf(me()) >= 0; }
  function load() { try { var o = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; o.it = o.it || {}; return o; } catch (e) { return { it: {} }; } }
  function save(fn) { var o = load(); fn(o); o.at = stamp(); o.by = me(); try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function stamp() { var d = new Date(); return (d.getMonth() + 1) + "/" + d.getDate() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function digits(v) { var t = String(v == null ? "" : v).trim(); return /^[\d,\s]+원?$/.test(t) ? t.replace(/[^\d]/g, "") : t; }
  function money(v) { var t = digits(v); return /^\d+$/.test(t) ? Number(t).toLocaleString("ko-KR") : t; }
  function nim(n) { return n && n !== "사장님" ? n + "님" : n || ""; }
  function rows() { var it = load().it; return Object.keys(it).filter(function (k) { return it[k] && !it[k].del; }).map(function (k) { var x = it[k]; return { id: k, c: x.c || "기타", n: x.n || "", p: x.p || "", m: x.m || "", o: x.o == null ? 999 : x.o }; }); }
  function cats(L) { var seen = {}, out = []; CATS0.concat(L.map(function (x) { return x.c; })).forEach(function (c) { if (c && !seen[c] && L.some(function (x) { return x.c === c; })) { seen[c] = 1; out.push(c); } }); return out; }
  function norm(s) { return String(s).replace(/\s+/g, "").toLowerCase(); }

  function draw() {
    if (box.contains(document.activeElement) && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    var L = rows(), C = cats(L), o = load(), ed = editing && can();
    var F = L.filter(function (x) { return (!cat || x.c === cat) && (!q || norm(x.n + " " + x.m + " " + x.c).indexOf(norm(q)) >= 0); });
    var h = '<div class="prtool"><input type="search" class="prq" placeholder="🔍 메뉴 이름으로 찾기 (예: 딸기, 라떼, 에그)" value="' + esc(q) + '" aria-label="메뉴 찾기">' +
      (can() ? '<button type="button" class="skbtn' + (ed ? " prim" : "") + '" data-a="edit">' + (ed ? "✔ 다 고쳤어요" : "✏ 가격 고치기") + "</button>" : "") + "</div>";
    if (C.length) h += '<div class="prcats" role="group" aria-label="분류">' + ['<button type="button" class="prcat' + (!cat ? " on" : "") + '" data-c="">전체 ' + L.length + "</button>"].concat(C.map(function (c) { var n = L.filter(function (x) { return x.c === c; }).length; return '<button type="button" class="prcat' + (cat === c ? " on" : "") + '" data-c="' + esc(c) + '">' + esc(c) + " " + n + "</button>"; })).join("") + "</div>";
    if (!L.length) h += '<div class="prempty"><b>아직 가격이 없어요</b><span>사장님이 네이버 스마트플레이스 메뉴 화면을 캡쳐해서 보내 주시거나, ' + (can() ? "아래 「✏ 가격 고치기 → 📋 한 번에 붙여넣기」에 메뉴 글을 붙여 넣으면 들어갑니다" : "사장님 · 정항아님이 넣으면 바로 보입니다") + "</span></div>";
    (cat ? [cat] : C).forEach(function (c) {
      var G = F.filter(function (x) { return x.c === c; }).sort(function (a, b) { return a.o - b.o || (a.n < b.n ? -1 : 1); });
      if (!G.length) return;
      h += '<div class="prgrp"><h4 class="prgh">' + esc(c) + " <small>" + G.length + "</small></h4>";
      h += G.map(function (x) {
        if (!ed) return '<div class="prrow"><span class="prn">' + esc(x.n) + (x.m ? '<em class="prm">' + esc(x.m) + "</em>" : "") + '</span><b class="prp">' + (x.p ? esc(money(x.p)) + (/^\d+$/.test(digits(x.p)) ? "원" : "") : "—") + "</b></div>";
        return '<div class="prrow ed" data-id="' + x.id + '"><input class="pri" data-f="c" list="prCatList" value="' + esc(x.c) + '" aria-label="분류"><input class="pri prname" data-f="n" value="' + esc(x.n) + '" placeholder="메뉴 이름" aria-label="메뉴 이름">' +
          '<input class="pri prmoney" data-f="p" inputmode="numeric" value="' + esc(money(x.p)) + '" placeholder="가격" aria-label="가격"><input class="pri prmemo" data-f="m" value="' + esc(x.m) + '" placeholder="메모 (사이즈 · 옵션 등)" aria-label="메모">' +
          '<button type="button" class="prx" data-a="del" aria-label="빼기">🗑</button></div>';
      }).join("") + "</div>";
    });
    if ((q || cat) && !F.length && L.length) h += '<p class="prnone">찾는 메뉴가 없어요 — 사장님 · 정항아님께 여쭤 보세요</p>';
    if (ed) h += '<datalist id="prCatList">' + CATS0.concat(C).filter(function (c, i, a) { return a.indexOf(c) === i; }).map(function (c) { return '<option value="' + esc(c) + '">'; }).join("") + "</datalist>" +
      '<div class="pradd"><button type="button" class="skbtn" data-a="add">＋ 줄 추가</button></div>' +
      '<details class="prpaste"><summary>📋 한 번에 붙여넣기 (스마트플레이스 메뉴 글 그대로)</summary><p>메뉴 이름과 가격이 한 줄에 있거나 다음 줄에 있어도 됩니다 · 가격 없는 줄은 분류 이름으로 씁니다 · 이미 있는 메뉴는 가격이 다를 때만 바꿀지 묻습니다</p>' +
      '<textarea class="prpt" rows="8" placeholder="예)\n조각 케이크\n딸기 생크림 조각 9,200원\n초코 딸기 조각\n9,300원\n커피\n아메리카노 4,500"></textarea><button type="button" class="skbtn prim" data-a="paste">넣기</button></details>';
    if (o.at) h += '<p class="prfoot">마지막 수정 ' + esc(o.at) + (o.by ? " · " + esc(nim(o.by)) : "") + " · 네이버 스마트플레이스 가격이 바뀌면 여기도 같이 고쳐 주세요</p>";
    box.innerHTML = h;
  }
  // 붙여 넣은 글에서 「이름 … 가격」 찾기
  function parse(text) {
    var out = [], c = "기타", pend = "";
    String(text || "").split(/\r?\n/).map(function (s) { return s.replace(/\s+/g, " ").trim(); }).filter(Boolean).forEach(function (ln) {
      if (/^(대표|인기|추천|사진|메뉴판|더보기|펼쳐보기|접기)$/.test(ln)) return;
      var m = /^(.*?)[\s·:\-]*([\d]{1,3}(?:,\d{3})+|\d{3,7})\s*원?$/.exec(ln);
      if (m && m[1].trim()) { out.push({ c: c, n: m[1].trim(), p: m[2].replace(/,/g, "") }); pend = ""; return; }
      if (m && !m[1].trim() && pend) { out.push({ c: c, n: pend, p: m[2].replace(/,/g, "") }); pend = ""; return; }
      if (pend) { c = pend; }   // 가격 없이 두 줄 연달아 = 앞 줄은 분류
      pend = ln;
    });
    return out;
  }
  box.addEventListener("input", function (e) {
    var t = e.target;
    if (t.classList.contains("prq")) { q = t.value; clearTimeout(draw.t); draw.t = setTimeout(function () { var pos = t.selectionStart; t.blur(); draw(); var n = box.querySelector(".prq"); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (er) {} } }, 250); return; }
    if (t.classList.contains("prmoney")) { var v = t.value; if (/^[\d,]*$/.test(v)) { var f = v ? Number(v.replace(/,/g, "")).toLocaleString("ko-KR") : ""; if (f !== v) t.value = f; } }
  });
  box.addEventListener("change", function (e) {
    var t = e.target; if (!t.classList.contains("pri")) return;
    var id = t.closest(".prrow").dataset.id, f = t.dataset.f, v = f === "p" ? digits(t.value) : t.value.trim();
    save(function (o) { if (o.it[id]) { o.it[id][f] = v; o.it[id].ed = me() + " " + stamp(); } });
  });
  box.addEventListener("click", function (e) {
    var c = e.target.closest(".prcat"); if (c) { cat = c.dataset.c; draw(); return; }
    var b = e.target.closest("[data-a]"); if (!b) return; var a = b.dataset.a;
    if (a === "edit") { editing = !editing; draw(); return; }
    if (!can()) return;
    if (a === "add") { var id = "p" + Date.now().toString(36), L = rows(); save(function (o) { o.it[id] = { c: cat || "기타", n: "", p: "", m: "", o: L.length, ed: me() + " " + stamp() }; }); q = ""; draw(); var n = box.querySelector('.prrow[data-id="' + id + '"] .prname'); if (n) n.focus(); return; }
    if (a === "del") { var row = b.closest(".prrow"), nm = row.querySelector(".prname").value || "이 줄"; if (!confirm("「" + nm + "」을(를) 가격표에서 뺄까요?")) return; save(function (o) { if (o.it[row.dataset.id]) o.it[row.dataset.id].del = me() + " " + stamp(); }); draw(); return; }
    if (a === "paste") {
      var P = parse(box.querySelector(".prpt").value); if (!P.length) { alert("가격이 있는 줄을 못 찾았어요 — 「메뉴 이름 9,200원」처럼 한 줄에 쓰거나 이름 다음 줄에 가격을 써 주세요"); return; }
      var cur = rows(), byN = {}; cur.forEach(function (x) { byN[norm(x.n)] = x; });
      var add = P.filter(function (x) { return !byN[norm(x.n)]; }), chg = P.filter(function (x) { var y = byN[norm(x.n)]; return y && digits(y.p) !== x.p; });
      var msg = "새로 넣을 메뉴 " + add.length + "개" + (chg.length ? "\n가격이 다른 메뉴 " + chg.length + "개 → 새 가격으로 바꿉니다:\n" + chg.slice(0, 8).map(function (x) { return "· " + x.n + " " + money(byN[norm(x.n)].p) + " → " + money(x.p); }).join("\n") : "") + "\n\n넣을까요?";
      if (!add.length && !chg.length) { alert("이미 다 같은 가격으로 들어가 있어요"); return; }
      if (!confirm(msg)) return;
      var base = Date.now(), n0 = cur.length;
      save(function (o) {
        add.forEach(function (x, i) { o.it["p" + (base + i).toString(36)] = { c: x.c, n: x.n, p: x.p, m: "", o: n0 + i, ed: me() + " " + stamp() }; });
        chg.forEach(function (x) { var y = byN[norm(x.n)]; if (o.it[y.id]) { o.it[y.id].prev = o.it[y.id].p; o.it[y.id].p = x.p; o.it[y.id].ed = me() + " " + stamp(); } });
      });
      draw(); if (window.__CS_TOAST) window.__CS_TOAST("✅ " + add.length + "개 넣고 " + chg.length + "개 가격 바꿨어요");
    }
  });
  window.addEventListener("cs:remote", function () { setTimeout(draw, 200); });
  window.addEventListener("cs:me", function () { setTimeout(draw, 50); });
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest('.tab[data-p="tp19"]')) setTimeout(draw, 50); });
  window.__CS_PRICE_PARSE = parse;
  draw();
})();
