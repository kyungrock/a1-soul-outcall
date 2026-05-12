/**
 * 중요한정보/shops.json 과 shops-outcall-matched 를 같은 id(또는 전화)로 맞추어
 * courses, features, tags, staffInfo, reviews 등 누락분을 보강합니다.
 * 카드(shop-card-data-outcall) 전화가 shops.json 에만 있으면 매칭 목록에 추가합니다.
 */
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function loadShopsBundle(filePath, globalName) {
  let t = fs.readFileSync(filePath, "utf8").trim();
  const re = new RegExp("^window\\." + globalName.replace(/[$]/g, "\\$") + "\\s*=\\s*");
  t = t.replace(re, "");
  if (t.endsWith(";")) t = t.slice(0, -1).trim();
  return JSON.parse(t);
}

function normPhone(p) {
  return String(p || "").replace(/\D/g, "");
}

function isEmptyArr(a) {
  return !Array.isArray(a) || a.length === 0;
}

function courseItemCount(courses) {
  if (!courses || !courses.length) return 0;
  return courses.reduce(function (sum, c) {
    return sum + (c.items && c.items.length ? c.items.length : 0);
  }, 0);
}

function mergeShop(matched, full) {
  if (!full) return { ...matched };
  const out = { ...matched };
  const keys = [
    "courses",
    "features",
    "tags",
    "staffInfo",
    "reviews",
    "services",
    "description",
    "operatingHours",
    "coordinates",
    "status",
    "createdAt",
    "updatedAt",
    "detailAddress",
    "type",
    "region",
    "district",
    "address",
    "price",
    "rating",
    "reviewCount",
  ];
  for (const k of keys) {
    const fv = full[k];
    const mv = matched[k];
    if (k === "courses") {
      const mCnt = courseItemCount(mv);
      const fCnt = courseItemCount(fv);
      if (mCnt === 0 && fCnt > 0) out.courses = JSON.parse(JSON.stringify(fv));
      else if (fCnt > mCnt) out.courses = JSON.parse(JSON.stringify(fv));
      continue;
    }
    if (k === "reviews") {
      if (isEmptyArr(mv) && !isEmptyArr(fv)) {
        out.reviews = JSON.parse(JSON.stringify(fv));
      }
      continue;
    }
    if (k === "features" || k === "tags" || k === "services") {
      if (isEmptyArr(mv) && !isEmptyArr(fv)) {
        out[k] = JSON.parse(JSON.stringify(fv));
      }
      continue;
    }
    if (k === "staffInfo" || k === "detailAddress") {
      if ((mv == null || String(mv).trim() === "") && fv != null && String(fv).trim() !== "") {
        out[k] = fv;
      }
      continue;
    }
    if (k === "description") {
      if (typeof fv === "string" && typeof mv === "string" && fv.length > mv.length + 30) {
        out.description = fv;
      } else if ((mv == null || String(mv).trim() === "") && fv) {
        out.description = fv;
      }
      continue;
    }
    if (mv == null && fv != null) out[k] = fv;
  }
  return out;
}

function loadOutcallCards() {
  const p = path.join(ROOT, "data", "shop-card-data-outcall.js");
  const t = fs.readFileSync(p, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(t, sandbox);
  const arr = sandbox.window.outcallShopCardData;
  if (!Array.isArray(arr)) throw new Error("outcallShopCardData not loaded");
  return arr;
}

function formatBundle(obj, globalName) {
  return `window.${globalName} = ${JSON.stringify(obj, null, 2)};\n`;
}

const fullPath = path.join(ROOT, "중요한정보", "shops.json");
const matchedPath = path.join(ROOT, "중요한정보", "shops-outcall-matched.json");
const matchedJsPath = path.join(ROOT, "중요한정보", "shops-outcall-matched.js");
const dataJsonPath = path.join(ROOT, "data", "shops-outcall-matched.json");
const dataJsPath = path.join(ROOT, "data", "shops-outcall-matched.js");

const fullPack = loadShopsBundle(fullPath, "shopsData");
const matchedPack = loadShopsBundle(matchedPath, "shopsDataOutcallMatched");

const fullById = new Map(fullPack.shops.map((s) => [s.id, s]));
const fullByPhone = new Map();
for (const s of fullPack.shops) {
  const ph = normPhone(s.phone);
  if (ph) fullByPhone.set(ph, s);
}

const cards = loadOutcallCards();
const phonesInCards = new Set(cards.map((c) => normPhone(c.phone)).filter(Boolean));

let mergedShops = matchedPack.shops.map(function (s) {
  const byId = fullById.get(s.id);
  const byPhone = normPhone(s.phone) ? fullByPhone.get(normPhone(s.phone)) : null;
  const full = byId || byPhone;
  return mergeShop(s, full);
});

const matchedPhones = new Set(mergedShops.map((x) => normPhone(x.phone)).filter(Boolean));

for (const ph of phonesInCards) {
  if (!ph || matchedPhones.has(ph)) continue;
  const full = fullByPhone.get(ph);
  if (!full) continue;
  mergedShops.push(JSON.parse(JSON.stringify(full)));
  matchedPhones.add(ph);
}

const outPack = { shops: mergedShops };
const serialized = formatBundle(outPack, "shopsDataOutcallMatched");

fs.writeFileSync(matchedPath, serialized, "utf8");
fs.writeFileSync(matchedJsPath, serialized, "utf8");
fs.writeFileSync(dataJsonPath, serialized, "utf8");
fs.writeFileSync(dataJsPath, serialized, "utf8");

let stats = { mergedFields: [], addedFromCards: mergedShops.length - matchedPack.shops.length };

console.log(
  "Matched shops:",
  matchedPack.shops.length,
  "→",
  mergedShops.length,
  "(추가:",
  stats.addedFromCards,
  ")"
);
