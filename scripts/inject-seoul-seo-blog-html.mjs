/**
 * index.html + dist-seoul-*.html 의「오늘의 글·초안」에
 * 구별 SEO 본문(HTML)을 주입합니다. (npm run content:seoul-seo-blog)
 *
 * 마커: <!-- SEOUL_SEO_BLOG_START --> … <!-- SEOUL_SEO_BLOG_END -->
 * 재실행 시 마커 구간만 교체합니다.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const MARK_S = "<!-- SEOUL_SEO_BLOG_START -->";
const MARK_E = "<!-- SEOUL_SEO_BLOG_END -->";
const STUB_RE =
  /<p class="section-lead muted">이 영역은 이 HTML 파일에서만 직접 편집합니다\.<\/p>\s*<!--\s*카드·문단·링크 등을 여기에 넣으세요\s*-->/;

const SHOP_DETAIL = "shop-detail.html?id=seoul_instapretty_001";
const SHOP_NAME = "20대 인스타이쁜이";
const SHOP_TEL = "0507-1859-7033";

/** 정렬된 구 목록 (파일명과 동일 한글) */
const SEOUL_GU = [
  "강남",
  "강동",
  "강북",
  "강서",
  "관악",
  "광진",
  "구로",
  "금천",
  "노원",
  "도봉",
  "동대문",
  "동작",
  "마포",
  "서대문",
  "서초",
  "성동",
  "성북",
  "송파",
  "양천",
  "영등포",
  "용산",
  "은평",
  "종로",
  "중구",
  "중랑",
];

const DISTRICT_SCENE = {
  강남: "테헤란로·역삼 쪽 미팅이 잦은 주라면, 하루가 끝날 때쯤엔 발바닥이 먼저 신호를 보내는 경우가 많았어요.",
  강동: "천호·암사 쪽은 한강을 넘나드는 동선이 생각보다 길게 느껴질 때가 있어요. 주말 산책 뒤엔 종아리가 묵직해지기도 하고요.",
  강북: "미아·수유 일대는 북쪽으로 갈수록 이동이 한 번에 길게 이어지는 날이 잦아요. 계단·언덕이 섞이면 허벅지 쪽이 먼저 피로해질 때도 있었습니다.",
  강서: "김포공항·마곡 쪽은 ‘이동’ 자체가 하루의 상당 부분을 차지하는 날이 많아요. 가방을 오래 들면 어깨 라인이 먼저 뻐근해지기도 하죠.",
  관악: "신림·낙성대 쪽은 경사와 계단이 자연스럽게 섞여요. 평소에 걷기를 좋아해도, 그날 컨디션에 따라 무릎·종아리 반응이 달라지더라고요.",
  광진: "건대·화양·중곡 일대는 저녁 약속이 겹치기 쉬운 동선이에요. 먹자골목을 한 바퀴 돌고 나면 속은 괜찮은데 몸은 무거운 날도 있었어요.",
  구로: "구로디지털단지 쪽은 야근이 겹치면 의자에 붙어 있는 시간이 길어져요. 모니터 각도만 살짝 바꿔도 목 뒤가 당기는 느낌, 익숙하죠.",
  금천: "가산·독산 일대는 출근길에 사람이 몰리는 구간이 길어요. 지하철에서 오래 서 있으면 골반이 먼저 굳는 날도 있었습니다.",
  노원: "상계·중계는 동네가 넓어서 ‘조금만 걸었는데’가 꽤 쌓이는 타입이에요. 장보기·등원 동선이 겹치면 저녁엔 허리가 묵직해지기도 하고요.",
  도봉: "방학·쌍문 쪽은 북쪽 끝이라 이동이 한 번에 길게 잡히는 날이 있어요. 집에 도착하면 일단 소파에 앉고 싶어지는 마음부터 드는 날도 있었어요.",
  동대문: "청량리·왕십리 환승이 잦으면 가방을 한쪽 어깨에만 두는 습관이 생기기 쉬워요. 저도 그런 날엔 견갑 안쪽이 먼저 뭉치더라고요.",
  동작: "노량진·흑석 쪽은 한강과 언덕이 같이 있어요. 낮에는 괜찮았는데 밤에 갑자기 뻐근해지는 패턴도 흔한 편이었습니다.",
  마포: "홍대·합정·상수 쪽은 밤에 사람이 몰리는 동선이 길어져요. 서서 대기하는 시간이 길면 발등이 먼저 피로해지는 날도 있었어요.",
  서대문: "신촌·이대·연세 쪽은 젊은 동선이라 걷기도 많고, 카페에 앉아 있는 시간도 길어져요. 허리가 먼저 말하는 날이 있더라고요.",
  서초: "반포·서래·교대 쪽은 약속 장소가 잘게 쪼개지는 날이 많아요. 택시·도보가 섞이면 하루가 끝날 때 어깨가 먼저 무거워지기도 했습니다.",
  성동: "성수·뚝섬 쪽은 카페·전시·산책이 한 번에 겹치기 쉬워요. ‘조금만 더 걷자’가 쌓이면 저녁엔 종아리가 먼저 말을 걸더라고요.",
  성북: "한성대·안암·보문 쪽은 언덕과 계단이 자연스럽게 섞여요. 평소 운동이 적으면 그날 컨디션이 확 달라지는 느낌도 있었습니다.",
  송파: "잠실·문정·방이 쪽은 넓은 단지를 가로지르는 날이 많아요. 회의·미팅이 연속이면 허리가 먼저 뻐근해지는 패턴도 흔했어요.",
  양천: "목동·신정 쪽은 생활권이 넓어서 장보기·등하원 동선이 길게 이어지기도 해요. ‘별거 아닌데’ 쌓이면 저녁엔 발바닥이 먼저 피곤해지더라고요.",
  영등포: "여의도·당산 쪽은 낮엔 회의, 밤엔 약속이 겹치기 쉬워요. 택시에서 오래 앉아 있으면 골반 주변이 먼저 굳는 날도 있었습니다.",
  용산: "용산역·이촌 쪽은 환승과 이동이 한 번에 몰리는 날이 많아요. 짐을 들고 계단을 오르내리면 손목·전완이 먼저 반응하기도 하죠.",
  은평: "불광·연신내 쪽은 동네가 넓어서 ‘가까운 줄 알았는데’가 자주 생겨요. 저녁에 집에 들어오면 일단 스트레칭부터 하게 되더라고요.",
  종로: "광화문·인사·삼청 쪽은 낮에 걷는 양이 생각보다 많아져요. 관광 동선이 겹치면 발등이 먼저 말하는 날도 있었습니다.",
  중구: "을지로·명동·회현 쪽은 낮과 밤의 동선이 확 달라져요. 밤에 이동이 길어지면 다음 날 아침엔 목이 먼저 뻐근해지기도 하더라고요.",
  중랑: "망우·상봉·면목 쪽은 환승이 잦으면 가방을 한쪽에만 두는 날이 늘어요. 어깨 높이가 살짝 달라지는 느낌, 익숙하죠.",
};

function hash32(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function pick(arr, seed) {
  return arr[seed % arr.length];
}

/** 같은 배열에서 서로 다른 항목 두 개 */
function pickPair(arr, seed) {
  if (arr.length < 2) return [arr[0], arr[0]];
  const a = arr[seed % arr.length];
  const b = arr[(seed + 1 + (seed % (arr.length - 1))) % arr.length];
  return a === b ? [a, arr[(seed + 2) % arr.length]] : [a, b];
}

const PROMO_ROMAN = {
  강남: "gangnam",
  강동: "gangdong",
  강북: "gangbuk",
  강서: "gangseo",
  관악: "gwanak",
  광진: "gwangjin",
  구로: "guro",
  금천: "geumcheon",
  노원: "nowon",
  도봉: "dobong",
  동대문: "dongdaemun",
  동작: "dongjak",
  마포: "mapo",
  서대문: "seodaemun",
  서초: "seocho",
  성동: "seongdong",
  성북: "seongbuk",
  송파: "songpa",
  양천: "yangcheon",
  영등포: "yeongdeungpo",
  용산: "yongsan",
  은평: "eunpyeong",
  종로: "jongno",
  중구: "junggu",
  중랑: "jungnang",
};

function promoImageSrc(gu) {
  const roman = gu ? PROMO_ROMAN[gu] : "";
  if (roman) {
    const rel = `images/promo-seoul-${roman}-1.svg`;
    if (fs.existsSync(path.join(ROOT, rel))) return rel;
  }
  return "images/og-default.png";
}

function blogFigureHtml(gu, kw) {
  const src = promoImageSrc(gu);
  const alt = gu ? `${kw} — 서울 일대 방문형 힐링 안내` : "서울출장마사지 — 서울 전역 안내";
  return `<figure class="seoul-seo-blog-figure">
          <img src="${src}" alt="${alt}" width="800" height="420" loading="lazy" />
          <figcaption>${gu ? `${kw} 안내` : "서울출장마사지"}</figcaption>
        </figure>`;
}

function textLenRough(html) {
  return stripTags(html).replace(/\s+/g, " ").length;
}

function stripTags(s) {
  return String(s).replace(/<[^>]+>/g, " ");
}

function neighborFiles(gu) {
  const i = SEOUL_GU.indexOf(gu);
  if (i < 0) return ["dist-seoul-종로.html", "dist-seoul-중구.html", "dist-seoul-마포.html"];
  const a = SEOUL_GU[(i - 1 + SEOUL_GU.length) % SEOUL_GU.length];
  const b = SEOUL_GU[(i + 1) % SEOUL_GU.length];
  const c = SEOUL_GU[(i + 3) % SEOUL_GU.length];
  return [`dist-seoul-${a}.html`, `dist-seoul-${b}.html`, `dist-seoul-${c}.html`];
}

function linkLine(label, href) {
  return `<li><a href="${href}">${label}</a></li>`;
}

function buildDistrictArticle(gu, pageFile) {
  const seed = hash32(gu + pageFile);
  const scene = DISTRICT_SCENE[gu] || `${gu} 일대는 하루 동선이 생각보다 길게 이어지는 날이 많아요.`;
  const kw = `${gu}출장마사지`;
  const neigh = neighborFiles(gu);
  const n1 = neigh[0].replace(/^dist-seoul-/, "").replace(/\.html$/i, "");
  const n2 = neigh[1].replace(/^dist-seoul-/, "").replace(/\.html$/i, "");
  const n3 = neigh[2].replace(/^dist-seoul-/, "").replace(/\.html$/i, "");

  const titles = [
    `${gu}에서 정리한 서울출장마사지 상담 노트 — 홈타이·호텔까지`,
    `${kw} 찾을 때, 서울홈타이 상담을 짧게 끝내던 방법`,
    `야근 뒤 ${gu} 동선에서 서울마사지 상담까지 오래 안 걸리게`,
    `${gu} 일대 서울출장 후기 느낌으로 적어본 체크리스트`,
    `${gu}에서 서울스웨디시·오일 라인 고를 때 헷갈렸던 포인트`,
  ];
  const h2Title = pick(titles, seed);

  const pIntro = [
    `${scene} 저는 그런 날엔 “오늘은 어디까지 갈 수 있나”보다 “몸이 어디부터 말하는지”부터 적어 두곤 했어요. 검색창에 <strong>서울출장마사지</strong>를 넣기 전에, 일정·위치·원하는 강도만 짧게 정리해 두면 상담이 훨씬 빨라지더라고요.`,
    `주변에서 ${kw} 이야기가 나오면 꼭 따라붙는 말이 있어요. “진짜 시간 맞나요?” 같은 질문이죠. 저도 처음엔 반신반의했는데, <strong>서울출장</strong> 상담은 가능 구간·대기·준비물(타올·샤워 가능 여부)만 먼저 맞추면 이후가 편했습니다.`,
    `${scene} 그래서 요즘은 검색어를 한 번에 늘리기보다, <strong>서울홈타이</strong>처럼 ‘공간’ 키워드부터 넣어 보곤 해요. 원룸이냐 오피스텔이냐, 혹은 <strong>서울호텔출장</strong>처럼 숙소인지에 따라 동선 설명이 달라지거든요.`,
  ];

  const pUse = [
    `이용 상황은 크게 세 가지로 나뉘었어요. (1) 회식·미팅 뒤 늦게 들어가는 날 — 이때는 <strong>서울야간출장</strong> 가능 여부를 먼저 물어보게 됐고요. (2) 주말에 집에서 회복하고 싶은 날 — <strong>서울홈타이</strong> 톤으로 상담하는 게 맞았어요. (3) 출장으로 호텔에 머무는 날 — <strong>서울호텔출장</strong> 기준으로 로비·층수 안내를 짧게 맞추는 게 중요했습니다.`,
    `직장인 기준으로는 “퇴근 후 2시간만 비워도 될까?”가 제일 현실적인 질문이었어요. ${gu} 쪽은 이동이 꼬이기 쉬워서, <strong>서울출장</strong> 상담에서 역 출구·로비 기준으로 만나는지부터 확인하는 게 마음이 편했습니다.`,
  ];

  const pCourse = [
    `코스는 이름보다 ‘오늘 몸이 원하는 밸런스’로 고르는 편이 좋았어요. 뻐근함이 깊으면 스포츠 쪽으로 시작하고, 피부 당김이나 이완이 필요하면 <strong>서울오일마사지</strong> 라인을 섞어 달라고 말씀드렸어요. 부드러운 흐름을 원하면 <strong>서울스웨디시</strong> 톤으로 길게 잡는 경우도 있었고요.`,
    `가격표를 처음 보면 숫자만 커 보일 수 있는데, 저는 ‘시간 대비 내가 원하는 게 뭔지’부터 적었어요. 60·90·120처럼 길이가 달라질수록 호흡이 달라지더라고요. 과장된 기대보다는 “오늘은 여기만 내려놓고 싶다” 정도로 말하면 <strong>서울마사지</strong> 상담이 방향을 잡기 쉬웠습니다.`,
  ];

  const pMove = [
    `${gu}에서 서울을 가로지르는 날은, 지도상 거리보다 ‘환승·대기’가 체력을 더 뺏는 경우가 많았어요. 그래서 상담할 때는 주소를 길게 적기보다, 근처 랜드마크와 도보 가능 범위를 짧게 말하는 편이 수월했어요.`,
    `저는 ${gu}에서 약속이 밀릴수록 “집이 아니라 숙소인데 괜찮을까?”를 먼저 묻게 됐어요. 공간이 익숙하면 회복도 빨라지는 편이라, <strong>서울홈타이</strong>처럼 환기·소음만 체크해 두면 이후 상담이 단순해지더라고요.`,
  ];

  const pConsult = [
    `상담 흐름은 대체로 이랬어요. 일정·위치·원하는 압(강·중·약)을 말씀드리고, 가능 여부 확인 → 코스·시간 조율 → 방문 전 준비(샤워 가능, 오일 알레르기)만 짧게 정리. 애매한 부분은 카드에 있는 연락처로 다시 확인하는 게 제일 안전했습니다.`,
    `전화할 땐 “지금 이 시간대도 되나요?”를 제일 먼저 묻게 되더라고요. <strong>서울야간출장</strong>은 업체마다 운영이 달라서, 통화가 안 되면 문자로 짧게 남기는 것도 방법이었어요.`,
  ];

  const pClose = [
    `마무리로, ${kw} 페이지는 정보 안내에 가깝고 실제 예약·요금은 업체마다 달라요. 아래 링크에서 홈으로 돌아가거나 인근 구를 비교해 보시고, 마음에 드는 곳만 골라 편하게 문의해 보시면 됩니다.`,
    `의료적 효과를 단정하진 않을게요. 다만 하루 끝에 몸이 보내는 신호는 꽤 솔직하더라고요. ${gu}에서의 동선을 짧게 정리해 두면, 다음날 컨디션이 조금은 덜 무겁게 느껴질 때도 있었습니다.`,
  ];

  const [courseA, courseB] = pickPair(pCourse, seed);
  const [consultA, consultB] = pickPair(pConsult, seed + 7);
  const extra = pick(
    [
      `참고로 저는 상담할 때 “오늘은 어깨만”처럼 부위를 한정해 말하면 <strong>서울마사지</strong> 코스 구성이 더 명확해진다는 걸 느꼈어요.`,
      `가끔은 <strong>서울스웨디시</strong>처럼 부드러운 라인을 원하고, 가끔은 스포츠 쪽으로 ‘딱’ 밀어주길 원할 때도 있었어요. 그날 컨디션에 맞춰 말하는 게 제일 좋았습니다.`,
    ],
    seed + 3
  );

  const shopUl = `<ul class="seoul-seo-blog-list">
          <li><strong>${SHOP_NAME}</strong> · 서울 · 70,000원~ (안내 기준, 변동 가능)</li>
          <li>스포츠(꾹꾹) A/B/C · 오일 · 감성힐링 스웨디시 · VVIP · 믹스 · 한국인 스웨 라인 등 코스 구성</li>
          <li>예약·문의: <a href="tel:${SHOP_TEL.replace(/-/g, "")}">${SHOP_TEL}</a> · 상세는 <a href="${SHOP_DETAIL}">${SHOP_NAME} 소개 페이지</a></li>
          <li>서울 전역 원룸·오피스텔·주택가 홈타이 출장 안내(실제 가능 구간은 상담으로 확인)</li>
        </ul>`;

  const linkUl = `<ul class="seoul-seo-blog-list seoul-seo-blog-links" aria-label="관련 지역 페이지">
          ${linkLine("서울출장마사지 홈", "index.html#blog-posts")}
          ${linkLine("등록 업체 목록", "shops.html")}
          ${linkLine(`${n1}출장마사지`, `dist-seoul-${n1}.html#blog-posts`)}
          ${linkLine(`${n2}출장마사지`, `dist-seoul-${n2}.html#blog-posts`)}
          ${linkLine(`${n3}출장마사지`, `dist-seoul-${n3}.html#blog-posts`)}
          ${linkLine(`${gu} 페이지 상단`, `${pageFile}#blog-posts`)}
        </ul>`;

  let body = `${MARK_S}
        <article class="seoul-seo-blog" lang="ko">
          ${blogFigureHtml(gu, kw)}
          <h2 class="seoul-seo-blog-title">${h2Title}</h2>
          <p class="fineprint seoul-seo-blog-disclaimer">정보 제공 목적 글이며, 의료 효과를 보장하지 않습니다. 실제 프로그램·요금은 상담 및 업체 안내를 기준으로 확인해 주세요.</p>
          <p>${pick(pIntro, seed)}</p>
          <p>${pick(pIntro, seed + 5)}</p>
          <p>${pick(pUse, seed)}</p>
          <h3 class="seoul-seo-blog-h3">이용 상황을 나눠 적어 보면</h3>
          <p>${pick(pUse, seed + 1)}</p>
          <h3 class="seoul-seo-blog-h3">코스는 이렇게 고르게 됐어요</h3>
          <p>${courseA}</p>
          <p>${courseB}</p>
          ${shopUl}
          <h3 class="seoul-seo-blog-h3">${gu} 쪽 서울 지역 이동 특징</h3>
          <p>${pick(pMove, seed)}</p>
          <p>${pick(pMove, seed + 1)}</p>
          <h3 class="seoul-seo-blog-h3">상담 흐름(제가 써 둔 순서)</h3>
          <p>${consultA}</p>
          <p>${consultB}</p>
          <p>${extra}</p>
          <h3 class="seoul-seo-blog-h3">마무리 안내</h3>
          <p>${pick(pClose, seed)}</p>
          <p>${pick(pClose, seed + 1)}</p>
          ${linkUl}
        </article>
        ${MARK_E}`;

  let n = textLenRough(body);
  let pad = 0;
  while (n < 1500 && pad < 6) {
    body = body.replace(
      `${MARK_E}`,
      `<p class="seoul-seo-blog-padding">${gu}에서 하루를 정리해 보면, ‘조금만 쉬면 되겠지’가 쌓이는 타입이었어요. 그래서 상담 때는 당일 뻐근한 지점을 한두 군데만 짚어 말하는 습관을 들이게 됐습니다. <strong>서울출장마사지</strong>라는 말이 부담스럽게 느껴질 땐, 그냥 “오늘은 이완 위주로”처럼 말로 풀어도 충분했어요.</p>\n        ${MARK_E}`
    );
    n = textLenRough(body);
    pad++;
  }

  return body;
}

function buildIndexArticle() {
  const seed = hash32("index-seo-blog");
  const h2Title = pick(
    [
      "서울출장마사지 홈에서 본 하루 — 홈타이·호텔·야간 상담까지",
      "서울 전역 기준으로 적어본 서울마사지 상담 체크리스트",
      "서울홈타이부터 서울호텔출장까지, 질문 순서만 바꿔도 편해졌던 이유",
    ],
    seed
  );

  const p1 = `서울에서 하루를 보내다 보면 ‘이동’이 생각보다 많이 쌓여요. 지하철 환승, 회의실 의자, 저녁 약속까지 겹치면 몸은 먼저 신호를 보내죠. 저는 그럴 때 검색창에 <strong>서울출장마사지</strong>를 넣기 전에, 오늘은 집인지 오피스텔인지 호텔인지부터 적어 두곤 했어요. <strong>서울홈타이</strong>냐 <strong>서울호텔출장</strong>이냐에 따라 준비물 안내도 달라지더라고요.`;

  const p2 = `직장인 입장에선 야근이 붙는 날이 제일 현실적이에요. 그런 날은 “지금 시간대도 되나요?”를 먼저 묻게 됐고, <strong>서울야간출장</strong> 가능 여부는 업체마다 달라서 통화가 안 되면 문자로 짧게 남기는 편이 마음이 편했습니다. 과장된 약속보다는 범위를 솔직히 말해 주는 상담이 결국 신뢰로 이어졌어요.`;

  const p3 = `코스 이름이 많아 보여도, 저는 ‘오늘 몸이 원하는 밸런스’로만 고르게 됐어요. 뻐근함이 깊으면 스포츠 쪽으로 시작하고, 당김이나 이완이 필요하면 <strong>서울오일마사지</strong> 톤을 섞어 달라고 말씀드렸습니다. 부드러운 흐름을 원하면 <strong>서울스웨디시</strong> 라인으로 길게 잡는 경우도 있었고요.`;

  const p4 = `상담 흐름은 이렇게 정리됐어요. 일정·위치·원하는 압(강·중·약) → 가능 여부 확인 → 코스·시간 조율 → 방문 전 준비(샤워 가능, 오일 알레르기)만 짧게 확인. <strong>서울출장</strong>이라고 해서 특별한 게 있는 건 아니고, 그날 컨디션을 짧게 전하는 게 제일 도움이 됐습니다.`;

  const p5 = `아래 링크는 제가 실제로 비교해 보거나, 주변에서 물어보던 구별 페이지예요. <strong>서울마사지</strong>라는 말이 부담스럽게 느껴질 땐, 그냥 “오늘은 어깨만”처럼 부위를 한정해 말해도 충분했어요.`;

  const shopUl = `<ul class="seoul-seo-blog-list">
          <li><strong>${SHOP_NAME}</strong> · 서울 · 70,000원~ (안내 기준, 변동 가능)</li>
          <li>스포츠·오일·스웨디시·VVIP·믹스·한국인 스웨 등 코스 구성</li>
          <li>예약·문의: <a href="tel:${SHOP_TEL.replace(/-/g, "")}">${SHOP_TEL}</a> · 상세는 <a href="${SHOP_DETAIL}">${SHOP_NAME} 소개 페이지</a></li>
        </ul>`;

  const linkUl = `<ul class="seoul-seo-blog-list seoul-seo-blog-links" aria-label="서울 구별 하부 페이지">
          ${linkLine("종로출장마사지", "dist-seoul-종로.html#blog-posts")}
          ${linkLine("중구출장마사지", "dist-seoul-중구.html#blog-posts")}
          ${linkLine("강남출장마사지", "dist-seoul-강남.html#blog-posts")}
          ${linkLine("마포출장마사지", "dist-seoul-마포.html#blog-posts")}
          ${linkLine("송파출장마사지", "dist-seoul-송파.html#blog-posts")}
          ${linkLine("등록 업체 목록", "shops.html")}
          ${linkLine("이 페이지 상단", "index.html#blog-posts")}
        </ul>`;

  return `${MARK_S}
        <article class="seoul-seo-blog" lang="ko">
          ${blogFigureHtml(null, "서울출장마사지")}
          <h2 class="seoul-seo-blog-title">${h2Title}</h2>
          <p class="fineprint seoul-seo-blog-disclaimer">정보 제공 목적 글이며, 의료 효과를 보장하지 않습니다. 실제 프로그램·요금은 상담 및 업체 안내를 기준으로 확인해 주세요.</p>
          <p>${p1}</p>
          <p>${p2}</p>
          <p>${p3}</p>
          <h3 class="seoul-seo-blog-h3">코스·가격표를 처음 볼 때</h3>
          ${shopUl}
          <h3 class="seoul-seo-blog-h3">이런 날엔 특히 질문이 길어졌어요</h3>
          <p>오피스텔에서 노트북만 보다가 저녁에 약속이 있는 날, 혹은 호텔에서 다음 날 일정이 빡빡한 날이었어요. 전자는 창문을 열 환기가 되는지부터 말하게 됐고, 후자는 로비에서 만나는 게 나은지 층에서 맞는 게 나은지를 짧게 물었습니다. 공간이 정리되면 <strong>서울출장</strong> 상담도 훨씬 빨리 끝나더라고요.</p>
          <p>가격표 숫자가 부담스러울 땐, 먼저 시간만 고르고 그다음에 라인을 고르는 순서가 편했어요. 60분이면 ‘당일 회복’ 느낌, 90분 이상이면 몸이 천천히 풀리는 날이었거든요.</p>
          <p>${p4}</p>
          <h3 class="seoul-seo-blog-h3">서울 지역 이동을 줄이는 말하기</h3>
          <p>서울은 지도상 거리보다 환승·대기가 체력을 더 뺏는 경우가 많아요. 그래서 상담할 때는 주소를 길게 적기보다, 역 출구·로비 기준으로 만나는지부터 확인하는 편이 수월했습니다. 호텔에 머무는 날엔 층수·로비 안내를 짧게 맞추면 <strong>서울호텔출장</strong> 상담이 한결 단순해지더라고요.</p>
          <h3 class="seoul-seo-blog-h3">마무리 안내</h3>
          <p>${p5}</p>
          <p>의료적 효과를 단정하진 않을게요. 다만 하루 끝에 몸이 보내는 신호는 꽤 솔직하더라고요. 아래 링크에서 구별 페이지를 열어보고, 편한 곳만 골라 문의해 보시면 됩니다.</p>
          ${linkUl}
        </article>
        ${MARK_E}`;
}

function replaceBlogInner(html, newBlock) {
  const escS = MARK_S.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escE = MARK_E.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const marked = new RegExp(`${escS}[\\s\\S]*?${escE}`);
  if (html.includes(MARK_S) && html.includes(MARK_E)) {
    return html.replace(marked, newBlock.trim());
  }
  if (STUB_RE.test(html)) {
    return html.replace(STUB_RE, newBlock.trim());
  }
  return null;
}

function processFile(name) {
  const fp = path.join(ROOT, name);
  let html = fs.readFileSync(fp, "utf8");
  if (!html.includes('id="blog-posts"')) return { name, ok: false, reason: "no blog-posts" };
  let block;
  if (name === "index.html") block = buildIndexArticle();
  else {
    const gu = name.replace(/^dist-seoul-|\.html$/gi, "");
    if (!SEOUL_GU.includes(gu)) return { name, ok: false, reason: "not seoul dist" };
    block = buildDistrictArticle(gu, name);
  }
  const next = replaceBlogInner(html, block);
  if (!next) return { name, ok: false, reason: "no stub/markers" };
  const len = textLenRough(block);
  if (len < 1400) console.warn("[len]", name, len);
  fs.writeFileSync(fp, next, "utf8");
  return { name, ok: true, len };
}

function main() {
  const dry = process.argv.includes("--dry-run");
  const files = ["index.html", ...SEOUL_GU.map((g) => `dist-seoul-${g}.html`)];
  let n = 0;
  for (const name of files) {
    const fp = path.join(ROOT, name);
    if (!fs.existsSync(fp)) {
      console.warn("missing", name);
      continue;
    }
    if (dry) {
      const gu = name === "index.html" ? null : name.replace(/^dist-seoul-|\.html$/gi, "");
      const b = name === "index.html" ? buildIndexArticle() : buildDistrictArticle(gu, name);
      console.log("[dry]", name, "chars~", textLenRough(b));
      n++;
      continue;
    }
    const r = processFile(name);
    if (r.ok) {
      console.log("ok", r.name, "~chars", r.len);
      n++;
    } else console.warn("skip", r.name, r.reason);
  }
  console.log("inject-seoul-seo-blog-html:", n, "/", files.length);
}

main();
