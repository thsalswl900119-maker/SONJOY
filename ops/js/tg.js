// 텔레그램 바로 보내기 (10/14) — 보고(발주·재고 그림 · 일지 · 오늘 할 일 진행사항 · 주간 보고 · 벤치마킹)를
// 복사 · 저장 없이 매장 단톡방으로 바로 보낸다. 텔레그램 봇(BotFather)으로 보낸다.
// ⚠ 봇 열쇠(토큰)는 저장소 · 서버에 절대 안 둔다(둘 다 공개) — 기기마다 cafesui.ui.tg 에만(서버 · 백업 안 감).
//    다른 기기는 사장님이 만든 「연결 링크」(#tgset=…)를 한 번 열면 연결된다(주소 # 뒤는 서버로 안 감).
(function () {
  var KEY = "cafesui.ui.tg", API = "https://api.telegram.org/bot";
  var ADMIN = ["사장님", "정항아"];
  function get() { try { return JSON.parse(localStorage.getItem(KEY) || "null") || null; } catch (e) { return null; } }
  function put(o) { try { if (o) localStorage.setItem(KEY, JSON.stringify(o)); else localStorage.removeItem(KEY); } catch (e) {} paintAll(); }
  function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
  function nim(n) { return !n ? "" : n === "사장님" ? n : n + "님"; }
  function ready() { var o = get(); return !!(o && o.t && o.c); }
  function esc(v) { return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  // 연결 링크로 들어온 경우 — 저장하고 주소에서 지운다
  (function () {
    var m = /[#&]tgset=([^&]+)/.exec(location.hash || ""); if (!m) return;
    try {
      var o = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(m[1])))));
      if (o && o.t && o.c) { put({ t: o.t, c: o.c, n: o.n || "", at: new Date().toISOString() }); setTimeout(function () { alert("✅ 이 기기를 텔레그램 「" + (o.n || "단톡방") + "」에 연결했습니다"); }, 600); }
    } catch (e) {}
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { location.hash = ""; }
  })();

  function call(method, fd, tok) {
    var o = get(), t = tok || (o && o.t);
    return fetch(API + t + "/" + method, { method: "POST", body: fd }).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.ok) return j.result;
      // 단톡방이 「슈퍼그룹」으로 바뀌면 번호가 바뀐다 — 새 번호로 고쳐서 한 번 더
      if (j && j.parameters && j.parameters.migrate_to_chat_id && !tok) {
        var o2 = get(); o2.c = String(j.parameters.migrate_to_chat_id); put(o2);
        if (fd.has && fd.has("chat_id")) { fd.set("chat_id", o2.c); return call(method, fd); }
      }
      throw new Error((j && j.description) || "보내지 못했습니다");
    });
  }
  function form(o) { var fd = new FormData(); Object.keys(o).forEach(function (k) { if (o[k] != null) fd.append(k, o[k]); }); return fd; }
  function foot() { var n = me(); return "— 카페스이 직원 시스템" + (n ? " · 보낸 사람 " + nim(n) : ""); }
  // 글 — 4000자씩 나눠 보낸다
  function sendText(text) {
    if (!ready()) return Promise.reject(new Error("연결 안 됨"));
    var t = String(text || "").trim() + "\n\n" + foot(), parts = [];
    while (t.length > 3900) { var cut = t.lastIndexOf("\n", 3900); if (cut < 1000) cut = 3900; parts.push(t.slice(0, cut)); t = t.slice(cut).replace(/^\n+/, ""); }
    parts.push(t);
    var c = get().c, p = Promise.resolve();
    parts.forEach(function (s) { p = p.then(function () { return call("sendMessage", form({ chat_id: c, text: s, disable_web_page_preview: "true" })); }); });
    return p;
  }
  // 그림 — 글(caption)은 1000자까지 · 넘으면 그림 다음에 글로 이어서
  function sendPhoto(blob, caption, name) {
    if (!ready()) return Promise.reject(new Error("연결 안 됨"));
    var cap = String(caption || "").trim(), rest = "";
    var full = (cap ? cap + "\n\n" : "") + foot();
    if (full.length > 1000) { rest = cap; full = (cap.split("\n")[0] || "보고").slice(0, 300) + "\n" + foot(); }
    var fd = form({ chat_id: get().c, caption: full }); fd.append("photo", blob, name || "보고.png");
    return call("sendPhoto", fd).then(function () { if (rest) return sendText(rest); });
  }

  // 그림을 만드는 원래 단추(📷 이미지로 저장 · 📸 주간 보고)를 대신 눌러, 만들어진 그림을 가로챈다
  var pending = null;
  function take() { var f = pending; pending = null; return f; }

  // 보고마다 — 무엇을 보낼지
  var KINDS = {
    sk: { label: "발주 · 재고 보고", photo: "skShot", cap: function () { return window.__CS_SK_TEXT ? window.__CS_SK_TEXT() : ""; } },
    wr: { label: "매니저 주간 보고", photo: "wrCopy", cap: function () { var l = document.getElementById("wrLabel"); return "📋 매니저 주간 보고 " + (l ? l.textContent : ""); } },
    log: { label: "운영일지", text: function () { return window.__CS_LOG_TEXT ? window.__CS_LOG_TEXT() : ""; } },
    td: { label: "오늘 할 일 결과", text: function () { return window.__CS_TD_TEXT ? window.__CS_TD_TEXT() : ""; } },
    sched: { label: "근무표", img: function (btn) { return window.__CS_SCHED_IMG ? window.__CS_SCHED_IMG(btn.dataset.ym) : Promise.reject(new Error("근무표가 없습니다")); } },
    bn: { label: "벤치마킹 정리", text: function () { return window.__CS_BN_TEXT ? window.__CS_BN_TEXT() : ""; } }
  };
  function flash(btn, s, ms) {
    var L = btn.dataset.lbl || (btn.dataset.lbl = btn.innerHTML);
    btn.textContent = s; clearTimeout(btn._t);
    if (ms) btn._t = setTimeout(function () { btn.innerHTML = L; btn.disabled = false; }, ms);
  }
  // 봇 연결 안 된 기기 — 그림을 만들어 휴대폰은 공유 창(텔레그램 고르기), 컴퓨터는 그림 복사 + 파일 저장(텔레그램에 붙여 넣기 · Ctrl+V)
  function giveBlob(blob, name, title, btn) {
    var file = null; try { file = new File([blob], name, { type: "image/png" }); } catch (e) {}
    var dl = function () { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 2000); };
    var touch = window.matchMedia && window.matchMedia("(pointer:coarse)").matches;
    if (touch && file && navigator.canShare && navigator.canShare({ files: [file] })) {
      return navigator.share({ files: [file], title: title }).then(function () { flash(btn, "✅ 공유 창에서 텔레그램을 골랐으면 끝", 4000); }, function () { flash(btn, "공유를 닫았습니다", 2500); });
    }
    dl();
    if (navigator.clipboard && window.ClipboardItem) {
      return navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]).then(function () { flash(btn, "✅ 캡쳐 복사됨 · 텔레그램방에서 붙여넣기(Ctrl+V) · 파일도 저장됨", 6000); }, function () { flash(btn, "✅ 캡쳐 파일 저장됨 · 텔레그램방에 올려 주세요", 6000); });
    }
    flash(btn, "✅ 캡쳐 파일 저장됨 · 텔레그램방에 올려 주세요", 6000); return Promise.resolve();
  }
  function send(kind, btn) {
    var K = KINDS[kind]; if (!K) return;
    if (!ready() && K.img) {   // 근무표 — 봇이 없어도 캡쳐는 바로
      if (btn.disabled) return; btn.disabled = true; flash(btn, "캡쳐 만드는 중…");
      K.img(btn).then(function (r) { return giveBlob(r.blob, r.name, "근무표", btn); }).catch(function (e) { flash(btn, "❌ 캡쳐를 못 만들었어요 — " + (e && e.message || ""), 5000); });
      return;
    }
    if (!ready()) { setup(true); return; }
    if (btn.disabled) return;
    var c = get();
    if (!confirm("텔레그램 「" + (c.n || "단톡방") + "」으로 " + K.label + "를 보낼까요?")) return;
    btn.disabled = true; flash(btn, "보내는 중…");
    var ok = function () { flash(btn, "✅ 텔레그램으로 보냈습니다", 3500); };
    var bad = function (e) { flash(btn, "❌ 못 보냈어요 — " + (e && e.message ? e.message : "인터넷 확인"), 6000); };
    if (K.text) {
      var t = K.text(); if (!t || !String(t).trim()) { flash(btn, "아직 쓴 내용이 없습니다", 2500); return; }
      sendText(t).then(ok, bad); return;
    }
    if (K.img) { K.img(btn).then(function (r) { return sendPhoto(r.blob, r.cap, r.name); }).then(ok, bad); return; }   // 근무표 — 달력 전체를 그림으로
    var src = document.getElementById(K.photo); if (!src) { bad(); return; }
    var to = setTimeout(function () { if (pending) { pending = null; bad(new Error("그림을 못 만들었습니다")); } }, 8000);
    pending = function (blob, name) { clearTimeout(to); sendPhoto(blob, K.cap(), name).then(ok, bad); };
    src.click();
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-tg]"); if (!b) return;
    e.preventDefault(); send(b.dataset.tg, b);
  });
  function paintAll() {
    var on = ready(), c = get();
    document.querySelectorAll("[data-tg]").forEach(function (b) {
      if (b.disabled) return;
      b.classList.toggle("off", !on && b.dataset.tg !== "sched");   // 근무표 캡쳐는 연결 없이도 됨
      b.title = on ? "텔레그램 「" + (c.n || "단톡방") + "」으로 바로 보냅니다" : b.dataset.tg === "sched" ? "근무표를 한 장으로 캡쳐해서 복사 · 저장합니다 — 텔레그램방에 붙여 넣으세요" : "이 기기는 아직 텔레그램에 연결 안 됨 — 누르면 연결 방법";
    });
    var s = document.getElementById("tgState");
    var h = on ? "✅ 이 기기는 <b>" + esc(c.n || "단톡방") + "</b>에 연결됨" : "⚪ 이 기기는 아직 연결 안 됨";
    if (s && s.innerHTML !== h) s.innerHTML = h;
  }

  // 연결 화면 — 사장님 · 정항아님만 고칠 수 있다 (다른 사람은 안내만)
  var box = null;
  function setup(fromSend) {
    var can = ADMIN.indexOf(me()) >= 0, c = get() || {};
    if (!can) {
      alert(ready() ? "이미 연결되어 있습니다" : "이 기기는 아직 텔레그램에 연결되지 않았어요.\n사장님께 「텔레그램 연결 링크」를 받아 이 기기에서 한 번 열어 주세요.\n\n(그 전까지는 옆의 복사 · 이미지 단추로 보내 주세요)");
      return;
    }
    if (box) box.remove();
    box = document.createElement("div"); box.className = "tgmodal"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "텔레그램 연결");
    box.innerHTML = '<div class="tgcard">' +
      '<div class="tgh"><b>📨 텔레그램 바로 보내기 연결</b><button type="button" class="tgx" aria-label="닫기">✕</button></div>' +
      (fromSend ? '<p class="tgwarn">이 기기는 아직 연결 안 됨 — 아래 순서대로 한 번만 하면 됩니다</p>' : "") +
      '<ol class="tgsteps">' +
      "<li><b>봇 만들기</b> — 텔레그램에서 <b>@BotFather</b> 검색 → <code>/newbot</code> → 이름(예: 카페스이 보고) · 아이디(예: cafesui_report_bot) 정하기 → 받은 <b>열쇠(토큰)</b> 복사</li>" +
      "<li><b>단톡방에 초대</b> — 보고받는 단톡방에 만든 봇을 초대하고, 단톡방에 <code>/start</code> 한 번 보내기</li>" +
      '<li><b>열쇠 붙여 넣기</b><input type="password" class="tgtok" autocomplete="off" placeholder="123456789:ABC… (BotFather가 준 열쇠)"><button type="button" class="tgfind">🔎 단톡방 찾기</button></li>' +
      '<li><b>보낼 단톡방 고르기</b><select class="tgchat"><option value="">— 먼저 「단톡방 찾기」 —</option></select><button type="button" class="tgtest">시험 보내기</button></li>' +
      "</ol>" +
      '<p class="tgmsg" aria-live="polite"></p>' +
      '<div class="tgfoot"><button type="button" class="tgsave">✔ 이 기기에 저장</button>' +
      '<button type="button" class="tglink"' + (ready() ? "" : " disabled") + '>🔗 다른 기기 연결 링크 복사</button>' +
      '<button type="button" class="tgoff"' + (ready() ? "" : " disabled") + '>연결 끊기</button></div>' +
      '<p class="tgnote">🔒 열쇠는 <b>이 기기에만</b> 저장됩니다(서버 · 저장소에 안 올라감). 연결 링크에는 열쇠가 들어 있으니 <b>단톡방에 올리지 말고</b> 매장 기기에서 직접 열어 주세요. 열쇠가 새면 @BotFather → <code>/revoke</code>로 바꾸면 됩니다.</p>' +
      "</div>";
    document.body.appendChild(box);
    var $ = function (s) { return box.querySelector(s); }, msg = $(".tgmsg");
    $(".tgtok").value = c.t || "";
    if (c.c) { $(".tgchat").innerHTML = '<option value="' + esc(c.c) + '">' + esc(c.n || c.c) + "</option>"; }
    $(".tgx").onclick = function () { box.remove(); box = null; };
    box.addEventListener("click", function (e) { if (e.target === box) { box.remove(); box = null; } });
    $(".tgfind").onclick = function () {
      var t = $(".tgtok").value.trim(); if (!/^\d+:[\w-]{20,}$/.test(t)) { msg.textContent = "열쇠 모양이 아니에요 — 숫자:글자 모양 전체를 붙여 넣어 주세요"; return; }
      msg.textContent = "찾는 중…";
      call("getMe", new FormData(), t).then(function (bot) {
        return call("getUpdates", new FormData(), t).then(function (ups) {
          var seen = {}, opts = [];
          (ups || []).forEach(function (u) {
            var ch = (u.message || u.my_chat_member || u.channel_post || u.edited_message || {}).chat; if (!ch || seen[ch.id]) return;
            seen[ch.id] = 1; opts.push('<option value="' + ch.id + '" data-n="' + esc(ch.title || ch.first_name || ch.id) + '">' + esc(ch.title || ((ch.first_name || "") + " (개인)")) + "</option>");
          });
          if (!opts.length) { msg.innerHTML = "봇 「" + esc(bot.first_name) + "」은 찾았는데 단톡방이 안 보여요 — 단톡방에 봇을 초대하고 <code>/start</code>를 보낸 뒤 다시 눌러 주세요"; return; }
          $(".tgchat").innerHTML = opts.join(""); msg.textContent = "봇 「" + bot.first_name + "」 · 단톡방 " + opts.length + "개 찾음 — 고르고 「시험 보내기」";
        });
      }).catch(function (e) { msg.textContent = "❌ " + (e.message === "Unauthorized" ? "열쇠가 맞지 않아요" : e.message); });
    };
    function pick() { var s = $(".tgchat"), o = s.options[s.selectedIndex]; return o && o.value ? { t: $(".tgtok").value.trim(), c: o.value, n: o.dataset.n || o.textContent } : null; }
    $(".tgtest").onclick = function () {
      var p = pick(); if (!p) { msg.textContent = "단톡방을 먼저 고르세요"; return; }
      msg.textContent = "보내는 중…";
      call("sendMessage", form({ chat_id: p.c, text: "✅ 카페스이 직원 시스템 연결 시험 — 이제 보고가 여기로 옵니다\n" + foot() }), p.t)
        .then(function () { msg.textContent = "✅ 보냈어요 — 단톡방에 왔는지 보고 「이 기기에 저장」"; }, function (e) { msg.textContent = "❌ " + e.message; });
    };
    $(".tgsave").onclick = function () {
      var p = pick(); if (!p) { msg.textContent = "열쇠와 단톡방을 먼저"; return; }
      p.at = new Date().toISOString(); put(p); msg.textContent = "✅ 저장했습니다 — 이제 「📨 텔레그램」 단추로 바로 보내집니다";
      $(".tglink").disabled = false; $(".tgoff").disabled = false;
    };
    $(".tglink").onclick = function () {
      var o = get(); if (!o) return;
      var code = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify({ t: o.t, c: o.c, n: o.n })))));
      var url = location.origin + location.pathname + "#tgset=" + code;
      var done = function () { msg.textContent = "🔗 연결 링크를 복사했습니다 — 매장 다른 기기에서 열면 바로 연결 (단톡방에는 올리지 마세요)"; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { prompt("이 주소를 다른 기기에서 여세요", url); });
      else prompt("이 주소를 다른 기기에서 여세요", url);
    };
    $(".tgoff").onclick = function () { if (!confirm("이 기기의 텔레그램 연결을 끊을까요? (다른 기기는 그대로)")) return; put(null); box.remove(); box = null; };
  }

  window.__CS_TG = { ready: ready, sendText: sendText, sendPhoto: sendPhoto, take: take, setup: setup, paint: paintAll };
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("#tgSetup")) { e.preventDefault(); setup(false); } });
  window.addEventListener("cs:me", paintAll);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paintAll); else paintAll();
  // 늦게 그려지는 단추(벤치마킹 · 관리자 탭)도 색을 맞춘다
  var mo = new MutationObserver(function () { clearTimeout(mo._t); mo._t = setTimeout(paintAll, 400); });
  mo.observe(document.body, { childList: true, subtree: true });
})();
