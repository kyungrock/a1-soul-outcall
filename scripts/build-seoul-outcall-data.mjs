/**
 * 출장 카드 중 region 에 '서울' 포함분만 유지하고,
 * 소개·인사말·주소를 서울 전용·업체별 상이하게 갱신한 뒤
 * shops-outcall-matched 를 전화번호 기준으로 동기화합니다.
 */
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const DATA_JS = path.join(ROOT, "data", "shop-card-data-outcall.js");
const MATCHED_JSON = path.join(ROOT, "data", "shops-outcall-matched.json");
const IMPORTANT_JS = path.join(ROOT, "중요한정보", "shop-card-data-outcall.js");
const IMPORTANT_MATCHED_JSON = path.join(ROOT, "중요한정보", "shops-outcall-matched.json");

function loadCards() {
  const t = fs.readFileSync(DATA_JS, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(t, sandbox);
  return sandbox.window.outcallShopCardData || [];
}

function normPhone(p) {
  return String(p || "").replace(/\D/g, "");
}

/** 카드 동명 전화번호 구분용 (공백·대소문자 무시 안 함, 공백만 제거) */
function normBizName(n) {
  return String(n || "").replace(/\s+/g, "");
}

/** shops-outcall 이름 ↔ 카드 `name` (동일 업체 다른 표기) */
const SHOP_DISPLAY_NAME_TO_CARD_NAME = {
  "VVIP 20대 여신 한국인홈케어": "20대 여신 한국인",
  "20대 이쁘니 탱글 출장": "20대 탱글 출장",
  "VIP 20대 힐링 한국홈케어": "VIP 20대 한국홈케어",
  "T팬티 콜걸": "T팬티 테라피 출장",
  "란제리 구멍 출장": "란제리 힐링 출장",
  "BJ 발정난 색끼년 출장": "믹스 스웨 힐링 출장",
  "24시 슴살화끈색녀": "24시 홈케어 힐링",
};

function cardCanonicalNameFromShopDisplayName(displayName) {
  return SHOP_DISPLAY_NAME_TO_CARD_NAME[displayName] || displayName;
}

/**
 * 카드·리뷰·업체 문자열 안의 타 지역 표기를 서울 기준 문장으로 바꿉니다.
 */
function sanitizeSeoulText(text) {
  if (typeof text !== "string") return text;
  return (
    text
      .replace(/서울\s*경기\s*인천\s*전\s*지역이라/gi, "서울 전역이라")
      .replace(/서울\s*경기\s*인천\s*전\s*지역/gi, "서울 전역")
      .replace(/서울\s*·\s*경기\s*·\s*인천/g, "서울")
      .replace(/서울\s*[,.\s]+\s*인천\s*[,.\s]+\s*경기/gi, "서울")
      .replace(/서울\s*[,.\s]+\s*경기\s*[,.\s]+\s*인천/gi, "서울")
      .replace(/서울\s*경기/gi, "서울")
      .replace(/경기\s*인천|인천\s*경기/g, "")
      .replace(/\s+/g, " ")
      .replace(/(^|\s)·\s*|·(?=\s|$)/g, " ")
      .replace(/\s{2,}/g, " ")
      .replace(/인천에서/g, "서울에서")
      .replace(/경기\s*집에서/g, "서울 집에서")
      .replace(/경기도\s*집에서/g, "서울 집에서")
      .trim()
  );
}

function scrubTags(tags) {
  if (!Array.isArray(tags)) return tags;
  const out = [];
  const seen = new Set();
  for (const raw of tags) {
    let t = String(raw).trim();
    if (!t) continue;
    if (t === "경기" || t === "인천") continue;
    t = sanitizeSeoulText(t);
    if (/서울\s*경기\s*인천|경기\s*[,·]?\s*인천|인천\s*[,·]?\s*경기/.test(raw)) continue;
    if (t.includes("경기") || t.includes("인천")) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  if (!out.includes("서울")) out.unshift("서울");
  return out;
}

function scrubFeatures(features) {
  if (!Array.isArray(features)) return features;
  return features
    .map((f) => sanitizeSeoulText(String(f)))
    .filter(Boolean);
}

function cardMapByShop(cards) {
  const map = new Map();
  for (const c of cards) {
    const key = `${normPhone(c.phone)}::${normBizName(c.name)}`;
    map.set(key, c);
  }
  return map;
}

function shopUsesPreserveLocation(cardName) {
  const o = copyByName[cardName];
  return !!(o && o.preserveLocation);
}

function syncMatchedShopsFromCards(shops, cards) {
  const cmap = cardMapByShop(cards);
  let missing = 0;
  for (const s of shops) {
    const canon = cardCanonicalNameFromShopDisplayName(s.name);
    const key = `${normPhone(s.phone)}::${normBizName(canon)}`;
    const c = cmap.get(key);
    if (!c) {
      missing++;
      console.warn(`sync: no card for "${s.name}" ${s.phone}`);
      continue;
    }
    s.name = c.name;
    if (shopUsesPreserveLocation(c.name)) {
      s.region = c.region || "서울";
      s.district = c.district || "서울";
      s.address = c.address || "서울";
    } else {
      s.region = "서울";
      s.district = "서울 전지역";
      s.address = "서울 전지역";
    }
    s.detailAddress = c.detailAddress;
    s.description = c.description;
    if ("greeting" in s && c.greeting) s.greeting = c.greeting;
    if (Array.isArray(s.tags)) s.tags = scrubTags(s.tags);
    if (Array.isArray(s.features)) s.features = scrubFeatures(s.features);
    if (Array.isArray(s.reviews) && Array.isArray(c.reviews)) {
      s.reviews = s.reviews.map((mr, i) => {
        const cr = c.reviews[i];
        if (mr && typeof mr === "object" && cr && typeof cr.review === "string") {
          return { ...mr, reviewBody: sanitizeSeoulText(cr.review) };
        }
        return mr;
      });
    }
  }
  if (missing) console.warn("syncMatchedShopsFromCards unmatched:", missing);
}

function shopKeyFromCard(c) {
  return `${normPhone(c.phone)}::${normBizName(c.name)}`;
}

function shopKeyFromShop(s) {
  const canon = cardCanonicalNameFromShopDisplayName(s.name);
  return `${normPhone(s.phone)}::${normBizName(canon)}`;
}

function jongnoOutcallCourses() {
  return [
    {
      category: "돌담 건식 릴리스",
      items: [
        {
          name: "A코스",
          price: "75,000원",
          duration: "60분",
          description: "목·어깨·견갑 상부 집중, 오일 없음",
        },
        {
          name: "B코스",
          price: "95,000원",
          duration: "90분",
          description: "상체 전반 + 허리 라인, 오일 없음",
        },
      ],
    },
    {
      category: "광장가 라이트 오일",
      items: [
        {
          name: "A코스",
          price: "85,000원",
          duration: "60분",
          description: "가벼운 오일, 실내 환기 가능할 때만 권장",
        },
        {
          name: "B코스",
          price: "110,000원",
          duration: "90분",
          description: "오일 + 스웨식 이완, 장시간 앉은 날 추천",
        },
      ],
    },
  ];
}

function defaultOutcallCourses() {
  return [
    {
      category: "기본 출장 코스",
      items: [
        { name: "A코스", price: "70,000원", duration: "60분", description: "출장 기본 힐링" },
        { name: "B코스", price: "90,000원", duration: "90분", description: "출장 기본 힐링" },
      ],
    },
  ];
}

function matchedShopStubFromCard(c) {
  const o = copyByName[c.name] || defaultCopy;
  const preserved = !!(o && o.preserveLocation);
  const id = c.shopDetailId || `seoul_outcall_card_${c.id}`;
  const courses = preserved ? jongnoOutcallCourses() : defaultOutcallCourses();
  const baseReviews = Array.isArray(c.reviews)
    ? c.reviews.map((r) => ({
        author: r.author || "고객님",
        rating: r.rating ?? 5,
        date: r.date || "2026-05-12",
        reviewBody: "",
      }))
    : [];
  return {
    id,
    name: c.name,
    type: "출장마사지",
    region: preserved ? c.region || "서울" : "서울",
    district: preserved ? c.district || "종로" : "서울 전지역",
    address: preserved ? c.address || "서울 종로구 출장" : "서울 전지역",
    detailAddress: c.detailAddress || o.detailAddress,
    phone: c.phone,
    price: c.price || "70,000원~",
    operatingHours:
      c.operatingHours || "24시간 (폰이 꺼진 경우: 마감, 랜덤 휴무)",
    rating: c.rating ?? 4.9,
    reviewCount: c.reviewCount ?? (Array.isArray(c.reviews) ? c.reviews.length : 0),
    image: c.image || "images/outcall-default.jpg",
    description: c.description || o.description,
    services: Array.isArray(c.services) && c.services.length ? c.services : ["출장마사지", "스포츠 마사지", "오일 마사지", "스웨디시"],
    courses,
    staffInfo: preserved
      ? "종로·광화문 동선 위주 | 건식·오일 단계 상담 | 출입·계단 정보 사전 확인"
      : "실력파 라인 | 상기 종목 테라피 과정 수료 | 출장 동선 협의",
    reviews: baseReviews,
    features: preserved
      ? [
          "광화문·인사·삼청·북촌 일대 동선 협의",
          "건식 우선 가능(실내 상황에 따라 오일 조절)",
          "골목·주차 출입 사전 확인",
          "심야·새벽은 전일 협의",
          "홈타이 출장",
        ]
      : [
          "서울 홈타이",
          "24시간 상담(유선 기준)",
          "출장 동선 협의",
          "홈타이 서비스",
        ],
    coordinates: preserved
      ? { latitude: 37.5759, longitude: 126.9825 }
      : { latitude: 37.5665, longitude: 126.978 },
    status: "active",
    createdAt: "2026-05-12T02:00:00Z",
    updatedAt: "2026-05-12T02:00:00Z",
    tags: preserved
      ? ["종로", "종로구", "출장마사지", "홈타이", "광화문", "인사동"]
      : ["서울", "출장마사지", "홈타이"],
    greeting: c.greeting || "",
  };
}

function appendMissingShopsForCards(shops, cards) {
  const keys = new Set(shops.map(shopKeyFromShop));
  for (const c of cards) {
    const k = shopKeyFromCard(c);
    if (keys.has(k)) continue;
    shops.push(matchedShopStubFromCard(c));
    keys.add(k);
  }
}

/** 작은따옴표 JS 문자열 이스케이프 */
function q(s) {
  if (s == null) return "''";
  return (
    "'" +
    String(s)
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\r\n/g, "\\n")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\n") +
    "'"
  );
}

/** 업체명 기준 맞춤 문구 (서울만) */
const copyByName = {
  "20대 인스타이쁜이": {
    description:
      "서울 전역 홈타이를 기준으로 한 출장 케어입니다. 연락 주시는 동선에 맞춰 방문 일정을 잡고, 스포츠·오일·스웨디시 등 코스별로 몸의 긴장을 풀어 드립니다. 야간·새벽 예약도 상담으로 조율 가능합니다.",
    greeting: "서울 어디서든 홈타이 상담 — 원하시는 시간대를 말씀해 주세요.",
    detailAddress: "서울 내 원하시는 장소(숙소·주거)로 방문 · 사전 상담 시 동선 안내",
  },
  "한국 20대 이쁜이": {
    description:
      "서울 일대 루틴 피로에 맞춘 출장형 힐링입니다. 시내 동선 위주로 이동하며, 가벼운 스트레칭부터 오일·스웨디시까지 단계를 나눠 받을 수 있습니다. 첫 이용이어도 코스 안내를 차분히 도와드립니다.",
    greeting: "서울 전지역 · 20대 관리 라인 — 부담 없이 코스부터 문의해 보세요.",
    detailAddress: "서울 홈타이 · 방문 전 요청 사항을 말씀해 주시면 맞춰 준비합니다",
  },
  "24시 한국일본혼혈": {
    description:
      "서울을 중심으로 연중 상담 가능한 출장 서비스입니다. 혼혈 라인 특성에 맞춰 부드러운 압과 리듬을 조절하고, 장시간 근무 후 회복용 코스를 추천해 드립니다. 전화 꺼짐 시 휴무일 수 있으니 재문의 부탁드립니다.",
    greeting: "24시 상담 가능(유선 상태 기준) — 서울 방문 일정 맞춰 드립니다.",
    detailAddress: "서울 출장 · 혼혈 테라피 위주 코스, 장소는 사전 협의",
  },
  "20대 여신 한국인": {
    description:
      "서울 일대 VIP 홈케어 스타일의 출장입니다. 한국인 관리사 위주로 구성되어 있으며, 프라이빗한 공간에서 집중 케어를 원하시는 분께 맞춥니다. 스웨디시·프리미엄 위주 상담을 권해 드립니다.",
    greeting: "서울 VIP 홈케어 — 일정·장소는 통화로 확정해 드립니다.",
    detailAddress: "서울 출장샵 스타일 방문 · 사전 예약 권장",
  },
  "T팬티 테라피 출장": {
    description:
      "서울 시내 위주로 이동하는 테마형 출장 코스입니다. 건식·스웨디시·믹스 등 단계별 옵션이 다양하니, 체력·시간에 맞게 조합해 보실 수 있습니다. 방문 전 코스명을 알려 주시면 준비가 수월합니다.",
    greeting: "서울 테마 코스 상담 — 원하시는 라인(건식/스웨디시)만 알려 주세요.",
    detailAddress: "서울 홈타이 · 테마별 코스명 확인 후 방문",
  },
  "20대 탱글 출장": {
    description:
      "서울에서 만나는 20대 라인 출장 홈타이입니다. 스포츠성 압과 오일 힐링을 번갈아 선택할 수 있어, 운동 부족·모니터 피로 둘 다 잡고 싶을 때 무난합니다. 믹스·한국인 스웨 등 옵션은 상담 시 안내합니다.",
    greeting: "서울 홈타이 — 스포츠와 오일 중 오늘 몸에 맞는 쪽부터 골라보세요.",
    detailAddress: "서울 전역 방문 · 코스 조합은 방문 전 상담",
  },
  우크라이나출장: {
    description:
      "서울 기준 출발하는 유러피언 감성 라인입니다. 같은 부위를 오래 두드리기보다, 전신 순환에 맞춘 박자로 풀어 드리는 스타일을 지향합니다. 야근 직후·주말 루틴용으로 문의가 많은 편입니다.",
    greeting: "서울 출장 — 유러피언 라인 스케줄은 통화 시 안내드려요.",
    detailAddress: "서울 홈타이 · 라인·시간대 협의 후 방문",
  },
  도쿄핫: {
    description:
      "서울 시내 동선에 맞춘 혼혈·혼합 라인 출장입니다. 소통 위주로 진행되는 코스가 있어 첫 방문도 부담이 적은 편입니다. VIP·VVIP 등 심화 코스는 시간 여유 있을 때 추천드립니다.",
    greeting: "서울 혼혈 라인 — 코스명 말씀 주시면 소요 시간 안내해 드려요.",
    detailAddress: "서울 홈타이 · 혼혈 관리 위주, 장소는 사전 확정",
  },
  원정녀: {
    description:
      "서울 방문 위주의 집중 케어형 출장입니다. 짧은 시간에 핵심 부위를 풀어 주는 코스부터 풀 바디 옵션까지 단계가 나뉘어 있으니, 당일 컨디션에 맞게 고르시면 됩니다. 재방문 할인 등은 업체 정책을 확인해 주세요.",
    greeting: "서울 출장 — 오늘은 풀코스 vs 부분, 어느 쪽이 편하신지 알려 주세요.",
    detailAddress: "서울 홈타이 · 황제/VIP 등 심화 코스는 시간 협의",
  },
  재팬혼혈출장: {
    description:
      "서울 일대 1인 위주 혼혈 출장 샵입니다. 타이·아로마·스웨디시 등 아시아계 기법을 섞어 받을 수 있어, 여행·출장 직후 몸을 풀기 좋습니다. 최소 예약 시간은 코스별로 다를 수 있습니다.",
    greeting: "서울 혼혈 1인샵 느낌 — 타이/스웨 중 취향만 알려 주세요.",
    detailAddress: "서울 출장샵 스타일 · 코스별 소요 분 상담",
  },
  비키니출장: {
    description:
      "서울 시내 동선을 기준으로 빠른 방문을 지향하는 출장입니다. 타이·아로마·VIP 힐링 등 가벼운 코스부터 긴 코스까지 선택지가 있으며, 일부 동선은 사정상 어려울 수 있으니 상담 시 확인 부탁드립니다.",
    greeting: "서울 출장 — 방문 가능 구간은 통화 시 바로 확인해 드립니다.",
    detailAddress: "서울 홈타이 · 일부 구간 제한 있을 수 있음(상담 필수)",
  },
  "VIP 20대 한국홈케어": {
    description:
      "서울 중심 프리미엄 홈케어 출장입니다. 스웨디시 위주의 깊은 이완을 원하시는 분께 맞추었고, 가격대가 높은 만큼 시간·공간 여유를 두고 예약하시는 것을 권합니다. 한국인 관리사 위주 구성입니다.",
    greeting: "서울 VIP 홈케어 — 프리미엄 코스는 일정 넉넉히 잡아 주세요.",
    detailAddress: "서울 홈타이 · 프리미엄 스웨 위주, 일부 지역 제한 가능",
  },
  쏘핫: {
    description:
      "서울 야간대에 강점을 둔 출장입니다. 한국·일본 라인이 섞여 있어 손맛 스타일을 고르실 수 있습니다. 운영이 밤 시간대에 몰려 있으니, 방문 전 반드시 통화 가능 여부를 확인해 주세요.",
    greeting: "서울 야간 출장 — 오늘 밤 시간대만 먼저 알려 주시면 됩니다.",
    detailAddress: "서울 전역 기준 야간 홈타이 · 일부 지역 상담",
  },
  "24시 홈케어 힐링": {
    description:
      "서울 전역 상담 가능한 24시 부스 스타일 출장입니다. 스포츠·오일·스웨·VVIP까지 폭넓게 운영하며, 당일 컨디션에 따라 강도 조절을 요청하실 수 있습니다. 일부 지역은 협의가 필요합니다.",
    greeting: "서울 24시 — 지금 몸은 뻐근한지, 뻐근+이완 둘 다 필요한지 알려 주세요.",
    detailAddress: "서울 홈타이 · 24시(유선 기준) · 일부 지역 상담",
  },
  "믹스 스웨 힐링 출장": {
    description:
      "서울 기준 한·태 라인이 섞인 출장입니다. 건식으로 시작해 스웨디시·VVIP로 이어지는 식의 단계형 코스가 특징입니다. 빠른 이동을 내세우는 만큼, 정확한 주소·출입 정보를 미리 주시면 원활합니다.",
    greeting: "서울 출장 — 건식으로 시작할지 스웨 위주로 갈지 정해 주세요.",
    detailAddress: "서울 홈타이 · 한·태 라인 · 일부 지역 제한",
  },
  "란제리 힐링 출장": {
    description:
      "서울 일대 섬세한 스웨·건식 조합을 내세운 출장입니다. 행복·힐링을 키워드로 두고, 장시간 앉는 직종 분들의 어깨·허리 라인에 맞춘 상담을 드립니다. 일부 지역은 협의 후 방문합니다.",
    greeting: "서울 홈타이 — 오늘은 건식으로 풀고 스웨로 마무리할까요?",
    detailAddress: "서울 전역 홈타이 · 일부 지역은 사전 협의",
  },
  "종로 북악 루트 출장": {
    preserveLocation: true,
    region: "서울",
    district: "종로",
    address: "서울 종로구 광화문·인사·삼청·북촌 일대 출장",
    description:
      "종로만 따로 잡은 출장 홈타이입니다. 낮엔 박물관·전시 동선, 해질 무렵엔 광화문·세종대로 쪽 퇴근 인파와 겹치기 쉬워서, 예약 시간 전에 어느 쪽에서 합류하는지만 짚어 주셔도 방문 순서가 매끈합니다. 건조한 한옥·펜션형 숙소에서는 향·오일을 최소화하고 건식으로 시작한 뒤, 환기와 수건 준비가 될 때만 라이트 오일로 넘어갑니다. 북악·삼청 쪽 길은 경사와 계단이 잦으니 통화 때 미리 알려 주시면 압과 각도를 낮춰 드립니다.",
    greeting:
      "접수드립니다. 오늘은 인사동 쪽에서 놀다 들어오시는지, 광화문·세종 쪽 업무 후인지 한 번만 짚어 주세요. 돌담 골목은 계단이 잦아서, 미리 말씀해 주시면 자세·압 조절 맞춰 둘게요.",
    detailAddress:
      "종로 일대 지정 장소 방문 · 좁은 골목·단지 내부는 출입 규정 확인 후 가능 · 심야·새벽은 전일 협의",
    alt: "종로 출장마사지 북악 루트 — 광화문·인사·북촌 동선 홈타이",
  },
};

const defaultCopy = {
  description:
    "서울 전역을 기준으로 하는 출장 홈타이입니다. 상담 시 일정과 장소를 맞추고, 컨디션에 맞는 코스를 안내해 드립니다.",
  greeting: "서울 출장 상담 환영합니다 — 편한 시간에 연락 주세요.",
  detailAddress: "서울 내 지정 장소로 방문 · 상담 후 확정",
};

function transformCard(c) {
  const o = copyByName[c.name] || defaultCopy;
  const next = { ...c };
  if (o.preserveLocation) {
    next.region = o.region || next.region || "서울";
    next.district = o.district || next.district || "종로";
    next.address = o.address || next.address || "서울 종로구 출장";
  } else {
    next.region = "서울";
    next.district = "서울 전지역";
    next.address = "서울 전지역";
  }
  next.detailAddress = o.detailAddress;
  next.description = o.description;
  next.greeting = o.greeting;
  next.alt = o.alt || `서울 전지역 출장마사지 ${c.name} — ${c.price || ""}`;
  if (next.dong === "불가" || next.dong === "관리") delete next.dong;
  if (Array.isArray(next.reviews)) {
    next.reviews = next.reviews.map((r) =>
      typeof r?.review === "string" ? { ...r, review: sanitizeSeoulText(r.review) } : r
    );
  }
  return next;
}

function cardToJsObject(obj, indent) {
  const pad = " ".repeat(indent);
  const lines = [`{`];
  const keys = Object.keys(obj);
  keys.forEach((k, i) => {
    const v = obj[k];
    const comma = i < keys.length - 1 ? "," : "";
    if (k === "reviews" && Array.isArray(v)) {
      lines.push(`${pad}  ${k}: [`);
      v.forEach((r, ri) => {
        const rc = ri < v.length - 1 ? "," : "";
        lines.push(`${pad}    {`);
        const rk = Object.keys(r);
        rk.forEach((key, ki) => {
          const com = ki < rk.length - 1 ? "," : "";
          const val = r[key];
          if (typeof val === "string") {
            lines.push(`${pad}      ${key}: ${q(val)}${com}`);
          } else {
            lines.push(`${pad}      ${key}: ${JSON.stringify(val)}${com}`);
          }
        });
        lines.push(`${pad}    }${rc}`);
      });
      lines.push(`${pad}  ]${comma}`);
    } else if (Array.isArray(v)) {
      const inner = v.map((x) => q(x)).join(", ");
      lines.push(`${pad}  ${k}: [${inner}]${comma}`);
    } else if (typeof v === "string") {
      lines.push(`${pad}  ${k}: ${q(v)}${comma}`);
    } else if (typeof v === "number" || typeof v === "boolean") {
      lines.push(`${pad}  ${k}: ${v}${comma}`);
    } else if (v == null) {
      lines.push(`${pad}  ${k}: null${comma}`);
    }
  });
  lines.push(`${pad}}`);
  return lines.join("\n");
}

const all = loadCards();
const seoulCards = all
  .filter((c) => String(c.region || "").includes("서울"))
  .map(transformCard)
  .sort((a, b) => a.id - b.id);

const phoneSet = new Set(seoulCards.map((c) => normPhone(c.phone)).filter(Boolean));

const body = seoulCards.map((c) => cardToJsObject(c, 0)).join(",\n\n");
const outJs = `// shop-card-data.js에서 출장마사지 항목만 분리 (서울 전용)\nwindow.outcallShopCardData = [\n${body}\n];\n`;

fs.writeFileSync(DATA_JS, outJs, "utf8");
if (fs.existsSync(IMPORTANT_JS)) {
  fs.writeFileSync(IMPORTANT_JS, outJs, "utf8");
}

let matchedText = fs.readFileSync(MATCHED_JSON, "utf8");
const m0 = matchedText.indexOf("{");
const m1 = matchedText.lastIndexOf("}");
const pack = JSON.parse(matchedText.slice(m0, m1 + 1));
pack.shops = (pack.shops || []).filter((s) => phoneSet.has(normPhone(s.phone)));
appendMissingShopsForCards(pack.shops, seoulCards);
syncMatchedShopsFromCards(pack.shops, seoulCards);
const matchedOut = `window.shopsDataOutcallMatched = ${JSON.stringify(pack, null, 2)};\n`;
fs.writeFileSync(MATCHED_JSON, matchedOut, "utf8");
fs.writeFileSync(path.join(ROOT, "data", "shops-outcall-matched.js"), matchedOut, "utf8");
if (fs.existsSync(IMPORTANT_MATCHED_JSON)) {
  fs.writeFileSync(IMPORTANT_MATCHED_JSON, matchedOut, "utf8");
  fs.writeFileSync(path.join(ROOT, "중요한정보", "shops-outcall-matched.js"), matchedOut, "utf8");
}

console.log("Seoul cards:", seoulCards.length);
console.log("Matched shops:", pack.shops.length);
console.log("Written:", DATA_JS, MATCHED_JSON);
console.log("팁: index.html / shops.html 소스에 카드 HTML 반영 → npm run shop:cards");
