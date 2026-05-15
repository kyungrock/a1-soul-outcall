/**
 * blog-article.html — ?slug= 파일명(md 제외)
 */
(function () {
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function fetchText(url) {
    var res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) throw new Error("로드 실패 " + res.status);
    return res.text();
  }

  function slugOk(slug, manifest) {
    if (!slug || typeof slug !== "string") return false;
    if (!/^[\w.-]+$/.test(slug)) return false;
    return manifest.some(function (x) {
      return x.slug === slug;
    });
  }

  function parseFrontmatterTitle(raw, fallback) {
    if (!/^---\r?\n/.test(raw)) return fallback;
    var end = raw.indexOf("\n---", 4);
    if (end === -1) return fallback;
    var fmRaw = raw.slice(4, end);
    var pick = function (reQ, reBare) {
      var m =
        fmRaw.match(reQ) || fmRaw.match(reBare);
      return m ? m[1].trim().replace(/^"|"$/g, "") : "";
    };
    var custom = pick(/^custom_title:\s*"([^"]*)"$/m, /^custom_title:\s*(.+)$/m);
    if (custom) return custom;
    var st = pick(/^source_title:\s*"([^"]*)"$/m, /^source_title:\s*(.+)$/m);
    if (st) return st;
    return fallback;
  }

  async function init() {
    var titleEl = document.getElementById("article-heading");
    var subEl = document.getElementById("article-meta");
    var bodyEl = document.getElementById("article-body");
    var msgEl = document.getElementById("article-msg");
    if (!titleEl || !bodyEl || !SimpleMd) return;

    var params = new URLSearchParams(location.search || "");
    var slug = params.get("slug");

    var manifest =
      typeof window.blogDraftManifest === "undefined"
        ? []
        : window.blogDraftManifest || [];
    if (!manifest.length || !slugOk(slug, manifest)) {
      if (msgEl) msgEl.textContent = "유효한 글 주소가 아닙니다. 홈으로 돌아가 목록에서 선택해 주세요.";
      titleEl.textContent = "글을 찾을 수 없음";
      return;
    }

    var entry =
      manifest.find(function (x) {
        return x.slug === slug;
      }) || {};

    titleEl.textContent = entry.title || slug;
    var metaBits = [];
    if (entry.date) metaBits.push("등록 일자 · " + entry.date);
    var rp = entry.region_path || entry.series;
    if (rp) metaBits.push(String(rp));
    if (subEl) subEl.textContent = metaBits.join(" · ");

    var embedded =
      typeof entry.mdSource === "string" && entry.mdSource.length ? entry.mdSource : "";

    var cover = entry.cover_image ? String(entry.cover_image).trim() : "";
    var coverHtml = "";
    if (cover) {
      coverHtml =
        '<figure class="article-cover"><img src="' +
        esc(cover) +
        '" alt="" width="960" height="480" loading="lazy" /></figure>';
    }

    try {
      if (embedded) {
        titleEl.textContent = parseFrontmatterTitle(embedded, titleEl.textContent);
        bodyEl.innerHTML = coverHtml + SimpleMd.markdownToHtml(embedded);
        if (msgEl) msgEl.textContent = "";
        return;
      }

      var mdPath = "content/drafts/" + encodeURIComponent(slug) + ".md";
      var raw = await fetchText(mdPath);
      titleEl.textContent = parseFrontmatterTitle(raw, titleEl.textContent);
      bodyEl.innerHTML = coverHtml + SimpleMd.markdownToHtml(raw);
      if (msgEl) msgEl.textContent = "";
    } catch (e) {
      if (msgEl) {
        msgEl.textContent =
          "내용을 불러오지 못했습니다 (" +
          esc(e.message) +
          "). 로컬 file://에서는 자동 포함 본문이 없을 때 발생합니다 — 터미널에서 npm run blog:manifest 를 다시 실행하세요.";
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
