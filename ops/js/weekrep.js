// 매니저 주간 보고 — 주마다 한 장 (월~토). 토요일 근무 마치고 쓴다. 매니저 · 사장님만 본다. cafesui.weekrep.<그 주 월요일> = { f:{sum,good,...}, by:{...}, savedAt, who }
(function () {
  var box = document.getElementById("wrBox"); if (!box) return;
  var PRE = "cafesui.weekrep.";
  var ins = Array.prototype.slice.call(box.querySelectorAll(".wrin"));
  var labelEl = document.getElementById("wrLabel"), autoEl = document.getElementById("wrAuto"), stateEl = document.getElementById("wrState"), footEl = document.getElementById("wrFoot");
  var CL = { "정항아": "p1", "박혜빈": "p2", "이해선": "p3", "사장님": "p4" };
  var WD = ["일", "월", "화", "수", "목", "금", "토"];
  function pad(n) { return String(n).padStart(2, "0"); }
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function monOf(d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
  function add(s, n) { var p = s.split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]); d.setDate(d.getDate() + n); return ymd(d); }
  function md(s) { var p = s.split("-"); return (+p[1]) + "/" + (+p[2]); }
  function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
  function nim(n) { return !n ? "" : n === "사장님" ? n : n + "님"; }
  function load(k) { try { return JSON.parse(localStorage.getItem(PRE + k) || "{}") || {}; } catch (e) { return {}; } }
  function J(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  var cur = ymd(monOf(new Date()));
  function paint(el, n) { ["wp1", "wp2", "wp3", "wp4"].forEach(function (c) { el.classList.remove(c); }); if (n && CL[n]) el.classList.add("w" + CL[n]); }
  function grow(el) { el.style.height = "auto"; el.style.height = Math.max(44, el.scrollHeight + 2) + "px"; }
  // 일지에서 이번 주 오늘 매출 · 배달 건수를 모아 참고로 보여준다
  function autoSum() {
    var tot = 0, days = 0, rec = [];
    for (var i = 0; i < 6; i++) {
      var d = add(cur, i), lg = J("cafesui.log." + d); if (!lg || !lg.f) continue;
      var v = String(lg.f.lf183 || ""), n = parseInt(v.replace(/[^0-9]/g, ""), 10);
      if (n > 10000) { tot += n; days += 1; rec.push(md(d) + " " + Math.round(n / 10000) + "만"); }
    }
    return days ? "일지 오늘 매출 합계 " + tot.toLocaleString("ko-KR") + "원 (" + days + "일 기록 · " + rec.join(" · ") + ")" : "이번 주 일지에 적힌 매출이 아직 없습니다";
  }
  function render() {
    var o = load(cur), f = o.f || {}, by = o.by || {};
    labelEl.textContent = md(cur) + " (월) ~ " + md(add(cur, 5)) + " (토)";
    ins.forEach(function (el) { if (document.activeElement === el) return; el.value = f[el.dataset.f] || ""; paint(el, by[el.dataset.f]); grow(el); });
    autoEl.textContent = autoSum();
    var n = ins.filter(function (el) { return el.value.trim(); }).length;
    stateEl.textContent = n ? "작성됨 · " + n + "/" + ins.length + (o.who ? " · " + nim(o.who) : "") : "이번 주 아직 안 씀";
    stateEl.className = n ? "done" : "todo";
    footEl.textContent = o.savedAt ? "마지막 저장 " + o.savedAt + (o.who ? " · " + nim(o.who) : "") + " · 적는 즉시 저장되고 모든 기기에 같이 보입니다" : "적는 즉시 저장되고 모든 기기에 같이 보입니다";
    var sat = new Date().getDay() === 6;
    box.classList.toggle("satday", sat);
  }
  function save() {
    var o = load(cur); o.f = o.f || {}; o.by = o.by || {};
    var w = me();
    ins.forEach(function (el) {
      var k = el.dataset.f, v = el.value;
      if (v.trim()) { if (o.f[k] !== v) { o.f[k] = v; o.by[k] = w || o.by[k] || ""; } }
      else { delete o.f[k]; delete o.by[k]; }
    });
    var d = new Date(); o.savedAt = (d.getMonth() + 1) + "/" + d.getDate() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); o.who = w || o.who;
    try { localStorage.setItem(PRE + cur, JSON.stringify(o)); } catch (e) {}
  }
  var t = null;
  ins.forEach(function (el) {
    el.addEventListener("input", function () { grow(el); paint(el, me()); clearTimeout(t); t = setTimeout(function () { save(); render(); }, 300); });
    el.addEventListener("blur", function () { clearTimeout(t); save(); render(); });
  });
  (window.__CS_SAVERS = window.__CS_SAVERS || []).push(function () { if (ins.some(function (el) { return document.activeElement === el; })) save(); });
  document.getElementById("wrPrev").addEventListener("click", function () { cur = add(cur, -7); render(); });
  document.getElementById("wrNext").addEventListener("click", function () { cur = add(cur, 7); render(); });
  document.getElementById("wrThis").addEventListener("click", function () { cur = ymd(monOf(new Date())); render(); });
  // 보고서를 그림(PNG)으로 만들어 텔레그램으로 보낸다 — 휴대폰은 공유 창(텔레그램 선택), 컴퓨터는 그림 복사(붙여넣기) · 안 되면 파일 저장
  document.getElementById("wrCopy").addEventListener("click", function () {
    save(); var o = load(cur), f = o.f || {}, btn = this, NL = String.fromCharCode(10);
    var W = 1080, PAD = 56, LH = 44, FONT = "'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif";
    var cv = document.createElement("canvas"), cx = cv.getContext("2d");
    function wrap(s, font, max) {
      cx.font = font; var out = [], c = "";
      s.split(" ").forEach(function (w) {
        var t2 = c ? c + " " + w : w;
        if (cx.measureText(t2).width <= max) { c = t2; return; }
        if (c) out.push(c); c = "";
        for (var i = 0; i < w.length; i++) { var t3 = c + w[i]; if (cx.measureText(t3).width > max && c) { out.push(c); c = w[i]; } else c = t3; }
      });
      if (c) out.push(c); return out.length ? out : [""];
    }
    var rows = [], F_H = "900 40px " + FONT, F_S = "800 30px " + FONT, F_B = "500 28px " + FONT, F_A = "600 24px " + FONT;
    rows.push({ s: "📋 매니저 주간 보고", font: F_H, c: "#8A4A00", line: true });
    rows.push({ gap: 16 });
    wrap(labelEl.textContent + (o.who ? " · " + nim(o.who) : ""), F_S, W - PAD * 2).forEach(function (x) { rows.push({ s: x, font: F_S, c: "#2A2522" }); });
    wrap(autoEl.textContent, F_A, W - PAD * 2).forEach(function (x) { rows.push({ s: x, font: F_A, c: "#8C7B6B" }); });
    var n = 0;
    box.querySelectorAll(".wrrow").forEach(function (r) {
      var el = r.querySelector(".wrin"), v = (f[el.dataset.f] || "").trim(); if (!v) return; n++;
      rows.push({ gap: 22 });
      rows.push({ s: "■ " + r.querySelector("span").textContent, font: F_S, c: "#B4661B" });
      v.split(NL).forEach(function (ln) { wrap(ln.trim(), F_B, W - PAD * 2 - 24).forEach(function (x) { rows.push({ s: x, font: F_B, c: "#2A2522", ind: 24 }); }); });
    });
    if (!n) { alert("아직 쓴 내용이 없습니다"); return; }
    var H = PAD * 2 + rows.reduce(function (a, r) { return a + (r.gap || LH); }, 0) + 50;
    var S = 2; cv.width = W * S; cv.height = H * S; cx.scale(S, S);
    cx.fillStyle = "#FFFCF6"; cx.fillRect(0, 0, W, H);
    cx.strokeStyle = "#B4661B"; cx.lineWidth = 6; cx.strokeRect(3, 3, W - 6, H - 6);
    var y = PAD + 30;
    rows.forEach(function (r) {
      if (r.gap) { y += r.gap; return; }
      cx.font = r.font; cx.fillStyle = r.c; cx.fillText(r.s, PAD + (r.ind || 0), y);
      if (r.line) { cx.fillStyle = "#B4661B"; cx.fillRect(PAD, y + 14, W - PAD * 2, 3); }
      y += LH;
    });
    cx.font = "600 22px " + FONT; cx.fillStyle = "#8C7B6B"; cx.textAlign = "right";
    cx.fillText("카페스이 · 매니저 주간 보고 " + new Date().toLocaleString("ko-KR", { hour12: false }), W - PAD, H - 26);
    var name = "주간보고_" + cur + ".png", LBL = btn.textContent;
    var msg = function (t) { btn.textContent = t; setTimeout(function () { btn.textContent = LBL; }, 2500); };
    cv.toBlob(function (blob) {
      if (!blob) { msg("그림을 못 만들었습니다"); return; }
      var file = null; try { file = new File([blob], name, { type: "image/png" }); } catch (e) {}
      var dl = function () { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 2000); msg("그림 파일로 저장됨 · 텔레그램에 올리세요"); };
      var touch = window.matchMedia && window.matchMedia("(pointer:coarse)").matches;
      if (touch && file && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: "매니저 주간 보고" }).then(function () { msg("보냈습니다"); }, function () {}); return; }
      if (navigator.clipboard && window.ClipboardItem) {
        var fin = false, to = setTimeout(function () { if (!fin) { fin = true; dl(); } }, 3000);   // 복사가 막히면 파일로
        navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]).then(function () { if (fin) return; fin = true; clearTimeout(to); msg("그림 복사됨 · 텔레그램에서 붙여넣기 (Ctrl+V)"); }, function () { if (fin) return; fin = true; clearTimeout(to); dl(); });
      } else dl();
    }, "image/png");
  });
  window.addEventListener("cs:remote", function (e) { var ks = (e.detail && e.detail.keys) || []; if (ks.some(function (k) { return k.indexOf(PRE) === 0 || k.indexOf("cafesui.log.") === 0; })) render(); });
  box.addEventListener("toggle", function () { if (box.open) render(); });
  // 매니저 · 사장님만 보인다. 토요일에는 펼쳐 두고, 다른 날은 접어 둔다 (이번 주 안 썼으면 빨간 글씨로 표시)
  var SEE = ["정항아", "사장님"], opened = false;
  function gate() {
    var ok = SEE.indexOf(me()) >= 0;
    box.hidden = !ok;
    if (!ok) { box.open = false; return; }
    if (!opened && new Date().getDay() === 6) { opened = true; box.open = true; }
    render();
  }
  window.addEventListener("cs:me", gate);
  window.addEventListener("storage", function (e) { if (e.key === "cafesui.me") gate(); });
  gate();
})();
