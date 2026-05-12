/**
 * GitHub Pages 하위 경로(https://계정.github.io/repo/…)나 index.html 포함 URL에서도
 * styles.css · data/*.js 같은 상대 경로가 깨지지 않도록 같은 폴더를 기준으로 <base>를 설정합니다.
 * 반드시 <head> 안에서 stylesheet 링크보다 위에 포함하세요 (defer 없음).
 */
(function () {
  try {
    var u = new URL(window.location.href);
    var pathname = u.pathname || "/";
    if (/\.(html|htm)$/i.test(pathname)) {
      pathname = pathname.slice(0, pathname.lastIndexOf("/") + 1);
      if (pathname === "") pathname = "/";
    } else if (pathname !== "/" && !pathname.endsWith("/")) {
      pathname = pathname + "/";
    }
    u.pathname = pathname;
    var b = document.createElement("base");
    b.href = u.href;
    var ins = document.head.querySelector(
      'link[rel="stylesheet"], link[rel="canonical"], meta[http-equiv]'
    );
    if (ins) document.head.insertBefore(b, ins);
    else document.head.prepend(b);
  } catch (e) {}
})();
