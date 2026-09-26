(function () {
  // 체크는 쓰임새마다 따로 담는다. 날이 바뀌면 오늘 할 일이 저절로 비고,
  // 주가 바뀌면 요일 청소가, 달이 바뀌면 월 청소가 새로 시작한다.
  function now() { return new Date(); }
  function dayKey() {
    var d = now();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
           "-" + String(d.getDate()).padStart(2, "0");
  }
  function monKey() {
    var d = now();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  }
  function weekKey() {
    var d = now();
    var mon = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));   // 그 주 월요일
    return mon.getFullYear() + "-" + String(mon.getMonth() + 1).padStart(2, "0") +
           "-" + String(mon.getDate()).padStart(2, "0");
  }
  var KEYS = {
    t: "cafesui.todo." + dayKey(),     // 오늘 할 일 — 하루
    p: "cafesui.todo." + dayKey(),
    w: "cafesui.week." + weekKey(),    // 요일 고정 청소 — 한 주
    z: "cafesui.clean." + monKey(),    // 월 1회 청소 — 한 달
    m: "cafesui.maint"                 // 주기 정비 — 계속 쌓는다
  };
  function bucket(k) { return KEYS[String(k).charAt(0)] || KEYS.m; }

  function read(key) {
    try {
      var raw = localStorage.getItem(key);
      var p = raw ? JSON.parse(raw) : null;
      return (p && typeof p === "object") ? p : {};
    } catch (e) { return {}; }
  }
  function write(key, o) {
    try {
      if (Object.keys(o).length) localStorage.setItem(key, JSON.stringify(o));
      else localStorage.removeItem(key);
    } catch (e) {}
  }

  // 담당자와 정비 날짜는 달이 바뀌어도 그대로 둔다
  var OWNER_KEY = "cafesui.cleanowner";
  var state = { owner: read(OWNER_KEY), done: {}, dates: read("cafesui.maintdate") };
  ["t", "w", "z", "m"].forEach(function (pre) {
    var o = read(KEYS[pre]);
    Object.keys(o).forEach(function (k) { state.done[k] = o[k]; });
  });
  // 지난 날짜 · 지난 주 체크 기록은 지우지 않고 그대로 둔다 (누가 뭘 했는지 남기려고)

  function save() {
    var by = {};
    Object.keys(state.done).forEach(function (k) {
      var b = bucket(k);
      (by[b] || (by[b] = {}))[k] = state.done[k];
    });
    ["t", "w", "z", "m"].forEach(function (pre) {
      write(KEYS[pre], by[KEYS[pre]] || {});
    });
    write(OWNER_KEY, state.owner);
    write("cafesui.maintdate", state.dates);
  }

  // ── 업무 편집 — 직원이 할 일의 문구 · 순서 · 색 · 위치를 바꾸거나 추가 · 삭제한다.
  //    바뀐 내용은 cafesui.todo.custom 에 쌓이고(서버 동기화), 원래 HTML은 그대로 둔 채 화면에서 덮어쓴다.
  var TC_KEY = "cafesui.todo.custom";
  var COLORS = ["", "imp", "big", "blue", "green", "yellow", "orange", "purple"];
  var COLOR_LABEL = { "": "기본", imp: "연한 강조", big: "빨강", blue: "파랑", green: "초록", yellow: "노랑", orange: "주황", purple: "보라" };
  function tcRead() { var o = read(TC_KEY); o.items = o.items || {}; o.order = o.order || {}; o.added = o.added || {}; return o; }
  function tcWrite(o) { o.t = new Date().toISOString(); write(TC_KEY, o); }
  function panelOf(el) { var p = el.closest(".spanel"); return p ? p.id : ""; }
  function blockOf(el) { return el.closest(".tblock, .onlbox"); }
  function blockId(blk) {
    if (!blk) return "";
    var h = blk.querySelector(".tbhead, .onlh b");
    var txt = h ? (h.childNodes[0] ? h.childNodes[0].textContent : h.textContent) : "";
    return panelOf(blk) + "|" + txt.trim();
  }
  function allBlocks() { return Array.prototype.slice.call(document.querySelectorAll("#tp2 .tblock, #tp2 .onlbox")).filter(function (b) { return b.querySelector(".titems"); }); }
  function blockById(id) { return allBlocks().filter(function (b) { return blockId(b) === id; })[0] || null; }
  function colorOf(el) { for (var i = COLORS.length - 1; i > 0; i--) if (el.classList.contains(COLORS[i])) return COLORS[i]; return ""; }
  function setColor(el, c) {
    el.className = "titem" + (c ? " imp" + (c !== "imp" ? " " + c : "") : "");
  }
  function makeItem(k, d) {
    var lab = document.createElement("label");
    lab.innerHTML = '<button type="button" class="box" aria-pressed="false"></button><span class="tbody"><span class="ttop"><span class="ttitle"></span></span></span>';
    lab.querySelector(".box").dataset.k = k;
    setColor(lab, d.color || "");
    setText(lab, d.title || "", d.note || "");
    return lab;
  }
  function setText(lab, title, note) {
    var tt = lab.querySelector(".ttitle"); tt.textContent = title;
    lab.querySelector(".box").setAttribute("aria-label", title);
    var tn = lab.querySelector(".tnote");
    if (note) { if (!tn) { tn = document.createElement("span"); tn.className = "tnote"; lab.querySelector(".tbody").appendChild(tn); } tn.textContent = note; }
    else if (tn) tn.remove();
  }
  function recount(blk) {
    var c = blk.querySelector(".tbcnt"); if (c) c.textContent = blk.querySelectorAll(".titem").length;
  }
  function itemEl(k) { var b = document.querySelector('#tp2 .box[data-k="' + k + '"]'); return b ? b.closest(".titem") : null; }
  // 저장된 편집 내용을 화면에 적용
  function tcApply() {
    var o = tcRead();
    Object.keys(o.added).forEach(function (k) {
      var d = o.added[k]; if (d.del || itemEl(k)) return;
      var blk = blockById(d.block); if (!blk) return;
      blk.querySelector(".titems").appendChild(makeItem(k, d));
    });
    Object.keys(o.items).forEach(function (k) {
      var d = o.items[k], el = itemEl(k); if (!el) return;
      if (d.del) { el.remove(); return; }
      if (d.title != null || d.note != null) {
        var tt = el.querySelector(".ttitle"), tn = el.querySelector(".tnote");
        setText(el, d.title != null ? d.title : tt.textContent, d.note != null ? d.note : (tn ? tn.textContent : ""));
      }
      if (d.color != null) setColor(el, d.color);
      if (d.block) { var blk = blockById(d.block); if (blk && blockOf(el) !== blk) blk.querySelector(".titems").appendChild(el); }
    });
    Object.keys(o.order).forEach(function (bid) {
      var blk = blockById(bid); if (!blk) return;
      var wrap = blk.querySelector(".titems");
      o.order[bid].forEach(function (k) { var el = itemEl(k); if (el && blockOf(el) === blk) wrap.appendChild(el); });
    });
    allBlocks().forEach(recount);
  }
  tcApply();
  window.__CS_TODO_CUSTOM = tcRead;

  // 편집 모드
  (function () {
    var tog = document.getElementById("tedToggle"); if (!tog) return;
    var on = false;
    function who() { var m = null; try { m = localStorage.getItem("cafesui.me"); } catch (e) {} return m || ""; }
    function saveOrder(blk) {
      var o = tcRead(); var bid = blockId(blk);
      o.order[bid] = Array.prototype.map.call(blk.querySelectorAll(".titem .box"), function (b) { return b.dataset.k; });
      tcWrite(o); recount(blk);
    }
    function upd(k, patch) {
      var o = tcRead(); var tgt = o.added[k] ? o.added : o.items; var d = tgt[k] || (tgt[k] = {});
      Object.keys(patch).forEach(function (p) { d[p] = patch[p]; }); d.by = who(); d.t = new Date().toISOString();
      tcWrite(o);
    }
    function bar(el) {
      if (el.querySelector(".tedbar")) return;
      var b = document.createElement("span"); b.className = "tedbar";
      b.innerHTML = '<button type="button" data-a="up" title="위로">▲</button><button type="button" data-a="down" title="아래로">▼</button>' +
        '<button type="button" data-a="move">⇄ 다른 묶음으로</button><button type="button" data-a="edit">✎ 글 고치기</button>' +
        '<button type="button" data-a="color">🎨 색</button><button type="button" data-a="del">✕ 삭제</button>';
      el.appendChild(b);
      b.addEventListener("click", function (e) {
        var btn = e.target.closest("button"); if (!btn) return;
        e.preventDefault(); e.stopPropagation();
        var a = btn.dataset.a, k = el.querySelector(".box").dataset.k, blk = blockOf(el), wrap = blk.querySelector(".titems");
        if (a === "up" && el.previousElementSibling && el.previousElementSibling.classList.contains("titem")) { wrap.insertBefore(el, el.previousElementSibling); saveOrder(blk); }
        else if (a === "down" && el.nextElementSibling && el.nextElementSibling.classList.contains("titem")) { wrap.insertBefore(el.nextElementSibling, el); saveOrder(blk); }
        else if (a === "color") { var c = COLORS[(COLORS.indexOf(colorOf(el)) + 1) % COLORS.length]; setColor(el, c); upd(k, { color: c }); btn.textContent = "🎨 " + COLOR_LABEL[c]; }
        else if (a === "del") {
          if (!confirm('"' + el.querySelector(".ttitle").textContent + '" 을(를) 목록에서 지울까요?')) return;
          upd(k, { del: true }); var old = blk; el.remove(); saveOrder(old);
        }
        else if (a === "edit") editForm(el, k);
        else if (a === "move") moveForm(el, k);
      });
    }
    function editForm(el, k) {
      if (el.querySelector(".tedform")) return;
      var tt = el.querySelector(".ttitle").textContent, tn = el.querySelector(".tnote"); var note = tn ? tn.textContent : "";
      var f = document.createElement("span"); f.className = "tedform";
      f.innerHTML = '<label>제목<input type="text"></label><label>설명 (없으면 비워두기)<textarea rows="2"></textarea></label><span class="tedrow"><button type="button" class="ok">저장</button><button type="button" class="no">취소</button></span>';
      f.querySelector("input").value = tt; f.querySelector("textarea").value = note;
      el.appendChild(f); f.querySelector("input").focus();
      f.addEventListener("click", function (e) { e.stopPropagation(); if (e.target.tagName === "BUTTON") e.preventDefault(); });
      f.querySelector(".no").addEventListener("click", function () { f.remove(); });
      f.querySelector(".ok").addEventListener("click", function () {
        var t2 = f.querySelector("input").value.trim(), n2 = f.querySelector("textarea").value.trim();
        if (!t2) { alert("제목을 적어주세요"); return; }
        setText(el, t2, n2); upd(k, { title: t2, note: n2 }); f.remove();
      });
    }
    function moveForm(el, k) {
      if (el.querySelector(".tedform")) return;
      var f = document.createElement("span"); f.className = "tedform";
      var cur = blockId(blockOf(el));
      var opts = allBlocks().map(function (b) { var id = blockId(b); return '<option value="' + id.replace(/"/g, "&quot;") + '"' + (id === cur ? " selected" : "") + ">" + id.replace(/^td0\|/, "[오픈] ").replace(/^td1\|/, "[미들] ").replace(/^td2\|/, "[마감] ") + "</option>"; }).join("");
      f.innerHTML = '<label>옮길 묶음<select>' + opts + '</select></label><span class="tedrow"><button type="button" class="ok">옮기기</button><button type="button" class="no">취소</button></span>';
      el.appendChild(f);
      f.addEventListener("click", function (e) { e.stopPropagation(); if (e.target.tagName === "BUTTON") e.preventDefault(); });
      f.querySelector(".no").addEventListener("click", function () { f.remove(); });
      f.querySelector(".ok").addEventListener("click", function () {
        var id = f.querySelector("select").value, blk = blockById(id), old = blockOf(el); f.remove();
        if (!blk || blk === old) return;
        blk.querySelector(".titems").appendChild(el); upd(k, { block: id }); saveOrder(old); saveOrder(blk);
        var s = blk.closest(".spanel"); if (s && s.hidden) alert("「" + id.split("|")[1] + "」 묶음 맨 아래로 옮겼습니다");
      });
    }
    function addBtn(blk) {
      if (blk.querySelector(".tedadd")) return;
      var b = document.createElement("button"); b.type = "button"; b.className = "tedadd"; b.textContent = "＋ 업무 추가";
      blk.appendChild(b);
      b.addEventListener("click", function () {
        var t2 = prompt("새 업무 제목"); if (!t2 || !t2.trim()) return;
        var n2 = prompt("설명 (없으면 그냥 확인)") || "";
        var k = "tn" + Date.now().toString(36);
        var o = tcRead(); o.added[k] = { title: t2.trim(), note: n2.trim(), color: "", block: blockId(blk), by: who(), t: new Date().toISOString() }; tcWrite(o);
        var el = makeItem(k, o.added[k]); blk.querySelector(".titems").appendChild(el);
        if (window.__CS_BIND_BOX) window.__CS_BIND_BOX(el.querySelector(".box"));
        bar(el); saveOrder(blk);
      });
    }
    function enter() {
      on = true; document.body.classList.add("tedit"); tog.setAttribute("aria-pressed", "true"); tog.textContent = "✔ 편집 끝내기";
      allBlocks().forEach(function (blk) { addBtn(blk); Array.prototype.forEach.call(blk.querySelectorAll(".titem"), bar); });
    }
    function leave() {
      on = false; document.body.classList.remove("tedit"); tog.setAttribute("aria-pressed", "false"); tog.textContent = "✏ 업무 편집";
      document.querySelectorAll(".tedform").forEach(function (f) { f.remove(); });
    }
    tog.addEventListener("click", function () {
      if (on) { leave(); return; }
      if (!who()) { alert("먼저 위에서 이름을 고르세요 (누가 고쳤는지 남깁니다)"); return; }
      enter();
    });
    // 편집 중에는 글자를 눌러도 체크되지 않게
    document.addEventListener("click", function (e) {
      if (!on) return;
      var it = e.target.closest("#tp2 .titem"); if (!it) return;
      if (e.target.closest(".tedbar, .tedform")) return;
      e.preventDefault();
    }, true);
  })();

  var chips = document.querySelectorAll(".chip");
  var boxes = document.querySelectorAll(".box");

  // 담당은 여러 명 고를 수 있다 — "정항아,박혜빈" 처럼 쉼표로 저장
  function owners(k) { var v = state.owner[k]; return v ? String(v).split(",").filter(Boolean) : []; }
  chips.forEach(function (c) {
    if (owners(c.dataset.k).indexOf(c.dataset.v) >= 0) c.setAttribute("aria-pressed", "true");
    c.addEventListener("click", function () {
      var k = c.dataset.k, v = c.dataset.v, list = owners(k);
      var i = list.indexOf(v);
      if (i >= 0) list.splice(i, 1); else list.push(v);
      if (list.length) state.owner[k] = list.join(","); else delete state.owner[k];
      document.querySelectorAll('.chip[data-k="' + k + '"]').forEach(function (s) {
        s.setAttribute("aria-pressed", String(list.indexOf(s.dataset.v) >= 0));
      });
      save();
    });
  });

  // 누가 체크했는지 — 이름을 고르면 그 사람 색으로 칠해진다
  var WHOC = { "정항아": "p1", "박혜빈": "p2", "이해선": "p3", "사장님": "p4" };
  var whoBtns = Array.prototype.slice.call(document.querySelectorAll(".wbtn"));
  var whoMsg = document.getElementById("whoMsg");
  var meKey = "cafesui.me";
  var me = null;
  try { me = localStorage.getItem(meKey); } catch (e) {}

  function paint(b) {
    var v = state.done[b.dataset.k];
    ["p1", "p2", "p3", "p4"].forEach(function (c) { b.classList.remove(c); });
    if (!v) { b.setAttribute("aria-pressed", "false"); return; }
    b.setAttribute("aria-pressed", "true");
    var name = (typeof v === "string") ? v : "";
    // 이름은 띄우지 않는다 — 색깔로만 누가 했는지 구분한다
    if (name && WHOC[name]) {
      b.classList.add(WHOC[name]);
      b.title = name;
    } else { b.removeAttribute("title"); }
  }
  function setMe(n) {
    me = n;
    try { n ? localStorage.setItem(meKey, n) : localStorage.removeItem(meKey); }
    catch (e) {}
    whoBtns.forEach(function (w) {
      w.setAttribute("aria-pressed", String(w.dataset.n === me));
    });
    if (whoMsg) {
      whoMsg.textContent = me
        ? me + (me === "사장님" ? "으로 체크됩니다" : "님으로 체크됩니다")
        : "이름을 고르면 체크가 그 사람 색으로 표시됩니다";
    }
  }
  whoBtns.forEach(function (w) {
    w.addEventListener("click", function () {
      setMe(me === w.dataset.n ? null : w.dataset.n);
    });
  });
  setMe(me);

  function bindBox(b) {
    paint(b);
    b.addEventListener("click", function () {
      var k = b.dataset.k;
      if (state.done[k]) delete state.done[k];
      else state.done[k] = me || 1;
      paint(b);
      save();
    });
  }
  boxes.forEach(bindBox);
  window.__CS_BIND_BOX = bindBox;

  // 오늘 날짜 표시 + 오늘 할 일 결과 보고서 (마감 맨 아래) — 화면에 있는 체크 상태만 읽어서 그리므로 서버 통신은 없다
  (function () {
    var WDK = ["일", "월", "화", "수", "목", "금", "토"];
    var dEl = document.getElementById("tdDate");
    if (dEl) {
      var d = now(), key = dayKey(), hol = (window.__CS_HOL || {})[key];
      dEl.innerHTML = "<b>" + (d.getMonth() + 1) + "월 " + d.getDate() + "일 (" + WDK[d.getDay()] + ")</b>" + (hol ? '<i class="lghol">🇰🇷 ' + hol + "</i>" : "") + "<span>오늘 체크는 오늘만 · 날이 바뀌면 새로 시작합니다</span>";
    }
    var body = document.getElementById("tdRepBody"); if (!body) return;
    function esc(v) { return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    function nim(n) { return n === "사장님" ? n : n + "님"; }
    var SH = [["td0", "오픈"], ["td1", "미들"], ["td2", "마감"]];
    var lastText = "";
    function draw() {
      var html = "", text = ["[오늘 할 일 결과] " + dayKey() + " (" + WDK[now().getDay()] + ")"];
      SH.forEach(function (s) {
        var panel = document.getElementById(s[0]); if (!panel) return;
        // 묶음(시간대)별로 나눠서 한 줄에 하나씩
        var groups = [], doneAll = [], tot = 0, doneN = 0;
        Array.prototype.forEach.call(panel.querySelectorAll(".tblock, .onlbox"), function (blk) {
          var head = blk.querySelector(".tbhead, .onlh b"); var gname = head ? (head.childNodes[0] ? head.childNodes[0].textContent : head.textContent).trim() : "";
          var un = [];
          Array.prototype.forEach.call(blk.querySelectorAll(".titem .box"), function (b) {
            var lab = b.closest(".titem"); if (!lab || lab.hidden) return;
            var title = (lab.querySelector(".ttitle") || {}).textContent || "";
            var v = state.done[b.dataset.k]; tot += 1;
            if (v) { doneN += 1; doneAll.push({ t: title, w: typeof v === "string" ? v : "" }); } else un.push(title);
          });
          if (un.length) groups.push({ g: gname, un: un });
        });
        if (!tot) return;
        var pct = Math.round(doneN / tot * 100), lv = pct === 100 ? "ok" : pct >= 70 ? "mid" : "low";
        html += '<div class="tdrs ' + lv + '"><div class="tdrsh"><b>' + s[1] + '</b><span class="pct">' + doneN + " / " + tot + '</span><i class="bar"><u style="width:' + pct + '%"></u></i><em>' + pct + "%</em></div>";
        if (!groups.length) html += '<div class="tdall">✔ 전부 완료</div>';
        else {
          html += '<div class="tdun"><div class="tdunh">✗ 안 한 것 ' + (tot - doneN) + "</div>";
          groups.forEach(function (g) { html += '<div class="tdg">' + esc(g.g) + "</div>" + g.un.map(function (x) { return '<div class="tdl no">' + esc(x) + "</div>"; }).join(""); });
          html += "</div>";
        }
        if (doneAll.length) html += '<details class="tddn"><summary>✔ 한 것 ' + doneAll.length + "개 보기</summary>" + doneAll.map(function (x) { return '<div class="tdl yes ' + (WHOC[x.w] ? WHOC[x.w] : "") + '">' + esc(x.t) + (x.w ? " <em>" + esc(nim(x.w)) + "</em>" : "") + "</div>"; }).join("") + "</details>";
        html += "</div>";
        text.push("", "■ " + s[1] + " " + doneN + "/" + tot + " (" + pct + "%)");
        groups.forEach(function (g) { text.push("[" + g.g + "] 안 한 것: " + g.un.join(" / ")); });
        if (doneAll.length) text.push("✔ 한 것: " + doneAll.map(function (x) { return x.t + (x.w ? "(" + x.w + ")" : ""); }).join(" / "));
      });
      body.innerHTML = html || '<div class="tdl">오늘 체크한 항목이 아직 없습니다</div>';
      lastText = text.join(String.fromCharCode(10));
    }
    window.__CS_TODO_REPORT = draw;
    draw();
    document.addEventListener("click", function (e) { if (e.target.closest("#tp2 .box, #tp2 .tedbar, #tp2 .tedadd, .stab.prog")) setTimeout(draw, 50); }, true);
    window.addEventListener("cs:remote", function () { setTimeout(draw, 300); });
    var cp = document.getElementById("tdRepCopy");
    if (cp) cp.addEventListener("click", function () {
      draw();
      var ok = function () { cp.textContent = "복사됐습니다"; setTimeout(function () { cp.textContent = "복사하기"; }, 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(lastText).then(ok, function () { alert(lastText); });
      else alert(lastText);
    });
  })();

  // 이달 청소 배정표 — 담당 지정과 완료 확인은 매니저 · 사장님만
  (function () {
    var ALLOW = ["정항아", "사장님"];
    var who = null;
    try { who = localStorage.getItem("cafesui.me"); } catch (e) {}
    if (who && ALLOW.indexOf(who) >= 0) return;
    var wrap = document.querySelector(".ztable-wrap");
    if (!wrap) return;
    wrap.querySelectorAll(".chip").forEach(function (c) {
      c.disabled = true;
      c.classList.add("locked");
      c.title = "매니저와 사장님만 배정할 수 있습니다";
    });
    wrap.querySelectorAll('.box[data-k^="z"]').forEach(function (b) {
      b.disabled = true;
      b.classList.add("locked");
      b.title = "매니저와 사장님만 확인할 수 있습니다";
    });
    var foot = wrap.querySelector(".zfoot .lock");
    if (foot) {
      foot.textContent = "담당 배정과 완료 확인은 매니저 · 사장님만 누릅니다 · " +
                         "청소를 마치면 매니저에게 말씀해 주세요";
    }
  })();

  // 연간 표 / 과일 달력 — 누르면 그 아래로 상세가 펼쳐진다
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".ybtn, .fbtn"); if (!btn) return;
    var row = document.getElementById(btn.getAttribute("aria-controls"));
    if (!row) return;
    var open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    row.hidden = open;
  });

  // 글자 색으로 누가 썼는지 — 정항아 주황 · 박혜빈 파랑 · 이해선 보라 · 사장님 초록
  var WCLR = { "정항아": "p1", "박혜빈": "p2", "이해선": "p3", "사장님": "p4" };
  function meNow() {
    try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; }
  }
  function paintBy(el, name) {
    ["wp1", "wp2", "wp3", "wp4"].forEach(function (c) { el.classList.remove(c); });
    if (name && WCLR[name]) {
      el.classList.add("w" + WCLR[name]);
      el.title = name + (name === "사장님" ? "이 쓴 내용" : "님이 쓴 내용");
    } else { el.removeAttribute("title"); }
  }
  // 칸에 글을 쓰면 그 사람 색으로 물든다
  function bindBy(els, getBy, setBy) {
    els.forEach(function (el) { paintBy(el, getBy()[el.dataset.k]); });
    els.forEach(function (el) {
      el.addEventListener("input", function () {
        var by = getBy();
        var v = (el.type === "checkbox") ? el.checked : (el.value || "").trim();
        if (v) by[el.dataset.k] = meNow() || by[el.dataset.k] || "";
        else delete by[el.dataset.k];
        setBy(by);
        paintBy(el, by[el.dataset.k]);
      });
    });
  }

  // 묶음별 백업 — 일지 · 월말회의 · 평가 · 워크샵 · 근무표를 따로 복사
  (function () {
    document.querySelectorAll(".bkmini").forEach(function (b) {
      b.addEventListener("click", function () {
        var pres = b.dataset.pre.split(",").map(function (x) {
          return "cafesui." + x;
        });
        var o = {}, n = 0;
        try {
          for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            for (var j = 0; j < pres.length; j++) {
              if (k.indexOf(pres[j]) === 0) { o[k] = localStorage.getItem(k); n += 1; break; }
            }
          }
        } catch (e) {}
        var lab = b.querySelector("span");
        var back = b.dataset.label + "만 글로 복사";
        var timer = null;
        function say(t) {
          if (!lab) return;
          lab.textContent = t;
          b.classList.add("hit");
          if (timer) clearTimeout(timer);
          timer = setTimeout(function () {
            lab.textContent = back; b.classList.remove("hit");
          }, 2600);
        }
        if (!n) { say("아직 저장된 게 없어요"); return; }
        var text = "CAFESUI-BACKUP " + new Date().toISOString().slice(0, 10) + " " +
                   JSON.stringify(o);
        var done = function () { say(n + "건 복사됨 — 톡에 붙여넣기"); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, fb);
        } else { fb(); }
        function fb() {
          var ta = document.createElement("textarea");
          ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta); ta.select();
          try { document.execCommand("copy"); done(); }
          catch (e) { say("복사가 안 됩니다"); }
          ta.remove();
        }
      });
    });
  })();

  // 자료 보관 — 용량 보여주고, 백업을 복사해서 옮길 수 있게
  (function () {
    var sizeEl = document.getElementById("bkSize");
    var msg = document.getElementById("bkMsg");
    if (!sizeEl) return;
    function keys() {
      var out = [];
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k.indexOf("cafesui.") === 0 && !/^cafesui\.(me|unlocked|device|syncstate|ui\..*|presence\..*)$/.test(k)) out.push(k);   // 기기 번호 · 로그인 상태 · 접속 표시는 빼고 전부
        }
      } catch (e) {}
      return out.sort();
    }
    function bytes() {
      var n = 0;
      keys().forEach(function (k) {
        try { n += k.length + (localStorage.getItem(k) || "").length; } catch (e) {}
      });
      return n;
    }
    function showSize() {
      var n = bytes();
      var txt = n < 1024 ? n + "B"
              : n < 1048576 ? (n / 1024).toFixed(0) + "KB"
              : (n / 1048576).toFixed(2) + "MB";
      sizeEl.textContent = txt + " 사용 중";
      if (n > 4 * 1048576) {
        sizeEl.textContent = txt + " — 곧 가득 찹니다. 파일로 저장해 두고 정리하세요";
        sizeEl.style.color = "var(--off)";
      }
    }
    showSize();

    // 쓰기로 한 기간 — 2026년 10월부터 3년
    (function () {
      var el = document.getElementById("bkPeriod");
      if (!el) return;
      var start = new Date(2026, 9, 1), end = new Date(2029, 8, 30);
      var now = new Date();
      var left = Math.round((end - now) / 2592000000);   // 남은 달 수
      if (now < start) {
        el.textContent = "이 프로그램은 2026년 10월부터 2029년 9월까지 3년치로 " +
          "만들어 두었습니다. 본격 사용은 10월부터입니다.";
      } else if (left > 6) {
        el.innerHTML = "쓰기로 한 기간 <b>2026년 10월 ~ 2029년 9월</b> · 남은 기간 <b>" +
          Math.floor(left / 12) + "년 " + (left % 12) + "개월</b>";
      } else if (left > 0) {
        el.className = "period warn";
        el.innerHTML = "<b>3년이 다 되어갑니다 — 남은 기간 " + left + "개월.</b> " +
          "전체 내용을 파일로 저장해 두고, 이어서 쓸지 새로 만들지 정하실 때입니다.";
      } else {
        el.className = "period warn";
        el.innerHTML = "<b>쓰기로 한 3년이 지났습니다.</b> 전체 내용을 파일로 저장해 두세요. " +
          "이어서 쓰셔도 기록은 그대로 쌓입니다.";
      }
    })();

    document.getElementById("bkCopy").addEventListener("click", function () {
      var o = {};
      keys().forEach(function (k) {
        try { o[k] = localStorage.getItem(k); } catch (e) {}
      });
      var text = "CAFESUI-BACKUP " + new Date().toISOString().slice(0, 10) + " " +
                 JSON.stringify(o);
      var done = function () {
        msg.textContent = "복사됐습니다 — 텔레그램이나 메모장에 붙여넣어 두세요";
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fb);
      } else { fb(); }
      function fb() {
        var ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); }
        catch (e) { msg.textContent = "복사가 안 됩니다"; }
        ta.remove();
      }
    });

    var paste = document.getElementById("bkPaste");
    document.getElementById("bkOpen").addEventListener("click", function () {
      paste.hidden = !paste.hidden;
      msg.textContent = paste.hidden ? "" : "복사해 둔 글을 붙여넣고 「불러오기」를 누르세요";
    });
    // ── 읽기용 문서 — 사람이 읽는 HTML 한 장. 날짜별 일지 · 출퇴근 · 근무표 · 재고 · 메모 · 휴가 · 독서 · 워크샵 · 평가 · 회의
    function readableHTML() {
      var E = function (v) { return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
      var NLr = /\r?\n/g;
      var P = function (v) { return E(v).replace(NLr, "<br>"); };
      var J = function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
      var all = keys().sort();
      var by = function (pre) { return all.filter(function (k) { return k.indexOf(pre) === 0; }); };
      var WDN = ["일", "월", "화", "수", "목", "금", "토"];
      var dlab = function (d) { var t = new Date(d + "T00:00:00"); return isNaN(t) ? d : d + " (" + WDN[t.getDay()] + ")"; };
      // 화면에서 칸 이름을 모은다 (저장 키 → 사람이 읽는 이름)
      var LBL = {};
      document.querySelectorAll("[data-k]").forEach(function (el) {
        var k = el.dataset.k; if (LBL[k]) return;
        var t = el.getAttribute("aria-label");
        if (!t) { var lb = el.closest(".mrow2, .frow, .lgnum, .lgtext, label"); var sp = lb && lb.querySelector("span"); if (sp) { var c = sp.cloneNode(true); c.querySelectorAll("small,em").forEach(function (x) { x.remove(); }); t = c.textContent.trim(); } }
        if (!t) { var tr = el.closest("tr"); var th = tr && tr.querySelector("th, .rq"); if (th) t = th.textContent.trim(); }
        LBL[k] = t || k;
      });
      var STATIC = { lf151: "손님 흐름 · 만석 · 웨이팅", lf164: "내일 예약 건", lf182: "사장님께 보고할 것" };
      var L = function (k) { return LBL[k] || STATIC[k] || k; };
      var rows = function (obj, skip) {
        var h = "";
        Object.keys(obj || {}).forEach(function (k) {
          if (skip && skip.test(k)) return;
          var v = obj[k]; if (v == null || v === "" || (typeof v === "object")) return;
          h += "<tr><th>" + E(L(k)) + "</th><td>" + P(v) + "</td></tr>";
        });
        return h ? '<table class="kv">' + h + "</table>" : "";
      };
      var out = [];
      var sec = function (t, body) { if (body) out.push('<section><h2>' + E(t) + "</h2>" + body + "</section>"); };
      // 일지
      var lg = by("cafesui.log.").sort().reverse(), h = "";
      lg.forEach(function (k) {
        var o = J(k) || {}, f = o.f || {}, d = k.slice(12);
        var ORDER = ["lf143", "lf140", "lf141", "lf142", "lf101", "lf102", "lf103", "lf104", "lf105", "lf106", "lf120", "lf121", "lf122", "lf110", "lf185", "lf180", "lf181", "lf190", "lf183", "lf184", "lf154", "lf150", "lf151", "lf152", "lf153", "lf160", "lf161", "lf162", "lf163", "lf164", "lf170", "lf171", "lf172", "lf182"];
        var seen = {}, b = "";
        ORDER.concat(Object.keys(f)).forEach(function (fk) {
          if (seen[fk]) return; seen[fk] = 1;
          var v = f[fk]; if (v == null || String(v).trim() === "") return;
          var cls = fk === "lf185" ? ' class="boss"' : (fk === "lf183" || fk === "lf184") ? ' class="red"' : "";
          b += "<tr" + cls + "><th>" + E(L(fk)) + "</th><td>" + P(v) + "</td></tr>";
        });
        if (!b) return;
        h += "<h3>" + dlab(d) + (o.who ? " · 작성 " + E(o.who) : "") + (o.savedAt ? " · 저장 " + E(o.savedAt) : " · 작성 중") + '</h3><table class="kv">' + b + "</table>";
      });
      sec("마감 일지", h);
      // 출퇴근
      h = "";
      by("cafesui.att.").sort().reverse().forEach(function (k) {
        var o = J(k) || {}, d = k.slice(12), b = "";
        Object.keys(o).forEach(function (nm) { var r = o[nm] || {}; if (!r.role && !r.out) return; b += "<tr><th>" + E(nm) + "</th><td>" + E(r.role || "") + "</td><td>" + E(r.out ? "퇴근 " + r.out : "") + "</td></tr>"; });
        if (b) h += "<h3>" + dlab(d) + '</h3><table class="kv">' + b + "</table>";
      });
      sec("출퇴근", h);
      // 근무표 + 휴무 신청
      h = "";
      by("cafesui.sched.").sort().forEach(function (k) {
        var o = J(k) || {}, ym = k.slice(14), names = {}, days = [];
        Object.keys(o).forEach(function (dk) { var m = dk.match(/^(\d+)-(\d+)$/); if (!m) return; days.push(dk); Object.keys(o[dk] || {}).forEach(function (nm) { names[nm] = 1; }); });
        if (!days.length) return;
        days.sort(function (a, b2) { return +a.split("-")[1] - +b2.split("-")[1]; });
        var nl = Object.keys(names).filter(function (n) { return n !== "공지"; });
        var b = "<tr><th>날짜</th>" + nl.map(function (n) { return "<th>" + E(n) + "</th>"; }).join("") + "<th>공지</th></tr>";
        days.forEach(function (dk) { var r = o[dk] || {}; var dd = ym.slice(0, 4) + "-" + String(dk.split("-")[0]).padStart(2, "0") + "-" + String(dk.split("-")[1]).padStart(2, "0"); b += "<tr><th>" + dlab(dd).slice(5) + "</th>" + nl.map(function (n) { return "<td>" + E(r[n] || "") + "</td>"; }).join("") + "<td>" + E(r["공지"] || "") + "</td></tr>"; });
        h += "<h3>" + ym.replace("-", "년 ") + '월 근무표</h3><table class="grid">' + b + "</table>";
        var off = J("cafesui.off." + ym);
        if (off && off.days && off.days.length) h += "<p><b>휴무 신청</b> · " + E(off.who || "") + " — " + off.days.map(function (d) { return E(d) + (off.why && off.why[d] ? " (" + E(off.why[d]) + ")" : ""); }).join(", ") + "</p>";
      });
      sec("근무표", h);
      // 재고 · 발주
      h = "";
      by("cafesui.stock.").sort().reverse().forEach(function (k) {
        var o = J(k) || {}, d = k.slice(14), b = "";
        [["orders", "발주 넣을 것"], ["report", "총괄 보고 · 특이사항"], ["prod", "조각케이크 생산"], ["fruitUseA", "과일 사용 (알)"], ["fruitUseB", "과일 사용 (병)"], ["fruitUseC", "과일 사용 (통)"], ["creamUse", "생크림 사용 (통)"], ["fruitOrder", "과일 주문 · 입고"], ["creamPlan", "생크림 주문 계획"]].forEach(function (f) { if (o[f[0]] && String(o[f[0]]).trim()) b += "<tr><th>" + f[1] + "</th><td>" + P(o[f[0]]) + "</td></tr>"; });
        var st = o.stock || {}, sb = "";
        Object.keys(st).forEach(function (nm) { if (st[nm] != null && String(st[nm]).trim() !== "") sb += "<tr><th>" + E(nm) + "</th><td>" + P(st[nm]) + "</td></tr>"; });
        if (!b && !sb) return;
        h += "<h3>" + dlab(d) + (o.by ? " · " + E(o.by) : "") + "</h3>" + (b ? '<table class="kv">' + b + "</table>" : "") + (sb ? '<p class="sub">재고</p><table class="kv two">' + sb + "</table>" : "");
      });
      sec("재고 · 발주", h);
      // 메모 달력 · 휴가
      h = "";
      var dn = J("cafesui.daynotes") || {};
      Object.keys(dn).sort().forEach(function (d) { var a = dn[d] || []; if (!a.length) return; h += "<p><b>" + dlab(d) + "</b> — " + a.map(function (n) { return E(n.t) + (n.by ? " <i>(" + E(n.by) + ")</i>" : ""); }).join(" · ") + "</p>"; });
      var vc = J("cafesui.vacations") || [];
      if (vc.length) h += "<h3>일정 · 직원 휴가</h3>" + vc.map(function (v) { var sc = v.kind === "sched"; return "<p>" + (sc ? "[일정] " + E(v.title || "") + (v.who ? " · " + E(v.who) : "") : "[휴가] " + E(v.who)) + " · " + E(v.from) + " ~ " + E(v.to) + (v.memo ? " · " + E(v.memo) : "") + "</p>"; }).join("");
      sec("메모 달력 · 일정 · 휴가", h);
      // 매니저 주간 보고
      h = "";
      var WRL = { sum: "이번 주 매출 · 흐름 요약", good: "잘된 점", bad: "문제점 · 개선할 점", stock: "재고 · 발주 이슈", staff: "직원 · 근무 이슈", next: "다음 주 계획 · 준비할 것", ask: "사장님께 요청 · 건의" };
      var meR = ""; try { meR = localStorage.getItem("cafesui.me") || ""; } catch (e) {}
      if (meR === "사장님" || meR === "정항아") by("cafesui.weekrep.").sort().reverse().forEach(function (k) {
        var o = J(k) || {}, f = o.f || {}, b = "";
        Object.keys(WRL).forEach(function (fk) { if (f[fk] && String(f[fk]).trim()) b += "<tr><th>" + WRL[fk] + "</th><td>" + P(f[fk]) + "</td></tr>"; });
        if (b) h += "<h3>" + E(k.slice(16)) + " 주" + (o.who ? " · " + E(o.who) : "") + '</h3><table class="kv">' + b + "</table>";
      });
      sec("매니저 주간 보고", h);
      // 독서나눔
      h = "";
      var bk = J("cafesui.books"); (bk && bk.items || []).forEach(function (it) {
        h += "<h3>" + E(it.title || "제목 없음") + (it.author ? " · " + E(it.author) : "") + "</h3>" + (it.summary ? '<p class="box">' + P(it.summary) + "</p>" : "");
        Object.keys(it.resp || {}).forEach(function (nm) { var r = it.resp[nm] || {}; if (!r.feel && !r.apply && !r.rec) return; h += "<h4>" + E(nm) + '</h4><table class="kv">' + (r.feel ? "<tr><th>느낀 점</th><td>" + P(r.feel) + "</td></tr>" : "") + (r.apply ? "<tr><th>카페에 적용해볼 것</th><td>" + P(r.apply) + "</td></tr>" : "") + (r.rec ? "<tr><th>추천 도서</th><td>" + P(r.rec) + "</td></tr>" : "") + "</table>"; });
      });
      sec("독서나눔", h);
      // 워크샵
      h = "";
      by("cafesui.ws.").sort().reverse().forEach(function (k) {
        var o = J(k) || {}, y = k.slice(11), b = "";
        ["w1", "w2", "w3", "w4", "w5", "w6"].forEach(function (f) { if (o[f]) b += "<tr><th>" + E(L(f)) + "</th><td>" + P(o[f]) + "</td></tr>"; });
        if (b) b = '<table class="kv">' + b + "</table>";
        for (var d = 1; d <= 4; d++) {
          var tb = "";
          for (var r = 1; r <= 60; r++) { var t = o["d" + d + "t" + r], pl = o["d" + d + "p" + r], m = o["d" + d + "m" + r]; if (!t && !pl && !m) continue; tb += "<tr><td>" + E(t || "") + "</td><td>" + E(pl || "") + "</td><td>" + P(m || "") + "</td></tr>"; }
          if (tb) b += "<h4>" + d + "일차" + (o["d" + d + "date"] ? " · " + E(o["d" + d + "date"]) : "") + '</h4><table class="grid"><tr><th>시간</th><th>일정</th><th>메모</th></tr>' + tb + "</table>";
        }
        [1, 2, 3].forEach(function (cd) {
          var pre = cd === 1 ? "c" : "c" + cd + "_", tb = "", sum = 0;
          for (var r = 1; r <= 60; r++) { var dd = o[pre + r + "d"], n = o[pre + r + "n"], a = o[pre + r + "a"], m = o[pre + r + "m"]; if (!dd && !n && !a && !m) continue; var num = parseFloat(String(a || "").replace(/,/g, "")); if (!isNaN(num)) sum += num; tb += "<tr><td>" + E(dd || "") + "</td><td>" + E(n || "") + "</td><td>" + E(a || "") + "</td><td>" + E(m || "") + "</td></tr>"; }
          if (tb) b += "<h4>" + cd + "일차 지출 · 합계 " + sum.toLocaleString("ko-KR") + '</h4><table class="grid"><tr><th>시간</th><th>지출</th><th>금액</th><th>메모</th></tr>' + tb + "</table>";
        });
        var rest = rows(o, /^(w\d|d\d(date|[tpm]\d+)|c\d*_?\d+[dnam]|_by)$/);
        if (rest) b += "<h4>회의 · 가고 싶은 곳 · 그 외</h4>" + rest;
        if (b) h += "<h3>" + E(y) + "년 워크샵</h3>" + b;
      });
      sec("워크샵", h);
      // 월말 평가
      h = "";
      by("cafesui.review.").sort().reverse().forEach(function (k) {
        var o = J(k) || {}, parts = k.slice(15).split("."), ym = parts[0], who = parts[1] || "";
        var checks = Object.keys(o).filter(function (x) { return /^k\d+$/.test(x) && o[x]; });
        var b = rows(o, /^(k\d+|_by|_rank|_level)$/);
        if (!checks.length && !b) return;
        h += "<h3>" + ym.replace("-", "년 ") + "월" + (who ? " · " + E(who) : "") + (o._level ? " · " + E(o._level) : "") + "</h3>" + b;
        if (checks.length) h += "<p><b>체크한 항목 " + checks.length + "개</b></p><ul>" + checks.map(function (x) { return "<li>" + E(L(x)) + "</li>"; }).join("") + "</ul>";
      });
      sec("월말 평가", h);
      // 월말회의
      h = "";
      by("cafesui.meeting.").sort().reverse().forEach(function (k) { var o = J(k) || {}, b = rows(o, /^_/); if (b) h += "<h3>" + k.slice(16).replace("-", "년 ") + "월 회의</h3>" + b; });
      var mt = J("cafesui.mtable"); if (mt) { var mb = rows(mt); if (mb) h += "<h3>채널별 · 품목별 비교표</h3>" + mb; }
      sec("월말회의", h);
      // 제과제빵
      h = "";
      var bg = J("cafesui.baking"); (bg && bg.items || []).forEach(function (it) { if (!it.title && !it.body) return; h += "<h3>" + E(it.cat ? "[" + it.cat + "] " : "") + E(it.title || "제목 없음") + (it.by ? " · " + E(it.by) : "") + '</h3><p class="box">' + P(it.body || "") + "</p>"; });
      sec("제과제빵", h);
      // 보건증
      var hc = J("cafesui.health"); if (hc) { var hb = ""; Object.keys(hc).forEach(function (n) { if (hc[n]) hb += "<tr><th>" + E(n) + "</th><td>발급일 " + E(hc[n]) + "</td></tr>"; }); if (hb) sec("보건증", '<table class="kv">' + hb + "</table>"); }
      var now = new Date(), stamp = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0") + " " + String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
      var css = "body{font-family:'Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif;max-width:900px;margin:24px auto;padding:0 18px;color:#2b2620;line-height:1.6;background:#fffdf8}h1{font-size:22px;border-bottom:3px solid #8a6b3a;padding-bottom:8px}h1 small{font-size:13px;color:#8a7f6e;font-weight:400;margin-left:10px}nav{font-size:13px;margin:10px 0 24px}nav a{margin-right:12px;color:#8a6b3a}section{margin:26px 0;page-break-inside:avoid}h2{font-size:18px;color:#8a6b3a;border-left:5px solid #8a6b3a;padding-left:10px;margin:30px 0 10px}h3{font-size:15px;margin:18px 0 6px;background:#f3ede0;padding:6px 10px;border-radius:6px}h4{font-size:13.5px;margin:12px 0 4px;color:#5f5546}table{border-collapse:collapse;width:100%;font-size:13.5px;margin:4px 0 10px}table.kv th{width:160px;text-align:left;background:#f8f4ea;font-weight:700;vertical-align:top}table.kv.two th{width:220px}th,td{border:1px solid #e3dccb;padding:5px 8px;vertical-align:top}table.grid th{background:#f8f4ea}tr.boss th,tr.boss td{background:#f3eedf;font-weight:900}tr.red th,tr.red td{color:#a8402f;font-weight:700}p.box{background:#f8f4ea;padding:10px 12px;border-radius:6px;white-space:normal}p.sub{margin:8px 0 2px;font-size:12.5px;color:#8a7f6e;font-weight:700}i{color:#8a7f6e}@media print{body{margin:0}h2{page-break-after:avoid}}";
      var toc = out.map(function (x) { var m = x.match(/<h2>(.*?)<\/h2>/); return m ? m[1] : ""; }).filter(Boolean);
      return "<!doctype html><html lang=\"ko\"><head><meta charset=\"utf-8\"><title>카페스이 기록 " + E(stamp) + "</title><style>" + css + "</style></head><body>" +
        "<h1>카페스이 기록 모음<small>" + E(stamp) + " 저장 · 읽기 전용</small></h1>" +
        "<nav>" + toc.map(function (t, i) { return '<a href="#s' + i + '">' + t + "</a>"; }).join("") + "</nav>" +
        out.map(function (x, i) { return x.replace("<section>", '<section id="s' + i + '">'); }).join("") +
        (out.length ? "" : "<p>아직 적은 내용이 없습니다.</p>") + "</body></html>";
    }
    var bkReadBtn = document.getElementById("bkRead");
    if (bkReadBtn) bkReadBtn.addEventListener("click", function () {
      try { if (window.__CS_FLUSH) window.__CS_FLUSH(); } catch (e) {}
      var d = new Date(), name = "cafesui-read-" + d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + ".html";
      var blob = new Blob(["\ufeff" + readableHTML()], { type: "text/html;charset=utf-8" });
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
      msg.textContent = "「" + name + "」로 저장했습니다 · 더블클릭하면 브라우저에서 읽힙니다";
    });
    function backupText() {
      var o = {};
      keys().forEach(function (k) { try { o[k] = localStorage.getItem(k); } catch (e) {} });
      return "CAFESUI-BACKUP " + new Date().toISOString().slice(0, 10) + " " + JSON.stringify(o);
    }
    // 파일로 내려받기 — 컴퓨터·휴대폰의 다운로드 폴더에 저장된다. 이 화면의 내용은 그대로 남는다 (복사본만 만든다)
    var bkFileBtn = document.getElementById("bkFile");
    if (bkFileBtn) bkFileBtn.addEventListener("click", function () {
      try { if (window.__CS_FLUSH) window.__CS_FLUSH(); } catch (e) {}
      var d = new Date(), name = "cafesui-copy-" + d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + ".txt";
      var blob = new Blob([backupText()], { type: "text/plain;charset=utf-8" });
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
      msg.textContent = "「" + name + "」로 내려받았습니다 · 다운로드 폴더에 있습니다";
    });
    // 파일에서 되살리기
    var bkFileInBtn = document.getElementById("bkFileIn"), bkFileInp = document.getElementById("bkFileInp");
    if (bkFileInBtn && bkFileInp) {
      bkFileInBtn.addEventListener("click", function () { bkFileInp.value = ""; bkFileInp.click(); });
      bkFileInp.addEventListener("change", function () {
        var f = bkFileInp.files && bkFileInp.files[0]; if (!f) return;
        var r = new FileReader();
        r.onload = function () { document.getElementById("bkText").value = String(r.result || ""); restoreFromText(); };
        r.readAsText(f, "utf-8");
      });
    }
    function restoreFromText() {
      var v = (document.getElementById("bkText").value || "").trim();
      var i = v.indexOf("{");
      if (i < 0) { msg.textContent = "복사본 글이 아닙니다"; return; }
      var o;
      try { o = JSON.parse(v.slice(i)); }
      catch (e) { msg.textContent = "복사본 글이 깨졌습니다"; return; }
      var cnt = Object.keys(o).filter(function (k) { return k.indexOf("cafesui.") === 0; }).length;
      var stamp = (v.match(/CAFESUI-BACKUP\s+(\d{4}-\d{2}-\d{2})/) || [])[1] || "";
      if (!window.confirm("복사본" + (stamp ? " (" + stamp + " 것)" : "") + " " + cnt + "개 항목을 불러올까요?\n\n복사본에 들어 있는 항목은 복사본 내용으로 바뀝니다 (같은 날짜 일지 · 같은 달 근무표 등).\n복사본에 없는 항목은 그대로 남습니다.")) return;
      var n = 0;
      Object.keys(o).forEach(function (k) {
        if (k.indexOf("cafesui.") !== 0 || /^cafesui\.(me|unlocked|device|syncstate|ui\..*|presence\..*)$/.test(k)) return;   // 기기 번호는 컴퓨터마다 달라야 한다
        try { localStorage.setItem(k, o[k]); n += 1; } catch (e) {}
      });
      msg.textContent = n + "개를 불러왔습니다 · 화면을 새로 엽니다";
      setTimeout(function () { if (window.__CS_RELOAD) window.__CS_RELOAD(); else location.reload(); }, 900);
    }
    document.getElementById("bkRestore").addEventListener("click", restoreFromText);

    document.getElementById("bkOld").addEventListener("click", function () {
      var cut = new Date();
      cut.setFullYear(cut.getFullYear() - 1);
      var c = cut.toISOString().slice(0, 10);
      var gone = 0;
      keys().forEach(function (k) {
        var m = k.match(/^cafesui\.(log|att)\.(\d{4}-\d{2}-\d{2})$/);
        if (m && m[2] < c) {
          try { localStorage.removeItem(k); gone += 1; } catch (e) {}
        }
      });
      msg.textContent = gone ? gone + "일치를 정리했습니다" : "정리할 것이 없습니다";
      showSize();
    });
  })();

  // 첫 화면 — 누가 쓰는지 고르고, 본인이 정한 네 자리 숫자로 들어간다.
  //           (파일 하나짜리 미리보기라 진짜 잠금은 아니다. 옆사람이 못 열게 하는 정도.)
  (function () {
    var NAMES2 = ["정항아", "박혜빈", "이해선", "사장님"];
    var COL2 = { "정항아": "p1", "박혜빈": "p2", "이해선": "p3", "사장님": "p4" };
    var BOSS = "사장님";
    var gate = document.getElementById("gate");
    var gb = document.getElementById("gateBtns");
    if (!gate || !gb) return;
    var st1 = document.getElementById("gateStep1");
    var st2 = document.getElementById("gateStep2");
    var pin1 = document.getElementById("pin1");
    var pin2 = document.getElementById("pin2");
    var pinMsg = document.getElementById("pinMsg");
    var pinAsk = document.getElementById("pinAsk");
    var pinWho = document.getElementById("pinWho");
    var pinForgot = document.getElementById("pinForgot");
    var picked = null, mode = "enter";

    function get(k) { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }
    function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    function del(k) { try { localStorage.removeItem(k); } catch (e) {} }
    function pinKey(n) { return "cafesui.pin." + n; }
    // 그대로 적어두지 않으려고 살짝 섞는다 (진짜 암호화는 아니다)
    function mix(n, v) {
      var out = "";
      for (var i = 0; i < v.length; i++) {
        out += String.fromCharCode(v.charCodeAt(i) ^ (n.charCodeAt(i % n.length) & 15));
      }
      return btoa(unescape(encodeURIComponent(out)));
    }

    gb.innerHTML = NAMES2.map(function (n) {
      return '<button type="button" class="gatebtn ' + COL2[n] + '" data-n="' + n +
             '">' + n + "</button>";
    }).join("");

    if (!get("cafesui.me")) gate.hidden = false;

    gb.addEventListener("click", function (e) {
      var b = e.target.closest(".gatebtn");
      if (!b) return;
      picked = b.dataset.n;
      mode = get(pinKey(picked)) ? "enter" : "make";
      pinWho.textContent = picked + (picked === "사장님" ? "" : "님");
      pinAsk.textContent = mode === "make" ? "쓸 비밀번호를 정하세요"
                                           : "비밀번호를 넣으세요";
      pinMsg.textContent = mode === "make" ? "숫자 네 자리 · 다른 컴퓨터에서도 같은 번호로 들어옵니다" : "";
      pinMsg.className = "pinmsg" + (mode === "make" ? " ok" : "");
      pin1.value = ""; pin2.value = "";
      pin2.hidden = true;
      pinForgot.hidden = mode === "make";
      st1.hidden = true; st2.hidden = false;
      pin1.focus();
    });

    document.getElementById("pinBack").addEventListener("click", function () {
      st2.hidden = true; st1.hidden = false; picked = null;
    });

    function go() {
      if (!picked) return;
      var v = (pin1.value || "").trim();
      if (!/^[0-9]{4}$/.test(v)) {
        pinMsg.className = "pinmsg";
        pinMsg.textContent = "숫자 네 자리를 넣어주세요";
        return;
      }
      if (mode === "make") {
        set(pinKey(picked), mix(picked, v));
        set("cafesui.me", picked);
        try { sessionStorage.setItem("cafesui.unlocked", "1"); } catch (e) {}
        location.reload();
        return;
      }
      if (get(pinKey(picked)) !== mix(picked, v)) {
        pinMsg.className = "pinmsg";
        pinMsg.textContent = "비밀번호가 다릅니다";
        pin1.value = ""; pin1.focus();
        return;
      }
      set("cafesui.me", picked);
      try { sessionStorage.setItem("cafesui.unlocked", "1"); } catch (e) {}
      location.reload();
    }
    document.getElementById("pinOk").addEventListener("click", go);
    [pin1, pin2].forEach(function (el) {
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); go(); }
      });
      el.addEventListener("input", function () {
        el.value = el.value.replace(/[^0-9]/g, "").slice(0, 4);
        if (el === pin1 && el.value.length === 4) go();
      });
    });

    // 잊었을 때 — 사장님 비밀번호로 푼다
    pinForgot.addEventListener("click", function () {
      var boss = get(pinKey(BOSS));
      if (picked === BOSS) {
        if (!window.confirm("사장님 비밀번호를 지우고 새로 정할까요?")) return;
        del(pinKey(BOSS));
        pinMsg.className = "pinmsg ok";
        pinMsg.textContent = "지웠습니다. 사장님을 다시 눌러 새 네 자리를 정하세요";
        setTimeout(function () { st2.hidden = true; st1.hidden = false; }, 900);
        return;
      }
      if (!boss) {
        del(pinKey(picked));
        pinMsg.className = "pinmsg ok";
        pinMsg.textContent = "지웠습니다. 이름을 다시 골라 새로 정하세요";
        setTimeout(function () { st2.hidden = true; st1.hidden = false; }, 900);
        return;
      }
      var v = window.prompt("사장님 비밀번호를 넣어주세요 (네 자리)");
      if (v == null) return;
      if (mix(BOSS, String(v).trim()) !== boss) {
        pinMsg.className = "pinmsg";
        pinMsg.textContent = "사장님 비밀번호가 다릅니다";
        return;
      }
      del(pinKey(picked));
      pinMsg.className = "pinmsg ok";
      pinMsg.textContent = "지웠습니다. 이름을 다시 골라 새로 정하세요";
      setTimeout(function () { st2.hidden = true; st1.hidden = false; }, 900);
    });

    // 월말 평가는 대상자 본인과 사장님만
    var me = get("cafesui.me");
    if (me) {
      var allowed = [BOSS, "정항아"];
      if (allowed.indexOf(me) < 0) {
        document.querySelectorAll(".tab").forEach(function (t) {
          if (t.textContent.indexOf("월말 평가") < 0) return;
          var panel = document.getElementById(t.dataset.p);
          t.remove();
          if (panel) panel.remove();
        });
      }
    }
  })();

  // 내 화면 — 고른 이름에 맞춰 화면을 맞춘다
  (function () {
    var SCHED = window.__CS_SCHED || {};
    var NAMES = ["정항아", "박혜빈", "이해선", "사장님"];
    var bar = document.getElementById("myBar");
    var me = "";
    try { me = localStorage.getItem("cafesui.me") || ""; } catch (e) {}
    if (!me || NAMES.indexOf(me) < 0 || !bar) return;

    // 오늘 내 근무
    function todayStr() {
      var d = new Date();
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
             "-" + String(d.getDate()).padStart(2, "0");
    }
    var WDN3 = ["일", "월", "화", "수", "목", "금", "토"];
    function label(sh) {
      return "<b>" + sh.r + "</b>" +
             (sh.s ? " " + sh.s + "–" + sh.e : " · 매장 상황 보며");
    }
    function josa(w) {
      var c = w.charCodeAt(w.length - 1);
      return (c >= 44032 && c <= 55203 && (c - 44032) % 28) ? "이에요" : "예요";
    }
    function mineOn(d) {
      var p = SCHED[d];
      if (!p) return null;
      return p.filter(function (x) { return x.w === me; })[0] || null;
    }
    function nextWork() {
      var keys = Object.keys(SCHED).sort(), t = todayStr();
      for (var k = 0; k < keys.length; k++) {
        if (keys[k] <= t) continue;
        var m = mineOn(keys[k]);
        if (m) return { d: keys[k], sh: m };
      }
      return null;
    }
    var t = todayStr();
    var today = mineOn(t);
    document.getElementById("myName").textContent = me + (me === "사장님" ? "" : "님");
    var msg;
    if (today) {
      msg = "오늘은 <b>" + today.r + "</b>" + josa(today.r) +
            (today.s ? " " + today.s + "–" + today.e : " · 매장 상황 보며");
    } else {
      var head = (new Date().getDay() === 0) ? "오늘은 정기휴무예요"
                                             : "오늘은 쉬는 날이에요";
      if (t < "2026-10-01") head = "근무표는 2026년 10월부터 시작해요";
      var nx = nextWork();
      if (nx) {
        var p = nx.d.split("-");
        var wd = WDN3[new Date(+p[0], +p[1] - 1, +p[2]).getDay()];
        head += " · 다음 근무는 " + (+p[1]) + "/" + (+p[2]) + "(" + wd + ") " +
                label(nx.sh);
      }
      msg = head;
    }
    var note0 = (window.__CS_NOTES || {})[t];
    if (note0) msg += ' · <b class="mynote">📣 오늘 ' + note0 + "</b>";
    document.getElementById("myToday").innerHTML = msg;
    bar.hidden = false;

    document.getElementById("myOff").addEventListener("click", function () {
      try { localStorage.removeItem("cafesui.me"); sessionStorage.removeItem("cafesui.unlocked"); } catch (e) {}
      location.reload();
    });

    // 오늘 할 일 이름 미리 고르기
    var wb = document.querySelector('.wbtn[data-n="' + me + '"]');
    if (wb && wb.getAttribute("aria-pressed") !== "true") wb.click();
    // 휴무 신청 이름
    document.querySelectorAll('.rname[data-n="' + me + '"]').forEach(function (b) {
      if (b.getAttribute("aria-pressed") !== "true") b.click();
    });
    // 퇴근 카드 표시
    setTimeout(function () {
      document.querySelectorAll(".atcard").forEach(function (c) {
        var w = c.querySelector(".atwho");
        c.classList.toggle("mine", !!w && w.textContent.replace(/님$/, "") === String(me).replace(/님$/, ""));
      });
      var lw = document.getElementById("lgWho");
      if (lw && !lw.value) {
        lw.value = me;
        lw.dispatchEvent(new Event("change"));
      }
    }, 150);
  })();

  // 근무표 — 어느 달이든 고칠 수 있다. 고친 것은 읽기 달력에도 바로 반영된다.
  (function () {

    var TIMES = {"정항아":{"토요일":["09:00","18:00"],"오픈":["08:30","17:30"],"마감":["10:00","19:30"]},"박혜빈":{"토요일":["09:00","18:00"],"오픈":["08:30","18:00"],"마감":["10:00","19:30"]},"이해선":{"토요일":["09:00","18:00"],"미들":["09:30","16:30"],"전일":["08:30","19:30"]},"사장님":{"토요일":["09:00","18:00"],"전일(케이크+사무실근무)":["08:30","19:30"],"오픈":["08:30","17:30"],"마감":["10:00","19:30"],"반죽":[null,null]}};
    var NAMES = ["정항아", "박혜빈", "이해선", "사장님"];
    var NL = String.fromCharCode(10);
    var RCLS = { "오픈": "open", "마감": "close", "미들": "mid",
                 "전일": "full", "토요일": "full", "전일(케이크+사무실근무)": "own", "반죽": "own",
                 "공부": "away", "출강": "away", "서울출장": "away", "출장": "away", "사무실 근무": "away" };
    var RORDER = { "오픈": 0, "반죽": 1, "미들": 2, "전일": 2, "토요일": 2, "전일(케이크+사무실근무)": 3, "마감": 4,
                   "공부": 5, "출강": 5, "서울출장": 5, "출장": 5, "사무실 근무": 5 };

    function keyOf(ym) { return "cafesui.sched." + ym; }
    function draftOf(ym) {
      return window.__CS_DRAFT ? window.__CS_DRAFT(ym) : {};
    }
    function load(ym) {
      try { var raw = localStorage.getItem(keyOf(ym)); return raw ? (JSON.parse(raw) || {}) : {}; }
      catch (e) { return {}; }
    }
    function store(ym, o) {
      try {
        if (Object.keys(o).length) localStorage.setItem(keyOf(ym), JSON.stringify(o));
        else localStorage.removeItem(keyOf(ym));
      } catch (e) {}
    }
    function esc(v) {
      return String(v == null ? "" : v).replace(/&/g, "&amp;")
        .replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    // 고친 날은 읽기 달력을 다시 그린다
    function repaint(ym) {
      var read = document.getElementById("rc" + ym);
      if (!read) return;
      var saved = load(ym);
      var isPlanPanel = !!read.closest(".mpanel.plan");
      read.querySelectorAll(".cell:not(.closed)").forEach(function (c) {
        // 읽기 달력은 "10/1", 고치기 판은 "10-1" 로 날짜를 쓴다
        var day = saved[String(c.dataset.d).replace("/", "-")];
        if (!day) {
          // 짜는 달은 저장한 날만 보여준다 (로테이션 예상은 안 보여줌)
          if (isPlanPanel) {
            var h0 = c.querySelector(".hol"), b0 = c.querySelector(".bizt");
            c.innerHTML = '<div class="dnum">' + c.querySelector(".dnum").textContent + "</div>" + (h0 ? h0.outerHTML : "") + (b0 ? b0.outerHTML : "") +
                          '<div class="offrow"><span class="offwho" style="color:var(--rule2)">아직 안 짬</span></div>';
          }
          return;
        }
        var offs = [], rows = [];
        NAMES.forEach(function (n) {
          var r = day[n];
          if (!r) return;
          if (r === "휴무" || r === "휴가" || r === "반짝휴무") { offs.push({ n: n, r: r }); return; }
          var t = (TIMES[n] || {})[r] || [null, null];
          rows.push({ n: n, r: r, s: t[0], e: t[1] });
        });
        rows.sort(function (x, y) {
          return (RORDER[x.r] || 9) - (RORDER[y.r] || 9);
        });
        var hol = c.querySelector(".hol"), bz = c.querySelector(".bizt");
        var html = '<div class="dnum">' + c.querySelector(".dnum").textContent + "</div>" +
          (hol ? hol.outerHTML : "") + (bz ? bz.outerHTML : "") +
          (day["공지"] ? '<div class="allnote">📣 ' + esc(day["공지"]) + "</div>" : "") +
          offs.map(function (o) {
            return '<div class="offrow"><span class="offmark">' + esc(o.r) + "</span>" +
              '<span class="offwho">' + esc(o.n) + "</span></div>";
          }).join("") +
          rows.map(function (r) {
            return '<div class="sh ' + (RCLS[r.r] || "own") + '">' +
              '<span class="who">' + esc(r.n) + "</span>" +
              '<span class="rl">' + esc(r.r) + "</span>" +
              (r.s ? '<span class="tm">' + r.s + '<span class="dash">–</span>' + r.e +
                     "</span>"
                   : (RCLS[r.r] === "away" ? '<span class="tm free">가게 밖</span>'
                                           : '<span class="tm free">매장 상황 보며</span>')) + "</div>";
          }).join("");
        c.innerHTML = html;
      });
    }

    function check(panel, wrap) {
      var chk = wrap.querySelector(".pcheck");
      if (!chk) return;
      var cells = Array.prototype.slice.call(wrap.querySelectorAll(".pcell:not(.closed)"));
      var noOpen = 0, noClose = 0, dup = 0, blank = 0, count = {};
      NAMES.forEach(function (n) { count[n] = { work: 0, off: 0 }; });
      cells.forEach(function (cell) {
        var roles = {}, filled = 0, warn = [];
        cell.querySelectorAll(".pslot").forEach(function (el) {
          var v = el.value;
          if (!v) return;
          filled += 1;
          if (v === "휴무" || v === "휴가" || v === "반짝휴무") { count[el.dataset.n].off += 1; return; }
          count[el.dataset.n].work += 1;
          roles[v] = (roles[v] || 0) + 1;
        });
        var w = cell.querySelector(".pwarn");
        if (!filled) { blank += 1; if (w) w.textContent = ""; return; }
        var hasOpen = roles["오픈"] || roles["전일"] || roles["전일(케이크+사무실근무)"];
        var hasClose = roles["마감"] || roles["전일"] || roles["전일(케이크+사무실근무)"];
        if (!hasOpen) { noOpen += 1; warn.push("오픈 없음"); }
        if (!hasClose) { noClose += 1; warn.push("마감 없음"); }
        ["오픈", "마감", "미들"].forEach(function (r) {
          if (roles[r] > 1) { dup += 1; warn.push(r + " 두 명"); }
        });
        if (w) w.textContent = warn.join(" · ");
      });
      var chips = "";
      if (blank) chips += '<span class="pchip">아직 안 채운 날 ' + blank + '일</span>';
      if (noOpen) chips += '<span class="pchip bad">오픈이 빈 날 ' + noOpen + '일</span>';
      if (noClose) chips += '<span class="pchip bad">마감이 빈 날 ' + noClose + '일</span>';
      if (dup) chips += '<span class="pchip bad">같은 자리에 두 명 ' + dup + '곳</span>';
      if (!blank && !noOpen && !noClose && !dup) {
        chips += '<span class="pchip ok">빠진 곳 없습니다</span>';
      }
      chk.innerHTML = chips;
    }

    // 달 하나를 붙인다
    function bind(ym, wrap, panel) {
      var slots = Array.prototype.slice.call(wrap.querySelectorAll(".pslot"));
      var notes = Array.prototype.slice.call(wrap.querySelectorAll(".pnote"));
      if (!slots.length) return;
      var msg = wrap.querySelector(".pmsg");

      function paint(el) {
        el.classList.toggle("off", el.value === "휴무" || el.value === "휴가" || el.value === "반짝휴무");
        el.classList.toggle("set", !!el.value && el.value !== "휴무");
      }
      function save() {
        var o = {};
        slots.forEach(function (el) {
          if (!el.value) return;
          (o[el.dataset.d] || (o[el.dataset.d] = {}))[el.dataset.n] = el.value;
        });
        notes.forEach(function (el) {
          if (!el.value) return;
          (o[el.dataset.d] || (o[el.dataset.d] = {}))["공지"] = el.value;
        });
        store(ym, o);
        repaint(ym);
      }
      function apply(data) {
        slots.forEach(function (el) {
          var d = data[el.dataset.d];
          el.value = (d && d[el.dataset.n]) || "";
          paint(el);
        });
        notes.forEach(function (el) {
          var d = data[el.dataset.d];
          el.value = (d && d["공지"]) || "";
          el.classList.toggle("set", !!el.value);
        });
        check(panel, wrap);
      }

      var saved = load(ym);
      // 짜는 달이 아니면 로테이션을 밑그림으로 깔아둔다
      apply(Object.keys(saved).length ? saved
            : (wrap.classList.contains("planmode") ? {} : draftOf(ym)));

      // 한 칸씩 저장하지 않는다 — 다 채운 뒤 "저장"을 눌러야 달력에 들어간다
      var dirty = false;
      var saveBtn = wrap.querySelector(".psave");
      function showDirty() {
        if (saveBtn) { saveBtn.classList.toggle("dirty", dirty); saveBtn.textContent = dirty ? "저장 (아직 저장 안 됨)" : "저장"; }
        if (msg) msg.textContent = dirty ? "다 채운 뒤 저장을 누르세요 · 아직 달력에 안 들어갔습니다" : msg.textContent;
      }
      window.__CS_SCHED_DIRTY = window.__CS_SCHED_DIRTY || {};
      function mark(v) { dirty = v; window.__CS_SCHED_DIRTY[ym] = v; showDirty(); }
      function commit() {
        save(); mark(false);
        if (msg) msg.textContent = "저장했습니다 · 달력에 반영됐습니다";
        if (wrap.__csClose) wrap.__csClose();
      }
      wrap.__csCommit = commit;
      (window.__CS_SAVERS = window.__CS_SAVERS || []).push(function () { if (dirty) commit(); });
      slots.forEach(function (el) {
        el.addEventListener("change", function () {
          paint(el); mark(true); check(panel, wrap);
        });
      });
      notes.forEach(function (el) {
        el.addEventListener("change", function () {
          el.classList.toggle("set", !!el.value); mark(true);
        });
      });
      if (saveBtn) saveBtn.addEventListener("click", commit);
      // 로테이션대로 채우기 — 다시 누를 때마다 다른 안(1~5안)으로 바뀐다
      var variant = -1;
      var fill = wrap.querySelector(".pfill");
      if (fill) fill.addEventListener("click", function () {
        variant = (variant + 1) % 5;
        var keep = {}; notes.forEach(function (el) { if (el.value) keep[el.dataset.d] = el.value; });
        var dr = window.__CS_DRAFT ? window.__CS_DRAFT(ym, variant) : {};
        Object.keys(keep).forEach(function (d) { (dr[d] || (dr[d] = {}))["공지"] = keep[d]; });
        apply(dr); mark(true);
        fill.textContent = "로테이션 " + (variant + 1) + "안 · 다시 누르면 다른 안";
        if (msg) msg.textContent = "로테이션 " + (variant + 1) + "안으로 채웠습니다 (5가지 중) · 휴무 신청 보고 고친 뒤 저장을 누르세요";
      });
      var clear = wrap.querySelector(".pclear");
      if (clear) clear.addEventListener("click", function () {
        store(ym, {});
        apply(wrap.classList.contains("planmode") ? {} : draftOf(ym));
        location.reload();
      });
      var copy = wrap.querySelector(".pcopy");
      if (copy) copy.addEventListener("click", function () {
        var lines = ["[카페스이 근무표] " + String(ym).replace("-", "년 ") + "월"];
        wrap.querySelectorAll(".pcell:not(.closed)").forEach(function (cell) {
          var day = cell.querySelector(".dnum").textContent;
          var wd = cell.dataset.wd || "";
          var parts = [];
          cell.querySelectorAll(".pslot").forEach(function (el) {
            if (el.value) parts.push(el.dataset.n + " " + el.value);
          });
          var nt = cell.querySelector(".pnote");
          if (nt && nt.value) parts.push("📣 " + nt.value);
          if (parts.length) lines.push(day + "일(" + wd + ") " + parts.join(" · "));
        });
        if (lines.length === 1) { if (msg) msg.textContent = "아직 짠 내용이 없습니다"; return; }
        var text = lines.join(NL);
        var done = function () { if (msg) msg.textContent = "복사됐습니다"; };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, fb);
        } else { fb(); }
        function fb() {
          var ta = document.createElement("textarea");
          ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta); ta.select();
          try { document.execCommand("copy"); done(); }
          catch (e) { if (msg) msg.textContent = "복사가 안 됩니다"; }
          ta.remove();
        }
      });
    }

    function bindSched(root) {
      root.querySelectorAll(".mpanel").forEach(function (panel) {
        var ym = panel.dataset.plan;
        var wrap = document.getElementById("ew" + ym);
        if (wrap) bind(ym, wrap, panel);
        repaint(ym);
      });
      root.querySelectorAll(".editbtn").forEach(function (b) {
        var ym = b.dataset.k;
        var wrap = document.getElementById("ew" + ym);
        var read = document.getElementById("rc" + ym);
        var isPlan = !!b.closest(".mpanel.plan");
        function setOpen(on) {
          wrap.hidden = !on;
          if (read) read.hidden = on;
          b.setAttribute("aria-pressed", String(on));
          b.textContent = on ? "✓ 다 했어요 (저장하고 닫기)" : "✎ 근무표 수정하기";
        }
        wrap.__csClose = function () { setOpen(false); };
        b.addEventListener("click", function () {
          var on = wrap.hidden;
          if (!on && wrap.__csCommit && (window.__CS_SCHED_DIRTY || {})[ym]) wrap.__csCommit();
          setOpen(on);
        });
        // 짜는 달인데 아직 아무것도 저장 안 했으면 바로 편집 화면으로
        if (isPlan && !Object.keys(load(ym)).length) setOpen(true);
      });
    }
    window.__CS_BINDSCHED = bindSched;
  })();

  // 퇴근 — 본인 칸의 버튼 한 번. 시각은 시스템이 넣는다.
  (function () {
    var SCHED = window.__CS_SCHED || {};
    var dateEl = document.getElementById("atDate");
    var listEl = document.getElementById("atList");
    var msgEl = document.getElementById("atMsg");
    if (!dateEl || !listEl) return;
    var COL = { "정항아": "p1", "박혜빈": "p2", "이해선": "p3", "사장님": "p4" };
    var ROLES = ["오픈", "미들", "마감", "전일", "전일(케이크+사무실근무)", "반죽 근무"];
    function keyOf(d) { return "cafesui.att." + d; }
    function load(d) {
      try { var raw = localStorage.getItem(keyOf(d)); return raw ? (JSON.parse(raw) || {}) : {}; }
      catch (e) { return {}; }
    }
    function store(d, o) {
      try {
        if (Object.keys(o).length) localStorage.setItem(keyOf(d), JSON.stringify(o));
        else localStorage.removeItem(keyOf(d));
      } catch (e) {}
    }
    function todayStr() {
      var d = new Date();
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
             "-" + String(d.getDate()).padStart(2, "0");
    }

    function render() {
      var d = dateEl.value || todayStr();
      var plan = SCHED[d];
      var wd0 = new Date(d + "T00:00:00").getDay();
      // 근무표가 없는 날(10월 전, 아직 안 짠 달)도 퇴근은 찍을 수 있게 세 명을 그대로 보여준다
      if (!plan && wd0 !== 0) plan = [{ w: "정항아", r: "", s: null, e: null }, { w: "박혜빈", r: "", s: null, e: null }, { w: "이해선", r: "", s: null, e: null }];
      // 퇴근 칸은 직원만 — 사장님은 빼고, 이해선은 근무표에 없는 날도 넣는다
      if (plan) {
        plan = plan.filter(function (x) { return x.w !== "사장님"; });
        if (!plan.some(function (x) { return x.w === "이해선"; })) {
          plan = plan.concat([{ w: "이해선", r: "미들", c: "mid", s: null, e: null }]);
        }
      }
      var rec = load(d);
      listEl.innerHTML = "";
      if (!plan) {
        listEl.innerHTML = '<div class="atnone">일요일 정기휴무입니다</div>';
        msgEl.textContent = "";
        drawLog(); drawMonth();
        return;
      }
      plan.forEach(function (sh) {
        var mine = rec[sh.w] || {};
        var card = document.createElement("div");
        card.className = "atcard " + (COL[sh.w] || "") + (mine.out ? " finished" : "");
        var role = mine.role || sh.r;
        var opts = ROLES.map(function (r) {
          return '<option' + (r === role ? " selected" : "") + ">" + r + "</option>";
        }).join("");
        var main = mine.out
          ? '<div class="atdone"><b>' + role + '</b> · ' + mine.out + ' 퇴근</div>'
          : '<button type="button" class="atbig off">퇴근</button>';
        card.innerHTML =
          '<div class="ath"><span class="atwho">' + sh.w + '</span>' +
          '<span class="atplan">' + (sh.e ? "예정 " + sh.e + " 퇴근" : "매장 상황 보며") +
          '</span></div>' +
          '<div class="atbody">' +
            '<div class="atrow"><span>근무</span>' +
              '<select class="atsel">' + opts + '</select></div>' +
            main +
            '<button type="button" class="atedit">고치기</button>' +
            '<div class="atfix" hidden>' +
              '<div class="atrow"><span>퇴근</span>' +
                '<input type="time" class="attime"></div>' +
              '<input type="text" class="atmemo" placeholder="사유 · 대타 · 비고">' +
            '</div>' +
          '</div>';

        var sel = card.querySelector(".atsel");
        sel.addEventListener("change", function () {
          put(sh.w, "role", sel.value, !mine.out);
        });

        var big = card.querySelector(".atbig");
        if (big) big.addEventListener("click", function () {
          var n = new Date();
          var rec2 = load(dateEl.value || todayStr());
          if (!rec2[sh.w]) rec2[sh.w] = {};
          rec2[sh.w].role = sel.value;
          rec2[sh.w].out = String(n.getHours()).padStart(2, "0") + ":" +
                           String(n.getMinutes()).padStart(2, "0");
          store(dateEl.value || todayStr(), rec2);
          render();
        });

        var fix = card.querySelector(".atfix");
        var edit = card.querySelector(".atedit");
        if (mine.memo) fix.hidden = false;
        edit.textContent = fix.hidden ? "고치기" : "접기";
        edit.addEventListener("click", function () {
          fix.hidden = !fix.hidden;
          edit.textContent = fix.hidden ? "고치기" : "접기";
        });
        var t = card.querySelector(".attime");
        t.value = mine.out || "";
        t.addEventListener("change", function () { put(sh.w, "out", t.value); });
        var memo = card.querySelector(".atmemo");
        memo.value = mine.memo || "";
        memo.addEventListener("input", function () { put(sh.w, "memo", memo.value, true); });
        listEl.appendChild(card);
      });
      var done = plan.filter(function (sh) {
        return (rec[sh.w] || {}).out; }).length;
      msgEl.textContent = done + " / " + plan.length + "명 퇴근 찍음";
      drawLog(); drawMonth();
    }

    function put(who, field, val, quiet) {
      var d = dateEl.value || todayStr();
      var rec = load(d);
      if (!rec[who]) rec[who] = {};
      if (val) rec[who][field] = val; else delete rec[who][field];
      if (!Object.keys(rec[who]).length) delete rec[who];
      store(d, rec);
      if (quiet) return;
      render();
    }

    // 찍은 것이 날짜순으로 쌓인다
    var logEl = document.getElementById("atLog");
    var cntEl = document.getElementById("atCount");
    var PRE = "cafesui.att.";
    var WD2 = ["일", "월", "화", "수", "목", "금", "토"];
    function drawLog() {
      var rows = [];
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k.indexOf(PRE) !== 0) continue;
          var d = k.slice(PRE.length);
          var v = JSON.parse(localStorage.getItem(k) || "{}");
          Object.keys(v).forEach(function (who) {
            if (!v[who].out) return;
            rows.push({ d: d, who: who, role: v[who].role || "",
                        out: v[who].out, memo: v[who].memo || "" });
          });
        }
      } catch (e) {}
      rows.sort(function (a, b) {
        if (a.d !== b.d) return a.d < b.d ? 1 : -1;
        return a.out < b.out ? 1 : -1;
      });
      cntEl.textContent = rows.length ? rows.length + "건" : "";
      if (!rows.length) {
        logEl.innerHTML = '<div class="lgnone">아직 찍힌 퇴근이 없습니다</div>';
        return;
      }
      logEl.innerHTML = rows.slice(0, 60).map(function (r) {
        var p = r.d.split("-");
        var wd = WD2[new Date(+p[0], +p[1] - 1, +p[2]).getDay()];
        return '<div class="lgrow' + (r.d === dateEl.value ? " on" : "") +
          '" data-d="' + r.d + '">' +
          '<span class="lgd">' + (+p[1]) + "/" + (+p[2]) + " (" + wd + ")</span>" +
          '<span class="atw ' + (COL[r.who] || "") + '">' + r.who + "</span>" +
          '<span class="lgn">' + r.role + (r.memo ? " · " + r.memo : "") + "</span>" +
          '<span class="lgd">' + r.out + "</span>" +
          '<button type="button" class="lgopen">열기</button></div>';
      }).join("");
    }
    // 한 달 퇴근 현황 — 날짜 × 직원 표. 예정보다 늦게 남은 날은 +분으로 표시
    var STAFF = ["정항아", "박혜빈", "이해선"];
    var monEl = document.getElementById("atMonth"), tblEl = document.getElementById("atMon");
    function mins(t) { var p = String(t || "").split(":"); return p.length === 2 ? (+p[0]) * 60 + (+p[1]) : null; }
    function drawMonth() {
      if (!monEl || !tblEl) return;
      var ym = monEl.value || (dateEl.value || todayStr()).slice(0, 7);
      monEl.value = ym;
      var y = +ym.slice(0, 4), m = +ym.slice(5, 7);
      var last = new Date(y, m, 0).getDate(), today = todayStr();
      var tot = {}; STAFF.forEach(function (w) { tot[w] = { work: 0, out: 0, late: 0 }; });
      // 기록을 시작한 날 이전은 "미기록"으로 세지 않는다
      var firstRec = null;
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k.indexOf(PRE) === 0) { var dk = k.slice(PRE.length); if (!firstRec || dk < firstRec) firstRec = dk; }
        }
      } catch (e) {}
      // 근무표처럼 달력 모양 (월~일) — 칸마다 직원별 퇴근 시각
      var cells = [], firstWd = (new Date(y, m - 1, 1).getDay() + 6) % 7;
      for (var b0 = 0; b0 < firstWd; b0++) cells.push('<td class="atc blank"></td>');
      for (var dd = 1; dd <= last; dd++) {
        var d = ym + "-" + String(dd).padStart(2, "0");
        var wd = new Date(y, m - 1, dd).getDay();
        var plan = SCHED[d] || [], rec = load(d);
        var cls = "atc" + (wd === 0 ? " sun" : "") + (d === today ? " today" : "") + (wd === 6 ? " sat" : "");
        var hol = (window.__CS_HOL || {})[d];
        var inner = '<div class="atd">' + dd + (hol ? '<em>' + hol + '</em>' : "") + "</div>";
        if (wd === 0 && !plan.length && !Object.keys(rec).length) {
          inner += '<div class="atoff">정기휴무</div>';
        } else {
          STAFF.forEach(function (w) {
            var sh = null; plan.forEach(function (x) { if (x.w === w) sh = x; });
            var r = rec[w] || {};
            var nm = '<span class="atn ' + (COL[w] || "") + '">' + w.slice(0, 3) + "</span>";
            if (r.out) {
              tot[w].work += 1; tot[w].out += 1;
              var late = "";
              var pe = sh ? mins(sh.e) : null, po = mins(r.out);
              if (pe != null && po != null && po - pe >= 20) { late = '<i class="late">+' + (po - pe) + "분</i>"; tot[w].late += (po - pe); }
              inner += '<div class="atp">' + nm + "<b>" + r.out + "</b>" + late + (r.memo ? '<small>' + esc(r.memo) + "</small>" : "") + "</div>";
            } else if (sh) {
              var counted = d <= today && firstRec && d >= firstRec;
              if (counted) tot[w].work += 1;
              inner += '<div class="atp">' + nm + (d < today ? (counted ? '<span class="miss">미기록</span>' : '<small class="dash">' + sh.r + "</small>")
                                                          : '<small>' + sh.r + (sh.e ? " " + sh.e : "") + "</small>") + "</div>";
            }
          });
        }
        cells.push('<td class="' + cls + '" data-d="' + d + '">' + inner + "</td>");
      }
      while (cells.length % 7) cells.push('<td class="atc blank"></td>');
      var body = "";
      for (var r0 = 0; r0 < cells.length; r0 += 7) body += "<tr>" + cells.slice(r0, r0 + 7).join("") + "</tr>";
      var foot = '<tr><td colspan="7" class="atsum">' + STAFF.map(function (w) {
        var tt = tot[w];
        return '<span class="atn ' + (COL[w] || "") + '">' + w + "</span> 퇴근 " + tt.out + " / 근무 " + tt.work + "일" +
               (tt.late ? ' <i class="late">늦게 남음 +' + tt.late + "분</i>" : "") +
               (tt.work - tt.out > 0 && ym <= today.slice(0, 7) ? ' <span class="miss">미기록 ' + (tt.work - tt.out) + "일</span>" : "");
      }).join(' <span class="sep">·</span> ') + "</td></tr>";
      tblEl.innerHTML = "<thead><tr>" + ["월", "화", "수", "목", "금", "토", "일"].map(function (w, i) { return "<th" + (i === 6 ? ' class="sun"' : "") + ">" + w + "</th>"; }).join("") + "</tr></thead>" +
        "<tbody>" + body + "</tbody><tfoot>" + foot + "</tfoot>";
    }
    function esc(v) { return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    if (monEl) {
      monEl.addEventListener("change", drawMonth);
      document.getElementById("atPrev").addEventListener("click", function () {
        var y = +monEl.value.slice(0, 4), m = +monEl.value.slice(5, 7) - 1; if (m < 1) { m = 12; y -= 1; }
        monEl.value = y + "-" + String(m).padStart(2, "0"); drawMonth(); });
      document.getElementById("atNext").addEventListener("click", function () {
        var y = +monEl.value.slice(0, 4), m = +monEl.value.slice(5, 7) + 1; if (m > 12) { m = 1; y += 1; }
        monEl.value = y + "-" + String(m).padStart(2, "0"); drawMonth(); });
      tblEl.addEventListener("click", function (e) {
        var row = e.target.closest("[data-d]"); if (!row) return;
        dateEl.value = row.dataset.d; render();
        listEl.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    logEl.addEventListener("click", function (e) {
      var row = e.target.closest(".lgrow");
      if (!row) return;
      dateEl.value = row.dataset.d;
      render();
      listEl.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    dateEl.value = todayStr();
    dateEl.addEventListener("change", render);

    render();
  })();

  // 고객 응대 — 묶음 고르기
  (function () {
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest(".cstab"); if (!t) return;
      Array.prototype.forEach.call(document.querySelectorAll(".cstab"), function (o) {
        var on = o === t;
        o.setAttribute("aria-selected", String(on));
        var p = document.getElementById(o.dataset.c);
        if (p) p.hidden = !on;
      });
    });
  })();

  // 워크샵 — 해마다 새로 쓴다
  (function () {
    var yearEl = document.getElementById("wsYear");
    if (!yearEl) return;
    var msg = document.getElementById("wsMsg");
    var totEl = document.getElementById("wsTotal");
    var ins = Array.prototype.slice.call(document.querySelectorAll(".wsin"));
    function wire(el) {
      el.addEventListener(el.type === "checkbox" ? "change" : "input", function () {
        save(); total(); paintMtg();
      });
      if (el.type !== "checkbox") {
        el.addEventListener("input", timetable);
        el.addEventListener("change", timetable);
      }
      ins.push(el);
    }
    // 일정 줄 하나 만들기
    function dayRow(d, r) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        '<td><input type="text" class="wsin tin" data-k="d' + d + 't' + r +
          '" placeholder="시간"></td>' +
        '<td><input type="text" class="wsin" data-k="d' + d + 'p' + r +
          '" placeholder="어디에서 무엇을"></td>' +
        '<td><input type="text" class="wsin" data-k="d' + d + 'm' + r +
          '" placeholder="해야 할 일 · 메모"></td>';
      return tr;
    }
    function mtgRow(r) {
      var tr = document.createElement("tr");
      tr.className = "mtgrow";
      tr.innerHTML =
        '<td class="mtgc"><input type="checkbox" class="wsin mtgck" data-k="mg' + r +
          'c"></td>' +
        '<td><input type="text" class="wsin tin" data-k="mg' + r + 'w" placeholder="' +
          r + '차"></td>' +
        '<td><input type="text" class="wsin tin" data-k="mg' + r + 'd" placeholder="날짜"></td>' +
        '<td><input type="text" class="wsin" data-k="mg' + r +
          'n" placeholder="무엇을 정할지"></td>';
      return tr;
    }
    function wishRow(r) {
      var tr = document.createElement("tr");
      tr.className = "mtgrow";
      tr.innerHTML =
        '<td class="mtgc"><input type="checkbox" class="wsin mtgck" data-k="wl' + r +
          'c"></td>' +
        '<td><input type="text" class="wsin tin" data-k="wl' + r + 'p" placeholder="누가"></td>' +
        '<td><input type="text" class="wsin" data-k="wl' + r +
          'g" placeholder="가고 싶은 곳"></td>' +
        '<td><input type="text" class="wsin" data-k="wl' + r +
          'm" placeholder="영업시간 · 휴무 · 메모"></td>';
      return tr;
    }
    function addWishRow() {
      var body = document.querySelectorAll(".wstable.mtg tbody")[0];
      var r = body.querySelectorAll("tr.mtgrow").length + 1;
      var tr = wishRow(r);
      body.appendChild(tr);
      tr.querySelectorAll(".wsin").forEach(wire);
      return tr;
    }
    function addMtgRow() {
      var body = document.querySelectorAll(".wstable.mtg tbody")[1];
      var r = body.querySelectorAll("tr").length + 1;
      var tr = mtgRow(r);
      body.appendChild(tr);
      tr.querySelectorAll(".wsin").forEach(wire);
      return tr;
    }
    function paintMtg() {
      document.querySelectorAll(".mtgrow").forEach(function (tr) {
        var c = tr.querySelector(".mtgck");
        tr.classList.toggle("done", !!(c && c.checked));
      });
    }
    function costRow(r, day) {
      var pre = (day && day !== 1) ? "c" + day + "_" : "c";
      var tr = document.createElement("tr");
      tr.innerHTML =
        '<td><input type="text" class="wsin tin" data-k="' + pre + r + 'd" placeholder="시간"></td>' +
        '<td><input type="text" class="wsin" data-k="' + pre + r + 'n" placeholder="지출 목록"></td>' +
        '<td><input type="text" inputmode="numeric" class="wsin numfmt cost" data-k="' + pre + r + 'a" placeholder="금액"></td>' +
        '<td><input type="text" class="wsin" data-k="' + pre + r + 'm" placeholder="메모"></td>';
      return tr;
    }
    function addDayRow(d) {
      var body = document.querySelector("#wsd" + d + " tbody");
      var r = body.querySelectorAll("tr").length + 1;
      var tr = dayRow(d, r);
      body.appendChild(tr);
      tr.querySelectorAll(".wsin").forEach(wire);
      return tr;
    }
    function addCostRow(day) {
      day = +day || 1;
      var body = document.querySelector('.wstable.cost[data-cd="' + day + '"] tbody');
      var r = body.querySelectorAll("tr").length + 1;
      var tr = costRow(r, day);
      body.appendChild(tr);
      tr.querySelectorAll(".wsin").forEach(wire);
      ensureDel(tr);
      return tr;
    }
    document.querySelectorAll(".wsadd").forEach(function (b) {
      b.addEventListener("click", function () {
        var tr = b.dataset.cost ? addCostRow(b.dataset.cost)
               : b.dataset.mtg ? addMtgRow()
               : b.dataset.wish ? addWishRow()
               : addDayRow(b.dataset.day);
        if (b.dataset.day && tr) ensureDel(tr);   // 새 줄에도 바로 옮기기 · 지우기 손잡이
        if (b.dataset.wish) groupWish();
        var f = tr.querySelector("input");
        if (f) f.focus();
      });
    });
    // 일정 수정하기 — 일자별 일정표는 평소엔 잠가 두고, 버튼을 눌러야 고칠 수 있다 (줄 지우기도 그때만)
    var editBtn = document.getElementById("wsEdit");
    var editHint = document.getElementById("wsEditHint");
    // 줄 옮기기 — ▲▼ 버튼이나 ☰ 손잡이를 끌어서. 값만 자리를 바꾼다 (저장 키는 그대로)
    function rowVals(tr) { return Array.prototype.map.call(tr.querySelectorAll("input"), function (i) { return i.value; }); }
    function setVals(tr, vals) { tr.querySelectorAll("input").forEach(function (i, c) { i.value = vals[c] || ""; }); }
    function flash(tr) { tr.classList.add("moved"); setTimeout(function () { tr.classList.remove("moved"); }, 700); }
    function moveRow(tr, delta) {
      var body = tr.parentElement, rows = Array.prototype.slice.call(body.querySelectorAll("tr"));
      var i = rows.indexOf(tr), j = i + delta;
      if (i < 0 || j < 0 || j >= rows.length) return;
      var a = rowVals(rows[i]), b = rowVals(rows[j]);
      setVals(rows[i], b); setVals(rows[j], a);
      save(); total(); paintMtg(); timetable(); flash(rows[j]);
    }
    function moveRowTo(tr, target) {
      var body = tr.parentElement, rows = Array.prototype.slice.call(body.querySelectorAll("tr"));
      var i = rows.indexOf(tr), j = rows.indexOf(target);
      if (i < 0 || j < 0 || i === j || target.parentElement !== body) return;
      var vals = rows.map(rowVals); var moved = vals.splice(i, 1)[0]; vals.splice(j, 0, moved);
      rows.forEach(function (r, idx) { setVals(r, vals[idx]); });
      save(); total(); paintMtg(); timetable(); flash(rows[j]);
    }
    var dragTr = null;
    function ensureDel(tr) {
      if (tr.querySelector(".wsdel")) return;
      var td = document.createElement("td");
      td.className = "wsdel";
      td.innerHTML = '<span class="wsdrag" draggable="true" title="끌어서 옮기기" aria-label="끌어서 옮기기">☰</span>' +
        '<button type="button" class="wsx mv" data-mv="-1" title="위로" aria-label="위로">▲</button>' +
        '<button type="button" class="wsx mv" data-mv="1" title="아래로" aria-label="아래로">▼</button>' +
        '<button type="button" class="wsx del" title="이 줄 지우기" aria-label="이 줄 지우기">✕</button>';
      td.querySelector(".del").addEventListener("click", function () { delRow(tr); });
      td.querySelectorAll(".mv").forEach(function (b) { b.addEventListener("click", function () { moveRow(tr, +b.dataset.mv); }); });
      var h = td.querySelector(".wsdrag");
      h.addEventListener("dragstart", function (e) { dragTr = tr; tr.classList.add("dragging"); try { e.dataTransfer.setData("text/plain", "row"); e.dataTransfer.effectAllowed = "move"; } catch (x) {} });
      h.addEventListener("dragend", function () { tr.classList.remove("dragging"); dragTr = null; document.querySelectorAll("tr.over").forEach(function (r) { r.classList.remove("over"); }); });
      tr.addEventListener("dragover", function (e) { if (!dragTr || dragTr === tr) return; e.preventDefault(); tr.classList.add("over"); });
      tr.addEventListener("dragleave", function () { tr.classList.remove("over"); });
      tr.addEventListener("drop", function (e) { if (!dragTr) return; e.preventDefault(); tr.classList.remove("over"); moveRowTo(dragTr, tr); });
      tr.appendChild(td);
    }
    function delRow(tr) {
      var body = tr.parentElement;
      var rows = Array.prototype.slice.call(body.querySelectorAll("tr"));
      var i = rows.indexOf(tr);
      if (i < 0) return;
      var cur = tr.querySelectorAll("input");
      var has = Array.prototype.some.call(cur, function (el) { return el.value.trim(); });
      if (has && !window.confirm("이 줄을 지울까요? 아래 줄들이 한 칸씩 올라옵니다.")) return;
      for (var j = i; j < rows.length; j++) {
        var a = rows[j].querySelectorAll("input");
        var b = rows[j + 1] ? rows[j + 1].querySelectorAll("input") : null;
        for (var c = 0; c < a.length; c++) a[c].value = b ? b[c].value : "";
      }
      save(); total(); paintMtg(); timetable();
    }
    function setEdit(on) {
      document.querySelectorAll(".wsday").forEach(function (day) {
        day.classList.toggle("locked", !on);
        day.querySelectorAll("input").forEach(function (el) { el.readOnly = !on; });
        if (!on) day.querySelectorAll("tbody input").forEach(function (el) {
          var ro = el.nextElementSibling;
          if (!ro || !ro.classList.contains("wsro")) { ro = document.createElement("div"); ro.className = "wsro"; el.parentNode.insertBefore(ro, el.nextSibling); }
          ro.textContent = el.value;
        });
        var th = day.querySelector("thead tr");
        if (th && !th.querySelector(".wsdel")) { var h = document.createElement("th"); h.className = "wsdel"; th.appendChild(h); }
        day.querySelectorAll("tbody tr").forEach(ensureDel);
      });
      if (editBtn) {
        editBtn.textContent = on ? "✓ 다 고쳤어요 (닫기)" : "✎ 일정 수정하기";
        editBtn.classList.toggle("on", on);
        editBtn.setAttribute("aria-pressed", String(on));
      }
      if (editHint) editHint.textContent = on ? "적는 즉시 저장됩니다 · ☰ 끌기나 ▲▼로 줄을 옮기고, ✕로 지웁니다 · 다 고쳤으면 닫아 주세요"
                                            : "잘못 눌러 바뀌는 걸 막으려고 잠겨 있어요 · 고칠 땐 「일정 수정하기」";
      if (on) {
        var day0 = document.querySelector(".wsday:not([hidden]) tbody input");
        if (day0) day0.focus();
      }
    }
    window.__CS_WS_SETEDIT = setEdit;
    if (editBtn) editBtn.addEventListener("click", function () { setEdit(!editBtn.classList.contains("on")); });
    // 가고 싶은 곳 — 사람별로 묶고, 이름 줄을 눌러 접는다 (접힘 상태는 이 기기에만)
    var WL_ORDER = ["사장님", "정항아", "박혜빈", "이해선", "다 같이"];
    var WL_COL = { "정항아": "p1", "박혜빈": "p2", "이해선": "p3", "사장님": "p4" };
    var FOLD_KEY = "cafesui.ui.wlfold";
    function foldState() { try { return JSON.parse(localStorage.getItem(FOLD_KEY) || "{}") || {}; } catch (e) { return {}; } }
    function saveFold(o) { try { localStorage.setItem(FOLD_KEY, JSON.stringify(o)); } catch (e) {} }
    function wishTable() { return document.querySelectorAll(".wstable.mtg")[0]; }
    function groupWish() {
      var tb = wishTable(); if (!tb) return;
      var body = tb.querySelector("tbody");
      var rows = Array.prototype.slice.call(body.querySelectorAll("tr.mtgrow"));
      var groups = {}, order = [];
      rows.forEach(function (tr) {
        var who = (tr.querySelector(".tin") || {}).value || "";
        who = who.trim() || "(이름 없음)";
        if (!groups[who]) { groups[who] = []; order.push(who); }
        groups[who].push(tr);
        tr.dataset.g = who;
      });
      order.sort(function (a, b) {
        var ia = WL_ORDER.indexOf(a), ib = WL_ORDER.indexOf(b);
        if (a === "(이름 없음)") return 1; if (b === "(이름 없음)") return -1;
        if (ia < 0 && ib < 0) return a < b ? -1 : a > b ? 1 : 0;
        if (ia < 0) return 1; if (ib < 0) return -1;
        return ia - ib;
      });
      var fold = foldState();
      body.querySelectorAll("tr.wlgrp").forEach(function (h) { h.remove(); });
      order.forEach(function (who) {
        var list = groups[who];
        var filled = list.filter(function (tr) { var g = tr.querySelectorAll("input[type=text]")[1]; return g && g.value.trim(); }).length;
        var closed = !!fold[who];
        var h = document.createElement("tr");
        h.className = "wlgrp" + (closed ? " closed" : "");
        h.dataset.g = who;
        h.innerHTML = '<td colspan="4"><button type="button" class="wlfold" aria-expanded="' + (!closed) + '">' +
          '<span class="ar">▾</span><b class="' + (WL_COL[who] || "") + '">' + who.replace(/&/g, "&amp;").replace(/</g, "&lt;") + '</b>' +
          '<span class="n">' + filled + "곳" + (closed ? " · 접힘" : "") + "</span></button></td>";
        h.querySelector(".wlfold").addEventListener("click", function () {
          var f = foldState(); f[who] = !f[who]; if (!f[who]) delete f[who]; saveFold(f); groupWish();
        });
        body.appendChild(h);
        list.forEach(function (tr) { tr.hidden = closed; body.appendChild(tr); });
      });
    }
    (function () {
      var tb = wishTable(); if (!tb) return;
      // 이름을 다 적고 칸을 벗어나면 그 사람 묶음으로 옮긴다
      tb.addEventListener("change", function (e) { if (e.target.classList.contains("tin")) groupWish(); });
      tb.addEventListener("input", function (e) {
        // 가고 싶은 곳을 적으면 묶음 제목의 갯수도 맞춘다 (자리는 안 옮김)
        if (e.target.type === "text" && !e.target.classList.contains("tin")) {
          var tr = e.target.closest("tr"), g = tr && tr.dataset.g; if (!g) return;
          var h = tb.querySelector('tr.wlgrp[data-g="' + g.replace(/"/g, '\\"') + '"] .n'); if (!h) return;
          var n = 0; tb.querySelectorAll('tr.mtgrow[data-g="' + g.replace(/"/g, '\\"') + '"]').forEach(function (r) { var gi = r.querySelectorAll("input[type=text]")[1]; if (gi && gi.value.trim()) n++; });
          h.textContent = n + "곳";
        }
      });
      var fa = document.getElementById("wlFoldAll"), oa = document.getElementById("wlOpenAll");
      if (fa) fa.addEventListener("click", function () {
        var f = {}; tb.querySelectorAll("tr.wlgrp").forEach(function (h) { f[h.dataset.g] = true; }); saveFold(f); groupWish();
      });
      if (oa) oa.addEventListener("click", function () { saveFold({}); groupWish(); });
    })();
    window.__CS_WS_GROUP = groupWish;
    (function () {
      var oa = document.getElementById("thOpenAll"), ca = document.getElementById("thCloseAll");
      // 이론 문서는 나중에 불러오므로 버튼도 문서 전체에서 받는다
      document.addEventListener("click", function (e) {
        var b = e.target.closest && e.target.closest("#thOpenAll, #thCloseAll"); if (!b) return;
        var on = b.id === "thOpenAll";
        document.querySelectorAll("#thDoc details").forEach(function (d) { d.open = on; });
      });
    })();
    // 저장해둔 줄이 기본 줄보다 많으면 그만큼 늘려둔다
    function grow(data) {
      for (var d = 1; d <= 4; d++) {
        var max = 0;
        var pre = "d" + d;
        Object.keys(data).forEach(function (k) {
          if (k.indexOf(pre) !== 0) return;
          var rest = k.slice(pre.length);
          if ("tpm".indexOf(rest.charAt(0)) < 0) return;
          var n = parseInt(rest.slice(1), 10);
          if (!isNaN(n)) max = Math.max(max, n);
        });
        var body = document.querySelector("#wsd" + d + " tbody");
        while (body.querySelectorAll("tr").length < max) addDayRow(d);
      }
      [1, 2, 3].forEach(function (cd) {
        var cmax = 0, re = cd === 1 ? /^c(\d+)[dnam]$/ : new RegExp("^c" + cd + "_(\\d+)[dnam]$");
        Object.keys(data).forEach(function (k) { var m = k.match(re); if (m) cmax = Math.max(cmax, +m[1]); });
        var cbody = document.querySelector('.wstable.cost[data-cd="' + cd + '"] tbody');
        while (cbody && cbody.querySelectorAll("tr").length < cmax) addCostRow(cd);
      });
      var gmax = 0;
      Object.keys(data).forEach(function (k) {
        if (k.indexOf("mg") !== 0) return;
        var n = parseInt(k.slice(2), 10);
        if (!isNaN(n)) gmax = Math.max(gmax, n);
      });
      var gbody = document.querySelectorAll(".wstable.mtg tbody")[1];
      while (gbody.querySelectorAll("tr").length < gmax) addMtgRow();
      var wmax = 0;
      Object.keys(data).forEach(function (k) {
        if (k.indexOf("wl") !== 0) return;
        var n = parseInt(k.slice(2), 10);
        if (!isNaN(n)) wmax = Math.max(wmax, n);
      });
      var wbody = document.querySelectorAll(".wstable.mtg tbody")[0];
      while (wbody.querySelectorAll("tr.mtgrow").length < wmax) addWishRow();
    }

    var SEED = {"2025": {"w1": "카페스이의 치즈케이크와 진정한 말차를 찾아서", "w2": "도쿄 · 25.11.10~13 (월~목) 3박 4일", "w3": "3명 / 시부야역 8분 · 2 Chome-20-5 Higashi, Shibuya, Tokyo 150-0011", "w4": "1인 100,000엔 (한국돈 100만원) · 10/27까지 이해선님께 송금", "w5": "11/10 에어부산 BX0112 08:20-10:25 (김해-나리타) / 11/13 진에어 LJ0224 16:30-18:55", "w6": "총 4번 — 일정 짜기 · 예약 확인 · 최종 점검", "w10": "사장님 · 정항아", "w11": "이해선", "w12": "사장님 · 정항아", "w13": "사장님", "w50": "마지막 밤 숙소에서 워크샵 전반 피드백 — 좋았던 것 / 아쉬웠던 점 이야기함", "d1date": "2025-11-10", "d1t1": "6:00", "d1p1": "김해공항 집결", "d1m1": "각자 짐을 들고 집결", "d1t2": "11:30", "d1p2": "나리타 공항 도착", "d1m2": "밖으로 나오는 시간까지", "d1p3": "나리타 지하 · NEX 티켓 사기", "d1m3": "교통카드 충전 + 편의점 간식 / 시부야까지 1시간 30분", "d1p4": "시부야역 코인락커에 짐 맡기기", "d1m4": "야간 티켓도 알아보기", "d1t5": "14:00", "d1p5": "스시노미도리 시부야점", "d1m5": "점심 · 시부야 마크시티 4층", "d1p6": "백화점 지하", "d1m6": "베이커리 + 케이크 구경", "d1p7": "요요기로 이동", "d1m7": "카멜백(커피) · 나타 데 크리스티아노(에타) · 365일(빵) · Equal(치즈케이크)", "d1t8": "17:00", "d1p8": "숙소 체크인", "d1m8": "에어비앤비 · 짐 정리 및 휴식", "d1p9": "벨츠", "d1m9": "케이크 전문점 (바스크)", "d1p10": "하카타 꼬치 조우몬", "d1m10": "저녁 식사", "d2date": "2025-11-11", "d2t1": "7:00", "d2p1": "기상", "d2t2": "8:30", "d2p2": "나카메구로로 이동", "d2m2": "근처에 말차 팔면 꼭 먹어보기", "d2p3": "cheese cake Johann · 마츠노스케 뉴욕", "d2m3": "오리지널 치즈케이크 · 메뉴판과 브로셔 참고", "d2p4": "다이칸야마 츠타야 서점", "d2m4": "구경", "d2t5": "15:00", "d2p5": "긴자로 이동", "d2m5": "긴자에서 만나기", "d2p6": "Lesolca", "d2m6": "고르곤졸라 치즈케이크가 유명", "d2p7": "스타벅스 긴자 마로니에토오리점", "d2m7": "말차를 맷돌로 가는 곳", "d2t8": "15:30", "d2p8": "히가시긴자 혼텐 (예약)", "d2m8": "말차 코스 · 각각 다른 걸로 · 16만원 결재", "d2t9": "19:15", "d2p9": "샤브라쿠테이 신주쿠", "d2m9": "저녁 · 알펜도쿄에서 러닝화도", "d2t10": "21:00", "d2p10": "숙소 복귀", "d3date": "2025-11-12", "d3t1": "5:30", "d3p1": "기상", "d3t2": "7:00", "d3p2": "디즈니랜드로 이동", "d3m2": "물 · 선글라스 · 운동화 / 1일패스권", "d3t3": "8:00", "d3p3": "입장", "d3m3": "푸의 허니헌트 · 몬스터주식회사(줄서기앱) / 미녀와야수 · 스플래시(DPA 유료)", "d3t4": "15:00", "d3p4": "디즈니랜드 나오기", "d3p5": "에비스역으로 이동", "d3m5": "자영업의 거리 · 근처 구경", "d3t6": "18:30", "d3p6": "라 테이블 드 조엘 로부숑", "d3m6": "미슐랭 1스타 프렌치 · 3명 13,800엔", "d3p7": "걸어서 숙소", "d3m7": "무인양품 · 칼디 구경", "d3p8": "시부야 사우나", "d3m8": "피로 풀기", "d3p9": "마지막 야식 · 워크샵 피드백", "d3m9": "좋았던 것 / 아쉬웠던 점 이야기하기", "d4date": "2025-11-13", "d4t1": "7:00", "d4p1": "기상 · 짐 정리 · 퇴실", "d4p2": "조식", "d4m2": "근처에서 커피 + 샌드위치", "d4t3": "10:00", "d4p3": "네즈 미술관 오픈런", "d4p4": "텐푸라 미야카와 (점심)", "d4m4": "오모테산도로 이동 · 오모테산도 힐즈 · 블루보틀", "d4p5": "나리타 1터미널로 이동", "d4m5": "오모테산도 - 우에노 - 스카이라이너", "d4t6": "14:30", "d4p6": "공항 도착", "d4m6": "짐 붙이고 대기", "d4t7": "20:00", "d4p7": "한국 입국", "c1d": "7/18", "c1n": "항공권 (3명)", "c1a": "943200", "c1m": "투어비스 세트 · 카페 결재", "c2d": "9/24", "c2n": "숙소 (3명)", "c2a": "834718", "c2m": "에어비앤비 · 카페 결재", "c3d": "10/21", "c3n": "디즈니랜드 티켓 (3명)", "c3a": "255000", "c3m": "클룩 · 카페 결재", "c4d": "10/21", "c4n": "샤브샤브집 예약", "c4a": "12789", "c4m": "시스템 이용료만", "c5d": "10/21", "c5n": "프렌치레스토랑 자리값", "c5a": "2000", "c5m": "자리값만", "c6d": "10/21", "c6n": "히가시긴자 혼텐 (3명)", "c6a": "160000", "c6m": "말차 코스", "c7d": "11/4", "c7n": "네즈미술관 티켓 (3명)", "c7a": "45000", "c7m": "공식홈피 결재", "c8d": "11/6", "c8n": "여행자보험 (3명)", "c8a": "19220", "c8m": "카카오페이", "mg1w": "1차", "mg1d": "9월", "mg1n": "가고 싶은 곳 · 하고 싶은 것 5개씩", "mg2w": "2차", "mg2d": "10월 초", "mg2n": "일정 짜기 · 예약할 것 정하기", "mg3w": "3차", "mg3d": "10/21 (화)", "mg3n": "디즈니랜드 정하기 · 예약 재확인 · 촬영 논의", "mg4w": "최종", "mg4d": "11/7 (금)", "mg4n": "환전 · 공금 전달 · 최종 점검", "wl1p": "다 같이", "wl1g": "스시노미도리 시부야점", "wl1m": "1일차 점심 · 마크시티 4층", "wl2p": "다 같이", "wl2g": "카멜백 — 라떼 · 커피", "wl2m": "요요기", "wl3p": "다 같이", "wl3g": "나타 데 크리스티아노 — 에그타르트", "wl3m": "요요기", "wl4p": "다 같이", "wl4g": "365일 — 빵집", "wl4m": "요요기", "wl5p": "정항아", "wl5g": "Equal — 치즈케이크", "wl5m": "강추한 곳인데 목요일부터 휴무라 못 감", "wl6p": "다 같이", "wl6g": "사보 오구노 시부야 — 복숭아 빙수", "wl6m": "예약했는데 못 감", "wl7p": "다 같이", "wl7g": "벨츠 — 케이크 전문점", "wl7m": "못 감", "wl8p": "다 같이", "wl8g": "시부야 스카이 — 야경", "wl8m": "티켓 실패해서 못 감", "wl9p": "다 같이", "wl9g": "cheese cake Johann", "wl9m": "2일차 나카메구로", "wl10p": "다 같이", "wl10g": "마츠노스케 뉴욕", "wl10m": "애플파이와 치즈케이크", "wl11p": "다 같이", "wl11g": "Lesolca — 고르곤졸라 치즈케이크", "wl11m": "긴자", "wl12p": "다 같이", "wl12g": "스타벅스 긴자 마로니에토오리점", "wl12m": "말차를 맷돌로 가는 곳", "wl13p": "다 같이", "wl13g": "히가시긴자 혼텐", "wl13m": "말차 코스 · 예약 15:30", "wl14p": "다 같이", "wl14g": "이토야 문구점", "wl14m": "대형 문구점 구경", "wl15p": "다 같이", "wl15g": "라 테이블 드 조엘 로부숑", "wl15m": "미슐랭 1스타 · 3일차 저녁", "wl16p": "다 같이", "wl16g": "네즈 미술관", "wl16m": "4일차 오픈런", "wl17p": "다 같이", "wl17g": "오모테산도 힐즈 · 블루보틀", "wl17m": "4일차"}, "2026": {"w1": "협력으로 만드는 진짜 오래 팔 수 있는 카페스이의 그것", "w2": "후쿠오카 · 26.11.9~11 (월~수) 2박 3일", "w3": "4명 / 하카타역 근처 · 1-chōme-22-6 Hakata Ekimae, Fukuoka 812-0011 (에어비앤비 예약 완료)", "w4": "아침 10만 + 점심 10만 + 저녁 10만 = 교통비 포함 총 80만원 · 회비 납부일은 2차 회의에서 정함 (엄마에게 송금)", "w5": "9월 안으로 구매 + 여행자보험 같이 등록", "w6": "총 3번 + 최종 — 1차 8/17(월) 끝 · 2차 9/24(목) · 3차 10/9(금) 퇴근 후 1시간 · 최종 11/7(토) 퇴근 후 20~30분 최종 점검", "w10": "사장님 · 정항아 · 박혜빈", "w11": "이해선", "w12": "정항아", "w13": "사장님 (+ 짐 배송 알아보기 · 델리백 문의)", "w14": "박혜빈 (타임키퍼 · 일정체크 · 길찾기 · 우버)", "d1date": "2026-11-09", "d1t1": "5:30", "d1p1": "김해공항 집결", "d1m1": "여권 · 환전 · 보험 · 보조배터리 최종확인 (수하물 대표: 사장님) · 짐 갯수 체크 · 비짓재팬", "d1p2": "체크인 + 짐 붙이기", "d1t3": "8:30", "d1p3": "후쿠오카 공항 도착", "d1m3": "입국 후 짐 찾고 택시로 하카타역 이동", "d1p4": "로손 편의점", "d1m4": "자양강장제 + 샌드위치", "d1t5": "9:30", "d1p5": "하카타역 코인락커에 짐 맡기기", "d1m5": "각자 1군데씩 찾아서 넣기", "d1t6": "10:00", "d1p6": "다코멧카", "d1m6": "아침 겸 대표 빵 구매 ⭐ 보는 순간 사고 싶게 만드는 매장 — 고객 동선 · 진열 높이·밀도 · 시즐감 · 생산 모습 노출 · 여러 개 집게 만드는 방식", "d1t7": "11:00", "d1p7": "모모토세 오픈런", "d1m7": "나폴레옹 파이 · 제철 케이크 ⭐ 카페스이와 가장 직접 비교 — 제철과일 · 생크림·시트·과일 비율 · 크기·가격 · 쇼케이스 · 계절 교체 방법", "d1t8": "12:30", "d1p8": "개별 벤치마킹 미션 · 자유시간", "d1m8": "각자 3~4곳 (점심·커피 포함) · 1인 최대 20만원 · 영수증 보관 ⭐ ①왜 골랐나 ②대표제품 ③가격 ④포장 ⑤카페스이 적용점 — 사진·메모 (모여서 발표) · 서로 다른 매장 보기", "d1t9": "18:30", "d1p9": "하카타역 집합", "d1m9": "저녁에 같이 먹을 음식·디저트 가져오기 · 영수증 + 구매제품 확인", "d1t10": "19:00", "d1p10": "숙소로 이동 · 짐 풀기", "d1m10": "가는 길에 음료·물 사가기", "d1t11": "19:30", "d1p11": "저녁 + 디저트 리뷰", "d1m11": "각자 가져온 제품 펼쳐놓고 ⭐ BEST 1~2 / 별로였던 것 1 / 카페스이에 적용하고 싶은 것 1 발표", "d1t12": "20:30", "d1p12": "돈키호테 쇼핑", "d1m12": "개인 쇼핑 · 미션 종료 후 편하게", "d1t13": "21:00", "d1p13": "숙소 근처 이자카야", "d1m13": "가볍게 한잔", "d1t14": "23:00", "d1p14": "취침", "d2date": "2026-11-10", "d2t1": "7:00", "d2p1": "기상", "d2m1": "2일차 주제 — 잘되는 가게는 어떻게 더 많이 사고, 더 오래 머물고, 다시 오게 만드는가?", "d2t2": "8:30", "d2p2": "숙소 출발", "d2t3": "9:00", "d2p3": "빵스톡 (텐진)", "d2m3": "각자 2~3개 ⭐ 많은 종류를 팔면서도 강한 가게 — 빵 차별화 · 진열 · 대표제품 · 여러 개 사게 만드는 구성 · 포장 · 직원 동선", "d2t4": "10:30", "d2p4": "하카타역 · 백화점 지하 식품관", "d2m4": "디저트·베이커리·선물코너 ⭐ 선물상품 관점 — 4·6·8·10개입 · 가격 · 박스 · 쇼핑백 · 낱개포장 · 시즌 한정 · 계산대 주변", "d2p5": "하카타역 특산물 선물샵 투어", "d2m5": "⭐ 6·8·10개입 구성 · 박스 · 쇼핑백 · 가격 · 시즌 패키지 · 답례품", "d2t6": "14:00", "d2p6": "점심식사", "d2t7": "15:00", "d2p7": "르브레통", "d2m7": "갈레트 · 버터케이크 · 구움과자 ⭐ 한 가지 정체성을 강하게 만드는 법 — 프랑스 콘셉트의 일관성 · 카페스이의 로컬·일본 감성과 비교", "d2t8": "17:00", "d2p8": "숙소 들르기", "d2m8": "구매제품 정리 · 잠깐 휴식", "d2t9": "17:30", "d2p9": "메이지공원 (피자집)", "d2m9": "4명 저녁 ⭐ 공원+식음 매장의 연결 · 공간을 목적지화하는 방법 · 로컬 식재료 활용", "d2t10": "19:30", "d2p10": "사우나", "d2m10": "2일차 공식 일정 종료", "d2t11": "21:00", "d2p11": "숙소 이동", "d2m11": "가는 길에 마실 것", "d2t12": "23:00", "d2p12": "취침", "d3date": "2026-11-11", "d3t1": "7:00", "d3p1": "기상 · 짐 최종 정리", "d3m1": "3일차 주제 — 오래 장사하면서 더 성장하기 위해 지킬 것과 바꿀 것 · 구매제품·영수증·개인 짐 확인", "d3t2": "8:00", "d3p2": "체크아웃", "d3t3": "9:00", "d3p3": "하카타역 짐 배송", "d3m3": "공항으로 바로 배송 · 항공사 말하고 대표자 사장님 · 캐리어 4개", "d3t4": "10:00", "d3p4": "쿠루미 오픈런", "d3m4": "계절 케이크 · 쇼트케이크 ⭐ 동네에서 오래 팔리는 케이크숍 — 계절/스테디 비율 · 크기·가격 · 진열량 · 포장 · 단골 반복구매 제품", "d3t5": "11:00", "d3p5": "자크오호리", "d3m5": "걸어서 이동 · 케이크 + 구움과자 ⭐ 클래식을 오래 파는 힘 — 대표상품 · 고급스러워 보이는 이유 · 마감 · 구움과자 구성 · 선물상품", "d3t6": "12:00", "d3p6": "하나노키 (오호리공원 프렌치)", "d3m6": "마지막 메인 식사 ⭐ 입장 → 응대 → 메뉴설명 → 식기 → 플레이팅 → 제공간격 → 디저트 → 계산 → 배웅까지 전체 경험 보기", "d3t7": "14:00", "d3p7": "공항으로 이동", "d3p8": "면세점 선물세트 마지막 구경", "d3m8": "⭐ 6·8·10개입 · 가격대 · 박스 · 쇼핑백 · 시즌 패키지 · 유통기한 · 개별포장", "d3p9": "공항에서 저녁", "d3t10": "16:00", "d3p10": "한국으로 이동", "d3m10": "⭐ 각자 워크샵 후기 3줄 이상 텔레그램에 (깨달은 것 + 카페스이 적용 + 개인적 변화)", "d3t11": "17:05", "d3p11": "김해공항 도착 · 워크샵 종료", "mg1c": 1, "mg1w": "1차", "mg1d": "8/17 (월) 17:30", "mg1n": "각자 가고 싶은 것 · 하고 싶은 것 5개씩 / 숏츠 3 · 롱폼 1 (엄마·사장님·항아님·혜빈님)", "mg2w": "2차", "mg2d": "9/24 (목) 17:30", "mg2n": "회비 납부일 · 비행기표 공유 · 워크샵 질문 정하기 · 식사 · 짐 배송 (항아님·사장님·혜빈님)", "mg3w": "3차", "mg3d": "10/9 (금)", "mg3n": "퇴근 후 1시간 · 항아님 · 사장님 · 혜빈님", "mg4w": "최종", "mg4d": "11/7 (토)", "mg4n": "퇴근 후 20~30분 · 최종 점검 및 체크 (엄마·사장님·항아님·혜빈님)", "wl1p": "사장님", "wl1g": "프렌치레스토랑 런치", "wl1m": "하고 싶은 것 · 사우나 · 서점 · 그릇투어도", "wl2p": "사장님", "wl2g": "아맘다코탄", "wl2m": "오전 8시~5시 · 쉬는 날 없음", "wl3p": "사장님", "wl3g": "오미야게 샵 (하카타역)", "wl3m": "답례품 구경", "wl4p": "사장님", "wl4g": "메이지공원 투어", "wl5p": "사장님", "wl5g": "테이크아웃 디저트샵", "wl5m": "뭘 많이 사가는지 보기", "wl6p": "이해선", "wl6g": "온천 · 사우나", "wl6m": "맛있는 것도", "wl7p": "정항아", "wl7g": "르브레통 — 갈레트 + 쁘티케이크", "wl7m": "1순위 · 수요일 휴무 · 11시~7시", "wl8p": "정항아", "wl8g": "모모토세 — 밀푀유", "wl8m": "1시 전 품절, 오픈런 · 월요일 휴무 · 11시~7시", "wl9p": "정항아", "wl9g": "쿠루미 — 케이크샵", "wl9m": "월요일 휴무 · 10시~7시 · 오호리 공원역 근처", "wl10p": "정항아", "wl10g": "HOC — 치즈케이크", "wl10m": "10시~5시 · 쉬는 날 없음 · 텐진에서 좀 떨어짐", "wl11p": "정항아", "wl11g": "아베키 — 치즈케이크", "wl12p": "정항아", "wl12g": "메이카페 — 특이한 빙수", "wl12m": "2순위", "wl13p": "정항아", "wl13g": "온천 · 프렌치 식사 · 사봉 바디워시 · 꼼데", "wl13m": "하고 싶은 것", "wl14p": "박혜빈", "wl14g": "빵스톡 — 바게트", "wl14m": "1순위 · 오전 8시~7시 · 월요일 휴무", "wl15p": "박혜빈", "wl15g": "파티스리 조르주 마르소 — 파르페 · 케이크", "wl15m": "10시~7시 · 월 · 화 휴무", "wl16p": "박혜빈", "wl16g": "자크오호리 — 구움과자 + 케이크", "wl16m": "10시~오후 4시 · 월 · 화 휴무", "wl17p": "박혜빈", "wl17g": "Dig inn — 베이글 샌드위치", "wl18p": "박혜빈", "wl18g": "Aimai — 힙한 커피집", "wl19p": "박혜빈", "wl19g": "브런치 · 돈키호테 · 편의점", "wl19m": "하고 싶은 것", "wl20p": "다 같이", "wl20g": "다코멧카 · 폴폴베이커리", "wl20m": "1일차 아침", "wl21p": "다 같이", "wl21g": "하나노키 — 프렌치 (오호리공원)", "wl21m": "3일차 점심 · 예약"}};
    // 노션 「전체 워크샵」에서 옮겨 온 회의 내용 · 참고 자료 (해마다 다르다)
    var MEET = {
      "2025": [
        { t: "1차 · 2차 회의", d: "9월 ~ 10월 초", h: "<p>총 4번 회의 — 항아님과 일정도 짜고, 마지막 확인도 함.</p><ul><li>가고 싶은 곳 · 하고 싶은 것 5개씩</li><li>일정 짜기 · 예약할 것 정하기</li></ul>" },
        { t: "3차 (마지막) 회의", d: "10/21 (화)", h: "<ul><li>디즈니랜드에서 뭐 할지 정확히 하기</li><li>예약한 곳 한 번 더 체크</li><li>촬영 어떻게 할 건지 논의</li><li>추가된 일정이 있으면 변경</li></ul>" },
        { t: "최종 회의", d: "11/7 (금) 오전 9시", h: "<ul><li>환전 금액 다 드리고 정산할 건 하고, 공금 받아서 이해선님께 전달 — <b>100,000엔씩</b></li><li>카페스이 정산 — 히가시긴자 혼텐 예약금 + 네즈미술관 티켓비 <b>20,500엔</b> (받아야 하는 돈)</li><li>카페스이가 먼저 결제한 것 — 항공권 · 숙박비 · 프렌치 자리값 · 샤브샤브 예약시스템비 · 디즈니랜드 티켓 · 여행자보험</li><li>11/6 온라인 셀프예약 서비스 등록 (여권 제출)</li></ul>" },
        { t: "다녀와서 피드백", d: "11/12 (수) 마지막 밤 · 숙소", h: "<p>워크샵 전반 피드백 — 좋았던 것 / 아쉬웠던 점 이야기함.</p>" }
      ],
      "2026": [
        { t: "1차 회의", d: "8/17 (월) 17:30 · 엄마 · 사장님 · 항아님 · 혜빈님 · 끝남", h:
          "<p><b>각자 가고 싶은 것 + 하고 싶은 것 5개씩</b> · 숏츠 3개 · 롱폼 1개</p>" +
          "<table class='wsref'><tr><th>누가</th><th>하고 싶은 것</th><th>가고 싶은 곳</th><th>메모</th></tr>" +
          "<tr><td>사장님</td><td>프렌치레스토랑 런치 · 사우나 · 서점 · 그릇투어 · 테이크아웃 디저트샵 (뭘 많이 사가는지)</td><td>아맘다코탄 · 오미야게 샵(하카타역) · 메이지공원 투어</td><td>아맘다코탄 오전 8~5시 · 쉬는 날 없음</td></tr>" +
          "<tr><td>엄마 (이해선)</td><td>온천 · 사우나 · 맛있는 것</td><td></td><td></td></tr>" +
          "<tr><td>항아님</td><td>온천 · 프렌치 식사 · 사봉 바디워시 · 꼼데</td><td>HOC(치즈케이크) · 아베키(치즈케이크) · <b>쿠루미(케이크샵)</b> · <b>모모토세(밀푀유, 1시 전 품절 오픈런)</b> · 메이카페(특이한 빙수, 2순위) · <b>르브레통(갈레트+쁘티케이크, 1순위)</b></td><td>HOC 10~5시 쉬는 날 없음, 텐진에서 떨어짐 / 쿠루미 월 휴무 10~7시 오호리 공원역 / 모모토세 월 휴무 11~7시 / 르브레통 수 휴무 11~7시</td></tr>" +
          "<tr><td>혜빈님</td><td>브런치 · 돈키호테 · 편의점</td><td><b>빵스톡(바게트, 1순위)</b> · Dig inn(베이글 샌드위치) · <b>파티스리 조르주 마르소(파르페·케이크)</b> · Aimai(힙한 커피) · <b>자크오호리(구움과자+케이크)</b></td><td>빵스톡 8~7시 월 휴무 / 조르주 마르소 10~7시 월·화 휴무 / 자크오호리 10~4시 월·화 휴무</td></tr></table>" },
        { t: "2차 회의", d: "9/24 (목) 17:30 · 항아님 · 사장님 · 혜빈님", h:
          "<p><b>안건</b></p><ul><li>회비 언제까지 납부할지 정하기 (엄마에게 송금)</li><li>9월까지 비행기표 끊어서 공유하기</li><li>중간중간 식사를 뭘 하면 좋을지</li><li>짐 배송 가능 여부 확인 (델리백에 문의해 둠) — 9일(월) 후쿠오카 공항 → 숙소 / 11일(수) 숙소 → 공항</li></ul>" +
          "<p><b>이번 워크샵의 질문</b></p><ul><li><b>1일차 발견</b> → 나는 무엇을 좋다고 생각하는가?</li><li><b>2일차 분석</b> → 잘되는 가게는 왜 잘되는가?</li><li><b>3일차 적용</b> → 우리는 무엇을 지키고, 무엇을 바꾸고, 나는 무엇을 할 것인가?</li></ul>" +
          "<p class='wsq'>마지막 날(한국 가는 날) 각자 작성해서 공유합니다. 3일간 보고, 먹고, 느낀 것을 바탕으로 각자의 생각을 적고 함께 나눕니다. 정답은 없습니다. 서로의 생각에서 카페스이의 다음 방향을 찾아봅니다.</p>" +
          "<table class='wsref'><tr><th>질문</th><th>보는 이유</th></tr><tr><td>① 카페스이가 앞으로도 절대 잃지 않았으면 하는 것은?</td><td>우리가 지켜야 할 정체성</td></tr><tr><td>② 이번 여행에서 보고 카페스이에 꼭 가져오고 싶은 것은?</td><td>실제 적용</td></tr><tr><td>③ 카페스이가 더 오래가기 위해 바꿨으면 하는 것은?</td><td>직원 관점의 개선점</td></tr><tr><td>④ 내가 그 변화에서 할 수 있는 역할은 무엇인가?</td><td>'사장님이 바꿔주세요'가 아니라 협력으로 연결</td></tr></table>" },
        { t: "3차 회의", d: "10/9 (금) 퇴근 후 1시간 · 항아님 · 사장님 · 혜빈님", h: "<p>예정 — 아직 회의 전입니다. 정한 것을 아래 칸에 적어 두세요.</p>" },
        { t: "최종 회의", d: "11/7 (토) 퇴근 후 20~30분 · 엄마 · 사장님 · 항아님 · 혜빈님", h: "<p>최종 점검 및 체크 — 예약 캡처 · 회비 · 환전 · 역할 · 짐 배송 확인.</p>" }
      ]
    };
    var REF = {
      "2025": "<h4>예약할 것들 · 결제 기록</h4><ul><li>숙소 (에어비앤비) · 비행기 티켓 (투어비스)</li><li>저녁 프렌치 레스토랑 — 3명 13,800엔짜리로 예약 완료 (자리값 200엔 · 민지 결제)</li><li>샤브샤브집 — 10/21 예약시스템 이용료 12,789원 (자리만 · 민지 결제)</li><li>디즈니랜드 원데이권 — 10/21 클룩 255,000원 결제 · 어플에 입장권 등록 (항아 · 엄마) · 아이디 연결</li><li>시부야 스카이 — 클룩 예약 실패 (야경) → 가서 당일 결제 해보기</li><li>여행자보험 — 카카오에서 가입 19,220원 (민지 결제)</li><li>네즈 미술관 — 11/4 티켓팅 완료 4,500엔 (45,000원 삼성카드)</li><li>히가시긴자 혼텐 — 15:30 예약 · 각각 1자리씩 다른 걸로 · 사업자카드 16만원 (받아야 하는 돈)</li><li>아이폰에 교통카드 등록 (각자)</li><li>항아님 디즈니랜드 집중 공략 — 푸의 허니헌트 · 몬스터주식회사 (줄서기 앱 무료) / 미녀와야수 · 스플래시 마운틴 (유료 DPA)</li></ul>" +
        "<h4>현지 지출 (노션 기록)</h4><table class='wsref'><tr><th>날</th><th>주요 지출</th><th>합계</th></tr>" +
        "<tr><td>회비</td><td>100,000엔 + 100,000엔 + 79,500엔</td><td>279,500엔</td></tr>" +
        "<tr><td>11/10 1일차</td><td>스이카 충전 30,000 · NEX 9,750 · 점심 스시미도리 13,970 · 카멜백 2,793 · 에타 600 · 슈퍼 1,733 · 긴급여권비+간식 10,000 등</td><td>92,100엔</td></tr>" +
        "<tr><td>11/11 2일차</td><td>고르곤졸라 치케 2,700 · 스타벅스 말차 1,453 + 3,780 · 택시 2,500 · 샤브샤브 19,900 등</td><td>31,569엔 (남은 180,091엔)</td></tr>" +
        "<tr><td>11/12 3일차</td><td>아침 카레 3,050 · DPA 6,000 + 4,500 · 간식 2,550 · 각자 환급 20,000×3 · 치즈케이크 5,913 · 테판야끼 코스 65,400 등</td><td>148,413엔 (잔액 31,678엔)</td></tr>" +
        "<tr><td>11/13 4일차</td><td>택시 900 + 800 · 모츠나베 6,235 · NEX 9,750</td><td>18,685엔 (12,993엔 남음 → 인당 4,300엔 환급)</td></tr>" +
        "<tr><td>3일간 총 경비</td><td></td><td><b>290,767엔</b></td></tr></table>",
      "2026": "<h4>예약할 것들</h4><ul><li>숙소 — 에어비앤비 예약 완료 (하카타역 근처)</li><li>비행기표 + 여행자보험 — 9월 중 같이 등록</li><li>프렌치 레스토랑 하나노키 (오호리공원) — 3일차 점심 예약</li><li>빵집 중 예약되는 곳 있으면 예약</li><li>짐 배송 — 델리백 문의 (9일 공항→숙소 / 11일 숙소→공항)</li></ul>" +
        "<h4>동선 메모</h4><ul><li>오호리 공원 쪽 — 자크 오호리점 · 쿠루미 · 아맘다코탄</li><li>모모토세 — 아베키</li><li>메이카페 — 파티스리 조르주 마르소 와타나베도리 본점 · 폴폴베이커리</li></ul>" +
        "<h4>경비 산출 (2박 3일)</h4><ul><li>아침 10만원 · 점심 10만원 · 저녁 10만원 = 교통비 포함 총 80만원</li><li>1일차 개별 미션 — 1인 최대 20만원 (점심·커피·디저트·저녁거리 포함, 영수증 보관)</li></ul>"
    };
    function renderMeet() {
      var y = String(yearEl.value || "2026");
      var list = MEET[y] || [];
      for (var i = 1; i <= 4; i++) {
        var m = list[i - 1];
        var box = document.getElementById("wsMt" + i);
        if (!box) continue;
        box.hidden = !m;
        if (!m) continue;
        box.querySelector(".wsmtt").textContent = m.t;
        box.querySelector(".wsmtd").textContent = m.d;
        box.querySelector(".wsmtnote").innerHTML = m.h;
      }
      var ref = document.getElementById("wsRef");
      if (ref) ref.innerHTML = REF[y] || "<p class='tnote'>이 해에는 옮겨 온 자료가 없습니다.</p>";
    }
    function key() { return "cafesui.ws." + (yearEl.value || "2026"); }
    var base = {};   // 마지막으로 읽어온 값 — 저장할 때 이것과 다른 칸만 「내가 고친 것」으로 본다
    function snapBase() { ins.forEach(function (el) { base[el.dataset.k] = el.type === "checkbox" ? (el.checked ? 1 : "") : (el.value || ""); }); }
    function load() {
      var data = {};
      try {
        var raw = localStorage.getItem(key());
        if (raw) data = JSON.parse(raw) || {};
      } catch (e) {}
      // 그 해에 적어둔 게 없으면 노션에서 가져온 내용을 깔아준다
      var seed = SEED[yearEl.value] || {};
      Object.keys(seed).forEach(function (k) {
        if (data[k] === undefined) data[k] = seed[k];   // 지운 칸은 그대로 비워둔다
      });
      grow(data);
      var by = data._by || {};
      ins.forEach(function (el) {
        if (el.type === "checkbox") el.checked = !!data[el.dataset.k];
        else { el.value = data[el.dataset.k] || ""; paintBy(el, by[el.dataset.k]); }
      });
      count(); total(); paintMtg();
      if (typeof timetable === "function") timetable();
      renderMeet();
      snapBase();
    }
    function save() {
      var o = {}, stored = {}, prev = {};
      try { stored = JSON.parse(localStorage.getItem(key()) || "{}") || {}; } catch (e) {}
      prev = stored._by || {};
      var by = {}, me2 = meNow(), changedAny = false;
      var seed0 = SEED[yearEl.value] || {};
      // 저장돼 있는 것(다른 컴퓨터가 고쳤을 수 있음)을 바탕으로, 이 화면에서 건드린 칸만 바꿔 넣는다
      Object.keys(stored).forEach(function (k) { if (k !== "_by") o[k] = stored[k]; });
      Object.keys(prev).forEach(function (k) { by[k] = prev[k]; });
      ins.forEach(function (el) {
        var k = el.dataset.k;
        var cur = el.type === "checkbox" ? (el.checked ? 1 : "") : (el.value || "");
        var touched = !(k in base) || base[k] !== cur;
        if (!touched) { if (el.type !== "checkbox") paintBy(el, by[k]); return; }
        changedAny = true; base[k] = cur;
        if (el.type === "checkbox") { if (el.checked) o[k] = 1; else delete o[k]; delete by[k]; return; }
        if (!String(cur).trim()) {
          // 원래 있던 내용을 지웠으면 「비움」으로 남긴다
          if (seed0[k] !== undefined) o[k] = ""; else delete o[k];
          delete by[k]; return;
        }
        o[k] = cur;
        by[k] = prev[k] || me2 || "";
        paintBy(el, by[k]);
      });
      o._by = by;
      if (changedAny) { try { localStorage.setItem(key(), JSON.stringify(o)); } catch (e) {} }
      count();
    }
    // 다른 컴퓨터에서 바뀐 것 — 지금 적고 있는 칸만 빼고 화면에 바로 반영한다
    window.addEventListener("cs:remote", function (e) {
      var keys = (e.detail && e.detail.keys) || [];
      if (keys.indexOf(key()) < 0) return;
      var a = document.activeElement, keep = (a && ins.indexOf(a) >= 0) ? [a, a.value, base[a.dataset.k]] : null;
      var wasEdit = !!(document.getElementById("wsEdit") && document.getElementById("wsEdit").classList.contains("on"));
      load();
      if (keep) { keep[0].value = keep[1]; base[keep[0].dataset.k] = keep[2]; save(); }
      setEdit(wasEdit);
      groupWish();
    });
    function count() {
      var n = ins.filter(function (el) {
        return el.type === "checkbox" ? el.checked : el.value.trim(); }).length;
      if (msg) msg.textContent = n ? n + "개 작성됨" : "";
    }
    function total() {
      var sum = 0, any = false;
      document.querySelectorAll(".wstable.cost").forEach(function (t) {
        var s2 = 0, a2 = false;
        t.querySelectorAll(".wsin.cost").forEach(function (el) {
          var v = parseFloat(String(el.value).replace(/,/g, ""));
          if (!isNaN(v)) { s2 += v; a2 = true; sum += v; any = true; }
        });
        var c = t.querySelector(".wstotal"); if (c) c.textContent = a2 ? s2.toLocaleString("ko-KR") : "—";
      });
      totEl.textContent = any ? sum.toLocaleString("ko-KR") : "—";
      // 일차별 날짜를 제목 옆에
      [1, 2, 3].forEach(function (d) {
        var di = document.querySelector('.wsdin[data-k="d' + d + 'date"]'), h = document.querySelector('.wsdayd[data-cd="' + d + '"]');
        if (h) h.textContent = di && di.value ? di.value.slice(5).replace("-", "/") : "";
      });
    }

    var now = new Date();
    yearEl.value = now.getFullYear();
    load();
    document.querySelectorAll(".wstable.cost tbody tr").forEach(ensureDel);
    setEdit(false);   // 일자별 일정표는 잠근 채로 시작
    groupWish();
    fillNov();
    yearEl.addEventListener("change", function () { load(); fillNov(); });

    // 워크샵은 해마다 11월. 날짜를 안 넣었으면 11월 둘째 주 월요일부터 깔아둔다.
    function fillNov() {
      var y = parseInt(yearEl.value, 10) || now.getFullYear();
      var d = new Date(y, 10, 1);                       // 11월 1일
      d.setDate(1 + ((8 - d.getDay()) % 7) + 7);        // 둘째 주 월요일
      var dates = Array.prototype.slice.call(document.querySelectorAll(".wsdin"));
      var filled = false;
      dates.forEach(function (el, i) {
        if (el.value) return;
        var x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
        el.value = x.getFullYear() + "-" +
          String(x.getMonth() + 1).padStart(2, "0") + "-" +
          String(x.getDate()).padStart(2, "0");
        filled = true;
      });
      if (filled) save();   // 열 때마다 통째로 다시 저장하지 않는다 (다른 컴퓨터가 고친 걸 덮어쓰는 사고 방지)
      timetable(); total();
    }
    // 1일차 날짜를 바꾸면 나머지 날도 따라 움직인다
    var firstDate = document.querySelector('.wsdin[data-k="d1date"]');
    if (firstDate) {
      firstDate.addEventListener("change", function () {
        if (!firstDate.value) return;
        var p = firstDate.value.split("-");
        document.querySelectorAll(".wsdin").forEach(function (el, i) {
          if (i === 0) return;
          var x = new Date(+p[0], +p[1] - 1, +p[2] + i);
          el.value = x.getFullYear() + "-" +
            String(x.getMonth() + 1).padStart(2, "0") + "-" +
            String(x.getDate()).padStart(2, "0");
        });
        save();
        timetable();
      });
    }
    ins.forEach(function (el) {
      el.addEventListener(el.type === "checkbox" ? "change" : "input", function () {
        save(); total(); paintMtg();
      });
    });

    // 적는 대로 오른쪽에 타임테이블이 생긴다
    var ttEl = document.getElementById("wsTime");
    var WDN2 = ["일", "월", "화", "수", "목", "금", "토"];
    function esc2(v) {
      return String(v == null ? "" : v).replace(/&/g, "&amp;")
        .replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    function pad2(t) {
      var m = String(t).match(/^\s*(\d{1,2})\s*[:.시]?\s*(\d{2})?/);
      if (!m) return null;
      return String(+m[1]).padStart(2, "0") + ":" + (m[2] || "00");
    }
    function timetable() {
      if (!ttEl) return;
      var day = document.querySelector(".wsday:not([hidden])");
      if (!day) return;
      var d = day.dataset.day;
      var dateEl = day.querySelector(".wsdin");
      var head = '<div class="ttday">' + d + "일차</div>";
      if (dateEl && dateEl.value) {
        var p = dateEl.value.split("-");
        var wd = WDN2[new Date(+p[0], +p[1] - 1, +p[2]).getDay()];
        head += '<div class="ttmeta">' + (+p[1]) + "월 " + (+p[2]) + "일 (" + wd + ")</div>";
      } else {
        head += '<div class="ttmeta">날짜를 넣으면 여기 나옵니다</div>';
      }

      var rows = [], last = "", i = 0;
      day.querySelectorAll("tbody tr").forEach(function (tr) {
        var cells = tr.querySelectorAll("input");
        var t = cells[0].value.trim();
        var plan = cells[1].value.trim();
        var memo = cells[2].value.trim();
        if (!plan && !memo) return;
        var key = pad2(t);
        // 「12:30」 다음 줄에 「2:00」처럼 적으면 오후 2시로 본다 (표 순서가 곧 하루 순서)
        if (key && last && key < last) { var hh = +key.slice(0, 2); if (hh < 12) key = String(hh + 12).padStart(2, "0") + key.slice(2); }
        if (key) last = key;
        rows.push({ raw: t, key: key || last || "99:99", i: i++, plan: plan, memo: memo,
                    shown: !!key });
      });
      rows.sort(function (a, b) {
        return a.key < b.key ? -1 : a.key > b.key ? 1 : a.i - b.i;
      });
      if (!rows.length) {
        ttEl.innerHTML = head + '<div class="rpempty">왼쪽에 일정을 적으면' +
          '<br>여기에 시간순으로 정리됩니다</div>';
        return;
      }
      ttEl.innerHTML = head + rows.map(function (r) {
        return '<div class="ttrow"><span class="tttime' + (r.shown ? "" : " none") +
          '">' + (r.shown ? esc2(r.raw) : "·") + "</span>" +
          '<span class="ttbody">' + (r.plan ? "<b>" + esc2(r.plan) + "</b>" : "") +
          (r.memo ? "<span>" + esc2(r.memo) + "</span>" : "") + "</span></div>";
      }).join("");
    }
    ins.forEach(function (el) {
      el.addEventListener("input", timetable);
      el.addEventListener("change", timetable);
    });
    timetable();

    var dtabs = Array.prototype.slice.call(document.querySelectorAll(".wsdtab"));
    // 지난 워크샵 카드를 누르면 그 해로 넘어간다
    document.querySelectorAll(".wpcard").forEach(function (c) {
      c.addEventListener("click", function () {
        yearEl.value = c.dataset.y;
        load(); fillNov(); timetable(); setEdit(false); groupWish();
        document.querySelectorAll(".wpcard").forEach(function (o) {
          o.setAttribute("aria-pressed", String(o === c));
        });
        if (msg) msg.textContent = c.dataset.y + "년 워크샵을 열었습니다";
        var head = yearEl.closest(".lgbar");
        if (head) head.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    dtabs.forEach(function (t) {
      t.addEventListener("click", function () {
        dtabs.forEach(function (o) {
          var on = o === t;
          o.setAttribute("aria-selected", String(on));
          var p = document.getElementById(o.dataset.d);
          if (p) p.hidden = !on;
        });
        timetable();
      });
    });
  })();

  // 일하는 자세 — 기본은 간략, 눌러서 전체
  (function () {
    var grid = document.getElementById("prinGrid");
    var btn = document.getElementById("prinMore");
    if (!grid || !btn) return;
    grid.querySelectorAll(".pcard").forEach(function (c) {
      if (c.querySelectorAll("li").length > 2) c.classList.add("more");
    });
    btn.addEventListener("click", function () {
      var brief = grid.classList.toggle("brief");
      btn.textContent = brief ? "자세히 보기" : "간략히";
    });
  })();

  // 연간 캘린더 — 해마다 요일이 바뀌니 열 때마다 다시 그린다.
  //                일정도 그 자리에서 고칠 수 있다.
  (function () {
    var grid = document.getElementById("yyGrid");
    var tabsEl = document.getElementById("ycTabs");
    var wrap = document.getElementById("ycWrap");
    if (!grid || !tabsEl || !wrap) return;

    var BASE = [{"id":20,"m":1,"d":10,"t":"겨울 감귤류 라인","a":"천혜향·한라봉·귤 요거트 케이크 구간. 딸기와 함께 겨울 주력.","c":"fruit"},{"id":60,"m":1,"d":25,"t":"발렌타인데이 준비 회의","a":"컨셉·케이크 디자인 회의. 딸기 생크림 하트 사진 촬영. 이름텍 제작.","c":"event"},{"id":61,"m":2,"d":14,"t":"발렌타인데이","a":"네이버 플레이스 발렌타인 노출. 케이크 이름텍 세팅.","c":"event"},{"id":1,"m":3,"d":1,"t":"빙수 개발 시작","a":"올해 빙수 라인업 정하기. 작년 판매량(토마토>옥수수>우유 순) 보고 뺄 것/넣을 것 결정. 제빙기 청소·점검.","c":"bingsu"},{"id":21,"m":3,"d":1,"t":"딸기 마무리 준비","a":"딸기 시즌 후반. 공판장 상황 보며 입고량 조절. 딸기 케이크 예약 마감 시점 정하기.","c":"fruit"},{"id":62,"m":3,"d":1,"t":"화이트데이 준비","a":"컨셉 회의 → 세트 구성 → 프린트해서 매장 게시.","c":"event"},{"id":63,"m":3,"d":14,"t":"화이트데이","a":"세트 판매. 딸기·꽃 픽업 일정 확인.","c":"event"},{"id":2,"m":4,"d":1,"t":"빙수 세미 테스트","a":"레시피 1차 테스트. 맛 잡기.","c":"bingsu"},{"id":3,"m":4,"d":4,"t":"빙수 최종 테스트","a":"레시피·디자인·사진 전부 확정. 이날 사진까지 다 찍어야 메뉴판 작업이 5월 전에 끝난다.","c":"bingsu"},{"id":4,"m":4,"d":20,"t":"빙수 메뉴판·가격표·포스터 준비","a":"아이패드 메뉴판, 프린트 메뉴판, 가격표, 포스터, 배민·쿠팡 상품등록까지 미리. 1인용/2인용 구분해서 작업.","c":"bingsu"},{"id":80,"m":4,"d":25,"t":"망고꽃다발 준비 — 자재 작업","a":"프릴 재단(한판 사이즈 + 반짝 사이즈), PET 띠지 작업. 꽃다발은 만드는 데 시간이 오래 걸리니 자재를 미리 다 잘라둬야 당일 작업이 밀리지 않는다.","c":"menu"},{"id":5,"m":5,"d":1,"t":"빙수 판매 시작","a":"영업시간 11:00-18:30 로 전환. 우유베이스·토마토소스 프렙 시작. 빙수 나오는 시간 SNS 업로드.","c":"bingsu"},{"id":81,"m":5,"d":1,"t":"망고꽃다발 판매 시작 · 전사 목표","a":"전사 목표를 잡고 시작한다. 기준: 한판 80개 + 미니 50개 = 총 130개.\n인스타그램에 계속 올린다(될 때까지). 어버이날·스승의날 수요와 겹친다.","c":"menu"},{"id":64,"m":5,"d":5,"t":"어린이날","a":"케이크 주문 소폭 발생. 가족 단위 방문 대비.","c":"event"},{"id":65,"m":5,"d":8,"t":"어버이날","a":"카네이션 픽·선물세트 수요. 꽃다발 케이크 준비.","c":"event"},{"id":22,"m":5,"d":15,"t":"멜론(허니듀) 시작","a":"멜론 케이크 출시. 거래처가 허니듀로 바꿔서 나올 수 있으니 입고 시 품종 확인.","c":"fruit"},{"id":6,"m":6,"d":1,"t":"빙수 성수기 진입","a":"판매량 피크 구간. 매일 6~10개. 재료 재고 넉넉히. 3인 체제 유지.","c":"bingsu"},{"id":23,"m":6,"d":1,"t":"초당옥수수 시작","a":"초당옥수수 케이크 시작. 삶고 알 떼는 작업 시간을 미리 잡아둘 것.","c":"fruit"},{"id":82,"m":6,"d":30,"t":"망고꽃다발 마무리 · 다음 과일 판단","a":"꽃다발 끝나갈 때 복숭아를 당길지 멜론을 당길지 결정한다.","c":"menu"},{"id":24,"m":7,"d":1,"t":"복숭아 시작","a":"복숭아 조림 작업 시간이 길어서 케이크 작업이 밀린다. 작업 순서 미리 조정할 것.","c":"fruit"},{"id":25,"m":8,"d":1,"t":"무화과·샤인머스캣 시작","a":"무화과는 일 6개로 고정 생산. 나머지는 잘 나가는 것 추가생산.","c":"fruit"},{"id":28,"m":8,"d":15,"t":"초당옥수수 종료 · 밤 준비","a":"초당옥수수는 8월 중순에 끝난다. 이때부터 밤타르트 필링을 미리 만들어 두고 9월 밤 라인으로 넘어간다.","c":"fruit"},{"id":26,"m":9,"d":15,"t":"복숭아 종료","a":"복숭아는 9월 중순까지. 이후 재고 남기지 말 것.","c":"fruit"},{"id":27,"m":9,"d":20,"t":"무화과 마무리","a":"9월 20일에서 말일 사이에 끝난다. 공판장 상황 보며 소진하고 메뉴에서 내리기. 샤인머스캣은 12월까지 이어간다.","c":"fruit"},{"id":66,"m":11,"d":1,"t":"수능 선물 준비","a":"수능 선물 문의가 들어온다. 딸기 미리 수량 확보. 인스타에 안내.","c":"event"},{"id":29,"m":11,"d":10,"t":"첫딸기 시즌 시작","a":"11월 10~20일 사이에 첫 딸기가 들어온다. 공판장 상황 보며 수량 확보. 수능 선물 수요와 크리스마스 예약이 겹치는 시기.","c":"fruit"},{"id":67,"m":11,"d":25,"t":"크리스마스 케이크 예약 오픈","a":"12/1 네이버 마케팅 메시지 발송(크리스마스 케이크 안내). 예약 디데이 마감일 정해서 공지.","c":"event"},{"id":68,"m":12,"d":22,"t":"크리스마스 피크 주간 (12/22~25)","a":"1년 중 가장 바쁜 나흘. 예약 픽업을 시간대별로 쪼개서 정리하고 인력을 추가 배치한다. 딸기·생크림·시트를 넉넉히 확보하고, 당일 현장 판매분도 남겨둘 것.","c":"event"},{"id":69,"m":12,"d":26,"t":"망년회 · 신년회 주간 (12/26~31)","a":"단체 예약과 모임용 케이크 주문이 들어오는 구간. 단체 문의를 미리 받아두고 생산량을 잡는다. 직원 회식·휴무 일정도 이 주에 정한다.","c":"event"}];
    var WEA = {"1":["한파","가장 추운 달. 매장 방문이 줄고 배달·택배 비중이 올라간다. 딸기·감귤류가 주력."],"2":["늦추위","아직 춥다. 설날·발렌타인으로 예약이 몰리는 달."],"3":["풀리기 시작","★ 딸기가 마무리로 가고 빙수 개발을 시작하는 기점. 제빙기 점검도 지금."],"4":["따뜻해짐","손님이 늘기 시작. 빙수 테스트·메뉴판·사진 작업하기 좋은 시기."],"5":["더워지기 시작","★ 빙수를 여는 기점. 영업시간을 11:00–18:30 으로 바꾼다."],"6":["장마","★ 비 오는 날은 빙수가 뚝 떨어진다. 날씨 보고 망고·재료 발주량을 줄일 것."],"7":["본격 더위","빙수 성수기. 매일 6~10개씩 나간다. 재료가 끊기지 않게."],"8":["폭염","★ 더위에 체리가 물러 못 쓴다. 8/10 전후로 체리를 내린다. 샤인머스캣·무화과 시작."],"9":["한풀 꺾임","★ 낮엔 아직 덥지만 빙수가 떨어진다. 추석 지나면 급감 — 재료 소진 맞춰 마무리."],"10":["선선함","케이크 판매가 회복된다. 밤 라인으로 넘어가되 샤인머스캣은 계속."],"11":["쌀쌀해짐","★ 첫딸기가 10~20일 사이에 들어온다. 수능·크리스마스 예약이 겹치니 수량을 미리 확보."],"12":["추위","★ 1년 중 가장 바쁜 달. 12/22~25 크리스마스 피크, 12/26~31 망년회·신년회. 배달이 늘고 매장은 예약 위주로 돌아간다."]};
    var SEA = {"1":"겨울","2":"겨울","3":"봄","4":"봄","5":"봄","6":"여름","7":"여름","8":"여름","9":"가을","10":"가을","11":"겨울","12":"겨울"};
    var HOL = {"1":"설날","2":"설날","9":"추석","10":"추석"};
    var CATS = {"bingsu":["c-bing","빙수"],"fruit":["c-fruit","과일"],"holiday":["c-hol","명절"],"giftset":["c-gift","선물세트"],"event":["c-ev","기념일"],"order":["c-ord","발주·관리"],"menu":["c-menu","메뉴"],"memo":["c-memo","메모·예약"],"log":["c-log","마감 일지"]};
    var ORDER = ["bingsu", "fruit", "menu", "event", "giftset", "order", "holiday"];
    var WDN = ["월", "화", "수", "목", "금", "토", "일"];
    var KEY = "cafesui.annual";
    var st = { edits: {}, adds: [] };
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var p = JSON.parse(raw) || {};
        st.edits = p.edits || {}; st.adds = p.adds || [];
      }
    } catch (e) {}
    function save() {
      try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
    }
    function esc(v) {
      return String(v == null ? "" : v).replace(/&/g, "&amp;")
        .replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    var now = new Date();
    var TM = now.getMonth() + 1, TY = now.getFullYear();
    function yearOf(m) { return m >= TM ? TY : TY + 1; }
    var cur = TM;

    // 기본 일정 + 고친 것 + 새로 넣은 것
    function list() {
      var out = [];
      BASE.forEach(function (e) {
        var ed = st.edits[e.id];
        if (ed && ed.del) return;
        out.push(ed ? { id: e.id, m: ed.m || e.m, d: ed.d || e.d,
                        t: ed.t != null ? ed.t : e.t,
                        a: ed.a != null ? ed.a : e.a,
                        c: ed.c || e.c, edited: true }
                    : { id: e.id, m: e.m, d: e.d, t: e.t, a: e.a, c: e.c });
      });
      st.adds.forEach(function (e) {
        out.push({ id: e.id, m: e.m, d: e.d, t: e.t, a: e.a, c: e.c,
                   edited: true, mine: true });
      });
      out.sort(function (x, y) { return x.m - y.m || x.d - y.d; });
      return out;
    }
    // 일지 탭 「이달 메모 달력」에 적은 것도 같이 보여준다 (그 해 그 달만)
    function noteItems(m) {
      var out = [], yr = yearOf(m), all = {};
      try { all = JSON.parse(localStorage.getItem("cafesui.daynotes") || "{}"); } catch (e) {}
      Object.keys(all).forEach(function (date) {
        if (date.slice(0, 4) != yr || +date.slice(5, 7) !== m) return;
        (all[date] || []).forEach(function (n, i) {
          out.push({ id: "n:" + date + ":" + i, m: m, d: +date.slice(8, 10), t: n.t,
                     a: "일지 메모 달력 · " + (n.by || "") + (n.at ? " " + n.at : ""), c: "memo", note: true });
        });
      });
      // 저장한 마감 일지도 그 날짜에 쌓인다 (📝 · 작성자 · 컴플레인/인계 있으면 표시)
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k.indexOf("cafesui.log.") !== 0) continue;
          var date = k.slice(12);
          if (date.slice(0, 4) != yr || +date.slice(5, 7) !== m) continue;
          var v = JSON.parse(localStorage.getItem(k) || "{}"), f = v.f || {};
          if (!Object.keys(f).length && !v.who) continue;
          var flags = [];
          if (f.lf170) flags.push("컴플레인"); if (f.lf180) flags.push("인계"); if (f.lf162) flags.push("폐기"); if (f.lf164) flags.push("예약");
          var brief = [f.lf170 ? "컴플레인: " + f.lf170 : "", f.lf180 ? "인계: " + f.lf180 : "", f.lf164 ? "내일 예약: " + f.lf164 : "", f.lf151 ? "손님: " + f.lf151 : ""].filter(Boolean).join(" · ");
          out.push({ id: "l:" + date, m: m, d: +date.slice(8, 10), t: "📝 " + (v.who || "일지") + (flags.length ? " · " + flags.join("·") : ""),
                     a: brief || "마감 일지 " + (v.savedAt ? "저장 " + v.savedAt : "작성 중"), c: "log", log: true });
        }
      } catch (e) {}
      return out;
    }
    function ofMonth(m) {
      return list().concat(noteItems(m)).filter(function (e) { return e.m === m; })
        .sort(function (x, y) { return x.d - y.d; });
    }
    function cls(c) { return (CATS[c] || CATS.event)[0]; }
    function kname(c) { return (CATS[c] || CATS.event)[1]; }

    // 1년 한눈에
    function drawYear() {
      var html = "";
      for (var m = 1; m <= 12; m++) {
        var all0 = ofMonth(m);
        var logs = all0.filter(function (e) { return e.log; });
        var items = all0.filter(function (e) { return !e.log; });
        var w = WEA[m] || ["", ""];
        var chips = items.map(function (e) {
          return '<span class="yychip ' + cls(e.c) + (e.edited ? " edited" : "") +
            '"><b>' + e.d + '일</b>' + esc(e.t) + "</span>";
        }).join("") + (logs.length ? '<span class="yychip c-log"><b>📝</b>마감 일지 ' + logs.length + "일</span>" : "");
        html += '<button type="button" class="yycard' + (m === TM ? " now" : "") +
          (w[1].indexOf("★") === 0 ? " key" : "") + '" data-m="' + m + '">' +
          '<span class="yyh"><b>' + m + '월</b><i>' + SEA[m] + "</i>" +
          (HOL[m] ? '<em class="yyhol">' + HOL[m] + "</em>" : "") +
          (m === TM ? '<em class="yynow">이번 달</em>' : "") + "</span>" +
          '<span class="yyw">' + esc(w[0]) + "</span>" +
          (chips ? '<span class="yychips">' + chips + "</span>"
                 : '<span class="yynone">미리 챙길 일 없음</span>') + "</button>";
      }
      grid.innerHTML = html;
      grid.querySelectorAll(".yycard").forEach(function (c) {
        c.addEventListener("click", function () {
          cur = +c.dataset.m; drawTabs(); drawMonth();
          document.getElementById("ycalHead")
            .scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    }

    function drawTabs() {
      var html = "";
      for (var m = 1; m <= 12; m++) {
        var n = ofMonth(m).filter(function (e) { return !e.log; }).length;
        html += '<button type="button" class="yctab" role="tab" data-m="' + m +
          '" aria-selected="' + (m === cur) + '">' + m + "월<i>" +
          (n || "—") + "</i></button>";
      }
      tabsEl.innerHTML = html;
      tabsEl.querySelectorAll(".yctab").forEach(function (t) {
        t.addEventListener("click", function () {
          cur = +t.dataset.m; drawTabs(); drawMonth(); closeEdit();
        });
      });
    }

    function drawMonth() {
      var m = cur, yr = yearOf(m);
      var items = ofMonth(m);
      var byDay = {};
      items.forEach(function (e) { (byDay[e.d] || (byDay[e.d] = [])).push(e); });

      var first = new Date(yr, m - 1, 1);
      var lead = (first.getDay() + 6) % 7;          // 월요일 시작
      var ndays = new Date(yr, m, 0).getDate();
      var cells = "";
      for (var i = 0; i < lead; i++) cells += '<div class="ycpad"></div>';
      for (var d = 1; d <= ndays; d++) {
        var wd = (new Date(yr, m - 1, d).getDay() + 6) % 7;
        var evs = byDay[d] || [];
        cells += '<div class="yccell' + (wd === 6 ? " sun" : wd === 5 ? " sat" : "") +
          (evs.length ? " has" : "") + '" data-d="' + d + '">' +
          '<span class="ycd">' + d + "</span>" +
          evs.map(function (e) {
            return '<span class="ycev ' + cls(e.c) + (e.edited ? " edited" : "") +
              '" data-id="' + e.id + '">' + esc(e.t) + "</span>";
          }).join("") +
          (evs.length ? "" : '<span class="ycadd">+</span>') + "</div>";
      }

      var w = WEA[m] || ["", ""];
      var star = w[1].indexOf("★") === 0 ? " wkey" : "";
      var items2 = items.filter(function (e) { return !e.log; });
      var detail = items2.length ? items2.map(function (e) {
        return '<div class="item ' + cls(e.c) + '" data-id="' + e.id + '">' +
          '<span class="idate">' + e.m + "/" + e.d + "</span>" +
          '<span class="itop"><span class="ittl">' + esc(e.t) + "</span>" +
          '<span class="itag">' + kname(e.c) + "</span></span>" +
          '<span class="iact">' + esc(e.a) + "</span></div>";
      }).join("") : '<p class="none">이 달에는 미리 챙길 일이 없습니다.</p>';

      wrap.innerHTML =
        '<div class="ycsub">' + yr + "년 " + m + "월 · " + SEA[m] +
          (m === TM ? " · <b>이번 달</b>" : "") + "</div>" +
        '<div class="ycal">' +
          WDN.map(function (x, k) {
            return '<div class="ycw' + (k >= 5 ? " s" : "") + '">' + x + "</div>";
          }).join("") + cells + "</div>" +
        (HOL[m] ? '<div class="ycnote hol"><b>' + HOL[m] +
          "</b>음력이라 해마다 날짜가 다릅니다. 그 해 날짜를 확인해서 표시하세요.</div>" : "") +
        '<div class="ycnote' + star + '"><b>' + esc(w[0]) + "</b>" +
          esc(String(w[1]).replace(/^★\s*/, "")) + "</div>" +
        '<div class="ycdetail">' + detail + "</div>";

      wrap.querySelectorAll(".ycev").forEach(function (el) {
        el.addEventListener("click", function (ev) {
          ev.stopPropagation();
          if (String(el.dataset.id).indexOf("n:") === 0) { eMsg.textContent = ""; alert("일지 탭의 「이달 메모 달력」에서 고치거나 지웁니다"); return; }
          if (String(el.dataset.id).indexOf("l:") === 0) {
            var d0 = el.dataset.id.slice(2);
            if (window.__CS_OPEN_LOG) window.__CS_OPEN_LOG(d0);
            var tb = document.querySelector('.tab[data-p="tp4"]'); if (tb) tb.click();
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }
          openEdit(el.dataset.id, null);
        });
      });
      wrap.querySelectorAll(".item[data-id]").forEach(function (el) {
        el.addEventListener("click", function () {
          if (String(el.dataset.id).indexOf("n:") === 0) { alert("일지 탭의 「이달 메모 달력」에서 고치거나 지웁니다"); return; }
          openEdit(el.dataset.id, null);
        });
      });
      wrap.querySelectorAll(".yccell").forEach(function (c) {
        c.addEventListener("click", function () { openEdit(null, +c.dataset.d); });
      });
    }

    // ── 고치기 ─────────────────────────────────────────────────
    var box = document.getElementById("yEdit");
    var fTitle = document.getElementById("yeTitle");
    var fDay = document.getElementById("yeDay");
    var fCat = document.getElementById("yeCat");
    var fName = document.getElementById("yeName");
    var fAct = document.getElementById("yeAct");
    var bSave = document.getElementById("yeSave");
    var bDel = document.getElementById("yeDel");
    var bReset = document.getElementById("yeReset");
    var eMsg = document.getElementById("yeMsg");
    var editing = null;

    fCat.innerHTML = ORDER.map(function (k) {
      return '<option value="' + k + '">' + CATS[k][1] + "</option>";
    }).join("");

    function closeEdit() { box.hidden = true; editing = null; }
    function openEdit(id, day) {
      var e = id ? list().filter(function (x) { return String(x.id) === String(id); })[0]
                 : null;
      editing = e ? e.id : null;
      fTitle.textContent = e ? cur + "월 " + e.d + "일 · 일정 고치기"
                             : cur + "월 " + day + "일 · 일정 넣기";
      fDay.value = e ? e.d : day;
      fCat.value = e ? e.c : "event";
      fName.value = e ? e.t : "";
      fAct.value = e ? e.a : "";
      bDel.hidden = !e;
      bReset.hidden = !(e && e.edited && !e.mine);
      eMsg.textContent = "";
      box.hidden = false;
      box.scrollIntoView({ behavior: "smooth", block: "nearest" });
      fName.focus();
    }
    document.getElementById("yeClose").addEventListener("click", closeEdit);

    bSave.addEventListener("click", function () {
      var t = fName.value.trim();
      if (!t) { eMsg.textContent = "제목을 적어주세요"; return; }
      var d = Math.max(1, Math.min(31, parseInt(fDay.value, 10) || 1));
      var rec = { m: cur, d: d, t: t, a: fAct.value.trim(), c: fCat.value };
      if (editing == null) {
        rec.id = "u" + Date.now();
        st.adds.push(rec);
      } else if (String(editing).indexOf("u") === 0) {
        st.adds = st.adds.map(function (x) {
          return String(x.id) === String(editing) ?
            { id: x.id, m: rec.m, d: rec.d, t: rec.t, a: rec.a, c: rec.c } : x;
        });
      } else {
        st.edits[editing] = rec;
      }
      save(); drawYear(); drawTabs(); drawMonth();
      eMsg.textContent = "저장했습니다";
      closeEdit();
    });
    bDel.addEventListener("click", function () {
      if (editing == null) return;
      if (String(editing).indexOf("u") === 0) {
        st.adds = st.adds.filter(function (x) {
          return String(x.id) !== String(editing); });
      } else {
        st.edits[editing] = { del: true };
      }
      save(); drawYear(); drawTabs(); drawMonth(); closeEdit();
    });
    bReset.addEventListener("click", function () {
      if (editing == null) return;
      delete st.edits[editing];
      save(); drawYear(); drawTabs(); drawMonth(); closeEdit();
    });

    drawYear(); drawTabs(); drawMonth();
    window.__CS_ANNUAL_REFRESH = function () { drawYear(); drawTabs(); drawMonth(); };
  })();

  // 숫자는 천 단위로 끊어서 보여준다 (1000 -> 1,000)
  (function () {
    function group(v) {
      var raw = String(v).replace(/[^0-9.-]/g, "");
      if (raw === "" || raw === "-" || isNaN(parseFloat(raw))) return raw;
      var p = raw.split(".");
      return (+p[0]).toLocaleString("ko-KR") + (p.length > 1 ? "." + p[1] : "");
    }
    function bind(el) {
      if (el.dataset.cf) return;
      el.dataset.cf = "1";
      var run = function () {
        var g = group(el.value);
        if (g !== el.value) el.value = g;
      };
      el.addEventListener("blur", run);
      el.addEventListener("change", run);
      if (el.value) run();
    }
    document.querySelectorAll(".numfmt").forEach(bind);
    // 나중에 그려지는 칸도 잡는다
    var moT = null;
    var mo = new MutationObserver(function () {
      if (moT) return;
      moT = setTimeout(function () { moT = null; document.querySelectorAll(".numfmt:not([data-cf])").forEach(bind); }, 400);
    });
    mo.observe(document.body, { childList: true, subtree: true });
  })();

  // 월말회의 비교표 — 차이와 총합계를 자동으로 계산한다
  (function () {
    var cins = Array.prototype.slice.call(document.querySelectorAll(".cin"));
    if (!cins.length) return;
    var KEY = "cafesui.mtable";
    var st = {};
    try { var raw = localStorage.getItem(KEY); if (raw) st = JSON.parse(raw) || {}; }
    catch (e) {}

    function num(v) {
      var n = parseFloat(String(v).replace(/,/g, ""));
      return isNaN(n) ? null : n;
    }
    function fmt(n) { return (n > 0 ? "+" : "") + n.toLocaleString("ko-KR"); }

    function recalc() {
      // 합계행 채우기
      ["sales"].forEach(function (t) {
        ["prev", "now"].forEach(function (col) {
          var sum = 0, any = false;
          document.querySelectorAll('.cin[data-t="' + t + '"][data-col="' + col + '"]')
            .forEach(function (el) {
              if (el.dataset.total) return;
              var row = el.closest("tr");
              if (row && row.querySelector("th").textContent.indexOf("일 매출") === 0) return;
              var v = num(el.value);
              if (v !== null) { sum += v; any = true; }
            });
          var tot = document.querySelector(
            '.cin[data-t="' + t + '"][data-col="' + col + '"][data-total]');
          if (tot) tot.value = any ? sum.toLocaleString("ko-KR") : "";
        });
      });
      // 일 매출 = 총합계 ÷ 총 영업일 (영업일은 유입 표에 있다)
      ["prev", "now"].forEach(function (col) {
        var tot = document.querySelector('.cin[data-k="c' +
          (col === "prev" ? "y" : "n") + '5"]');
        var days = document.querySelector('.cin[data-k="c' +
          (col === "prev" ? "y" : "n") + '25"]');
        var per = document.querySelector('.cin[data-k="c' +
          (col === "prev" ? "y" : "n") + '6"]');
        if (!per) return;
        var t = tot ? num(tot.value) : null, d = days ? num(days.value) : null;
        per.value = (t !== null && d)
          ? Math.round(t / d).toLocaleString("ko-KR") : "";
        per.readOnly = true;
        // 직원당 일 매출 = 일 매출(총합계 ÷ 영업일수) ÷ 직원 수
        var c = col === "prev" ? "y" : "n";
        var staff = document.querySelector('.cin[data-k="c' + c + '8"]'), pst = document.querySelector('.cin[data-k="c' + c + '9"]');
        if (pst) { var sn = staff ? num(staff.value) : null; pst.value = (t !== null && d && sn) ? Math.round(t / d / sn).toLocaleString("ko-KR") : ""; pst.readOnly = true; }
      });
      // 차이
      document.querySelectorAll(".cdiff").forEach(function (td) {
        var id = td.dataset.for;
        var a = num((document.querySelector('.cin[data-k="cy' + id + '"]') || {}).value);
        var b = num((document.querySelector('.cin[data-k="cn' + id + '"]') || {}).value);
        if (a === null || b === null) { td.textContent = "—"; td.className = "cdiff"; return; }
        var d = b - a;
        td.textContent = d === 0 ? "0" : fmt(d);
        td.className = "cdiff" + (d > 0 ? " up" : d < 0 ? " down" : "");
      });
    }
    function save() {
      var o = {};
      cins.forEach(function (el) { if (el.value !== "") o[el.dataset.k] = el.value; });
      try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
    }
    cins.forEach(function (el) {
      if (st[el.dataset.k] !== undefined) el.value = st[el.dataset.k];
      el.addEventListener("input", function () { recalc(); save(); });
    });
    recalc();
  })();

  // 월말회의 · 매니저 평가 서식 — 저장하고 복사
  function bindForm(monthId, formId, msgId, copyId, clearId, keyBase, title, whoId,
                    reportId, tableSel, checkId, countId, rankId) {
    var mEl = document.getElementById(monthId);
    var form = document.getElementById(formId);
    if (!mEl || !form) return;
    var msg = document.getElementById(msgId);
    var whoEl = whoId ? document.getElementById(whoId) : null;
    var ins = Array.prototype.slice.call(form.querySelectorAll(".fin"));
    var box = checkId ? document.getElementById(checkId) : null;
    var cks = box ? Array.prototype.slice.call(box.querySelectorAll(".rck")) : [];
    var cntEl = countId ? document.getElementById(countId) : null;
    var rankEl = rankId ? document.getElementById(rankId) : null;
    // 이번에 사람이 직접 만진 칸만 기억한다 — 안 만진 칸은 저장할 때 절대 비우지 않는다 (예전 화면이 새 글을 덮는 사고 방지)
    var touched = {};
    ins.forEach(function (el) { el.addEventListener("input", function () { touched[el.dataset.k] = true; }); });
    cks.forEach(function (el) { el.addEventListener("change", function () { touched[el.dataset.k] = true; }); });
    // 성과급 등급 (월말 평가만) — 항목별 체크 비율의 평균 → S/A/B/C/D
    var gradeBox = (checkId === "rvChecks") ? document.getElementById("rvGrade") : null;
    var baseEl = null;
    var GRADES = [["S", 90, 20], ["A", 80, 15], ["B", 70, 10], ["C", 60, 5], ["D", 0, 0]];
    // 매니저급 / 점장급 — 점장급만 9번(점장 역할)을 보고 등급에 넣는다
    var levelBox = gradeBox ? rankEl : null;
    var level = "매니저";
    function applyLevel() {
      if (!levelBox || !box) return;
      if (rankEl && rankEl.value !== level) rankEl.value = level;
      box.querySelectorAll(".rvsec.lv-jj").forEach(function (sec) { sec.hidden = (level !== "점장"); });
      box.querySelectorAll(".rvsec.lv-mg").forEach(function (sec) { sec.hidden = (level === "점장"); });
      var note = document.getElementById("rvLevelNote");
      if (note) note.textContent = level === "점장" ? "점장: 공통 1~7번 + 점장 항목 9~15번(손익 · 인력 · 매장 점검 · 청소 정비 · CS · 제품 · 청결)으로 평가합니다"
                                                 : "매니저: 공통 1~7번 + 8번 「매니저 역할」로 평가합니다 · 직급을 점장으로 고르면 9~15번 점장 항목으로 바뀝니다";
      paintLast();
    }
    // 지난달에 적은 「아쉬웠던 것 · 다음 달 기대 · 사장님 피드백」을 위에 띄운다 — 달라졌는지 보면서 체크하라고
    function paintLast() {
      var el = document.getElementById("rvLast"); if (!el || !gradeBox) return;
      if (!whoEl || !whoEl.value) { el.hidden = true; return; }
      var cur = mEl.value || thisMonth();
      var d = new Date(+cur.slice(0, 4), +cur.slice(5, 7) - 2, 1);
      var prevYm = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      var data = loadMonth(prevYm);
      var items = data ? [["내가 아쉬웠던 행동", data.rv301], ["다음 달 기대했던 모습", data.rv302], ["사장님 · 아쉬웠던 것", data.rv311], ["사장님 · 개선하면 좋은 것", data.rv312]]
                         .filter(function (x) { return x[1] && String(x[1]).trim(); }) : [];
      if (!items.length) { el.hidden = true; return; }
      var g = gradeOfData(data);
      el.innerHTML = "<h4>🔁 지난달(" + (+prevYm.slice(5, 7)) + "월) 약속<small>" + (g ? g.letter + "등급 · " + g.pct + "%" : "") + "</small></h4>" +
        items.map(function (x) { return '<div class="li"><b>' + x[0] + "</b><span>" + esc(String(x[1]).trim()) + "</span></div>"; }).join("") +
        '<div class="ask">이번 달에 이게 실제로 달라졌나요? → 7번 「지난달 평가에서 아쉬웠던 것을 이번 달에 실제로 고쳤나요?」에서 솔직하게 체크</div>';
      el.hidden = false;
    }
    function secOn(sec) { return !sec.hidden; }
    function cksOn() { return cks.filter(function (c) { var sec = c.closest(".rvsec"); return !sec || !sec.hidden; }); }
    function letterOf(pct) { var g = GRADES[GRADES.length - 1]; for (var i = 0; i < GRADES.length; i++) if (pct >= GRADES[i][1]) { g = GRADES[i]; break; } return g; }
    // 저장된 어느 달이든 등급을 계산한다 (항목별 체크 비율 평균)
    var SECMAP = null;
    function secMap() {
      if (SECMAP || !box) return SECMAP;
      SECMAP = [];
      box.querySelectorAll(".rvsec").forEach(function (sec) {
        var ks = Array.prototype.map.call(sec.querySelectorAll(".rck"), function (c) { return c.dataset.k; });
        if (ks.length) SECMAP.push({ ks: ks, jj: sec.classList.contains("lv-jj"), mg: sec.classList.contains("lv-mg") });
      });
      return SECMAP;
    }
    function gradeOfData(data) {
      var m = secMap(); if (!m || !data) return null;
      var jj = (data._level || "매니저") === "점장";
      var on = 0, sum = 0, n = 0;
      m.forEach(function (o) {
        if (o.jj && !jj) return;
        if (o.mg && jj) return;
        var hit = o.ks.filter(function (k) { return data[k]; }).length; on += hit; sum += hit / o.ks.length; n++;
      });
      if (!on) return null;
      var pct = Math.round(sum / n * 100), g = letterOf(pct);
      return { pct: pct, letter: g[0], rate: g[2] };
    }
    function loadMonth(ym) {
      try { var raw = localStorage.getItem(keyBase + "." + ym + (whoEl && whoEl.value ? "." + whoEl.value : "")); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
    }
    // 설날·추석 상여 — 3~8월 평가는 추석에, 9~2월 평가는 설날에 모아서
    function periodOf(ym) {
      var y = +ym.slice(0, 4), m = +ym.slice(5, 7);
      if (m >= 3 && m <= 8) return { name: "추석", year: y, months: [[y, 3], [y, 4], [y, 5], [y, 6], [y, 7], [y, 8]] };
      var sy = m >= 9 ? y : y - 1;
      return { name: "설날", year: sy + 1, months: [[sy, 9], [sy, 10], [sy, 11], [sy, 12], [sy + 1, 1], [sy + 1, 2]] };
    }
    function prevPeriod(pd) {
      var f = pd.months[0]; var d = new Date(f[0], f[1] - 2, 1);
      return periodOf(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
    }
    function periodCard(pd, curYm, isNow) {
      var rows = "", pcts = [], done = 0;
      pd.months.forEach(function (ym) {
        var key = ym[0] + "-" + String(ym[1]).padStart(2, "0");
        var g = gradeOfData(loadMonth(key));
        if (g) { pcts.push(g.pct); done++; }
        rows += '<tr' + (key === curYm ? ' class="cur"' : "") + "><td>" + ym[1] + "월</td>" +
          (g ? '<td class="g g' + g.letter + '">' + g.letter + '</td><td class="r">' + g.pct + "% · " + (g.rate ? g.rate + "%" : "없음") + "</td>"
             : '<td class="g none">–</td><td class="r none">' + (key < curYm ? "평가 없음" : "아직") + "</td>") + "</tr>";
      });
      var f = pd.months[0], l = pd.months[5];
      var span = f[0] + "년 " + f[1] + "월 ~ " + (l[0] !== f[0] ? l[0] + "년 " : "") + l[1] + "월 평가";
      var sumHtml;
      if (pcts.length) {
        var avg = Math.round(pcts.reduce(function (a, b) { return a + b; }, 0) / pcts.length), g2 = letterOf(avg);
        sumHtml = '<div class="rvbsum"><b class="g' + g2[0] + '">' + g2[0] + "</b><span>" + pd.name + " 상여 " + (g2[2] ? "기본급의 " + g2[2] + "%" : "없음") + "</span>" +
                  "<em>" + done + "개월 평균 " + avg + "% · 달마다 비율이 다르면 달별 비율로 정산해도 됩니다 · 최종은 사장님 확정</em></div>";
      } else sumHtml = '<div class="rvbsum"><b class="gD">–</b><span>아직 평가한 달이 없습니다</span></div>';
      return '<div class="rvbcard' + (isNow ? " now" : "") + '"><h5>' + (pd.name === "설날" ? "🧧" : "🌕") + " " + pd.name + " " + pd.year + " 지급분" +
             (isNow ? "<small>지금 모으는 중</small>" : "<small>지난 기간</small>") + "</h5>" +
             '<div class="rvbsub">' + span + "</div><table>" + rows + "</table>" + sumHtml + "</div>";
    }
    function paintPeriods() {
      var el = document.getElementById("rvPeriods"); if (!el || !gradeBox) return;
      if (!whoEl || !whoEl.value) { el.innerHTML = '<div class="rvbcard"><div class="rvbsub">이름을 고르면 설날·추석 상여 등급이 달별로 모여 보입니다</div></div>'; return; }
      var cur = mEl.value || thisMonth();
      var now = periodOf(cur), prev = prevPeriod(now);
      var FROM = 2027;   // 상여 모아보기는 2027년 설날 지급분부터
      var html = "";
      if (prev.year >= FROM) html += periodCard(prev, cur, false);
      if (now.year >= FROM) html += periodCard(now, cur, true);
      if (!html) html = '<div class="rvbcard"><div class="rvbsub">상여 모아보기는 2027년 설날 지급분(2026년 9월 평가)부터 시작합니다</div></div>';
      el.innerHTML = html;
    }
    function gradeInfo() {
      if (!box) return null;
      var secs = [], total = 0, on = 0;
      box.querySelectorAll(".rvsec").forEach(function (sec) {
        if (sec.hidden) return;
        var all = Array.prototype.slice.call(sec.querySelectorAll(".rck"));
        if (!all.length) return;
        var hit = all.filter(function (c) { return c.checked; }).length;
        var ttl = sec.querySelector(".rvsh").textContent.replace(/^\s*\d+\s*/, "").replace(/\s*\d+ \/ \d+\s*$/, "").trim();
        secs.push({ t: ttl, hit: hit, all: all.length, pct: Math.round(hit / all.length * 100) });
        total += all.length; on += hit;
      });
      if (!on) return { on: 0, total: total, pct: 0, letter: null, rate: 0, secs: secs };
      var avg = secs.reduce(function (a, x) { return a + x.hit / x.all; }, 0) / secs.length;
      var pct = Math.round(avg * 100), g = letterOf(pct);
      return { on: on, total: total, pct: pct, letter: g[0], rate: g[2], secs: secs };
    }
    function won(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
    function paintGrade() {
      if (!gradeBox) return;
      var g = gradeInfo(); if (!g) return;
      var L = document.getElementById("rvGLetter"), P = document.getElementById("rvGPct");
      var R = document.getElementById("rvGRate"), B = document.getElementById("rvGBars");
      L.className = "rvgletter" + (g.letter ? " g" + g.letter : "");
      L.textContent = g.letter || "–";
      P.innerHTML = g.letter ? "체크 비율 평균 <b>" + g.pct + "%</b><br>" + g.on + " / " + g.total + " 체크" : "아래를 체크하면<br>등급이 매겨집니다";
      R.textContent = g.letter ? (g.rate ? "기본급의 " + g.rate + "%" : "없음 (D등급)") : "–";
      paintPeriods();
      B.innerHTML = g.secs.map(function (x) {
        return '<div class="rvgbar"><span>' + esc(x.t) + "</span><em>" + x.pct + "%</em><i><b style=\"width:" + x.pct + '%"></b></i></div>';
      }).join("");
    }

    function thisMonth() {
      var d = new Date();
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    }
    function key() {
      return keyBase + "." + (mEl.value || thisMonth()) +
             (whoEl && whoEl.value ? "." + whoEl.value : "");
    }
    function readKey(k) {
      try { var raw = localStorage.getItem(k); return raw ? (JSON.parse(raw) || {}) : {}; } catch (e) { return {}; }
    }
    function applyData(data) {
      var by = data._by || {};
      ins.forEach(function (el) {
        el.value = data[el.dataset.k] || "";
        el.classList.toggle("filled", !!el.value.trim());
        paintBy(el, by[el.dataset.k]);
      });
      cks.forEach(function (el) {
        el.checked = !!data[el.dataset.k];
        el.closest("tr").classList.toggle("done", el.checked);
      });
      if (levelBox) { level = data._level || ((data._rank || "").indexOf("점장") >= 0 ? "점장" : "매니저"); applyLevel(); }
      else if (rankEl) rankEl.value = data._rank || "";
      count();
    }
    function load() { touched = {}; applyData(readKey(key())); if (gradeBox) paintRecover(); }
    // 이 컴퓨터에 이전 저장본을 남긴다 (공유 안 함) — 다른 컴퓨터가 덮어써도 되살릴 수 있게
    var HIST_KEY = "cafesui.ui.hist." + keyBase;
    function histAll() { try { return JSON.parse(localStorage.getItem(HIST_KEY) || "{}") || {}; } catch (e) { return {}; } }
    function histPush(k, o) {
      try {
        var all = histAll(), list = all[k] || [];
        var js = JSON.stringify(o);
        if (list.length && list[list.length - 1].j === js) return;
        list.push({ t: Date.now(), j: js });
        if (list.length > 12) list = list.slice(list.length - 12);
        all[k] = list;
        var keys = Object.keys(all); if (keys.length > 40) { keys.sort(); delete all[keys[0]]; }
        localStorage.setItem(HIST_KEY, JSON.stringify(all));
      } catch (e) {}
    }
    function summarize(o) {
      var c = 0, mine = 0, boss = 0;
      Object.keys(o).forEach(function (k) {
        if (/^k\d+$/.test(k) && o[k]) c++;
        else if (/^rv30\d$/.test(k) && String(o[k]).trim()) mine++;
        else if (/^rv31\d$/.test(k) && String(o[k]).trim()) boss++;
      });
      return "체크 " + c + " · 본인 칸 " + mine + " · 사장님 칸 " + boss;
    }
    function whenStr(t) { var d = new Date(t); return (d.getMonth() + 1) + "/" + d.getDate() + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
    function paintRecover() {
      var el = document.getElementById("rvRecList"); if (!el) return;
      var cur = key(), html = "";
      // 1) 다른 이름·달에 적힌 사장님 피드백 (이름을 안 고르고 적은 경우가 많다)
      var others = [];
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k.indexOf(keyBase + ".") !== 0 || k === cur) continue;
          var o = readKey(k);
          var boss = [o.rv310, o.rv311, o.rv312].filter(function (v) { return v && String(v).trim(); });
          if (!boss.length) continue;
          var parts = k.slice(keyBase.length + 1).split(".");
          others.push({ k: k, label: parts[0] + (parts[1] ? " · " + parts[1] : " · (이름 안 고름)"), boss: boss });
        }
      } catch (e) {}
      others.sort(function (a, b) { return a.k < b.k ? 1 : -1; });
      html += '<div class="rvrh">다른 이름 · 달에 저장된 사장님 피드백</div>';
      html += others.length ? others.map(function (x, i) {
        return '<div class="rvri"><b>' + esc(x.label) + '</b><span>' + esc(x.boss.join(" / ")).slice(0, 160) + '</span><button type="button" class="wsmini" data-from="' + esc(x.k) + '">이 평가지로 가져오기</button></div>';
      }).join("") : '<div class="rvri none">없음</div>';
      // 2) 이 컴퓨터의 이전 저장본
      var list = (histAll()[cur] || []).slice().reverse();
      html += '<div class="rvrh">이 컴퓨터의 이전 저장본 (지금 이름 · 달)</div>';
      html += list.length ? list.map(function (h, i) {
        var o = {}; try { o = JSON.parse(h.j) || {}; } catch (e) {}
        return '<div class="rvri"><b>' + whenStr(h.t) + '</b><span>' + summarize(o) + '</span><button type="button" class="wsmini" data-hist="' + i + '">이 버전으로 되돌리기</button></div>';
      }).join("") : '<div class="rvri none">아직 없음 (이 컴퓨터에서 저장할 때마다 쌓입니다)</div>';
      el.innerHTML = html;
      el.querySelectorAll("[data-from]").forEach(function (b) {
        b.addEventListener("click", function () {
          var src = readKey(b.dataset.from), o = readKey(cur);
          var has = [o.rv310, o.rv311, o.rv312].some(function (v) { return v && String(v).trim(); });
          if (has && !window.confirm("지금 평가지의 사장님 피드백을 덮어씁니다. 가져올까요?")) return;
          ["rv310", "rv311", "rv312"].forEach(function (f) { if (src[f]) o[f] = src[f]; });
          o._by = o._by || {}; ["rv310", "rv311", "rv312"].forEach(function (f) { if (src._by && src._by[f]) o._by[f] = src._by[f]; });
          try { localStorage.setItem(cur, JSON.stringify(o)); } catch (e) {}
          load(); report();
          if (msg) msg.textContent = "가져왔습니다";
        });
      });
      el.querySelectorAll("[data-hist]").forEach(function (b) {
        b.addEventListener("click", function () {
          var h = list[+b.dataset.hist]; if (!h) return;
          if (!window.confirm("지금 내용을 " + whenStr(h.t) + " 저장본으로 되돌릴까요? (되돌리기 전 내용도 저장본에 남습니다)")) return;
          histPush(cur, readKey(cur));
          try { localStorage.setItem(cur, h.j); } catch (e) {}
          load(); report();
          if (msg) msg.textContent = "되돌렸습니다";
        });
      });
    }
    // 다른 컴퓨터에서 이 평가지가 바뀌면, 지금 쓰는 칸만 빼고 새 내용으로 바꿔 끼운다
    window.addEventListener("cs:remote", function (e) {
      var keys = (e.detail && e.detail.keys) || [];
      if (keys.indexOf(key()) < 0) return;
      var a = document.activeElement, keep = (a && ins.indexOf(a) >= 0) ? [a, a.value] : null;
      load();
      if (keep) { keep[0].value = keep[1]; keep[0].classList.toggle("filled", !!keep[1].trim()); touched[keep[0].dataset.k] = true; }
      report();
    });
    function count() {
      var n = ins.filter(function (el) { return el.value.trim(); }).length;
      if (msg) msg.textContent = n ? n + "개 작성됨" : "";
      if (!cks.length) return;
      var vis = cksOn();
      var on = vis.filter(function (el) { return el.checked; }).length;
      if (cntEl) cntEl.textContent = on + " / " + vis.length;
      if (box) box.querySelectorAll(".rvcnt").forEach(function (e) {
        var sec = e.dataset.s;
        var all = cks.filter(function (c) { return c.dataset.s === sec; });
        var hit = all.filter(function (c) { return c.checked; }).length;
        e.textContent = hit + " / " + all.length;
        e.classList.toggle("full", hit === all.length);
      });
      paintGrade();
    }
    function save() {
      var o = {}, stored = readKey(key()), prev = stored._by || {};
      var by = {}, me2 = meNow();
      ins.forEach(function (el) {
        var k = el.dataset.k;
        // 화면이 비어 있어도 직접 지운 게 아니면 저장돼 있던 글은 그대로 둔다
        if (!el.value.trim() && !touched[k] && stored[k] && String(stored[k]).trim()) {
          el.value = String(stored[k]); el.classList.add("filled");
        }
        if (!el.value.trim()) return;
        o[k] = el.value;
        by[k] = prev[k] || me2 || "";
        paintBy(el, by[k]);
      });
      cks.forEach(function (el) {
        var k = el.dataset.k;
        if (!el.checked && !touched[k] && stored[k]) { el.checked = true; el.closest("tr").classList.add("done"); }
        if (el.checked) o[k] = 1;
      });
      o._by = by;
      if (rankEl && rankEl.value.trim()) o._rank = rankEl.value.trim();
      if (levelBox) o._level = level;
      try { localStorage.setItem(key(), JSON.stringify(o)); } catch (e) {}
      if (gradeBox) histPush(key(), o);
      count();
    }

    // 쓰는 대로 오른쪽에 한 장짜리 보고서로 정리한다
    var repEl = reportId ? document.getElementById(reportId) : null;
    var NL = String.fromCharCode(10);
    function esc(v) {
      return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;");
    }
    function oneLine(v) {
      return v.split(NL).map(function (x) { return x.trim(); })
              .filter(Boolean).join(" / ");
    }
    function report() {
      var when = mEl.value || thisMonth();
      var head = when.replace("-", "년 ") + "월";
      var html = '<div class="rptitle">' + esc(title) + '</div>' +
                 '<div class="rpmeta">' + head +
                 (whoEl && whoEl.value ? " · " + esc(whoEl.value) : "") +
                 esc(rankEl && rankEl.value.trim() ? " · " + rankEl.value.trim() : "") +
                 '</div>';
      var rank = rankEl && rankEl.value.trim() ? " · " + rankEl.value.trim() : "";
      var text = ["[" + title + "] " + head +
                  (whoEl && whoEl.value ? " · " + whoEl.value : "") + rank];
      var any = false;

      if (tableSel) {
        document.querySelectorAll(tableSel).forEach(function (wrap) {
          var rows = "", lines = [];
          wrap.querySelectorAll("tbody tr").forEach(function (tr) {
            var a = tr.querySelector('[data-col="prev"]');
            var b = tr.querySelector('[data-col="now"]');
            var m = tr.querySelector(".memo");
            var av = a ? a.value.trim() : "", bv = b ? b.value.trim() : "";
            var mv = m ? m.value.trim() : "";
            if (!av && !bv && !mv) return;
            var name = tr.querySelector("th").firstChild.textContent.trim();
            var diff = tr.querySelector(".cdiff").textContent.trim();
            var val = (av || "—") + " → " + (bv || "—") +
                      (diff && diff !== "—" ? " (" + diff + ")" : "");
            rows += "<tr><th>" + esc(name) + "</th><td>" + esc(val) + "</td></tr>";
            lines.push(name + " " + val + (mv ? " — " + mv : ""));
          });
          if (!rows) return;
          any = true;
          var ttl = wrap.querySelector(".cmph").textContent;
          html += '<div class="rpsec"><h4>' + esc(ttl) + "</h4>" +
                  '<table class="rpnums">' + rows + "</table></div>";
          text.push("");
          text.push("[" + ttl + "]");
          text.push(lines.join(NL));
        });
      }

      if (box) {
        var rows = "", sum = [], miss = [];
        box.querySelectorAll(".rvsec").forEach(function (sec) {
          if (sec.hidden) return;
          var all = Array.prototype.slice.call(sec.querySelectorAll(".rck"));
          var hit = all.filter(function (c) { return c.checked; }).length;
          if (!hit) return;
          any = true;
          var ttl = sec.querySelector(".rvsh").firstChild.nextSibling.textContent ||
                    sec.querySelector(".rvsh").textContent;
          ttl = ttl.replace(/\s*\d+ \/ \d+\s*$/, "").trim();
          rows += "<tr><th>" + esc(ttl) + "</th><td>" + hit + " / " + all.length +
                  "</td></tr>";
          sum.push(ttl + " " + hit + "/" + all.length);
          all.forEach(function (c) {
            if (!c.checked) miss.push(c.closest("tr").querySelector(".rq").textContent);
          });
        });
        if (rows) {
          var vis2 = cksOn();
          var on = vis2.filter(function (c) { return c.checked; }).length;
          html += '<div class="rpsec"><h4>체크 결과' + (levelBox ? " (" + level + "급)" : "") + " · " + on + " / " + vis2.length +
                  '</h4><table class="rpnums">' + rows + "</table>";
          if (miss.length) {
            html += '<div class="rpitem"><b>아직 못 지킨 것 ' + miss.length + '가지</b>' +
                    "<span>" + esc(miss.join(" / ")) + "</span></div>";
          }
          html += "</div>";
          text.push("");
          text.push("[체크 결과" + (levelBox ? " · " + level + "급" : "") + "] " + on + " / " + vis2.length);
          text.push(sum.join(" · "));
          if (miss.length) {
            text.push("못 지킨 것: " + miss.join(" / "));
          }
          var g = gradeBox ? gradeInfo() : null;
          if (g && g.letter) {
            var gl = g.letter + "등급 (체크 비율 평균 " + g.pct + "%) → 성과급 " + (g.rate ? "기본급의 " + g.rate + "%" : "없음");
            var pdn = periodOf(when); gl += " · " + pdn.name + " " + pdn.year + " 지급분에 포함";
            html += '<div class="rpsec"><h4>성과급 등급</h4><div class="rpitem"><b>' + esc(gl) + "</b>" +
                    "<span>자동 계산 · 최종 등급은 월말 면담에서 사장님이 확정</span></div></div>";
            text.push("[성과급 등급] " + gl + " (자동 계산 · 면담에서 확정)");
          }
        }
      }

      form.querySelectorAll(".fsec").forEach(function (sec) {
        var items = "", lines = [];
        sec.querySelectorAll(".frow").forEach(function (row) {
          var el = row.querySelector(".fin");
          var v = (el.value || "").trim();
          if (!v) return;
          var name = row.querySelector(".flab span").textContent;
          items += '<div class="rpitem"><b>' + esc(name) + "</b><span>" +
                   esc(v) + "</span></div>";
          lines.push("· " + name + ": " + oneLine(v));
        });
        if (!items) return;
        any = true;
        var ttl = sec.querySelector(".fsh").textContent;
        html += '<div class="rpsec"><h4>' + esc(ttl) + "</h4>" + items + "</div>";
        text.push("");
        text.push("[" + ttl + "]");
        text.push(lines.join(NL));
      });

      if (!any) html += '<div class="rpempty">오른쪽에 쓰기 시작하면' +
                        '<br>여기에 정리됩니다</div>';
      if (repEl) repEl.innerHTML = html;
      return any ? text.join(NL) : "";
    }
    mEl.value = thisMonth();
    load();
    report();
    mEl.addEventListener("change", function () { load(); report(); });
    if (whoEl) whoEl.addEventListener("change", function () { load(); report(); });
    ins.forEach(function (el) {
      el.addEventListener("input", function () {
        el.classList.toggle("filled", !!el.value.trim());
        save();
        report();
      });
    });
    if (tableSel) {
      document.querySelectorAll(tableSel + " .cin").forEach(function (el) {
        el.addEventListener("input", report);
      });
    }
    cks.forEach(function (el) {
      el.addEventListener("change", function () {
        el.closest("tr").classList.toggle("done", el.checked);
        save();
        report();
      });
    });
    if (rankEl) rankEl.addEventListener("input", function () { save(); report(); });
    if (levelBox) rankEl.addEventListener("change", function () { level = rankEl.value === "점장" ? "점장" : "매니저"; applyLevel(); save(); report(); });

    document.getElementById(clearId).addEventListener("click", function () {
      if (!window.confirm("이 평가지의 체크와 글을 전부 지웁니다. 정말 지울까요?")) return;
      ins.forEach(function (el) { el.value = ""; el.classList.remove("filled"); touched[el.dataset.k] = true; });
      cks.forEach(function (el) {
        el.checked = false; el.closest("tr").classList.remove("done"); touched[el.dataset.k] = true;
      });
      save();
      report();
      if (msg) msg.textContent = "지웠습니다";
    });
    document.getElementById(copyId).addEventListener("click", function () {
      var text = report();
      if (!text) { if (msg) msg.textContent = "아직 쓴 내용이 없습니다"; return; }
      var done = function () { if (msg) msg.textContent = "복사됐습니다"; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fb);
      } else { fb(); }
      function fb() {
        var ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); }
        catch (e) { if (msg) msg.textContent = "복사가 안 됩니다"; }
        ta.remove();
      }
    });
  }
  bindForm("mtMonth", "mtForm", "mtMsg", "mtCopy", "mtClear",
           "cafesui.meeting", "카페스이 월말회의", null, "mtReport", ".cmpwrap");
  bindForm("rvMonth", "rvForm", "rvMsg", "rvCopy", "rvClear",
           "cafesui.review", "월말 성과 체크", "rvWho", "rvReport", null,
           "rvChecks", "rvCount", "rvRank");

  // 마감 일지 — 채우고 복사해서 텔레그램으로
  (function () {
    var dateEl = document.getElementById("lgDate");
    var whoEl = document.getElementById("lgWho");
    var msgEl = document.getElementById("lgMsg");
    var copyEl = document.getElementById("lgCopy");
    var clearEl = document.getElementById("lgClear");
    if (!dateEl) return;
    var inputs = Array.prototype.slice.call(document.querySelectorAll(".lgin[data-k]"));

    function today() {
      var d = new Date();
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
             "-" + String(d.getDate()).padStart(2, "0");
    }
    function keyFor() { return "cafesui.log." + (dateEl.value || today()); }
    window.__CS_OPEN_LOG = function (d) { dateEl.value = d; load(); report(); drawList(); };

    // base: 이 화면이 마지막으로 읽거나 저장한 값. 저장할 때 이 화면에서 바꾼 칸만 쓰고,
    // 안 건드린 칸은 서버(다른 기기)의 최신 내용을 그대로 둔다 — 옛 화면으로 남의 글을 덮어쓰는 사고 방지
    var base = {};
    // 「서비스 나간 것」은 폐기 칸으로 합쳤다 — 예전에 적어 둔 날만 그 칸을 보여준다 (기록은 그대로)
    function legacy163() {
      var el = document.querySelector('.lgin[data-k="lf163"]'); if (!el) return;
      var row = el.closest(".mrow2"); if (row) row.style.display = el.value.trim() ? "" : "none";
    }
    function load() {
      var data = {};
      try {
        var raw = localStorage.getItem(keyFor());
        if (raw) data = JSON.parse(raw) || {};
      } catch (e) {}
      var hb = document.getElementById("lgHol");
      if (hb) { var hv = (window.__CS_HOL || {})[dateEl.value || today()]; hb.textContent = hv ? "🇰🇷 " + hv : ""; hb.hidden = !hv; }
      whoEl.value = data.who || "";
      var by = data.by || {}, bl0 = data.bl || {}, ow0 = data.ow || {};
      base = {};
      inputs.forEach(function (el) {
        el.value = (data.f && data.f[el.dataset.k]) || "";
        base[el.dataset.k] = el.value;
        el.classList.toggle("filled", !!el.value.trim());
        paintLines(el, bl0[el.dataset.k], by[el.dataset.k], ow0[el.dataset.k]);
        tagAuthors(el, bl0[el.dataset.k], ow0[el.dataset.k]);
      });
      legacy163();
      var n = inputs.filter(function (el) { return el.value.trim(); }).length;
      msgEl.textContent = n ? n + "개 항목 작성됨" : "";
    }
    // 한 칸을 여러 사람이 이어 쓰면 칸 아래에 "쓴 사람: …" 을 각자 색으로 보여준다
    // 칸 안 글자색 — 줄마다 쓴 사람 색. 여러 사람이 쓴 긴 칸은 같은 글자를 색 입혀 위에 겹쳐 보여준다(입력은 그대로 칸에서).
    function paintLines(el, lineBy, first, own) {
      lineBy = lineBy || [];
      var names = []; lineBy.forEach(function (n) { if (n && names.indexOf(n) < 0) names.push(n); });
      var ov = el.nextElementSibling && el.nextElementSibling.classList.contains("lgov") ? el.nextElementSibling : null;
      var lines = el.value.split(String.fromCharCode(10));
      var marks = lines.map(function (ln) { return ownMask(ln, own); });
      var anyOwn = marks.some(function (m) { return m.indexOf(true) >= 0; });
      if (el.tagName !== "TEXTAREA" || (names.length < 2 && !anyOwn)) {
        if (ov) ov.remove();
        el.classList.remove("ovon");
        // 한 줄 칸 · 한 사람만 쓴 칸: 마지막으로 쓴 줄의 사람 색 (없으면 처음 쓴 사람)
        var last = ""; for (var i = lineBy.length - 1; i >= 0; i--) { if (lineBy[i]) { last = lineBy[i]; break; } }
        paintBy(el, last || first);
        return;
      }
      paintBy(el, "");
      if (!ov) { ov = document.createElement("div"); ov.className = "lgov"; ov.setAttribute("aria-hidden", "true"); el.parentNode.insertBefore(ov, el.nextSibling); }
      el.classList.add("ovon");
      // 사장님이 덧붙인 곳은 노란 형광 + 빨간 글씨 (다른 사람이 쓴 칸 안에서만)
      ov.innerHTML = lines.map(function (ln, i) {
        var n = lineBy[i] || first || "", whole = n === "사장님" && names.length > 1 && ln.trim();
        var body = whole ? '<span class="own">' + esc(ln) + "</span>" : ownHtml(ln, marks[i], esc);
        return '<span class="' + (WCLR[n] ? "w" + WCLR[n] : "") + '">' + (body || " ") + "</span>";
      }).join(String.fromCharCode(10)) + " ";
      placeOv(el, ov);
    }
    // 사장님 덧붙임 — 다른 사람 줄 안에 끼워 쓴 글은 그 글만 따로 기억한다 (ow: { 칸: [글, …] })
    function ownMask(ln, own) {
      var m = []; for (var i = 0; i < ln.length; i++) m.push(false);
      (own || []).forEach(function (t) { if (!t) return; var j = ln.indexOf(t); while (j >= 0) { for (var x = j; x < j + t.length; x++) m[x] = true; j = ln.indexOf(t, j + t.length); } });
      return m;
    }
    function ownRuns(ln, m) {
      var out = [], st = -1;
      for (var i = 0; i <= ln.length; i++) {
        if (i < ln.length && m[i]) { if (st < 0) st = i; }
        else if (st >= 0) { var t = ln.slice(st, i).replace(/^[\s\/]+|[\s\/]+$/g, ""); if (t.length >= 2) out.push(t); st = -1; }
      }
      return out;
    }
    function ownHtml(ln, m, fmt) {
      var out = "", st = 0;
      for (var i = 0; i <= ln.length; i++) {
        if (i === ln.length || (i > 0 && !!m[i] !== !!m[i - 1])) {
          var part = ln.slice(st, i);
          if (part) out += m[st] ? '<span class="own">' + fmt(part) + "</span>" : fmt(part);
          st = i;
        }
      }
      return out;
    }
    window.__CS_OWN = { mask: ownMask, html: ownHtml };
    function placeOv(el, ov) {
      requestAnimationFrame(function () {
        if (!ov.isConnected) return;
        var cs = getComputedStyle(el);
        ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth", "textIndent", "wordSpacing"].forEach(function (p) { ov.style[p] = cs[p]; });
        ov.style.top = el.offsetTop + "px"; ov.style.left = el.offsetLeft + "px";
        ov.style.width = el.offsetWidth + "px"; ov.style.height = el.offsetHeight + "px";
        ov.scrollTop = el.scrollTop;
      });
    }
    window.addEventListener("resize", function () { document.querySelectorAll(".lgov").forEach(function (ov) { var el = ov.previousElementSibling; if (el) placeOv(el, ov); }); });
    function tagAuthors(el, lineBy, own) {
      var row = el.closest(".mrow2"); if (!row) return;
      var names = []; (lineBy || []).forEach(function (n) { if (n && names.indexOf(n) < 0) names.push(n); });
      var tag = row.querySelector(".lgby");
      if (names.length < 2) { if (tag) tag.remove(); }
      else {
        if (!tag) { tag = document.createElement("i"); tag.className = "lgby"; row.appendChild(tag); }
        tag.innerHTML = "쓴 사람: " + names.map(function (n) { return '<b class="' + (WCLR[n] ? "w" + WCLR[n] : "") + '">' + esc(n === "사장님" ? n : n + "님") + "</b>"; }).join(" · ");
      }
      // 칸 아래 「👑 사장님 덧붙임」 — 직원이 쓴 칸에 사장님이 더 쓴 글을 크게 모아 보여준다
      var adds = [];
      el.value.split(String.fromCharCode(10)).forEach(function (ln, i) {
        if (!ln.trim()) return;
        if (names.length > 1 && (lineBy || [])[i] === "사장님") { adds.push(ln.trim()); return; }
        ownRuns(ln, ownMask(ln, own)).forEach(function (t) { adds.push(t); });
      });
      var box = row.querySelector(".lgown");
      if (!adds.length || el.tagName !== "TEXTAREA") { if (box) box.remove(); return; }
      if (!box) { box = document.createElement("div"); box.className = "lgown"; row.appendChild(box); }
      box.innerHTML = "<b>👑 사장님 덧붙임</b>" + adds.map(function (t) { return "<p>" + esc(t.replace(/^\s*[★⭐!！]\s*/, "").replace(/\*\*|__/g, "")) + "</p>"; }).join("");
    }
    function sameEnds(a, b) {
      var p = 0; while (p < a.length && p < b.length && a[p] === b[p]) p++;
      var q = 0; while (q < a.length - p && q < b.length - p && a[a.length - 1 - q] === b[b.length - 1 - q]) q++;
      return p + q;
    }
    // 「/」 로 이어 쓴 긴 글을 한 줄씩 나눈다 (쓴 사람 · 사장님 덧붙임 그대로). 9/26 같은 날짜 숫자, **…** · __…__ 안은 안 나눈다
    function splitSlash(ln) {
      var out = [], cur = "", inB = false, inU = false;
      for (var i = 0; i < ln.length; i++) {
        var two = ln.substr(i, 2);
        if (two === "**") { inB = !inB; cur += two; i++; continue; }
        if (two === "__") { inU = !inU; cur += two; i++; continue; }
        if (ln[i] === "/" && !inB && !inU && !(/[0-9]/.test(ln[i - 1] || "") && /[0-9]/.test(ln[i + 1] || ""))) { out.push(cur); cur = ""; continue; }
        cur += ln[i];
      }
      out.push(cur);
      return out.map(function (x) { return x.trim(); }).filter(Boolean);
    }
    var splitUndo = {};
    window.__CS_LOG_SPLIT = function (el, undo) {
      var NL = String.fromCharCode(10), k = el.dataset.k;
      if (undo) {
        var u = splitUndo[k]; delete splitUndo[k]; if (!u) return false;
        var o2 = {}; try { o2 = JSON.parse(localStorage.getItem(keyFor()) || "{}") || {}; } catch (e) {}
        if (!o2.f || o2.f[k] !== u.after) return false;
        o2.f[k] = u.f; o2.bl = o2.bl || {}; o2.bl[k] = u.bl; o2.ow = o2.ow || {}; if (u.ow) o2.ow[k] = u.ow; else delete o2.ow[k];
        try { localStorage.setItem(keyFor(), JSON.stringify(o2)); } catch (e) {}
        load(); report(); document.dispatchEvent(new Event("cs:log-loaded")); return true;
      }
      save();
      var o = {}; try { o = JSON.parse(localStorage.getItem(keyFor()) || "{}") || {}; } catch (e) {}
      if (!o.f || !o.f[k]) return false;
      var lines = o.f[k].split(NL), obl = (o.bl || {})[k] || [], first = (o.by || {})[k] || "", nv = [], nb = [];
      lines.forEach(function (ln, i) {
        if (!ln.trim()) { nv.push(ln); nb.push(""); return; }
        splitSlash(ln).forEach(function (p) { nv.push(p); nb.push(obl[i] || first); });
      });
      if (nv.length === lines.length) return false;
      var oow = (o.ow || {})[k], now2 = [];
      (oow || []).forEach(function (t) { splitSlash(t).forEach(function (p) { if (p.length >= 2 && now2.indexOf(p) < 0) now2.push(p); }); });
      splitUndo[k] = { f: o.f[k], bl: obl, ow: oow, after: nv.join(NL) };
      o.f[k] = nv.join(NL); o.bl = o.bl || {}; o.bl[k] = nb;
      if (now2.length) { o.ow = o.ow || {}; o.ow[k] = now2; }
      try { localStorage.setItem(keyFor(), JSON.stringify(o)); } catch (e) {}
      load(); report(); document.dispatchEvent(new Event("cs:log-loaded")); return true;
    };
    function save() {
      var NL = String.fromCharCode(10);
      var f = {}, prev = {}, old = {};
      try {
        old = JSON.parse(localStorage.getItem(keyFor()) || "{}") || {};
        prev = old.by || {};
        if (old.savedAt) prev.__savedAt = old.savedAt;
      } catch (e) {}
      var by = {}, me2 = meNow(), bl = {}, ow = {}, oldF = (old && old.f) || {}, oldBl = (old && old.bl) || {}, oldOw = (old && old.ow) || {};
      var oldBy = (old && old.by) || {};
      inputs.forEach(function (el) {
        var k = el.dataset.k;
        if (el.value === (base[k] || "") && (oldF[k] || "") !== el.value) {
          // 이 화면에서는 안 건드렸는데 다른 기기에서 바뀐 칸 — 서버 내용 그대로 두고 화면만 새로 채운다
          if (oldF[k]) { f[k] = oldF[k]; by[k] = oldBy[k] || ""; if (oldBl[k]) bl[k] = oldBl[k]; if (oldOw[k]) ow[k] = oldOw[k]; }
          if (document.activeElement !== el) {
            el.value = oldF[k] || ""; base[k] = el.value; el.classList.toggle("filled", !!el.value.trim());
            paintLines(el, oldBl[k], oldBy[k], oldOw[k]); tagAuthors(el, oldBl[k], oldOw[k]);
          }
          return;
        }
        base[k] = el.value;
        if (!el.value.trim()) return;
        f[k] = el.value;
        by[k] = prev[k] || me2 || "";
        // 줄 단위 작성자: 전에 있던 줄은 그 줄을 쓴 사람 그대로, 새로 적거나 고친 줄은 지금 사람
        // 단, 사장님이 직원 줄 중간에 끼워 쓰면 줄은 직원 것 그대로 두고, 끼워 쓴 글만 사장님 덧붙임으로 기억한다
        var pl = String(oldF[k] || "").split(NL), pb = oldBl[k] || [], po = oldOw[k] || [], usedI = {};
        var nl = el.value.split(NL), lb = [], pair = [], boss = me2 === "사장님";
        nl.forEach(function (ln, i) {
          if (!ln.trim()) { lb[i] = ""; return; }
          for (var j = 0; j < pl.length; j++) { if (!usedI[j] && pl[j] === ln) { usedI[j] = 1; pair[i] = j; lb[i] = pb[j] || prev[k] || me2 || ""; return; } }
        });
        nl.forEach(function (ln, i) {
          if (lb[i] !== undefined) return;
          var best = -1, bs = 0;
          for (var j = 0; j < pl.length; j++) { if (usedI[j] || !pl[j].trim()) continue; var c = sameEnds(pl[j], ln); if (c > bs) { bs = c; best = j; } }
          if (best >= 0 && bs >= Math.min(6, Math.ceil(pl[best].length / 2))) {
            usedI[best] = 1; pair[i] = best;
            var oa = pb[best] || prev[k] || "";
            lb[i] = boss && oa && oa !== "사장님" ? oa : (me2 || oa);
          } else lb[i] = me2 || prev[k] || "";
        });
        var owk = [];
        nl.forEach(function (ln, i) {
          if (!ln.trim()) return;
          var m;
          if (pair[i] === undefined) m = ownMask(ln, po);
          else {
            var o = pl[pair[i]], om = ownMask(o, po);
            if (o === ln) m = om;
            else {
              var a = 0; while (a < o.length && a < ln.length && o[a] === ln[a]) a++;
              var b = 0; while (b < o.length - a && b < ln.length - a && o[o.length - 1 - b] === ln[ln.length - 1 - b]) b++;
              var mid = []; for (var x = a; x < ln.length - b; x++) mid.push(boss && lb[i] !== "사장님");
              m = om.slice(0, a).concat(mid, om.slice(o.length - b));
            }
          }
          ownRuns(ln, m).forEach(function (t) { if (owk.indexOf(t) < 0) owk.push(t); });
        });
        bl[k] = lb;
        if (owk.length) ow[k] = owk;
        paintLines(el, bl[k], by[k], ow[k]);
        tagAuthors(el, bl[k], ow[k]);
      });
      var out = { who: whoEl.value, f: f, by: by, bl: bl };
      if (Object.keys(ow).length) out.ow = ow;
      if (prev.__savedAt) out.savedAt = prev.__savedAt;
      try { localStorage.setItem(keyFor(), JSON.stringify(out)); }
      catch (e) {}
      var n = Object.keys(f).length;
      msgEl.textContent = n ? n + "개 항목 작성됨" : "";
    }

    // 저장한 일지 목록 — 날짜를 눌러 지난 일지를 다시 연다
    var savedEl = document.getElementById("lgSaved");
    var countEl = document.getElementById("lgCount");
    var saveBtn = document.getElementById("lgSave");
    var PRE = "cafesui.log.";
    var WD2 = ["일", "월", "화", "수", "목", "금", "토"];

    function allLogs() {
      var out = [];
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k.indexOf(PRE) !== 0) continue;
          var v = JSON.parse(localStorage.getItem(k) || "{}");
          var n = v.f ? Object.keys(v.f).length : 0;
          if (!n && !v.who) continue;
          var d0 = k.slice(PRE.length), names = [];
          if (d0 >= "2026-09-25") {
            Object.keys(v.by || {}).forEach(function (fk) { var nm = v.by[fk]; if (nm && names.indexOf(nm) < 0) names.push(nm); });
            if (!names.length && v.who) names.push(v.who);
          }
          out.push({ d: d0, who: names.map(function (nm) { return nm === "사장님" ? nm : nm + "님"; }).join(" · "), n: n,
                     saved: v.savedAt || "" });
        }
      } catch (e) {}
      out.sort(function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : 0; });
      return out;
    }
    var shown = 20;
    function drawWeek() {
      var wk = document.getElementById("lgWeek"); if (!wk) return;
      var rows = allLogs(), byD = {};
      rows.forEach(function (r) { byD[r.d] = r; });
      var base = new Date(); base.setHours(0, 0, 0, 0);
      var h = "";
      for (var i = 0; i < 7; i++) {
        var t = new Date(base); t.setDate(base.getDate() - i);
        var d = t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
        var r = byD[d], wd = WD2[t.getDay()], sun = t.getDay() === 0;
        var st = r ? (r.saved ? '<span class="lgtag">저장됨</span>' : '<span class="lgtag draft">작성 중</span>') : (sun ? '<span class="lgtag off">정기휴무</span>' : '<span class="lgtag none">안 씀</span>');
        h += '<div class="lgrow wk' + (d === dateEl.value ? " on" : "") + (!r && !sun ? " miss" : "") + '" data-d="' + d + '">' +
          '<span class="lgd">' + (t.getMonth() + 1) + "/" + t.getDate() + " (" + wd + ")" + (i === 0 ? " <i>오늘</i>" : i === 1 ? " <i>어제</i>" : "") + "</span>" + st +
          '<span class="lgw">' + (r && r.who ? r.who : "") + "</span>" +
          '<span class="lgn">' + (r ? r.n + "항목" : "") + "</span>" +
          '<button type="button" class="lgopen">' + (r ? "열기" : "쓰기") + "</button></div>";
      }
      wk.innerHTML = h;
    }
    function drawList() {
      var rows = allLogs();
      drawWeek();
      countEl.textContent = rows.length ? rows.length + "일치" : "";
      if (!rows.length) {
        savedEl.innerHTML = '<div class="lgnone">저장한 일지가 아직 없습니다</div>';
        return;
      }
      // 달마다 접었다 펴는 묶음. 보고 있는 달은 펼쳐 둔다
      var months = [], curM = (dateEl.value || "").slice(0, 7);
      rows.forEach(function (r) { var m = r.d.slice(0, 7); if (months.indexOf(m) < 0) months.push(m); });
      var openState = {};
      savedEl.querySelectorAll(".lgmon").forEach(function (el) { openState[el.dataset.m] = el.open; });
      var rowHtml = function (r) {
        var p = r.d.split("-");
        var wd = WD2[new Date(+p[0], +p[1] - 1, +p[2]).getDay()];
        return '<div class="lgrow' + (r.d === dateEl.value ? " on" : "") +
          '" data-d="' + r.d + '">' +
          '<span class="lgd">' + (+p[1]) + "/" + (+p[2]) + " (" + wd + ")</span>" +
          '<span class="lgtag' + (r.saved ? "" : " draft") + '">' +
          (r.saved ? "저장됨" : "작성 중") + "</span>" +
          '<span class="lgw">' + (r.who || "") + "</span>" +
          '<span class="lgn">' + r.n + "항목</span>" +
          '<button type="button" class="lgopen">열기</button></div>';
      };
      savedEl.innerHTML = months.map(function (m) {
        var rs = rows.filter(function (r) { return r.d.slice(0, 7) === m; });
        var saved = rs.filter(function (r) { return r.saved; }).length;
        var isOpen = (m in openState) ? openState[m] : (m === curM);
        return '<details class="lgmon" data-m="' + m + '"' + (isOpen ? " open" : "") + '><summary>' + m.slice(0, 4) + "년 " + (+m.slice(5)) + "월" +
          "<span>" + rs.length + "일치 · 저장 " + saved + (rs.length - saved ? " · 작성 중 " + (rs.length - saved) : "") + "</span></summary>" +
          rs.map(rowHtml).join("") + "</details>";
      }).join("");
    }
    var weekEl = document.getElementById("lgWeek");
    if (weekEl) weekEl.addEventListener("click", function (e) {
      var row = e.target.closest(".lgrow"); if (!row) return;
      dateEl.value = row.dataset.d; load(); report(); drawList();
      msgEl.textContent = row.dataset.d + " 일지를 열었습니다";
      dateEl.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    savedEl.addEventListener("click", function (e) {
      var row = e.target.closest(".lgrow");
      if (!row) return;
      if (e.target.classList.contains("lgdel")) {
        try { localStorage.removeItem(PRE + row.dataset.d); } catch (x) {}
        if (row.dataset.d === dateEl.value) { load(); report(); }
        drawList();
        return;
      }
      dateEl.value = row.dataset.d;
      load();
      report();
      drawList();
      msgEl.textContent = row.dataset.d + " 일지를 열었습니다";
      dateEl.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    // 숫자 칸(생산 · 판매 · 입고) 중 빈 칸만 0으로
    var zeroBtn = document.getElementById("lgZero");
    if (zeroBtn) zeroBtn.addEventListener("click", function () {
      var n = 0;
      document.querySelectorAll(".lgngrid .lgnum input.lgin").forEach(function (el) {
        if (el.value.trim()) return;
        el.value = "0"; el.classList.add("filled"); n++;
      });
      if (n) { save(); report(); }
      msgEl.textContent = n ? "빈 칸 " + n + "개에 0을 채웠습니다" : "빈 숫자 칸이 없습니다";
    });
    // 다른 기기에서 이 날 일지가 바뀌면: 쓰는 중이 아닌 칸만 새 내용으로 바꿔 끼운다
    window.addEventListener("cs:remote", function (e) {
      var ks = (e.detail && e.detail.keys) || []; if (ks.indexOf(keyFor()) < 0) return;
      var data = {}; try { data = JSON.parse(localStorage.getItem(keyFor()) || "{}") || {}; } catch (er) {}
      var f0 = data.f || {}, by0 = data.by || {}, bl0 = data.bl || {}, ow0 = data.ow || {}, ch = false;
      inputs.forEach(function (el) {
        var k = el.dataset.k, nv = f0[k] || "";
        if (document.activeElement === el || el.value !== (base[k] || "")) return;
        if (el.value !== nv) { el.value = nv; base[k] = nv; el.classList.toggle("filled", !!nv.trim()); ch = true; }
        paintLines(el, bl0[k], by0[k], ow0[k]); tagAuthors(el, bl0[k], ow0[k]);
      });
      if (ch) document.dispatchEvent(new Event("cs:log-loaded"));
      legacy163();
      report();
    });
    saveBtn.addEventListener("click", function () {
      var n = inputs.filter(function (el) { return el.value.trim(); }).length;
      if (!n) { msgEl.textContent = "아직 쓴 내용이 없습니다"; return; }
      save();
      try {
        var raw = JSON.parse(localStorage.getItem(keyFor()) || "{}");
        var t = new Date();
        raw.savedAt = String(t.getHours()).padStart(2, "0") + ":" +
                      String(t.getMinutes()).padStart(2, "0");
        localStorage.setItem(keyFor(), JSON.stringify(raw));
        msgEl.textContent = (dateEl.value || today()) + " 일지 저장됨 · " + n + "항목";
      } catch (e) {
        msgEl.textContent = "이 기기에는 저장이 안 됩니다";
      }
      drawList();
    });

    dateEl.value = today();
    load();
    drawList();
    dateEl.addEventListener("change", function () { load(); drawList(); report(); });

    // 전날 · 다음 날 · 오늘로 넘기기
    function hop(n) {
      var p = (dateEl.value || today()).split("-");
      var d = new Date(+p[0], +p[1] - 1, +p[2]);
      d.setDate(d.getDate() + n);
      dateEl.value = d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");
      load(); drawList(); report();
      var WDX = ["일", "월", "화", "수", "목", "금", "토"];
      msgEl.textContent = (d.getMonth() + 1) + "월 " + d.getDate() + "일 (" +
        WDX[d.getDay()] + ") 일지";
    }
    document.getElementById("lgPrev").addEventListener("click", function () { hop(-1); });
    document.getElementById("lgNext").addEventListener("click", function () { hop(1); });
    document.getElementById("lgToday").addEventListener("click", function () {
      dateEl.value = today(); load(); drawList(); report();
      msgEl.textContent = "오늘 일지";
    });
    whoEl.addEventListener("change", save);
    inputs.forEach(function (el) {
      el.addEventListener("input", function () {
        el.classList.toggle("filled", !!el.value.trim());
        save();
      });
    });

    clearEl.addEventListener("click", function () {
      inputs.forEach(function (el) { el.value = ""; el.classList.remove("filled"); });
      save();
      report();
      drawList();
      msgEl.textContent = "지웠습니다";
    });

    // 쓰는 대로 오른쪽에 한 장짜리 보고서로 정리한다
    var repEl = document.getElementById("lgReport");
    var WDN = ["일", "월", "화", "수", "목", "금", "토"];
    function esc(v) {
      return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;");
    }
    function report() {
      var NL = String.fromCharCode(10);
      var d = dateEl.value || today();
      var p = d.split("-");
      var dt = new Date(+p[0], +p[1] - 1, +p[2]);
      var when = +p[0] + "년 " + (+p[1]) + "월 " + (+p[2]) + "일 (" +
                 WDN[dt.getDay()] + ")";
      var html = '<div class="rptitle">카페스이 마감 일지</div>' +
                 '<div class="rpmeta">' + when +
                 (whoEl.value ? " · 작성 " + esc(whoEl.value) : "") + '</div>';
      var text = ["[카페스이 마감 일지] " + when +
                  (whoEl.value ? " · 작성 " + whoEl.value : "")];
      var any = false;

      var nrows = "", nline = [];
      document.querySelectorAll(".lgng").forEach(function (g) {
        var gt = (g.querySelector(".lgngh") ? g.querySelector(".lgngh").firstChild.textContent : "").trim(), grows = "", gl = [];
        g.querySelectorAll(".lgnum").forEach(function (l) {
          var v = l.querySelector("input").value.trim();
          if (!v) return;
          var name = l.querySelector("span").textContent;
          grows += "<tr><th>" + esc(name) + "</th><td>" + esc(v) + "</td></tr>";
          gl.push(name + " " + v);
        });
        if (!grows) return;
        nrows += '<tr class="rpgh"><th colspan="2">' + esc(gt) + "</th></tr>" + grows;
        nline.push("■ " + gt + ": " + gl.join(" / "));
      });
      document.querySelectorAll(".lgtext").forEach(function (l) {
        var v = l.querySelector("input").value.trim();
        if (!v) return;
        var name = l.querySelector("span").firstChild.textContent.trim();
        nrows += "<tr" + (l.classList.contains("red") ? ' class="red"' : "") + "><th>" + esc(name) + "</th><td>" + esc(v) + "</td></tr>";
        nline.push("■ " + name + ": " + v);
      });
      var numHtml = "", numText = [];
      if (nrows) {
        any = true;
        numHtml = '<div class="rpsec"><h4>갯수</h4><table class="rpnums">' + nrows + "</table></div>";
        numText = [""].concat(nline);
      }

      // 묶음별로 만들어 두고, 정한 순서로 붙인다
      var secH = {}, secT = {}, rpBl = {}, rpOw = {};
      try { var rpO = JSON.parse(localStorage.getItem(keyFor()) || "{}") || {}; rpBl = rpO.bl || {}; rpOw = rpO.ow || {}; } catch (e) {}
      var S1 = String.fromCharCode(1), S2 = String.fromCharCode(2);
      // 맨 위에 먼저 볼 것: 사장님 지시사항 → 인계사항 → 직원들에게 알릴 것 → 폐기 → 매출 → 매장 흐름
      var TOPK = ["lf185", "lf180", "lf181", "lf162", "lf163", "lf183", "lf184", "lf154"], topH = {}, topT = {};
      document.querySelectorAll(".msec").forEach(function (sec) {
        var items = "", lines = [];
        sec.querySelectorAll(".mrow2").forEach(function (row) {
          var el = row.querySelector(".lgin");
          var v = (el.value || "").trim();
          if (!v) return;
          var name = (function (sp) { var c = sp.cloneNode(true); c.querySelectorAll("small").forEach(function (x) { x.remove(); }); return c.textContent.trim(); })(row.querySelector(".mlab span"));
          var cls = row.classList.contains("boss") ? " boss" : row.classList.contains("red") ? " red" : row.classList.contains("blue") ? " blue" : "";
          // 사장님 덧붙임 자리에 표시를 끼워 두었다가 아래에서 노란 형광 · 큰 글씨로 바꾼다
          var owk = rpOw[el.dataset.k];
          if (owk && owk.length && window.__CS_OWN) v = v.split(NL).map(function (ln) { return window.__CS_OWN.html(ln, window.__CS_OWN.mask(ln, owk), function (x) { return x; }).split('<span class="own">').join(S1).split("</span>").join(S2); }).join(NL);
          var shown = esc(v), plain = v;
          if (cls === " boss" || row.classList.contains("para") || row.classList.contains("mk")) {
            // **중요** 또는 줄 앞 ! → 빨간 굵은 글씨
            shown = v.split(NL).map(function (ln) {
              var t = esc(ln); var star = /^\s*[★⭐]/.test(ln), imp = !star && /^\s*[!！]/.test(ln);
              if (star) t = t.replace(/^\s*[★⭐]\s*/, ""); else if (imp) t = t.replace(/^\s*[!！]\s*/, "");
              t = t.replace(/\*\*(.+?)\*\*/g, '<b class="imp">$1</b>').replace(/__(.+?)__/g, "<u>$1</u>");
              return star ? '<b class="imp vimp">⭐ ' + t + "</b>" : imp ? '<b class="imp">❗ ' + t + "</b>" : t;
            }).join("<br>");
            plain = v.split(NL).map(function (ln) { return ln.replace(/^\s*[★⭐]\s*/, "⭐ ").replace(/^\s*[!！]\s*/, "❗ ").replace(/\*\*(.+?)\*\*/g, "【$1】").replace(/__(.+?)__/g, "$1"); }).join(NL);
          }
          // 여러 사람이 이어 쓴 칸: 줄마다 쓴 사람 색으로, 복사 글에는 이름을 붙인다
          var lb = (rpBl || {})[el.dataset.k] || [], distinct = [];
          lb.forEach(function (nn) { if (nn && distinct.indexOf(nn) < 0) distinct.push(nn); });
          if (distinct.length > 1) {
            var shLines = shown.split("<br>"), plLines = plain.split(NL), srcLines = v.split(NL);
            if (shLines.length === srcLines.length) shown = shLines.map(function (h, i) { var nn = lb[i] || ""; return '<span class="wl ' + (WCLR[nn] ? "w" + WCLR[nn] : "") + (nn === "사장님" && srcLines[i].trim() ? " rpownl" : "") + '">' + (nn === "사장님" && srcLines[i].trim() ? "👑 " : "") + h + "</span>"; }).join("");
            plain = plLines.map(function (x, i) { var nn = lb[i] || ""; return x.trim() ? x + (nn ? " (" + nn + ")" : "") : x; }).join(NL);
          }
          shown = shown.split(S1).join('<span class="rpown">👑 ').split(S2).join("</span>");
          plain = plain.split(S1).join("〔사장님: ").split(S2).join("〕");
          var ih = '<div class="rpitem' + cls + '"><b>' + esc(name) + "</b><span>" + shown + "</span></div>";
          var it = "· " + name + ": " + plain.split(NL).map(function (x) { return x.trim(); }).filter(Boolean).join(" / ");
          if (TOPK.indexOf(el.dataset.k) >= 0) { topH[el.dataset.k] = ih; topT[el.dataset.k] = it; any = true; return; }
          items += ih; lines.push(it);
        });
        if (!items) return;
        any = true;
        var title = (sec.querySelector(".msh span") || sec.querySelector(".msh")).textContent.trim();
        secH[title] = '<div class="rpsec"><h4>' + esc(title) + "</h4>" + items + "</div>";
        secT[title] = ["", "[" + title + "]", lines.join(NL)];
      });
      var topHtml = TOPK.map(function (k) { return topH[k] || ""; }).join("");
      if (topHtml) {
        html += '<div class="rpsec rptop"><h4>📌 먼저 볼 것</h4>' + topHtml + "</div>";
        text = text.concat(["", "[먼저 볼 것]", TOPK.filter(function (k) { return topT[k]; }).map(function (k) { return topT[k]; }).join(NL)]);
      }
      var ORDER = ["근무", "__num__", "전달", "매장", "생산 · 재고", "이슈"];
      var used = {};
      ORDER.forEach(function (t) {
        if (t === "__num__") { html += numHtml; text = text.concat(numText); return; }
        if (secH[t]) { html += secH[t]; text = text.concat(secT[t]); used[t] = 1; }
      });
      Object.keys(secH).forEach(function (t) { if (!used[t]) { html += secH[t]; text = text.concat(secT[t]); } });

      if (!any) html += '<div class="rpempty">오른쪽에 쓰기 시작하면' +
                        '<br>여기에 보고서로 정리됩니다</div>';
      if (repEl) repEl.innerHTML = html;
      return any ? text.join(NL) : "";
    }
    report();
    dateEl.addEventListener("change", report);
    whoEl.addEventListener("change", report);
    var repT = null; inputs.forEach(function (el) { el.addEventListener("input", function () { clearTimeout(repT); repT = setTimeout(report, 250); }); });

    // 붙여넣기 — 「복사하기」로 보낸 글을 다시 칸에 채운다 (빈 칸만 · 이미 적힌 칸은 물어보고)
    (function () {
      var btn = document.getElementById("lgPaste"), box = document.getElementById("lgPasteBox"), ta = document.getElementById("lgPasteText");
      var go = document.getElementById("lgPasteGo"), close = document.getElementById("lgPasteClose"), pm = document.getElementById("lgPasteMsg");
      if (!btn || !box) return;
      function labelOf(el) {
        var t = el.getAttribute("aria-label"); if (t) return t.trim();
        var lb = el.closest(".mrow2, .lgnum, .lgtext"); var sp = lb && lb.querySelector("span");
        if (sp) { var c = sp.cloneNode(true); c.querySelectorAll("small,em").forEach(function (x) { x.remove(); }); return c.textContent.trim(); }
        return "";
      }
      function norm(t) { return String(t || "").replace(/[^\w가-힣]+/g, "").toLowerCase(); }
      function fill(text) {
        var byLabel = {};
        document.querySelectorAll("#tp4 .lgin[data-k]").forEach(function (el) { var lb = norm(labelOf(el)); if (lb && !byLabel[lb]) byLabel[lb] = el; });
        var o152 = document.querySelector('#tp4 [data-k="lf152"]'); if (o152) byLabel[norm("먼저 팔린 메뉴")] = o152;   // 예전 이름으로 복사해 둔 글도 채워지게
        var filled = 0, conflicts = [], cur = null;
        function setVal(el, v) {
          v = String(v || "").trim(); if (!v) return;
          var now = (el.value || "").trim();
          if (now && now !== v) { conflicts.push([el, v]); return; }
          if (!now) { el.value = v; el.classList.add("filled"); el.dispatchEvent(new Event("input", { bubbles: true })); filled++; }
        }
        text.split(/\r?\n/).forEach(function (ln) {
          ln = ln.trim(); if (!ln) { cur = null; return; }
          var m;
          if (/^\[.*\]/.test(ln)) { cur = null; return; }
          if ((m = ln.match(/^■\s*(.+?):\s*(.*)$/))) {
            cur = null;
            var g = norm(m[1]), rest = m[2];
            if (byLabel[g]) { setVal(byLabel[g], rest); return; }
            rest.split(" / ").forEach(function (part) { var mm = part.trim().match(/^(.+?)\s+(\S+)$/); if (mm && byLabel[norm(mm[1])]) setVal(byLabel[norm(mm[1])], mm[2]); });
            return;
          }
          if ((m = ln.match(/^[·•]\s*(.+?):\s*(.*)$/))) {
            var el = byLabel[norm(m[1])];
            if (el) { cur = el; setVal(el, m[2].split(" / ").join("\n")); } else cur = null;
            return;
          }
          if (cur && cur.tagName === "TEXTAREA") { cur.value = (cur.value ? cur.value + "\n" : "") + ln; cur.dispatchEvent(new Event("input", { bubbles: true })); }
        });
        if (conflicts.length && window.confirm(conflicts.length + "개 칸에 이미 다른 내용이 있습니다. 붙여 넣은 내용으로 덮어쓸까요?\n(아니오를 누르면 빈 칸만 채웁니다)")) {
          conflicts.forEach(function (c) { c[0].value = c[1]; c[0].dispatchEvent(new Event("input", { bubbles: true })); filled++; });
          conflicts = [];
        }
        return { filled: filled, skipped: conflicts.length };
      }
      btn.addEventListener("click", function () {
        box.hidden = !box.hidden; pm.textContent = "";
        if (!box.hidden) {
          ta.value = "";
          if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(function (t) { if (t && t.indexOf("마감 일지") >= 0) { ta.value = t; pm.textContent = "복사해 둔 글을 가져왔습니다 · 「칸에 채워 넣기」를 누르세요"; } }, function () {});
          ta.focus();
        }
      });
      close.addEventListener("click", function () { box.hidden = true; });
      go.addEventListener("click", function () {
        var t = (ta.value || "").trim(); if (!t) { pm.textContent = "붙여 넣을 글이 없습니다"; return; }
        var m = t.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
        if (m) { var d = m[1] + "-" + String(m[2]).padStart(2, "0") + "-" + String(m[3]).padStart(2, "0"); if (dateEl.value !== d && window.confirm("이 글은 " + d + " 일지입니다. 날짜를 그날로 바꿔서 채울까요?")) { dateEl.value = d; dateEl.dispatchEvent(new Event("change", { bubbles: true })); } }
        var r = fill(t);
        report();
        pm.textContent = r.filled + "칸을 채웠습니다" + (r.skipped ? " · " + r.skipped + "칸은 이미 적혀 있어 그대로 두었습니다" : "") + " · 확인 후 「일지 저장」을 눌러 주세요";
      });
    })();
    copyEl.addEventListener("click", function () {
      var text = report();
      if (!text) { msgEl.textContent = "아직 쓴 내용이 없습니다"; return; }
      var done = function () { msgEl.textContent = "복사됐습니다"; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fb);
      } else { fb(); }
      function fb() {
        var ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); }
        catch (e) { msgEl.textContent = "복사가 안 됩니다"; }
        ta.remove();
      }
    });
  })();

  // 휴무 신청 — 이름 고르고 날짜 눌러서 신청 내용 만들기
  function bindReq(root) {
  root.querySelectorAll(".reqbar").forEach(function (bar) {
    var month = bar.dataset.m;
    var panel = bar.closest(".mpanel");
    var cells = Array.prototype.slice.call(
      panel.querySelectorAll(".cell:not(.closed)"));
    var names = Array.prototype.slice.call(bar.querySelectorAll(".rname"));
    var pickEl = bar.querySelector(".reqpick");
    var copyBtn = bar.querySelector(".reqcopy");
    var clearBtn = bar.querySelector(".reqclear");
    var msgEl = bar.querySelector(".reqmsg");
    var KEY = "cafesui.off." + month;
    var who = null, picked = [], reasons = {};

    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var p = JSON.parse(raw);
        who = p.who || null; picked = p.days || []; reasons = p.why || {};
      }
    } catch (e) {}

    function persist() {
      try { localStorage.setItem(KEY,
        JSON.stringify({ who: who, days: picked, why: reasons })); }
      catch (e) {}
    }
    function label(d) {
      var c = cells.filter(function (x) { return x.dataset.d === d; })[0];
      return d + (c ? "(" + c.dataset.wd + ")" : "");
    }
    function render() {
      names.forEach(function (n) {
        n.setAttribute("aria-pressed", String(n.dataset.n === who));
      });
      cells.forEach(function (c) {
        c.classList.toggle("pickable", !!who);
        var on = picked.indexOf(c.dataset.d) >= 0;
        c.classList.toggle("picked", on);
        var mark = c.querySelector(".pickmark");
        if (on && !mark) {
          mark = document.createElement("span");
          mark.className = "pickmark";
          mark.textContent = "휴무 신청";
        }
        if (on && mark) {
          mark.textContent = reasons[c.dataset.d]
            ? "휴무 · " + reasons[c.dataset.d] : "휴무 신청";
          c.insertBefore(mark, c.firstChild.nextSibling);
        } else if (!on && mark) { mark.remove(); }
      });
      picked.sort(function (a, b) {
        return parseInt(a.split("/")[1], 10) - parseInt(b.split("/")[1], 10);
      });
      if (!who) {
        pickEl.textContent = "먼저 이름을 골라주세요";
        pickEl.className = "reqpick";
      } else if (!picked.length) {
        pickEl.textContent = who + (who === "사장님" ? "" : "님") + " — 달력에서 쉬고 싶은 날을 누르세요";
        pickEl.className = "reqpick";
      } else {
        pickEl.textContent = who + (who === "사장님" ? "" : "님") + " · " + picked.length + "일 — " +
          picked.map(function (d) {
            return label(d) + (reasons[d] ? " (" + reasons[d] + ")" : "");
          }).join(", ");
        pickEl.className = "reqpick has";
      }
      copyBtn.disabled = !(who && picked.length);
      clearBtn.disabled = !picked.length;
      drawWhy();
    }

    // 고른 날마다 사유를 적는 칸
    var whysEl = bar.querySelector(".reqwhys");
    function drawWhy() {
      if (!picked.length) { whysEl.innerHTML = ""; return; }
      whysEl.innerHTML = picked.map(function (d) {
        return '<label class="reqrow"><span>' + label(d) + '</span>' +
          '<input type="text" class="reqwhy" data-d="' + d +
          '" placeholder="사유 (예: 병원 · 가족 행사)" value="' +
          (reasons[d] || "").replace(/"/g, "&quot;") + '"></label>';
      }).join("");
      whysEl.querySelectorAll(".reqwhy").forEach(function (el) {
        el.addEventListener("input", function () {
          var v = el.value.trim();
          if (v) reasons[el.dataset.d] = v; else delete reasons[el.dataset.d];
          persist();
          var c = cells.filter(function (x) { return x.dataset.d === el.dataset.d; })[0];
          var mk = c && c.querySelector(".pickmark");
          if (mk) mk.textContent = v ? "휴무 · " + v : "휴무 신청";
          pickEl.textContent = who + (who === "사장님" ? "" : "님") + " · " + picked.length + "일 — " +
            picked.map(function (d) {
              return label(d) + (reasons[d] ? " (" + reasons[d] + ")" : "");
            }).join(", ");
        });
      });
    }

    names.forEach(function (n) {
      n.addEventListener("click", function () {
        who = (who === n.dataset.n) ? null : n.dataset.n;
        persist(); render();
      });
    });
    cells.forEach(function (c) {
      c.addEventListener("click", function (e) {
        if (!who) { msgEl.textContent = "이름을 먼저 골라주세요"; return; }
        if (e.target.closest(".sh, .offrow, .prow")) return;
        var d = c.dataset.d, i = picked.indexOf(d);
        // 한 번 누르면 신청, 다시 누르면 취소. 사유는 아래 칸에 적는다.
        if (i < 0) picked.push(d);
        else { picked.splice(i, 1); delete reasons[d]; }
        msgEl.textContent = "";
        persist(); render();
      });
    });
    clearBtn.addEventListener("click", function () {
      picked = []; reasons = {}; msgEl.textContent = ""; persist(); render();
    });
    copyBtn.addEventListener("click", function () {
      var NL = String.fromCharCode(10);
      var ymTxt = String(month).replace("-", "년 ") + "월";
      var text = "[휴무 신청] " + who + " — " + ymTxt + NL +
        picked.map(function (d) {
          return "· " + label(d) + (reasons[d] ? " — " + reasons[d] : "");
        }).join(NL) +
        NL + "(총 " + picked.length + "일)";
      var done = function () {
        msgEl.textContent = "복사됐습니다 — 매니저에게 붙여넣어 보내주세요";
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else { fallback(); }
      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); }
        catch (e) { msgEl.textContent = "복사가 안 됩니다 — 위 목록을 직접 적어 보내주세요"; }
        ta.remove();
      }
    });
    render();
  });
  }

  // 그려진 달에 휴무 신청과 근무표 고치기를 붙인다
  window.__CS_AFTER = function (root) {
    bindReq(root);
    if (window.__CS_BINDSCHED) window.__CS_BINDSCHED(root);
  };
  (window.__CS_PENDING || []).forEach(window.__CS_AFTER);
  window.__CS_PENDING = [];

  // 근무표 — 연도 바인더와 달 전환 (그 해는 처음 누를 때 그린다)
  document.querySelectorAll(".btab").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".btab").forEach(function (o) {
        var on = o === b;
        o.setAttribute("aria-selected", String(on));
        var box = document.getElementById("yb" + o.dataset.y);
        if (box) box.hidden = !on;
      });
      if (window.__CS_BUILDYEAR) window.__CS_BUILDYEAR(+b.dataset.y);
    });
  });
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest(".mtab") : null;
    if (!t) return;
    var box = t.closest(".yearbox");
    if (!box) return;
    box.querySelectorAll(".mtab").forEach(function (o) {
      var on = o === t;
      o.setAttribute("aria-selected", String(on));
      var p = document.getElementById(o.dataset.m);
      if (p) p.hidden = !on;
    });
  });

  // 투두리스트 조 탭 (오픈 / 미들 / 마감)
  var stabs = Array.prototype.slice.call(document.querySelectorAll(".stab"));
  stabs.forEach(function (t, i) {
    t.addEventListener("click", function () {
      stabs.forEach(function (o) {
        var on = o === t;
        o.setAttribute("aria-selected", String(on));
        var p = document.getElementById(o.dataset.s);
        if (p) p.hidden = !on;
      });
    });
    t.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var n = stabs[(i + d + stabs.length) % stabs.length];
      n.focus(); n.click();
    });
  });

  // 품종 버튼 — 누르면 그 품종 쓰는 달이 칠해진다
  document.querySelectorAll(".vbtns").forEach(function (box) {
    var fi = box.dataset.f;
    var strip = document.getElementById("vs" + fi);
    var btns = Array.prototype.slice.call(box.querySelectorAll(".vbtn"));
    function pick(vi) {
      btns.forEach(function (b) {
        var on = b.dataset.v === String(vi);
        b.setAttribute("aria-pressed", String(on));
        var p = document.getElementById("fv" + fi + "_" + b.dataset.v);
        if (p) p.hidden = !on;
        if (on) {
          strip.className = "vstrip " + b.className.split(" ")[1];
          var ms = (p ? p.dataset.months : "").split(",");
          strip.querySelectorAll(".vm").forEach(function (m) {
            m.classList.toggle("on", ms.indexOf(m.dataset.mo) >= 0);
          });
        }
      });
    }
    btns.forEach(function (b) {
      b.addEventListener("click", function () { pick(b.dataset.v); });
    });
    pick(0);   // 처음엔 첫 품종이 칠해져 있게
  });

  // 미리 챙기기 — 기본은 이번 달만. 눌러서 나머지 달을 편다
  var prepBtn = document.getElementById("prepAll");
  if (prepBtn) {
    prepBtn.addEventListener("click", function () {
      var open = prepBtn.getAttribute("aria-expanded") === "true";
      document.querySelectorAll(".prow").forEach(function (r) {
        if (!r.classList.contains("now")) r.hidden = open;
      });
      prepBtn.setAttribute("aria-expanded", String(!open));
      prepBtn.textContent = open ? "다른 달도 보기" : "이번 달만 보기";
    });
  }

  // 주기 정비 — 마지막 교체일을 넣으면 다음 교체일을 계산한다
  // 정비표 날짜칸만 — 일지 날짜칸도 .dinp 라서 data-k 로 걸러낸다
  var inputs = Array.prototype.slice.call(document.querySelectorAll(".dinp[data-k]"));
  function fmt(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
           "-" + String(d.getDate()).padStart(2, "0");
  }
  function renderNext(inp) {
    var out = document.getElementById("mn" + inp.dataset.k.slice(1));
    if (!out) return;
    var months = parseInt(inp.dataset.months, 10);
    if (!inp.value || !months) {
      out.innerHTML = '<span class="mnpill">' + out.dataset.blank + "</span>";
      out.className = "mnext";
      return;
    }
    var p = inp.value.split("-");
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    d.setMonth(d.getMonth() + months);
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var days = Math.round((d - today) / 86400000);
    var pill = days < 0 ? "⚠ " + (-days) + "일 지남 · 교체 필요" : days === 0 ? "⚠ 오늘 교체" : days <= 30 ? "곧 · " + days + "일 남음" : days + "일 남음";
    out.innerHTML = '<b class="mnd">' + fmt(d).replace(/-/g, ". ") + '</b><span class="mnpill">' + pill + "</span>";
    out.className = "mnext" + (days < 0 ? " due" : days <= 30 ? " soon" : " ok");
  }
  inputs.forEach(function (inp) {
    if (state.dates && state.dates[inp.dataset.k]) inp.value = state.dates[inp.dataset.k];
    renderNext(inp);
    inp.addEventListener("change", function () {
      if (!state.dates) state.dates = {};
      if (inp.value) state.dates[inp.dataset.k] = inp.value;
      else delete state.dates[inp.dataset.k];
      renderNext(inp);
      save();
    });
  });

})();

  // (탭 전환은 위쪽 스크립트에서 한 번만 처리한다 — 중복 제거)
