/* 11/7 · 「덮인 글」 상자 — 워크샵 · 벤치마킹에서 두 사람이 같은 칸을 동시에 고쳐 한 분 글이 덮이면
   sync.js가 그 글을 문서 안 _lost 목록에 남긴다. 여기서 보여 주고 칸에 다시 넣거나 확인 표시를 한다. (지우지 않음 — ok 표시만) */
(function () {
  "use strict";
  function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
  function nim(n) { return n ? (/님$/.test(n) ? n : n + "님") : "누군가"; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function hm(t) { var d = new Date(t); return (d.getMonth() + 1) + "/" + d.getDate() + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
  var WEEK = 7 * 864e5;
  function wsYear() { var y = document.getElementById("wsYear"); return (y && y.value) || String(new Date().getFullYear()); }
  function wsField(p) { return document.querySelector('#tp9 .wsin[data-k="' + (window.CSS && CSS.escape ? CSS.escape(p) : p) + '"]'); }
  function wsLabel(p) {
    var el = wsField(p); if (!el) return p;
    var l = el.getAttribute("aria-label") || "";
    if (!l) { var c = el.closest("label, tr, .wsf, .wsrow, .frow, li, .wsq"); if (c) { var t = (c.querySelector("b, th, .wsl, span") || c).textContent || ""; l = t.replace(/\s+/g, " ").trim(); } }
    if (!l) l = el.placeholder || p;
    return l.length > 40 ? l.slice(0, 40) + "…" : l;
  }
  function bnLabel(o, p) {
    var a = p.split("."), st = (o && o.st) || {}, nm = function (id) { return (st[id] && st[id].n) || "가게"; };
    var F = { memo: "메모", take: "⭐ 가져올 것", pr: "대표 제품 · 가격", n: "가게 이름", area: "지역", best: "⭐ BEST", worst: "👎 별로", apply: "✨ 적용", cs: "카페스이라면", sh: "산 곳", life: "유통기한", temp: "보관", tt: "표지 제목", sub: "한 줄" };
    var last = F[a[a.length - 1]] || a[a.length - 1];
    if (a[0] === "ev" || a[0] === "st") return nm(a[1]) + " · " + (a[0] === "ev" ? nim(a[2]) + " " : "") + last;
    if (a[0] === "om" || a[0] === "oe") { var om = (o && o.om) || {}; return "기념품 " + ((om[a[1]] && om[a[1]].n) || "") + " · " + last; }
    if (a[0] === "rv") return "디저트 리뷰 · " + nim(a[2]) + " " + last;
    if (a[0] === "rf") return "하루 정리";
    return last;
  }
  function open(list) { return (Array.isArray(list) ? list : []).map(function (r, i) { return { r: r, i: i }; }).filter(function (x) { return x.r && !x.r.ok && x.r.t && Date.now() - (x.r.at || 0) < WEEK; }); }
  function box(id, before, anchor) {
    var b = document.getElementById(id); if (b) return b;
    if (!anchor) return null;
    b = document.createElement("div"); b.id = id; b.className = "lostbox"; b.hidden = true;
    if (before) anchor.parentNode.insertBefore(b, anchor); else anchor.parentNode.insertBefore(b, anchor.nextSibling);
    return b;
  }
  function draw(b, key, label, canPut) {
    if (!b) return;
    var o = get(key), L = open(o && o._lost);
    if (!L.length) { b.hidden = true; b.innerHTML = ""; return; }
    b.hidden = false;
    b.innerHTML = '<div class="lbh">🛟 덮인 글 ' + L.length + '개 <span>두 분이 같은 칸을 동시에 고쳐서 한 분 글이 덮였어요 — 필요하면 칸에 다시 넣어 주세요</span></div>' +
      L.slice().reverse().map(function (x) {
        var r = x.r;
        return '<div class="lbi" data-key="' + esc(key) + '" data-i="' + x.i + '"><div class="lbm"><b>' + esc(label(o, r.p)) + '</b> · ' + esc(hm(r.at)) + (r.by ? ' · ' + esc(nim(r.by)) + ' 글로 바뀌면서' : '') + '</div>' +
          '<div class="lbt">' + esc(r.t) + '</div><div class="lbb">' +
          (canPut && canPut(r.p) ? '<button type="button" data-a="put">↺ 칸에 덧붙이기</button>' : '') +
          '<button type="button" data-a="copy">📋 복사</button><button type="button" data-a="ok">✕ 확인했어요</button></div></div>';
      }).join("");
  }
  function paint() {
    var wp = document.getElementById("wsPres");
    draw(box("lostWs", false, wp), "cafesui.ws." + wsYear(), function (o, p) { return wsLabel(p); }, function (p) { var el = wsField(p); return el && el.type !== "checkbox"; });
    var bb = document.getElementById("bnBox");
    var y = wsYear(); try { var by = document.querySelector("#tp17 [data-bnyear], #bnYear"); if (by && by.value) y = by.value; } catch (e) {}
    var b1 = box("lostBn", true, bb), b2 = box("lostBnL", true, bb);
    draw(b1, "cafesui.bench." + y, bnLabel);
    draw(b2, "cafesui.bench.local", bnLabel);
  }
  var tm = 0; function later() { clearTimeout(tm); tm = setTimeout(paint, 300); }
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest(".lostbox button[data-a]"); if (t) {
      var it = t.closest(".lbi"), key = it.dataset.key, i = +it.dataset.i, o = get(key) || {}, r = (o._lost || [])[i];
      if (!r) return later();
      if (t.dataset.a === "copy") {
        var done = function () { t.textContent = "✔ 복사됨"; };
        try { navigator.clipboard.writeText(r.t).then(done, function () { prompt("복사해 주세요", r.t); }); } catch (x) { prompt("복사해 주세요", r.t); }
        return;
      }
      if (t.dataset.a === "put") {
        var el = wsField(r.p); if (!el) return;
        var cur = el.value || "";
        if (cur.indexOf(r.t) >= 0) { alert("이미 칸에 들어 있어요."); }
        else { el.value = cur ? cur + (el.tagName === "TEXTAREA" ? "\n" : " / ") + r.t : r.t; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); }
        o = get(key) || o; r = (o._lost || [])[i] || r;
      }
      if (t.dataset.a === "ok" && !confirm("이 글은 다시 안 넣어도 되나요? (기록은 남고 상자에서만 빠져요)")) return;
      var o2 = get(key) || {}; if (Array.isArray(o2._lost) && o2._lost[i] && o2._lost[i].t === r.t) {
        o2._lost[i] = Object.assign({}, o2._lost[i], { ok: me() || "확인", okAt: Date.now() });
        try { localStorage.setItem(key, JSON.stringify(o2)); } catch (x) {}
      }
      later(); return;
    }
    if (e.target.closest && e.target.closest('.tab[data-p="tp9"], .tab[data-p="tp17"], #bnMode, #wsYear')) later();
  });
  document.addEventListener("change", function (e) { if (e.target && e.target.id === "wsYear") later(); });
  window.addEventListener("cs:remote", function (e) {
    var ks = (e.detail && (e.detail.keys || [e.detail.key])) || [];
    if (!ks.length || ks.some(function (k) { return /^cafesui\.(ws|bench)\./.test(k); })) later();
  });
  window.addEventListener("storage", function (e) { if (e.key && /^cafesui\.(ws|bench)\./.test(e.key)) later(); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paint); else paint();
  setInterval(paint, 30000);
  window.__CS_LOST = paint;
})();
