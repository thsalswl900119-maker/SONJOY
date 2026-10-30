// 📎 파일 올리기 (10/30 · 사장님 「파일 같은 것도 직접 업로드할 수 있게」) — 워크샵 · 벤치마킹이 같이 씀
// 목록: cafesui.files.<범위> = { id: { n 이름, ty 종류, sz 크기, by, at, parts 조각 수, cat 분류, m 메모, ref 붙은 곳, th 작은 그림, del } }
// 내용: 서버 ops/「file.<id>.<번호>」 (문서 하나 20만 자 제한 → 19만 자씩) · sync.js __CS_FILEPUT / __CS_FILEGET
// 서버가 공개 읽기 — 여권 · 신분증 · 카드 · 예약번호가 보이는 사진은 올리지 않는다(처음 올릴 때 한 번 묻는다).
// 지우기는 del 표시만(조각은 남김 · 「빠진 파일 보기」에서 되살림).
(function () {
  var CHUNK = 190000, MAXRAW = 3 * 1024 * 1024, cache = {}, mounts = [];
  var CATS0 = [["photo", "📸 사진"], ["book", "🎫 예약 · 티켓"], ["rcpt", "🧾 영수증"], ["doc", "📄 자료"]];
  function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
  function nim(n) { return !n ? "" : n === "사장님" ? n : n + "님"; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function stamp() { var d = new Date(); return (d.getMonth() + 1) + "/" + d.getDate() + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
  function K(scope) { return "cafesui.files." + scope; }
  function load(scope) { try { return JSON.parse(localStorage.getItem(K(scope)) || "{}") || {}; } catch (e) { return {}; } }
  function patch(scope, id, fn) { var o = load(scope); o[id] = o[id] || {}; fn(o[id]); try { localStorage.setItem(K(scope), JSON.stringify(o)); } catch (e) { alert("기기 저장 공간이 꽉 찼습니다"); } }
  function list(scope, ref, withDel) { var o = load(scope); return Object.keys(o).filter(function (id) { var f = o[id]; return f && f.n && (withDel || !f.del) && (ref == null || (f.ref || "") === ref); }).map(function (id) { var f = o[id]; f._id = id; return f; }).sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }); }
  function size(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + "MB" : Math.max(1, Math.round(n / 1024)) + "KB"; }
  function icon(f) { return /^image\//.test(f.ty) ? "🖼" : /pdf/.test(f.ty) ? "📕" : /sheet|excel|csv|numbers/.test(f.ty + f.n) ? "📊" : /word|document|pages/.test(f.ty + f.n) ? "📝" : /video/.test(f.ty) ? "🎞" : "📄"; }
  function readURL(file) { return new Promise(function (ok, no) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.onerror = no; r.readAsDataURL(file); }); }
  function shrink(url, max, q) {   // 사진은 긴 쪽 max px · JPEG로 줄여서 올림 (휴대폰 사진 5MB → 약 300KB)
    return new Promise(function (ok) {
      var im = new Image(); im.onload = function () {
        var s = Math.min(1, max / Math.max(im.width, im.height)), w = Math.max(1, Math.round(im.width * s)), h = Math.max(1, Math.round(im.height * s));
        var c = document.createElement("canvas"); c.width = w; c.height = h; var g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.drawImage(im, 0, 0, w, h);
        ok({ url: c.toDataURL("image/jpeg", q), w: w, h: h });
      }; im.onerror = function () { ok(null); }; im.src = url;
    });
  }
  function privacyOk() {
    try { if (localStorage.getItem("cafesui.ui.fileok")) return true; } catch (e) {}
    var ok = confirm("📎 파일 올리기 전에 한 번만 확인해 주세요\n\n올린 파일은 시스템을 쓰는 모든 기기에서 볼 수 있어요.\n여권 · 신분증 · 카드 번호 · 예약 번호 · 집 주소가 보이는 사진은 올리지 마세요.\n\n알겠어요 → 확인");
    if (ok) try { localStorage.setItem("cafesui.ui.fileok", "1"); } catch (e) {}
    return ok;
  }
  // 올리기 — 조각을 다 보낸 뒤에야 목록에 넣는다(반쯤 올라간 파일이 남에게 보이지 않게)
  function upload(m, files) {
    if (!window.__CS_FILEPUT) { alert("서버에 아직 연결되지 않았어요 · 잠시 뒤 다시 해 주세요"); return; }
    if (!me()) { alert("먼저 맨 위에서 이름을 골라 주세요 (누가 올렸는지 남깁니다)"); return; }
    if (!files || !files.length || !privacyOk()) return;
    var arr = Array.prototype.slice.call(files);
    (function next() {
      var file = arr.shift(); if (!file) return;
      var img = /^image\/(jpeg|png|webp|heic|heif|gif)$/i.test(file.type) || (/^image\//.test(file.type) && !/svg/.test(file.type));
      if (!img && file.size > MAXRAW) { alert("「" + file.name + "」은(는) " + size(file.size) + "라 너무 커요 · 3MB까지 올릴 수 있어요 (PDF는 줄여서 올려 주세요)"); next(); return; }
      var id = "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), job = { id: id, n: file.name, p: 0 };
      m.jobs.push(job); draw(m);
      readURL(file).then(function (url) {
        if (!img) return { url: url, ty: file.type || "application/octet-stream" };
        return shrink(url, 1600, 0.82).then(function (big) { return shrink(url, 260, 0.62).then(function (th) { return big ? { url: big.url, ty: "image/jpeg", th: th && th.url, w: big.w, h: big.h } : { url: url, ty: file.type }; }); });
      }).then(function (r) {
        var parts = [], i; for (i = 0; i < r.url.length; i += CHUNK) parts.push(r.url.slice(i, i + CHUNK));
        var done = 0;
        function put(k) {
          if (k >= parts.length) return Promise.resolve();
          return window.__CS_FILEPUT(id, k, parts[k]).then(function () { done++; job.p = done / parts.length; draw(m); return put(k + 1); });
        }
        return put(0).then(function () {
          cache[id] = r.url;
          patch(m.scope, id, function (f) { f.n = file.name; f.ty = r.ty; f.sz = Math.round(r.url.length * 0.75); f.parts = parts.length; f.by = me(); f.at = stamp(); f.ts = Date.now(); f.cat = m.cat0 || (img ? "photo" : "doc"); if (m.ref) f.ref = m.ref; if (r.th) f.th = r.th; if (r.w) { f.w = r.w; f.h = r.h; } });
        });
      }).catch(function (e) { alert("「" + file.name + "」을(를) 올리지 못했어요 · 인터넷을 확인하고 다시 해 주세요\n(" + ((e && e.message) || e) + ")"); })
        .then(function () { m.jobs = m.jobs.filter(function (j) { return j !== job; }); drawAll(); next(); });
    })();
  }
  function getData(id, f) {
    if (cache[id]) return Promise.resolve(cache[id]);
    if (!window.__CS_FILEGET) return Promise.reject(new Error("서버 연결 전"));
    var ps = []; for (var i = 0; i < (f.parts || 1); i++) ps.push(window.__CS_FILEGET(id, i));
    return Promise.all(ps).then(function (a) { var s = a.join(""); if (!s) throw new Error("파일 내용을 찾지 못했어요"); cache[id] = s; return s; });
  }
  function blobOf(url) { var m = url.match(/^data:([^;,]*)(;base64)?,(.*)$/); if (!m) return null; var b = atob(m[3]), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return new Blob([a], { type: m[1] || "application/octet-stream" }); }
  // 크게 보기 — 사진은 화면 가득(◀ ▶ · 저장), 다른 파일은 새 창 또는 저장
  var lb = null;
  function view(scope, id, ref) {
    var L = list(scope, ref), i = L.map(function (f) { return f._id; }).indexOf(id), f = L[i]; if (!f) return;
    if (!lb) { lb = document.createElement("div"); lb.className = "cflb"; lb.hidden = true; document.body.appendChild(lb); lb.addEventListener("click", function (e) { if (e.target === lb || e.target.closest(".cflbx")) lb.hidden = true; }); document.addEventListener("keydown", function (e) { if (!lb.hidden && e.key === "Escape") lb.hidden = true; if (!lb.hidden && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { var b = lb.querySelector(e.key === "ArrowLeft" ? ".cflbp" : ".cflbn"); if (b) b.click(); } }); }
    lb.hidden = false; lb.innerHTML = '<div class="cflbin"><p class="cflbload">불러오는 중…</p></div>';
    getData(id, f).then(function (url) {
      var bl = blobOf(url), ou = bl ? URL.createObjectURL(bl) : url, isImg = /^image\//.test(f.ty), isPdf = /pdf/.test(f.ty);
      lb.innerHTML = '<div class="cflbin">' + (isImg ? '<img src="' + ou + '" alt="' + esc(f.n) + '">' : isPdf && window.innerWidth > 760 ? '<iframe src="' + ou + '" title="' + esc(f.n) + '"></iframe>' : '<div class="cflbdoc"><b>' + icon(f) + " " + esc(f.n) + "</b><span>" + size(f.sz || 0) + "</span></div>") +
        '<div class="cflbbar"><span><b>' + esc(f.n) + "</b> · " + esc(nim(f.by)) + " " + esc(f.at || "") + (f.m ? " · " + esc(f.m) : "") + '</span><a class="cflbdl" href="' + ou + '" download="' + esc(f.n) + '">⬇ 저장</a>' + (!isImg ? '<a class="cflbdl" href="' + ou + '" target="_blank" rel="noopener">새 창으로 열기</a>' : "") +
        (L.length > 1 && isImg ? '<button type="button" class="cflbp">◀</button><button type="button" class="cflbn">▶</button>' : "") + '<button type="button" class="cflbx">✕ 닫기</button></div></div>';
      var p = lb.querySelector(".cflbp"), n = lb.querySelector(".cflbn"), imgs = L.filter(function (x) { return /^image\//.test(x.ty); }), k = imgs.map(function (x) { return x._id; }).indexOf(id);
      if (p) p.onclick = function (e) { e.stopPropagation(); view(scope, imgs[(k - 1 + imgs.length) % imgs.length]._id, ref); };
      if (n) n.onclick = function (e) { e.stopPropagation(); view(scope, imgs[(k + 1) % imgs.length]._id, ref); };
    }).catch(function (e) { lb.innerHTML = '<div class="cflbin"><p class="cflbload">못 불러왔어요 — ' + esc(e.message || e) + '</p><div class="cflbbar"><button type="button" class="cflbx">✕ 닫기</button></div></div>'; });
  }
  function draw(m) {
    if (!m.el.isConnected) return;
    var all = list(m.scope, m.ref), gone = list(m.scope, m.ref, true).filter(function (f) { return f.del; }), cats = m.cats || CATS0;
    var L = all.filter(function (f) { return m.flt === "all" || (f.cat || "doc") === m.flt; });
    var busy = m.el.contains(document.activeElement) && document.activeElement.classList.contains("cfm");
    if (busy) { m.pend = 1; return; } m.pend = 0;
    var h = (m.title ? '<div class="cfh"><b>' + m.title + '</b><span>' + all.length + "개" + (all.length ? " · " + size(all.reduce(function (a, f) { return a + (f.sz || 0); }, 0)) : "") + "</span></div>" : "") +
      '<label class="cfdrop' + (m.compact ? " sm" : "") + '"><input type="file" multiple class="cfin"' + (m.accept ? ' accept="' + m.accept + '"' : "") + '><span class="cfdi">📎</span><b>' + (m.compact ? "사진 · 파일 올리기" : "눌러서 사진 · 파일 올리기") + '</b><small>' + (m.compact ? "" : "여기로 끌어다 놓아도 돼요 · 사진은 자동으로 줄여서 · 다른 파일은 3MB까지 · ") + "여권 · 신분증 · 카드 사진은 올리지 마세요</small></label>";
    if (!m.compact || all.length > 3) h += '<div class="cfflt">' + [["all", "전체"]].concat(cats).map(function (c) { var n = c[0] === "all" ? all.length : all.filter(function (f) { return (f.cat || "doc") === c[0]; }).length; return '<button type="button" data-flt="' + c[0] + '" aria-pressed="' + (m.flt === c[0]) + '">' + c[1] + " <i>" + n + "</i></button>"; }).join("") + "</div>";
    h += '<div class="cfgrid' + (m.compact ? " sm" : "") + '">' + m.jobs.map(function (j) { return '<div class="cft up"><div class="cfth"><i class="cfprog"><b style="width:' + Math.round(j.p * 100) + '%"></b></i></div><div class="cftb"><b>' + esc(j.n) + "</b><small>올리는 중 " + Math.round(j.p * 100) + "%</small></div></div>"; }).join("") +
      L.map(function (f, i) {
        return '<div class="cft" data-id="' + f._id + '" style="--i:' + i + '"><button type="button" class="cfth" data-open="' + f._id + '" aria-label="' + esc(f.n) + ' 열기">' + (f.th ? '<img src="' + f.th + '" alt="" loading="lazy">' : '<span class="cfic">' + icon(f) + "</span>") + "</button>" +
          '<div class="cftb"><b title="' + esc(f.n) + '">' + esc(f.n) + "</b><small>" + esc(nim(f.by)) + " · " + esc(f.at || "") + " · " + size(f.sz || 0) + '</small><input type="text" class="cfm" data-id="' + f._id + '" value="' + esc(f.m || "") + '" placeholder="메모 (예: 3일차 점심 예약)">' +
          '<div class="cfrow"><select class="cfc" data-id="' + f._id + '" aria-label="분류">' + cats.map(function (c) { return '<option value="' + c[0] + '"' + ((f.cat || "doc") === c[0] ? " selected" : "") + ">" + c[1] + "</option>"; }).join("") + '</select><button type="button" class="cfx" data-del="' + f._id + '" aria-label="빼기">✕</button></div></div></div>';
      }).join("") + (!L.length && !m.jobs.length ? '<p class="cfnone">' + (all.length ? "이 분류에는 아직 없어요" : "아직 올린 파일이 없어요") + "</p>" : "") + "</div>" +
      (gone.length ? '<details class="cfgone"><summary>빠진 파일 ' + gone.length + "개 (지우지 않고 남겨 둠)</summary>" + gone.map(function (f) { return '<div class="cfg1"><span>' + icon(f) + " " + esc(f.n) + " <small>뺀 사람 " + esc(nim(f.delBy || "")) + "</small></span><button type=\"button\" class=\"skbtn\" data-back=\"" + f._id + '">↺ 되살리기</button></div>'; }).join("") + "</details>" : "");
    m.el.innerHTML = h;
  }
  function drawAll() { mounts.forEach(function (m) { if (!m.el.isConnected) return; draw(m); }); mounts = mounts.filter(function (m) { return m.el.isConnected || m.keep; }); }
  function mount(el, opt) {
    var old = mounts.filter(function (m) { return m.el === el; })[0];
    if (old) { old.scope = opt.scope; old.ref = opt.ref; old.title = opt.title; draw(old); return old; }
    var m = { el: el, scope: opt.scope, ref: opt.ref, cats: opt.cats, title: opt.title, compact: opt.compact, accept: opt.accept, cat0: opt.cat0, keep: opt.keep, flt: "all", jobs: [] };
    mounts.push(m);
    el.classList.add("cfbox");
    el.addEventListener("change", function (e) {
      var t = e.target;
      if (t.classList.contains("cfin")) { upload(m, t.files); t.value = ""; return; }
      if (t.classList.contains("cfc")) patch(m.scope, t.dataset.id, function (f) { f.cat = t.value; });
      if (t.classList.contains("cfm")) { patch(m.scope, t.dataset.id, function (f) { f.m = t.value.trim(); }); }
    });
    el.addEventListener("focusout", function () { setTimeout(function () { if (m.pend) draw(m); }, 60); });
    el.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.classList.contains("cfm")) e.target.blur(); });
    el.addEventListener("click", function (e) {
      var t = e.target.closest("[data-flt],[data-open],[data-del],[data-back]"); if (!t) return;
      if (t.dataset.flt) { m.flt = t.dataset.flt; draw(m); return; }
      if (t.dataset.open) { view(m.scope, t.dataset.open, m.ref); return; }
      if (t.dataset.del) { var f = load(m.scope)[t.dataset.del]; if (!f || !confirm("「" + f.n + "」을(를) 목록에서 뺄까요?\n(지우지 않고 「빠진 파일」에 남겨 둡니다)")) return; patch(m.scope, t.dataset.del, function (x) { x.del = 1; x.delBy = me(); x.delAt = stamp(); }); drawAll(); return; }
      if (t.dataset.back) { patch(m.scope, t.dataset.back, function (x) { delete x.del; delete x.delBy; delete x.delAt; }); drawAll(); }
    });
    ["dragenter", "dragover"].forEach(function (ev) { el.addEventListener(ev, function (e) { if (!e.dataTransfer || Array.prototype.indexOf.call(e.dataTransfer.types || [], "Files") < 0) return; e.preventDefault(); el.classList.add("cfover"); }); });
    ["dragleave", "drop"].forEach(function (ev) { el.addEventListener(ev, function (e) { if (ev === "dragleave" && el.contains(e.relatedTarget)) return; el.classList.remove("cfover"); }); });
    el.addEventListener("drop", function (e) { if (!e.dataTransfer || !e.dataTransfer.files.length) return; e.preventDefault(); upload(m, e.dataTransfer.files); });
    draw(m); return m;
  }
  window.addEventListener("cs:remote", function (e) { var ks = (e.detail && e.detail.keys) || []; if (ks.some(function (k) { return k.indexOf("cafesui.files.") === 0; })) drawAll(); });
  window.__CS_FILES = { mount: mount, list: list, view: view, drawAll: drawAll, size: size, getData: getData };
})();
