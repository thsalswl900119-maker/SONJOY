// 크롬으로 열기 — 휴대폰에서 크롬이 아닌 브라우저(사파리 · 카톡 · 앱 안 브라우저)로 열리면 위에 「크롬으로 열기」 띠.
// 주소에 ?chrome=1 이 붙은 링크는 누르자마자 크롬으로 넘긴다(한 번만 · 크롬이면 그대로).
(function () {
  var ua = navigator.userAgent || "";
  var isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1), isAnd = /Android/.test(ua);
  if (!isIOS && !isAnd) return;   // 컴퓨터는 그대로
  var inChrome = isIOS ? /CriOS/.test(ua) : (/Chrome\//.test(ua) && !/; wv\)|Version\/[\d.]+ Chrome|SamsungBrowser|KAKAOTALK|NAVER|Instagram|FBAN|FB_IAB|Line\/|Whale|EdgA|OPR|DaumApps|Telegram/.test(ua));
  if (inChrome) return;
  var url = location.href; try { var u0 = new URL(location.href); u0.searchParams.delete("chrome"); url = u0.toString(); } catch (e) {}
  function go() {
    var noProto = url.replace(/^https?:\/\//, "");
    if (isIOS) location.href = "googlechromes://" + noProto;
    else location.href = "intent://" + noProto.split("#")[0] + "#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=" + encodeURIComponent(url) + ";end";
  }
  var want = /[?&]chrome=1/.test(location.search);
  if (want) { try { if (sessionStorage.getItem("cs.chrome.tried")) want = false; else sessionStorage.setItem("cs.chrome.tried", "1"); } catch (e) {} }
  if (want) setTimeout(go, 50);
  var hide = false; try { hide = localStorage.getItem("cafesui.ui.nochrome") === "1"; } catch (e) {}
  if (hide) return;
  var bar = document.createElement("div"); bar.className = "chromebar";
  bar.innerHTML = '<span>📲 이 화면은 <b>크롬</b>에서 열어 주세요 <small>(로그인 · 레시피 비밀번호가 브라우저마다 따로라서)</small></span><button type="button" class="cbgo">크롬으로 열기</button><button type="button" class="cbx" aria-label="닫기">✕</button>';
  document.body.insertBefore(bar, document.body.firstChild);
  bar.querySelector(".cbgo").onclick = go;
  bar.querySelector(".cbx").onclick = function () { bar.remove(); try { localStorage.setItem("cafesui.ui.nochrome", "1"); } catch (e) {} };
})();
