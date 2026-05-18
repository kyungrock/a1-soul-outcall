/**
 * blog/seoul-*.html 전문 생성 + 정적 페이지 게시판형 요약 카드
 * npm run content:seoul-blog-board
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ARTICLES, SEOUL_GU, SHOP, blogHref } from "./seoul-blog-articles-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BLOG_DIR = path.join(ROOT, "blog");

const BOARD_S = "<!-- SEOUL_BLOG_BOARD_START -->";
const BOARD_E = "<!-- SEOUL_BLOG_BOARD_END -->";
const OLD_SEO_S = "<!-- SEOUL_SEO_BLOG_START -->";
const OLD_SEO_E = "<!-- SEOUL_SEO_BLOG_END -->";
const STUB_RE =
  /<p class="section-lead muted">이 영역은 이 HTML 파일에서만 직접 편집합니다\.<\/p>\s*<!--\s*카드·문단·링크 등을 여기에 넣으세요\s*-->/;

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderBlocks(blocks) {
  return blocks
    .map((b) => (b.t === "h3" ? `        <h3 class="seoul-blog-h3">${b.h}</h3>` : `        <p>${b.h}</p>`))
    .join("\n");
}

/** 게시판 부모 파일 → 블로그 페이지에서의 상대 링크 (홈은 index.html 파일명 대신 /) */
function listingHref(parentFile) {
  return parentFile === "index.html" ? "../" : `../${parentFile}`;
}

function shopBox() {
  return `        <ul class="seoul-blog-shop-box">
          <li><strong>${escapeHtml(SHOP.name)}</strong> · 서울 · ${escapeHtml(SHOP.price)} (변동 가능)</li>
          <li>스포츠·오일·스웨디시·VVIP·믹스·한국인 스웨 라인</li>
          <li>예약·문의: <a href="${SHOP.telHref}">${escapeHtml(SHOP.tel)}</a></li>
          <li><a href="../${SHOP.detail}">${escapeHtml(SHOP.name)} 상세 페이지</a></li>
        </ul>`;
}

function renderLinks(article) {
  const lines = [
    `          <li><a href="../">서울출장마사지 홈</a></li>`,
    `          <li><a href="../shops.html">등록 업체 목록</a></li>`,
    `          <li><a href="${listingHref(article.parentFile)}">${escapeHtml(article.kwLabel)} · 목록</a></li>`,
  ];
  for (const [label, href] of article.neighborLinks || []) {
    const nh = href === "index.html" ? "../" : `../${href}`;
    lines.push(`          <li><a href="${nh}">${escapeHtml(label)}</a></li>`);
  }
  return `<ul class="seoul-blog-links">\n${lines.join("\n")}\n        </ul>`;
}

function renderFullBody(article) {
  return `${renderBlocks(article.blocks)}
${shopBox()}
        <p class="fineprint">${escapeHtml(SHOP.name)} 소개 · ${escapeHtml(article.shopBlurb)}</p>
${renderLinks(article)}`;
}

function blogPage(article) {
  const back = listingHref(article.parentFile);
  const title = `${article.title} | 서울출장마사지`;
  const body = renderFullBody(article);
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="../js/page-base.js"></script>
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(article.excerpt)}" />
  <meta name="robots" content="index, follow" />
  <meta name="theme-color" content="#2d6a4f" />
  <link rel="stylesheet" href="../styles.css" />
  <link rel="stylesheet" href="../shops.css" />
</head>
<body>
  <a class="skip-link" href="#main">본문으로 건너뛰기</a>
  <header class="site-header">
    <div class="inner">
      <p class="site-title">
        <a href="../">
          <span class="brand-name">서울출장마사지</span>
          <span class="brand-tagline">20대,30대 힐링출장 서비스</span>
        </a>
      </p>
    </div>
  </header>
  <main id="main" class="blog-article-layout">
    <article class="inner blog-article-inner seoul-blog-full">
      <p class="article-back-wrap">
        <a class="article-back" href="${escapeHtml(back)}">← 오늘의 글·초안 목록</a>
      </p>
      <figure class="seoul-seo-blog-figure">
        <img src="../${escapeHtml(article.image)}" alt="${escapeHtml(article.kwLabel || "서울")}" width="800" height="420" loading="lazy" />
      </figure>
      <header class="article-header-block">
        <h1 class="seoul-seo-blog-title">${escapeHtml(article.title)}</h1>
        <p class="article-meta muted">정보 제공 목적 · 의료 효과 미보장 · 요금·코스는 상담 기준</p>
      </header>
      <div class="article-body prose-like seoul-blog-article-body">
${body}
      </div>
    </article>
  </main>
  <footer class="site-footer">
    <div class="inner">
      <p class="fineprint">참고용 안내 글입니다.</p>
      <p class="copyright">© <span id="year"></span> 서울출장마사지</p>
    </div>
  </footer>
  <script src="../main.js" defer></script>
</body>
</html>`;
}

function boardCard(article) {
  const href = blogHref(article);
  return `${BOARD_S}
        <div class="blog-board" role="list">
          <article class="blog-board-item" role="listitem">
            <a class="blog-board-card" href="${escapeHtml(href)}">
              <span class="blog-board-thumb">
                <img src="${escapeHtml(article.image)}" alt="" width="400" height="225" loading="lazy" />
              </span>
              <span class="blog-board-text">
                <span class="blog-board-kicker">오늘의 글·초안</span>
                <span class="blog-board-title">${escapeHtml(article.title)}</span>
                <span class="blog-board-excerpt">${escapeHtml(article.excerpt)}</span>
                <span class="blog-board-shop-line"><strong>${escapeHtml(SHOP.name)}</strong> 소개 · ${escapeHtml(article.shopBlurb)}</span>
                <span class="blog-board-cta">전체 글 보기 →</span>
              </span>
            </a>
          </article>
        </div>
        ${BOARD_E}`;
}

function injectBoard(parentFile, cardHtml) {
  const fp = path.join(ROOT, parentFile);
  let html = fs.readFileSync(fp, "utf8");
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const boardRe = new RegExp(`${esc(BOARD_S)}[\\s\\S]*?${esc(BOARD_E)}`);
  const oldSeoRe = new RegExp(`${esc(OLD_SEO_S)}[\\s\\S]*?${esc(OLD_SEO_E)}`);

  if (boardRe.test(html)) html = html.replace(boardRe, cardHtml.trim());
  else if (oldSeoRe.test(html)) html = html.replace(oldSeoRe, cardHtml.trim());
  else if (STUB_RE.test(html)) html = html.replace(STUB_RE, cardHtml.trim());
  else return false;

  fs.writeFileSync(fp, html, "utf8");
  return true;
}

function allArticles() {
  return [ARTICLES.home, ...SEOUL_GU.map((g) => ARTICLES[g]).filter(Boolean)];
}

function main() {
  fs.mkdirSync(BLOG_DIR, { recursive: true });
  let pages = 0;
  let boards = 0;

  for (const article of allArticles()) {
    let pageHtml = blogPage(article);
    pageHtml = pageHtml.replace('<motion class="inner">', '<div class="inner">');
    pageHtml = pageHtml.replace("</motion>\n  </header>", "</div>\n  </header>");
    if (pageHtml.includes("<motion")) {
      pageHtml = pageHtml.replace(/<motion/g, "<div").replace(/<\/motion>/g, "</div>");
    }
    fs.writeFileSync(path.join(BLOG_DIR, `seoul-${article.id}.html`), pageHtml, "utf8");
    pages++;
    if (injectBoard(article.parentFile, boardCard(article))) boards++;
    else console.warn("inject fail:", article.parentFile);
  }

  console.log("build-seoul-blog-board: pages", pages, "boards", boards);
}

main();
