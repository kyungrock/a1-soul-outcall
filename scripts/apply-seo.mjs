/**
 * GitHub Pages 등 배포 URL 반영 — 한 번에 처리
 *
 * 1) seo-config.json 의 "siteUrl" 에 루트 절대 주소 입력 (끝 / 없음)
 *    예: https://USERNAME.github.io/REPOSITORY
 * 2) 실행: node scripts/apply-seo.mjs
 *    또는: npm run seo
 *
 * 환경변수 SITE_URL 가 있으면 seo-config 보다 우선합니다.
 *
 * 하는 일: sitemap.xml, robots.txt 생성 + index/shops/shop-detail HTML 절대 메타 주입
 */
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";
import { loadSiteUrl, loadOgImageAbsolute } from "./seo-load-site-url.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const MARKER_START = "  <!-- APPLY_SEO_START -->";
const MARKER_END = "  <!-- APPLY_SEO_END -->";

const FALLBACK = "https://example.com";

function normPhone(p) {
  return String(p || "").replace(/\D/g, "");
}

function resolveMatchedShopId(card, shops) {
  if (!card || !Array.isArray(shops)) return null;
  const p = normPhone(card.phone);
  if (p) {
    const byPhone = shops.find((s) => normPhone(s.phone) === p);
    if (byPhone) return byPhone.id;
  }
  const byName = shops.find((s) => s.name === card.name);
  return byName ? byName.id : null;
}

function buildDetailPath(card, shops) {
  const mid = resolveMatchedShopId(card, shops);
  if (mid) return `/shop-detail.html?id=${encodeURIComponent(mid)}`;
  return `/shop-detail.html?cardId=${encodeURIComponent(String(card.id))}`;
}

function loadOutcallCards() {
  const p = path.join(ROOT, "data", "shop-card-data-outcall.js");
  const t = fs.readFileSync(p, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(t, sandbox);
  return sandbox.window.outcallShopCardData || [];
}

function loadMatchedShops() {
  const p = path.join(ROOT, "data", "shops-outcall-matched.json");
  let t = fs.readFileSync(p, "utf8").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  const j = JSON.parse(t.slice(start, end + 1));
  return j.shops || [];
}

/** blog-article.html ?slug= 과 동일 규칙 — data/blog-draft-manifest.json */
function loadBlogDraftSlugs() {
  const p = path.join(ROOT, "data", "blog-draft-manifest.json");
  if (!fs.existsSync(p)) return [];
  const arr = JSON.parse(fs.readFileSync(p, "utf8"));
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => (x && typeof x.slug === "string" ? x.slug : ""))
    .filter((slug) => /^[\w.-]+$/.test(slug));
}

function xmlEscape(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(url) {
  return String(url).replace(/"/g, "&quot;");
}

function writeSitemapAndRobots(effectiveUrl) {
  const cards = loadOutcallCards();
  const shops = loadMatchedShops();
  const blogSlugs = loadBlogDraftSlugs();
  const urls = new Set();
  urls.add(`${effectiveUrl}/index.html`);
  urls.add(`${effectiveUrl}/shops.html`);
  urls.add(`${effectiveUrl}/blog-article.html`);
  for (const slug of blogSlugs) {
    urls.add(
      `${effectiveUrl}/blog-article.html?slug=${encodeURIComponent(slug)}`
    );
  }
  for (const s of shops) {
    const id = s && s.id != null ? String(s.id) : "";
    if (id) {
      urls.add(
        `${effectiveUrl}/shop-detail.html?id=${encodeURIComponent(id)}`
      );
    }
  }
  for (const card of cards) {
    urls.add(effectiveUrl + buildDetailPath(card, shops));
  }
  const sortedUrls = Array.from(urls).sort();
  const lastmod = new Date().toISOString().slice(0, 10);

  const urlEntries = sortedUrls
    .map((loc) => {
      let priority = "0.7";
      let changefreq = "weekly";
      if (/\/index\.html$/.test(loc)) {
        priority = "1.0";
      } else if (/\/shops\.html$/.test(loc)) {
        priority = "0.9";
      } else if (/\/shop-detail\.html/.test(loc)) {
        priority = "0.75";
      } else if (/\/blog-article\.html\?/.test(loc)) {
        priority = "0.62";
      } else if (/\/blog-article\.html$/.test(loc)) {
        priority = "0.65";
      }
      return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join("\n");

  fs.writeFileSync(
    path.join(ROOT, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`,
    "utf8"
  );

  fs.writeFileSync(
    path.join(ROOT, "robots.txt"),
    `# 서울출장마사지 — robots (scripts/apply-seo.mjs)
# 수정: seo-config.json siteUrl 또는 SITE_URL 로 node scripts/apply-seo.mjs

User-agent: *
Allow: /

Disallow: /scripts/

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: ${effectiveUrl}/sitemap.xml
`,
    "utf8"
  );

  return sortedUrls.length;
}

function injectMarkerBlock(html, generateInner) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${esc(MARKER_START)}[\\s\\S]*?${esc(MARKER_END)}`, "m");
  if (!re.test(html)) {
    console.warn("[apply-seo] 마커 없음 (APPLY_SEO_START/END)");
    return html;
  }
  return html.replace(re, `${MARKER_START}\n${generateInner}\n${MARKER_END}`);
}

function imageLines(siteUrl) {
  const img = loadOgImageAbsolute(siteUrl);
  if (!img) return "";
  return `\n  <meta property="og:image" content="${escapeAttr(img)}" />\n  <meta name="twitter:image" content="${escapeAttr(img)}" />`;
}

/** index / shops 공통 패턴 — canonical · og:url · twitter:url · 선택 og:image */
function blockForStaticPage(siteUrl, pathname) {
  const canonical = `${siteUrl}${pathname}`;
  let out = `  <link rel="canonical" href="${escapeAttr(canonical)}" />`;
  out += `\n  <meta property="og:url" content="${escapeAttr(canonical)}" />`;
  out += `\n  <meta name="twitter:url" content="${escapeAttr(canonical)}" />`;
  out += imageLines(siteUrl);
  return out;
}

function blockShopDetailTemplate(siteUrl) {
  /** 동적 파라미터별 canonical 오류 방지를 위해 상세 페이지에는 canonical 미삽입. 공유 카드만 기본 URL 로 */
  const base = `${siteUrl}/shop-detail.html`;
  let out = `  <meta property="og:url" content="${escapeAttr(base)}" />`;
  out += `\n  <meta name="twitter:url" content="${escapeAttr(base)}" />`;
  out += imageLines(siteUrl);
  return out;
}

function blockUnset() {
  return `  <!-- seo-config.json 에 siteUrl 을 채운 뒤 node scripts/apply-seo.mjs 또는 npm run seo -->`;
}

function patchLdJsonWebsiteUrl(html, siteUrl) {
  const baseSlash = `${siteUrl.replace(/\/+$/, "")}/`;
  return html.replace(
    /<script type="application\/ld\+json">\s*(\{[\s\S]*?\})\s*<\/script>/,
    (full, inner) => {
      try {
        const o = JSON.parse(inner.trim());
        o.url = baseSlash;
        return `<script type="application/ld+json">\n  ${JSON.stringify(o, null, 2)}\n  </script>`;
      } catch {
        return full;
      }
    }
  );
}

function scrubLdJsonUrl(html) {
  return html.replace(
    /<script type="application\/ld\+json">\s*(\{[\s\S]*?\})\s*<\/script>/,
    (full, inner) => {
      try {
        const o = JSON.parse(inner.trim());
        delete o.url;
        return `<script type="application/ld+json">\n  ${JSON.stringify(o, null, 2)}\n  </script>`;
      } catch {
        return full;
      }
    }
  );
}

const SITE_CONFIGURED = loadSiteUrl();
const EFFECTIVE_URL = SITE_CONFIGURED || FALLBACK;

console.log(
  SITE_CONFIGURED
    ? `[apply-seo] siteUrl 사용: ${SITE_CONFIGURED}`
    : `[apply-seo] siteUrl 미설정 → sitemap/robots 는 ${FALLBACK} (배포 전 seo-config 설정 권장)`
);

const urlCount = writeSitemapAndRobots(EFFECTIVE_URL);
console.log(`[apply-seo] sitemap URLs: ${urlCount}`);

const ogImgConfigured = !!(SITE_CONFIGURED && loadOgImageAbsolute(SITE_CONFIGURED));
if (SITE_CONFIGURED && !ogImgConfigured) {
  console.log("[apply-seo] 참고: ogImagePath 미설정 — 이미지 공유 미리보기 생략. seo-config 에 추가 가능.");
}

/** HTML 패치 */
const pagesIndex = [
  {
    file: "index.html",
    injectFn: () =>
      SITE_CONFIGURED
        ? blockForStaticPage(SITE_CONFIGURED, "/index.html")
        : blockUnset(),
  },
  {
    file: "shops.html",
    injectFn: () =>
      SITE_CONFIGURED
        ? blockForStaticPage(SITE_CONFIGURED, "/shops.html")
        : blockUnset(),
  },
  {
    file: "shop-detail.html",
    injectFn: () =>
      SITE_CONFIGURED ? blockShopDetailTemplate(SITE_CONFIGURED) : blockUnset(),
  },
  {
    file: "blog-article.html",
    injectFn: () =>
      SITE_CONFIGURED ? blockForStaticPage(SITE_CONFIGURED, "/blog-article.html") : blockUnset(),
  },
];

for (const { file, injectFn } of pagesIndex) {
  const fp = path.join(ROOT, file);
  let h = fs.readFileSync(fp, "utf8");
  h = injectMarkerBlock(h, injectFn());
  if (file === "index.html") {
    if (SITE_CONFIGURED) h = patchLdJsonWebsiteUrl(h, SITE_CONFIGURED);
    else h = scrubLdJsonUrl(h);
  }
  fs.writeFileSync(fp, h, "utf8");
  console.log(`[apply-seo] 갱신: ${file}`);
}

if (!SITE_CONFIGURED) {
  console.warn(
    "[apply-seo] HTML 절대주소(canonical 등) 미적용 상태입니다. 깃허브 주소 확인 후 seo-config.json 의 siteUrl 을 수정하고 다시 실행하세요."
  );
}
