/**
 * index.html 의 「등록 업체」영역(home-shops-blog-wrap ~ related-sites 직전)을
 * 모든 dist-seoul-*.html 에 동일 삽입합니다.
 *
 * index.html 만 고친 뒤: npm run shop:sync-seoul-districts
 */
import fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const indexPath = join(root, "index.html");

const SYNC_START = "<!-- SYNC_HOME_REGISTERED_SHOPS_FROM_INDEX_START -->";
const SYNC_END = "<!-- SYNC_HOME_REGISTERED_SHOPS_FROM_INDEX_END -->";

const INDEX_BLOCK_START = "    <div class=\"home-shops-blog-wrap\">";
const INDEX_BLOCK_END = "\n\n    <section id=\"related-sites\"";

function extractBlockFromIndex(html) {
  const i0 = html.indexOf(INDEX_BLOCK_START);
  const i1 = html.indexOf(INDEX_BLOCK_END);
  if (i0 === -1) throw new Error("index.html: " + INDEX_BLOCK_START + " 없음");
  if (i1 === -1) throw new Error("index.html: related-sites 앵커 없음");
  if (i1 <= i0) throw new Error("index.html: 블록 범위 오류");
  return html.slice(i0, i1);
}

function wrapMarked(block) {
  return SYNC_START + "\n" + block + "\n" + SYNC_END;
}

function ensureShopsCss(html) {
  if (html.includes('href="shops.css"')) return html;
  return html.replace(
    '<link rel="stylesheet" href="styles.css" />',
    '<link rel="stylesheet" href="styles.css" />\n  <link rel="stylesheet" href="shops.css" />'
  );
}

function stripOldDistrictShopScripts(html) {
  return html
    .replace(/\n  <script src="data\/shops-outcall-matched\.js"><\/script>/g, "")
    .replace(/\n  <script src="data\/shop-card-[^"]+-outcall\.js"><\/script>/g, "")
    .replace(/\n  <script src="js\/outcall-shop-utils\.js"><\/script>/g, "")
    .replace(/\n  <script src="js\/load-matched-shops\.js"><\/script>/g, "")
    .replace(/\n  <script src="js\/shops-list-app\.js" defer><\/script>/g, "");
}

function applySync(html, rawBlock) {
  const marked = wrapMarked(rawBlock);
  if (html.includes(SYNC_START)) {
    const re = new RegExp(
      SYNC_START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
        "[\\s\\S]*?" +
        SYNC_END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "m"
    );
    if (!re.test(html)) throw new Error("SYNC 마커가 깨졌습니다.");
    return html.replace(re, marked);
  }

  const gridTail =
    /\n      <div id="shop-card-grid" class="shop-card-grid" aria-live="polite"><\/div>\n    <\/div>\n  <\/main>/;
  if (gridTail.test(html)) {
    return html.replace(
      gridTail,
      "\n    </div>\n" + marked + "\n  </main>"
    );
  }

  const staticTail =
    /(\n        <\/p>\n      <\/div>\n)(    <\/section>\n  <\/main>)/;
  if (staticTail.test(html)) {
    return html.replace(staticTail, (_, a, b) => a + "\n" + marked + "\n" + b);
  }

  throw new Error("지원하지 않는 본문 패턴(수동으로 SYNC 마커를 넣었는지 확인)");
}

function processFile(filePath, rawBlock) {
  let html = fs.readFileSync(filePath, "utf8");
  html = ensureShopsCss(html);
  html = stripOldDistrictShopScripts(html);
  html = applySync(html, rawBlock);
  fs.writeFileSync(filePath, html, "utf8");
}

const indexHtml = fs.readFileSync(indexPath, "utf8");
const rawBlock = extractBlockFromIndex(indexHtml);

const names = fs.readdirSync(root).filter((n) => /^dist-seoul-.*\.html$/i.test(n));

let n = 0;
for (const name of names.sort()) {
  processFile(join(root, name), rawBlock);
  n++;
}

console.log("Synced home registered shops block from index.html →", n, "dist-seoul-*.html");
