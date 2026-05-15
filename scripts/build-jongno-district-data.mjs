/**
 * 종로 전용 shops-outcall-종로-Details → data/shops-outcall-matched.js 병합,
 * data/shop-card-종로-outcall.js 생성, data/shops-outcall-종로-Details.js 복제
 */
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const DETAIL_SRC = path.join(ROOT, "중요한정보", "shops-outcall-종로-Details.json");
const MATCHED_PATH = path.join(ROOT, "data", "shops-outcall-matched.js");
const CARD_OUT = path.join(ROOT, "data", "shop-card-종로-outcall.js");
const CARD_COPY = path.join(ROOT, "중요한정보", "shop-card-종로-outcall.js");
const DETAIL_JS_OUT = path.join(ROOT, "data", "shops-outcall-종로-Details.js");

function loadWindowAssign(filePath) {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(filePath, "utf8"), ctx);
  return ctx.window;
}

/** 카드 id·국가·company 파일 — 상세 JSON 순서와 무관 (숫자 id는 기존과 동일) */
const CARD_EXTRA = {
  seoul_instapretty_001: { id: 9, country: "korea,Thailand,japan", file: "company-seoul-instapretty-outcall.html" },
  seoul_korean_pretty_001: { id: 10, country: "korea,Thailand,japan", file: "company-seoul-korean-pretty-outcall.html" },
  seoul_24hour_korean_japanese_001: { id: 11, country: "korea,japan,Thailand", file: "company-seoul-24hour-korean-japanese-outcall.html" },
  seoul_vvip_goddess_korean_001: { id: 12, country: "korea", file: "company-seoul-vvip-goddess-korean-outcall.html" },
  seoul_tpanty_callgirl_001: { id: 13, country: "korea,Thailand", file: "company-seoul-tpanty-callgirl-outcall.html" },
  seoul_ukraine_001: { id: 15, country: "korea,russia,Thailand", file: "company-seoul-ukraine-outcall.html" },
  seoul_tokyo_hot_001: { id: 16, country: "korea,japan", file: "company-seoul-tokyo-hot-outcall.html" },
  seoul_wonjeong_001: { id: 17, country: "korea,japan", file: "company-seoul-wonjeong-outcall.html" },
  seoul_japan_mixed_001: { id: 18, country: "korea,japan", file: "company-seoul-japan-mixed-outcall.html" },
  seoul_pretty_tangle_001: { id: 14, country: "korea,japan,Thailand", file: "company-seoul-pretty-tangle-outcall.html" },
  seoul_bikini_outcall_001: { id: 23, country: "Thailand,japan", file: "company-seoul-bikini-outcall.html" },
  seoul_vip_20s_healing_korean_homecare_001: { id: 24, country: "korea", file: "company-seoul-vip-20s-healing-korean-homecare-outcall.html" },
  seoul_sohot_outcall_001: { id: 25, country: "korea,japan", file: "company-seoul-sohot-outcall.html" },
  seoul_24hour_sexy_outcall_001: { id: 26, country: "korea,japan,Thailand", file: "company-seoul-24hour-sexy-outcall.html" },
  seoul_bj_sexy_outcall_001: { id: 31, country: "korea,Thailand", file: "company-seoul-bj-sexy-outcall.html" },
  seoul_lingerie_hole_outcall_001: { id: 33, country: "korea,Thailand", file: "company-seoul-lingerie-hole-outcall.html" },
};

function cardType(s) {
  const t = String(s.type || "출장마사지");
  if (t === "outcall") return "출장마사지";
  return t;
}

function fmtCardReviews(reviews) {
  return (reviews || []).map((r) => ({
    author: r.author,
    rating: r.rating,
    date: r.date,
    review: r.reviewBody || r.review || r.content || "",
  }));
}

function buildCardBlock(s) {
  const ex = CARD_EXTRA[s.id];
  if (!ex) throw new Error("CARD_EXTRA에 없음: " + s.id);
  const name = s.name;
  const price = s.price || "";
  const alt = `종로 출장마사지 ${name} — ${price}`;
  const services = Array.isArray(s.services) && s.services.length ? s.services : ["출장마사지"];

  const o = {
    id: ex.id,
    shopDetailId: s.id,
    name,
    type: cardType(s),
    country: ex.country,
    region: s.region || "서울",
    district: s.district || "종로",
    address: s.address || "",
    detailAddress: s.detailAddress || "",
    phone: s.phone || "",
    rating: s.rating != null ? s.rating : 4.9,
    reviewCount: s.reviewCount != null ? s.reviewCount : (s.reviews && s.reviews.length) || 0,
    price,
    description: s.description || "",
    image: s.image || "",
    alt,
    services,
    operatingHours: s.operatingHours || "",
    file: ex.file,
    showHealingShop: true,
    greeting: s.greeting || "",
    reviews: fmtCardReviews(s.reviews),
  };

  return (
    "  " +
    JSON.stringify(o, null, 2)
      .split("\n")
      .map((line, i) => (i === 0 ? line : "  " + line))
      .join("\n")
  );
}

const jongno = loadWindowAssign(DETAIL_SRC).shopsDataOutcallMatched;
const jShops = jongno.shops;
const jMap = new Map(jShops.map((s) => [s.id, s]));

for (const s of jShops) {
  if (!CARD_EXTRA[s.id]) throw new Error("CARD_EXTRA 누락: " + s.id);
}

/** 종로 상세 JSON에서 제거한 업체 id — 전역 matched에서도 삭제 */
const DROP_FROM_MATCHED = new Set(["seoul_jongno_outcall_001"]);

const matched = loadWindowAssign(MATCHED_PATH).shopsDataOutcallMatched;
const mergedShops = matched.shops
  .filter((s) => !DROP_FROM_MATCHED.has(s.id))
  .map((s) => jMap.get(s.id) || s);
const merged = { shops: mergedShops };

fs.writeFileSync(MATCHED_PATH, "window.shopsDataOutcallMatched = " + JSON.stringify(merged, null, 2) + ";\n");

const cardHeader =
  "// 종로 출장마사지 전용 카드 — shops-outcall-종로-Details · dist-seoul-종로.html\n" +
  "// 생성: scripts/build-jongno-district-data.mjs\n" +
  "window.outcallShopCardData = [\n";
const cardBody = jShops.map((s) => buildCardBlock(s) + ",").join("\n\n");
const cardFooter = "\n];\n";
fs.writeFileSync(CARD_OUT, cardHeader + cardBody + cardFooter);
fs.writeFileSync(CARD_COPY, fs.readFileSync(CARD_OUT, "utf8"));
fs.copyFileSync(DETAIL_SRC, DETAIL_JS_OUT);

console.log("OK: merged", jShops.length, "jongno shops into", MATCHED_PATH);
console.log("OK:", CARD_OUT, DETAIL_JS_OUT);
