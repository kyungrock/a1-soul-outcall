/**
 * 지역 드롭다운 내비 + 시·구 정적 페이지(dist-*.html) + 광역 랜딩
 *
 * 데이터: 중요한정보/korea-regions.json
 * 실행: node scripts/gen-region-nav-snippet.mjs
 * 이후: npm run seo
 *
 * index / shops / shop-detail / blog-article 의 REGION_NAV_AUTO_* 마커 갱신
 * data/district-static-pages.json — apply-seo 사이트맵·canonical용
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REGIONS = JSON.parse(
  fs.readFileSync(path.join(ROOT, "중요한정보", "korea-regions.json"), "utf8")
);

function pick(name) {
  const r = REGIONS.regions.find((x) => x.name === name);
  return r ? r.districts : [];
}

const seoul = pick("서울");
const gyeonggi = pick("경기");
const incheon = pick("인천");
const gangwon = pick("강원");
const jeju = pick("제주");

const chungcheong = ["대전", "세종", "청주", "천안", "아산", "당진", "충남", "충북"];
const gyeongsang = [
  "부산",
  "대구",
  "울산",
  "김해",
  "포항",
  "구미",
  "경산",
  "양산",
  "진주",
  "경남",
  "경북",
];
const jeolla = ["광주", "전주", "순천", "여수", "익산", "군산", "목포", "전북", "전남"];

/** 광역 랜딩 파일명 · 메뉴 상위 링크 */
const REGION_PARENT_LINK = {
  seoul: "index.html",
  gyeonggi: "region-gyeonggi.html",
  incheon: "region-incheon.html",
  chungcheong: "region-chungcheong.html",
  gyeongsang: "region-gyeongsang.html",
  jeolla: "region-jeolla.html",
  gangwon: "region-gangwon.html",
  jeju: "region-jeju.html",
};

const REGION_PARENT_LABEL = {
  seoul: "서울",
  gyeonggi: "경기",
  incheon: "인천",
  chungcheong: "충청",
  gyeongsang: "경상",
  jeolla: "전라",
  gangwon: "강원",
  jeju: "제주",
};

const DISTRICT_GROUPS = [
  { regionKey: "seoul", scopeLabel: "서울", districts: seoul },
  { regionKey: "gyeonggi", scopeLabel: "경기", districts: gyeonggi },
  { regionKey: "incheon", scopeLabel: "인천", districts: incheon },
  { regionKey: "chungcheong", scopeLabel: "충청권", districts: chungcheong },
  { regionKey: "gyeongsang", scopeLabel: "경상권", districts: gyeongsang },
  { regionKey: "jeolla", scopeLabel: "전라권", districts: jeolla },
  { regionKey: "gangwon", scopeLabel: "강원", districts: gangwon },
  { regionKey: "jeju", scopeLabel: "제주", districts: jeju },
];

function distFilename(regionKey, district) {
  return `dist-${regionKey}-${district}.html`;
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function submenuItemsFromDist(regionKey, districts) {
  return districts
    .map((d) => {
      const href = distFilename(regionKey, d);
      const label = `${d}출장마사지`;
      return `            <li><a href="${esc(href)}">${esc(label)}</a></li>`;
    })
    .join("\n");
}

function dropdownDist(parentHref, parentLabel, regionKey, districts) {
  return `    <li class="nav-dropdown">
      <a href="${esc(parentHref)}">${esc(parentLabel)}</a>
      <ul class="nav-dropdown-menu" role="list">
${submenuItemsFromDist(regionKey, districts)}
      </ul>
    </li>`;
}

const ul = `<nav id="site-nav" class="site-nav" aria-label="주요 메뉴">
  <ul class="site-nav-root" role="list">
${dropdownDist("index.html", "서울", "seoul", seoul)}
${dropdownDist("region-gyeonggi.html", "경기", "gyeonggi", gyeonggi)}
${dropdownDist("region-incheon.html", "인천", "incheon", incheon)}
${dropdownDist("region-chungcheong.html", "충청", "chungcheong", chungcheong)}
${dropdownDist("region-gyeongsang.html", "경상", "gyeongsang", gyeongsang)}
${dropdownDist("region-jeolla.html", "전라", "jeolla", jeolla)}
${dropdownDist("region-gangwon.html", "강원", "gangwon", gangwon)}
${dropdownDist("region-jeju.html", "제주", "jeju", jeju)}
    <li><a href="shops.html">업체</a></li>
    <li><a href="index.html">글</a></li>
  </ul>
</nav>`;

const SEO_PLACEHOLDER = `  <!-- APPLY_SEO_START -->
  <!-- seo-config.json 에 siteUrl 을 채운 뒤 node scripts/apply-seo.mjs 또는 npm run seo -->
  <!-- APPLY_SEO_END -->`;

function navIndentedBlock() {
  return ul
    .split("\n")
    .map((line) => (line ? `      ${line}` : line))
    .join("\n");
}

function regionLandingCards(districts, scopeLabel, regionKey) {
  const line =
    "실제 예약·요금·방문 가능 여부는 등록 업체 상담을 통해 확인하세요. 본 페이지는 정보 안내 목적입니다.";
  return districts
    .map((d) => {
      const href = distFilename(regionKey, d);
      return `        <article id="r-${d}" class="region-kw-card">
          <h2 class="region-kw-card-title"><a href="${esc(href)}">${esc(d)} 출장마사지</a></h2>
          <p>${scopeLabel} ${d} 일대 방문형 힐링·바디케어 안내입니다. ${line}</p>
        </article>`;
    })
    .join("\n");
}

function districtPageHtml(regionKey, district, scopeLabel) {
  const h1 = `${district} 출장마사지`;
  const title = `${h1} | 서울출장마사지 - 20대,30대 힐링출장 서비스`;
  const description = `${district} 출장마사지 — ${scopeLabel} 일대 방문형 힐링·바디케어 안내. 예약·요금은 등록 업체 상담으로 확인하세요.`;
  const parentFile = REGION_PARENT_LINK[regionKey];
  const parentLabel = REGION_PARENT_LABEL[regionKey];
  const body = `        <p class="region-kw-lead">${scopeLabel} <strong>${esc(district)}</strong> 일대 키워드 안내 페이지입니다. 실제 서비스 가능 지역·시간·요금은 업체마다 다르므로 상담으로 확인해 주세요.</p>
        <p class="region-kw-actions">
          <a class="btn primary" href="shops.html">등록 업체 보기</a>
          <a class="btn ghost" href="${esc(parentFile)}">${esc(parentLabel)} 지역 전체</a>
          <a class="btn ghost" href="index.html">홈</a>
        </p>`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="js/page-base.js"></script>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="format-detection" content="telephone=yes" />
  <meta name="theme-color" content="#2d6a4f" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="ko_KR" />
  <meta property="og:site_name" content="서울출장마사지" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
${SEO_PLACEHOLDER}
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <a class="skip-link" href="#main">본문으로 건너뛰기</a>

  <header class="site-header">
    <div class="inner">
      <p class="site-title">
        <a href="index.html">
          <span class="brand-name">서울출장마사지</span>
          <span class="brand-tagline">20대,30대 힐링출장 서비스</span>
        </a>
      </p>
      <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav">메뉴</button>
${navIndentedBlock()}
    </div>
  </header>

  <main id="main" class="region-landing-main district-static-main">
    <section class="section" aria-labelledby="district-static-h1">
      <div class="inner">
        <h1 id="district-static-h1">${esc(h1)}</h1>
${body}
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="inner">
      <p class="footer-brand"><strong>서울출장마사지</strong> <span class="footer-tagline">20대,30대 힐링출장 서비스</span></p>
      <p class="fineprint">정보 제공 목적 페이지입니다.</p>
      <p class="copyright">© <span id="year"></span> 서울출장마사지</p>
    </div>
  </footer>
  <script src="main.js" defer></script>
</body>
</html>
`;
}

function regionPageHtml(spec) {
  const body = `        <h2 class="region-kw-heading visually-hidden">지역 키워드</h2>
        <p class="region-kw-lead">${spec.lead}</p>
        <p class="region-kw-actions"><a class="btn primary" href="shops.html">등록 업체 보기</a> <a class="btn ghost" href="index.html">서울 홈</a></p>
        <div class="region-kw-grid">
${regionLandingCards(spec.districts, spec.scope, spec.regionKey)}
        </div>`;
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="js/page-base.js"></script>
  <title>${esc(spec.title)}</title>
  <meta name="description" content="${esc(spec.description)}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="format-detection" content="telephone=yes" />
  <meta name="theme-color" content="#2d6a4f" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="ko_KR" />
  <meta property="og:site_name" content="서울출장마사지" />
  <meta property="og:title" content="${esc(spec.title)}" />
  <meta property="og:description" content="${esc(spec.description)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(spec.title)}" />
  <meta name="twitter:description" content="${esc(spec.description)}" />
${SEO_PLACEHOLDER}
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <a class="skip-link" href="#main">본문으로 건너뛰기</a>

  <header class="site-header">
    <div class="inner">
      <p class="site-title">
        <a href="index.html">
          <span class="brand-name">서울출장마사지</span>
          <span class="brand-tagline">20대,30대 힐링출장 서비스</span>
        </a>
      </p>
      <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav">메뉴</button>
${navIndentedBlock()}
    </div>
  </header>

  <main id="main" class="region-landing-main">
    <section class="section" aria-labelledby="region-landing-h1">
      <div class="inner">
        <h1 id="region-landing-h1">${esc(spec.h1)}</h1>
${body}
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="inner">
      <p class="footer-brand"><strong>서울출장마사지</strong> <span class="footer-tagline">20대,30대 힐링출장 서비스</span></p>
      <p class="fineprint">정보 제공 목적 페이지입니다.</p>
      <p class="copyright">© <span id="year"></span> 서울출장마사지</p>
    </div>
  </footer>
  <script src="main.js" defer></script>
</body>
</html>
`;
}

const REGION_LANDING_SPECS = [
  {
    file: "region-gyeonggi.html",
    regionKey: "gyeonggi",
    h1: "경기출장마사지",
    title: "경기출장마사지 | 서울출장마사지 - 20대,30대 힐링출장 서비스",
    description:
      "경기 출장마사지 안내 — 수원·성남·고양·용인 등 지역 키워드별 방문형 힐링 정보. 예약·요금은 업체 상담으로 확인하세요.",
    lead: "경기도 생활권 방문형 웰니스·바디케어 키워드 안내입니다. 노출된 지역과 무관하게 실제 서비스 가능 여부는 상담 시 확인이 필요합니다.",
    scope: "경기",
    districts: gyeonggi,
  },
  {
    file: "region-incheon.html",
    regionKey: "incheon",
    h1: "인천출장마사지",
    title: "인천출장마사지 | 서울출장마사지 - 20대,30대 힐링출장 서비스",
    description:
      "인천 출장마사지 안내 — 중구·연수·부평 등 행정구역별 키워드. 방문형 힐링 정보는 등록 업체와 상담으로 확인하세요.",
    lead: "인천광역시 일대 방문형 힐링·바디케어 키워드 안내입니다.",
    scope: "인천",
    districts: incheon,
  },
  {
    file: "region-chungcheong.html",
    regionKey: "chungcheong",
    h1: "충청출장마사지",
    title: "충청출장마사지 | 서울출장마사지 - 20대,30대 힐링출장 서비스",
    description:
      "충청권 출장마사지 안내 — 대전·세종·청주·천안 등 키워드별 정보. 충남·충북 일대 방문형 케어는 업체 상담을 확인하세요.",
    lead: "충청권(대전·세종·충남·충북 등) 방문형 힐링 키워드 안내입니다.",
    scope: "충청권",
    districts: chungcheong,
  },
  {
    file: "region-gyeongsang.html",
    regionKey: "gyeongsang",
    h1: "경상출장마사지",
    title: "경상출장마사지 | 서울출장마사지 - 20대,30대 힐링출장 서비스",
    description:
      "경상권 출장마사지 안내 — 부산·대구·울산·김해·포항·구미 등 키워드. 경남·경북 일대는 상담으로 가능 여부를 확인하세요.",
    lead: "경상권(부산·대구·울산 및 경남·경북) 방문형 힐링 키워드 안내입니다.",
    scope: "경상권",
    districts: gyeongsang,
  },
  {
    file: "region-jeolla.html",
    regionKey: "jeolla",
    h1: "전라출장마사지",
    title: "전라출장마사지 | 서울출장마사지 - 20대,30대 힐링출장 서비스",
    description:
      "전라권 출장마사지 안내 — 광주·전주·순천·여수·목포 등 키워드. 전북·전남 일대 정보는 등록 업체 상담을 참고하세요.",
    lead: "전라권(광주·전북·전남) 방문형 힐링 키워드 안내입니다.",
    scope: "전라권",
    districts: jeolla,
  },
  {
    file: "region-gangwon.html",
    regionKey: "gangwon",
    h1: "강원출장마사지",
    title: "강원출장마사지 | 서울출장마사지 - 20대,30대 힐링출장 서비스",
    description:
      "강원 출장마사지 안내 — 춘천·강릉·속초·원주 등 시·군별 키워드. 실제 방문 가능 지역은 업체 운영에 따라 다릅니다.",
    lead: "강원특별자치도 일대 방문형 힐링 키워드 안내입니다.",
    scope: "강원",
    districts: gangwon,
  },
  {
    file: "region-jeju.html",
    regionKey: "jeju",
    h1: "제주출장마사지",
    title: "제주출장마사지 | 서울출장마사지 - 20대,30대 힐링출장 서비스",
    description:
      "제주 출장마사지 안내 — 제주·서귀포 등 키워드. 섬 지역 일정·이동은 업체 상담으로 확인하세요.",
    lead: "제주특별자치도 일대 방문형 힐링 키워드 안내입니다.",
    scope: "제주",
    districts: jeju,
  },
];

function removeOldDistrictPages() {
  for (const name of fs.readdirSync(ROOT)) {
    if (name.startsWith("dist-") && name.endsWith(".html")) {
      fs.unlinkSync(path.join(ROOT, name));
    }
  }
}

const outDir = path.join(ROOT, "snippets");
fs.mkdirSync(outDir, { recursive: true });

removeOldDistrictPages();
const writtenDist = [];
for (const { regionKey, districts, scopeLabel } of DISTRICT_GROUPS) {
  for (const d of districts) {
    const fname = distFilename(regionKey, d);
    fs.writeFileSync(
      path.join(ROOT, fname),
      districtPageHtml(regionKey, d, scopeLabel),
      "utf8"
    );
    writtenDist.push(fname);
  }
}
writtenDist.sort();
fs.mkdirSync(path.join(ROOT, "data"), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, "data", "district-static-pages.json"),
  `${JSON.stringify(writtenDist, null, 2)}\n`,
  "utf8"
);
console.log(`District static pages: ${writtenDist.length}`);

fs.writeFileSync(path.join(outDir, "region-nav.generated.html"), ul + "\n", "utf8");
fs.writeFileSync(
  path.join(outDir, "region-seoul-index.generated.html"),
  "<!-- index.html 서울 구역 키워드 그리드 비사용 (gen-region-nav-snippet.mjs) -->\n",
  "utf8"
);

const START_NAV = "<!-- REGION_NAV_AUTO_START -->";
const END_NAV = "<!-- REGION_NAV_AUTO_END -->";
const START_SEOUL = "<!-- REGION_SEOUL_KW_AUTO_START -->";
const END_SEOUL = "<!-- REGION_SEOUL_KW_AUTO_END -->";

function spliceIndexHtml() {
  const p = path.join(ROOT, "index.html");
  if (!fs.existsSync(p)) return;
  let h = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
  if (h.includes(START_NAV) && h.includes(END_NAV)) {
    const a = h.indexOf(START_NAV) + START_NAV.length;
    const b = h.indexOf(END_NAV);
    if (a < b) h = `${h.slice(0, a)}\n${ul}\n${h.slice(b)}`;
  }
  if (h.includes(START_SEOUL) && h.includes(END_SEOUL)) {
    const a = h.indexOf(START_SEOUL);
    const b = h.indexOf(END_SEOUL) + END_SEOUL.length;
    if (a < b) h = `${h.slice(0, a)}${h.slice(b)}`;
  }
  fs.writeFileSync(p, h, "utf8");
}

function spliceNavInFile(rel, postProcess) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return;
  let h = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
  if (!h.includes(START_NAV) || !h.includes(END_NAV)) return;
  const a = h.indexOf(START_NAV) + START_NAV.length;
  const b = h.indexOf(END_NAV);
  if (a >= b) return;
  h = `${h.slice(0, a)}\n${ul}\n${h.slice(b)}`;
  if (postProcess) h = postProcess(h);
  fs.writeFileSync(p, h, "utf8");
}

for (const spec of REGION_LANDING_SPECS) {
  fs.writeFileSync(path.join(ROOT, spec.file), regionPageHtml(spec), "utf8");
  console.log(`Wrote ${spec.file}`);
}
spliceIndexHtml();
spliceNavInFile("shops.html", (h) =>
  h.replace(
    '<li><a href="shops.html">업체</a></li>',
    '<li><a href="shops.html" aria-current="page">업체</a></li>'
  )
);
spliceNavInFile("shop-detail.html");
spliceNavInFile("blog-article.html");
console.log("Wrote snippets/region-nav.generated.html");
console.log("Wrote snippets/region-seoul-index.generated.html (placeholder)");
