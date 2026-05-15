/**
 * 중요한정보/shops-outcall-종로-Details.json 을
 * shop-card-종로-outcall.js 와 맞추고 종로 전용 문구로 갱신합니다.
 */
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const IMPORTANT = path.join(ROOT, "중요한정보");
const CARD_JS = path.join(IMPORTANT, "shop-card-종로-outcall.js");
const DETAIL_PATH = path.join(IMPORTANT, "shops-outcall-종로-Details.json");

function loadCards() {
  const t = fs.readFileSync(CARD_JS, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(t, sandbox);
  return sandbox.window.outcallShopCardData || [];
}

/** 업체별 인원·특징 한 줄 (종로 출장 톤) */
const staffByName = {
  "20대 인스타이쁜이": "종로 광화문·인사 동선 | 실력파 관리 | 첫 방문도 코스·해소 순서 안내",
  "한국 20대 이쁜이": "종로 삼청·북촌 한옥 방문 경험 | 건식·오일 단계 맞춤 | 계단·경사 구간 상담",
  "24시 한국일본혼혈": "종로 청계·종로5가 야간 대응 | 혼혈 라인 | 긴장 해소 리듬 조절",
  "20대 여신 한국인": "종로 서측 VIP 홈케어 | 한국인 위주 | 경복궁·서촌 일대 집중 이완",
  "T팬티 테라피 출장": "종로 중심가 이동 | 테마 코스 순차 해소 | 익선·종로3·4가 합류 안내",
  "20대 탱글 출장": "종로 대학로·혜화 공연 동선 | 공연 전후 맞춤 압 | 스포츠·오일 병행 상담",
  우크라이나출장: "종로 돈의문·묘동 골목 | 순환 위주 스트로크 | 도보 합류 권장",
  도쿄핫: "종로 창신·숭인 경사 구간 | 한·일 혼합 라인 | 언덕 피로 해소",
  원정녀: "종로 청운·광장 코어 | 부분·전신 선택 | 짧은 시간도 집중 해소",
  재팬혼혈출장: "종로 명륜·혜화 인근 | 혼혈 1인 스타일 | 역 출구 합류 위주",
  비키니출장: "종로 통인·궁궐 인접 | 타이·아로마 | 행사일 동선 사전 확인",
  "VIP 20대 한국홈케어": "종로 교남·행촌 프리미엄 | 한국인 케어 | 한옥·레지던스 습도 맞춤",
  쏘핫: "종로 야간·대학로 퇴장 | 한·일 라인 | 역 기준 빠른 합류",
  "24시 홈케어 힐링": "종로 광화문·세종 24시 | 호텔·오피스 밀집 | 지하 연결 동선 안내",
  "믹스 스웨 힐링 출장": "종로 낙원·종로5가 | 한·태 믹스 | 건식→스웨 단계형 해소",
  "란제리 힐링 출장": "종로 익선·송현 한옥 | 건식 위주 가능 | 좁은 실내·환기 조율",
  "종로 북악 루트 출장": "북악·삼청·부암 전용 루트 | 계단·경사 사전 고지 | 건식·라이트 오일 조합",
};

function featuresFor(name) {
  const base = [
    "종로구 출장마사지 동선",
    "홈타이 방문",
    "사전 상담으로 해소 포인트 조율",
    "골목·주차·출입 사전 확인 권장",
  ];
  const extra = {
    "종로 북악 루트 출장": [
      "북악·삼청 경사 대응",
      "건조 한옥 시 건식 우선 가능",
      "심야·새벽 전일 협의",
    ],
  }[name] || ["24시간 상담(유선 기준)", "종로 일대 지정 장소 방문"];
  return [...base, ...extra];
}

function tagsFor(name) {
  const t = ["종로", "종로구", "출장마사지", "홈타이", "서울"];
  if (name.includes("북악")) t.push("삼청", "부암", "북촌");
  else if (name.includes("대학") || name === "쏘핫") t.push("혜화", "대학로");
  else if (name.includes("VIP") || name.includes("여신")) t.push("광화문", "경복궁");
  return t;
}

function jongnoCourseTweak(shop) {
  if (!Array.isArray(shop.courses)) return;
  for (const cat of shop.courses) {
    if (typeof cat.category === "string" && !cat.category.startsWith("종로")) {
      cat.category = `종로 출장 · ${cat.category}`;
    }
    if (Array.isArray(cat.items)) {
      for (const it of cat.items) {
        if (typeof it.description === "string" && !it.description.includes("종로")) {
          it.description = `${it.description} · 종로 일대 방문형`;
        }
      }
    }
  }
}

function main() {
  const cards = loadCards();
  const byName = new Map(cards.map((c) => [c.name, c]));

  let raw = fs.readFileSync(DETAIL_PATH, "utf8");
  const eq = raw.indexOf("=", raw.indexOf("window"));
  const start = raw.indexOf("{", eq);
  const end = raw.lastIndexOf("}");
  const pack = JSON.parse(raw.slice(start, end + 1));

  const now = "2026-05-20T06:00:00Z";

  for (const shop of pack.shops) {
    const card = byName.get(shop.name);
    if (!card) {
      console.warn("no card for shop:", shop.name);
      continue;
    }
    shop.region = "서울";
    shop.district = "종로";
    shop.address = card.address;
    shop.detailAddress = card.detailAddress;
    shop.description = card.description;
    shop.greeting = card.greeting;
    shop.reviewCount = Array.isArray(card.reviews) ? card.reviews.length : 0;
    shop.reviews = (card.reviews || []).map((r) => ({
      author: r.author,
      rating: r.rating,
      date: r.date,
      reviewBody: r.review,
    }));
    shop.staffInfo = staffByName[shop.name] || `종로 출장마사지 | ${shop.name} | 상담 시 동선·해소 포인트 맞춤`;
    shop.features = featuresFor(shop.name);
    shop.tags = tagsFor(shop.name);
    shop.updatedAt = now;
    jongnoCourseTweak(shop);
  }

  const body = JSON.stringify(pack, null, 2);
  const out = `window.shopsDataOutcallMatched = ${body};\n`;
  fs.writeFileSync(DETAIL_PATH, out, "utf8");
  console.log("Updated:", DETAIL_PATH, "shops:", pack.shops.length);
}

main();
