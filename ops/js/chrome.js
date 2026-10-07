// 크롬으로 열기 — 휴대폰에서 크롬이 아닌 브라우저(사파리 · 카톡 · 앱 안 브라우저)로 열리면 크롬으로 보낸다.
// · 아이폰은 앱 안 브라우저가 「자동으로 다른 앱 열기」를 막는다 → 손가락으로 누르는 큰 버튼(누르면 열림) + 주소 복사.
// · 카카오톡 안 브라우저는 kakaotalk://web/openExternal 로 바깥 기본 브라우저에서 연다(기본 브라우저를 크롬으로 해 두면 크롬).
// · 주소에 ?chrome=1 이 붙은 링크는 화면 전체 안내, 아니면 맨 위 파란 띠.
(function () {
  var ua = navigator.userAgent || "";
  var isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1), isAnd = /Android/.test(ua);
  if (!isIOS && !isAnd) return;   // 컴퓨터는 그대로
  var inChrome = isIOS ? /CriOS/.test(ua) : (/Chrome\//.test(ua) && !/; wv\)|Version\/[\d.]+ Chrome|SamsungBrowser|KAKAOTALK|NAVER|Instagram|FBAN|FB_IAB|Line\/|Whale|EdgA|OPR|DaumApps|Telegram/.test(ua));
  if (inChrome) return;
  var url = location.href; try { var u0 = new URL(location.href); u0.searchParams.delete("chrome"); u0.hash = ""; url = u0.toString(); } catch (e) {}
  var chromeUrl = isIOS ? "googlechromes://" + url.replace(/^https?:\/\//, "")
                        : "intent://" + url.replace(/^https?:\/\//, "") + "#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=" + encodeURIComponent(url) + ";end";
  var kakao = /KAKAOTALK/i.test(ua);
  var want = /[?&]chrome=1/.test(location.search);
  // 카카오톡: 바깥 브라우저로 (자동 · 한 번만)
  if (kakao) { try { if (!sessionStorage.getItem("cs.kakao.out")) { sessionStorage.setItem("cs.kakao.out", "1"); location.href = "kakaotalk://web/openExternal?url=" + encodeURIComponent(url); } } catch (e) {} }
  // 안드로이드는 자동으로도 넘어간다
  if (want && isAnd && !kakao) { try { if (!sessionStorage.getItem("cs.chrome.tried")) { sessionStorage.setItem("cs.chrome.tried", "1"); setTimeout(function () { location.href = chromeUrl; }, 60); } } catch (e) {} }
  function copy() {
    var done = function () { var b = document.querySelector(".cbcopy"); if (b) b.textContent = "✅ 복사됨 · 크롬 주소창에 붙여넣기"; };
    try { navigator.clipboard.writeText(url).then(done, function () { prompt("이 주소를 복사해서 크롬에 붙여 넣어 주세요", url); }); } catch (e) { prompt("이 주소를 복사해서 크롬에 붙여 넣어 주세요", url); }
  }
  var hide = false; try { hide = localStorage.getItem("cafesui.ui.nochrome") === "1"; } catch (e) {}
  if (want) {
    // 화면 전체 안내 — 손가락으로 누르면 크롬이 열린다
    var ov = document.createElement("div"); ov.className = "chromeov";
    ov.innerHTML = '<div class="cobox"><div class="coic">📲</div><b>크롬에서 열어 주세요</b><p>아래 파란 버튼을 누르면 크롬이 열립니다<br><small>「Chrome에서 여시겠습니까?」가 뜨면 「열기」</small></p>' +
      '<a class="cogo" href="' + chromeUrl.replace(/"/g, "&quot;") + '">크롬으로 열기</a>' +
      '<button type="button" class="cbcopy">주소 복사 (안 열리면 크롬에 붙여넣기)</button>' +
      '<button type="button" class="costay">그냥 여기서 볼게요</button></div>';
    document.body.appendChild(ov);
    ov.querySelector(".cbcopy").onclick = copy;
    ov.querySelector(".costay").onclick = function () { ov.remove(); };
    return;
  }
  if (hide) return;
  var bar = document.createElement("div"); bar.className = "chromebar";
  bar.innerHTML = '<span>📲 이 화면은 <b>크롬</b>에서 열어 주세요 <small>(로그인 · 레시피 비밀번호가 브라우저마다 따로라서)</small></span><a class="cbgo" href="' + chromeUrl.replace(/"/g, "&quot;") + '">크롬으로 열기</a><button type="button" class="cbx" aria-label="닫기">✕</button>';
  document.body.insertBefore(bar, document.body.firstChild);
  bar.querySelector(".cbx").onclick = function () { bar.remove(); try { localStorage.setItem("cafesui.ui.nochrome", "1"); } catch (e) {} };
})();
