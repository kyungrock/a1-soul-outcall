/**
 * 업체 카드를 index.html / shops.html 안에 정적으로 삽입합니다.
 * → 브라우저「페이지 소스 보기」에 <article class="shop-card">… 가 그대로 노출됩니다.
 *
 * 카드·매칭 데이터 수정 후 실행:
 *   npm run shop:cards
 *
 * 마커: <!--STATIC_SHOP_CARDS_BEGIN--> … <!--STATIC_SHOP_CARDS_END-->
 */
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const DATA_JS = path.join(ROOT, "data", "shop-card-data-outcall.js");
const MATCHED_JSON = path.join(ROOT, "data", "shops-outcall-matched.json");
const INDEX_HTML = path.join(ROOT, "index.html");
const SHOPS_HTML = path.join(ROOT, "shops.html");

const MARK_BEGIN = "<!--STATIC_SHOP_CARDS_BEGIN-->";
const MARK_END = "<!--STATIC_SHOP_CARDS_END-->";

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 카드 본문: alt 키워드(서울 전지역 출장마사지·상호·요금)를 도입에 포함 */
function buildShopCardGreetingEscaped(card, m) {
  const altLine = String(card.alt || "").trim();
  const body = String((m && m.description) || card.description || card.greeting || "").trim();
  const name = String(card.name || "").trim();
  const price = String(card.price || "").trim();
  const fallbackLead =
    name && price
      ? `서울 전지역 출장마사지 ${name} — ${price}`
      : name
        ? `서울 전지역 출장마사지 ${name}`
        : "서울 전지역 출장마사지";
  const lead = altLine || fallbackLead;
  if (!body) {
    return escapeHtml(`${lead}. 홈타이·출장 상담으로 일정·코스를 안내합니다.`);
  }
  const norm = body.replace(/\s+/g, " ").trim();
  const leadNorm = lead.replace(/\s+/g, " ").trim();
  if (norm.startsWith(leadNorm) || norm.startsWith(leadNorm + ".")) {
    return escapeHtml(body);
  }
  return escapeHtml(`${lead}. ${body}`);
}

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

function findMatchedShop(card, shops) {
  const id = resolveMatchedShopId(card, shops);
  if (!id) return null;
  return shops.find((s) => s.id === id) || null;
}

function buildDetailHref(card, shops) {
  const mid = resolveMatchedShopId(card, shops);
  if (mid) return `shop-detail.html?id=${encodeURIComponent(mid)}`;
  return `shop-detail.html?cardId=${encodeURIComponent(String(card.id))}`;
}

function regionIncludesSeoul(region) {
  return String(region || "").includes("서울");
}

/**
 * 예시와 유사한 한 장의 <article> (상세는 shop-detail.html?id=)
 */
function buildArticleHtml(card, shops) {
  const m = findMatchedShop(card, shops);
  const href = escapeHtml(buildDetailHref(card, shops));
  const name = String(card.name || "").trim();
  const img = escapeHtml(card.image || "");
  const alt = escapeHtml((card.alt || name || "업체").trim());
  const titleEsc = escapeHtml(name);
  const district = escapeHtml(
    String((m && (m.district || m.address)) || card.district || card.address || "").trim()
  );
  const hoursRaw = String(
    (m && m.operatingHours) || card.operatingHours || ""
  ).trim();
  const hoursEsc = escapeHtml(hoursRaw || "—");
  const priceEsc = escapeHtml(String(card.price || "").trim());
  const phone = String((m && m.phone) || card.phone || "").trim();
  const telDigits = normPhone(phone);
  const phoneEsc = escapeHtml(phone);
  const descEsc = buildShopCardGreetingEscaped(card, m);

  const services = (m && m.services) || card.services;
  const tagList = Array.isArray(services)
    ? services.filter(Boolean).slice(0, 8)
    : [];
  const tagsHtml = tagList.length
    ? `\n              <div class="shop-card-tags">\n${tagList
        .map((t) => `                <span class="shop-card-tag">${escapeHtml(String(t))}</span>`)
        .join("\n")}\n              </div>`
    : "";

  const phoneRow =
    phone && telDigits
      ? `<span class="shop-card-phone" data-tel="${escapeHtml(telDigits)}">📞 ${phoneEsc}</span>`
      : phone
      ? `<span class="shop-card-phone" data-tel="">📞 ${phoneEsc}</span>`
      : "";

  return `      <article class="shop-card">
        <a href="${href}" class="shop-card-hit" aria-label="${titleEsc} 상세보기">
          <div class="shop-card-image">
            <img src="${img}" alt="${alt}" loading="lazy" width="400" height="225" />
          </div>
          <div class="shop-card-body">
            <div class="shop-card-header">
              <h2 class="shop-card-title">${titleEsc}</h2>
            </div>
            <div class="shop-card-meta">
              <span>📍 <span>${district}</span></span>
              <span>⏱ <span>${hoursEsc}</span></span>
            </div>
            <div class="shop-card-price-row">
              <div class="shop-card-price">${priceEsc}</div>
              ${phoneRow}
            </div>
            <p class="shop-card-greeting">${descEsc}</p>${tagsHtml}
            <div class="shop-card-footer">
              <span class="shop-card-link">
                상세 보기
                <span>↗</span>
              </span>
            </div>
          </div>
        </a>
      </article>`;
}

function loadCards() {
  const t = fs.readFileSync(DATA_JS, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(t, sandbox);
  return sandbox.window.outcallShopCardData || [];
}

function loadShops() {
  const t = fs.readFileSync(MATCHED_JSON, "utf8").trim();
  const i0 = t.indexOf("{");
  const i1 = t.lastIndexOf("}");
  const j = JSON.parse(t.slice(i0, i1 + 1));
  return j.shops || [];
}

function patchHtmlFile(filePath, fragment) {
  let html = fs.readFileSync(filePath, "utf8");
  if (!html.includes(MARK_BEGIN) || !html.includes(MARK_END)) {
    throw new Error(`${path.basename(filePath)} 에 ${MARK_BEGIN} / ${MARK_END} 마커가 없습니다.`);
  }
  const re = new RegExp(
    `${MARK_BEGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[\\s\\S]*?\\s*${MARK_END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
    "m"
  );
  if (!re.test(html)) throw new Error(`${path.basename(filePath)}: 마커 블록을 찾을 수 없습니다.`);
  html = html.replace(re, `${MARK_BEGIN}\n${fragment}\n${MARK_END}`);
  fs.writeFileSync(filePath, html, "utf8");
}

function main() {
  const cards = loadCards().filter((c) => regionIncludesSeoul(c.region));
  const shops = loadShops();
  const fragment = cards.map((c) => buildArticleHtml(c, shops)).join("\n\n");

  patchHtmlFile(INDEX_HTML, fragment);
  patchHtmlFile(SHOPS_HTML, fragment);

  console.log(
    `[shop:cards] ${cards.length}개 카드 → index.html, shops.html (소스에 <article> 삽입 완료)`
  );
}

main();
