/**
 * index.html 블로그 목록 채우기 (data/blog-draft-manifest.js 선행 필요)
 */
(function () {
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function todaySeoulYmd() {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }

  function init() {
    var host = document.getElementById("blog-draft-list");
    if (!host) return;

    var list =
      typeof window.blogDraftManifest === "undefined" ? [] : window.blogDraftManifest;
    if (!list.length) {
      host.innerHTML =
        '<p class="blog-draft-empty muted">등록된 글 초안이 없습니다. <code>npm run content:draft</code> 후 <code>npm run blog:manifest</code>를 실행해 주세요.</p>';
      return;
    }

    var ul = "<ul class=\"blog-draft-cards\" role=\"list\">";
    var today = todaySeoulYmd();
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      var href =
        "blog-article.html?slug=" +
        encodeURIComponent(item.slug || "");
      var dt = escapeHtml(item.date || "");
      var todayBadge =
        item.date === today ? '<span class="blog-draft-today">오늘</span>' : "";
      var title = escapeHtml(item.title || item.slug || "제목 없음");
      var ex =
        '<p class=\"blog-draft-excerpt\">' +
        escapeHtml(item.excerpt || "") +
        "</p>";
      ul +=
        "<li>" +
        '<a class="blog-draft-card" href="' +
        escapeHtml(href) +
        '">' +
        '<span class="blog-draft-date">' +
        todayBadge +
        dt +
        "</span>" +
        '<span class="blog-draft-title">' +
        title +
        "</span>" +
        ex +
        '<span class="blog-draft-more">내용 보기 →</span>' +
        "</a>" +
        "</li>";
    }
    ul += "</ul>";
    host.innerHTML = ul;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
