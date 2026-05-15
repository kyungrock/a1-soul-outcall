/**
 * 서울 홈(index.html) + 서울 구 하부(dist-seoul-*.html)의「오늘의 글·초안」블록을
 * RSS 소식 기반으로 자동 채웁니다. (원문 복사 없이 요약·연결 문장)
 *
 * 매크로(예시):
 *   npm run content:seoul-blog
 *   npm run content:seoul-blog:ai     # OPENAI_API_KEY 있을 때 재작성
 *   npm run content:seoul-blog:dry    # 콘솔만
 *
 * RSS: content/rss-sources.json
 * 옵션: --dry-run  --openai  --force
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Parser from "rss-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SOURCES_JSON = path.join(ROOT, "content", "rss-sources.json");
const MARK_START = "<!-- AUTO_SEOUL_BLOG_START -->";
const MARK_END = "<!-- AUTO_SEOUL_BLOG_END -->";

const STUB_RE =
  /<p class="section-lead muted">이 영역은 이 HTML 파일에서만 직접 편집합니다\.<\/p>\s*<!--\s*카드·문단·링크 등을 여기에 넣으세요\s*-->/;

/** dist-seoul-강남.html → promo-seoul-gangnam-1.svg */
const KO_TO_PROMO_ROMAN = {
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

const parser = new Parser({
  timeout: 20000,
  headers: { "User-Agent": "SoulOutcallSeoulBlog/1.0 (private site)" },
});

function stripHtml(s) {
  if (!s) return "";
  return String(s)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(s, n) {
  const t = String(s || "").trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function todayKstYmd() {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

function loadFeeds() {
  const raw = JSON.parse(fs.readFileSync(SOURCES_JSON, "utf8"));
  const feeds = Array.isArray(raw.feeds) ? raw.feeds : [];
  return feeds
    .map((x) => (typeof x === "string" ? { url: x, label: "" } : x))
    .filter((x) => x && x.url && String(x.url).startsWith("http"));
}

async function collectItems(feedEntries) {
  const items = [];
  for (const f of feedEntries) {
    try {
      const res = await fetch(f.url, {
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
          "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) {
        console.warn("[RSS HTTP]", f.url, res.status);
        continue;
      }
      const xml = await res.text();
      const feed = await parser.parseString(xml);
      for (const it of feed.items || []) {
        if (!it.link || !it.title) continue;
        const enc = it.enclosure;
        let imageUrl = "";
        if (enc && enc.url && /^image\//i.test(String(enc.type || ""))) imageUrl = String(enc.url).trim();
        if (!imageUrl && it["media:content"]?.$?.url) imageUrl = String(it["media:content"].$.url).trim();
        if (!imageUrl && it["media:thumbnail"]?.$?.url) imageUrl = String(it["media:thumbnail"].$.url).trim();
        items.push({
          title: stripHtml(it.title),
          link: String(it.link).trim(),
          published: it.pubDate || it.isoDate || "",
          summary: truncate(stripHtml(it.contentSnippet || it.content || ""), 800),
          feedLabel: f.label || "",
          feedUrl: f.url,
          imageUrl,
        });
      }
    } catch (e) {
      console.warn("[RSS]", f.url, e.message || e);
    }
  }
  return items;
}

function scoreItem(item, districtKo) {
  if (!districtKo) return 0;
  const blob = `${item.title} ${item.summary}`.toLowerCase();
  const d = districtKo.toLowerCase();
  if (blob.includes(d)) return 25;
  const roman = KO_TO_PROMO_ROMAN[districtKo];
  if (roman && blob.includes(roman)) return 8;
  return 0;
}

function pickItemForPage(items, pageKey, districtKo, ymd) {
  const sorted = [...items].sort((a, b) => {
    const da = Date.parse(a.published) || 0;
    const db = Date.parse(b.published) || 0;
    return db - da;
  });
  const pool = sorted.slice(0, Math.min(sorted.length, 40));
  const scored = pool.map((it) => ({
    it,
    s: scoreItem(it, districtKo) + (hashString(pageKey + ymd + it.link) % 3) * 0.1,
  }));
  scored.sort((a, b) => b.s - a.s);
  if (districtKo && scored[0].s >= 25) return scored[0].it;
  const idx = hashString(pageKey + ymd) % pool.length;
  return pool[idx];
}

function heroImageForPage(districtKo) {
  const roman = districtKo ? KO_TO_PROMO_ROMAN[districtKo] : "";
  if (roman) {
    const rel = `images/promo-seoul-${roman}-1.svg`;
    if (fs.existsSync(path.join(ROOT, rel))) return rel;
  }
  return "images/og-default.png";
}

function rssImageOrHero(item, districtKo) {
  if (item.imageUrl && /^https?:\/\//i.test(item.imageUrl)) return item.imageUrl;
  return heroImageForPage(districtKo);
}

function listSeoulHtmlTargets() {
  const dist = fs
    .readdirSync(ROOT)
    .filter((n) => /^dist-seoul-.+\.html$/i.test(n))
    .sort((a, b) => a.localeCompare(b, "ko"));
  return ["index.html", ...dist];
}

function districtFromFilename(name) {
  if (name === "index.html") return null;
  const m = name.match(/^dist-seoul-(.+)\.html$/i);
  return m ? m[1] : null;
}

function neighborDistrictFiles(allFiles, currentFile) {
  const onlyDist = allFiles.filter((f) => f !== "index.html");
  const i = onlyDist.indexOf(currentFile);
  if (i < 0) {
    return [onlyDist[0], onlyDist[1] || onlyDist[0]].filter(Boolean);
  }
  const prev = onlyDist[(i - 1 + onlyDist.length) % onlyDist.length];
  const next = onlyDist[(i + 1) % onlyDist.length];
  return [prev, next];
}

function indexNeighborFiles(allFiles) {
  const onlyDist = allFiles.filter((f) => f !== "index.html");
  return [onlyDist[0], onlyDist[Math.min(1, onlyDist.length - 1)]];
}

function buildLocalBody(districtKo, item) {
  const place = districtKo ? `서울 ${districtKo}` : "서울";
  const title = String(item.title || "").replace(/\s+/g, " ").trim();
  const sum = String(item.summary || "").replace(/\s+/g, " ").trim().slice(0, 200);
  const p1 = `${place} 일대에서 이동·업무·좌식이 겹치면 목·어깨·허리가 먼저 신호를 보내는 날이 잦습니다. 집이나 숙소처럼 익숙한 공간에서 시간만 맞추면 되는 출장형 케어는 이동 스트레스를 줄이는 선택지가 될 수 있습니다.`;
  const p2 = sum
    ? `오늘 RSS에서 참고한 건강·라이프 소식은 「${title}」입니다. 원문을 그대로 옮기지 않고, 일상 피로·휴식 설계 관점만 이어서 정리합니다. 요지: ${sum}${sum.length >= 200 ? "…" : ""}`
    : `참고 소식 제목은 「${title}」입니다. 세부 본문은 인용하지 않고, 장시간 자세와 누적 피로를 가볍게 점검하는 관점으로만 씁니다.`;
  const p3 =
    "상담할 때는 당일 뻐근한 부위·원하는 압의 강도·방문 가능한 대략 구역만 짧게 전해 주면 코스 조율이 수월합니다. 예약 가능 시간과 방문 가능 구간은 업체마다 다릅니다.";
  const p4 = "의료적 효과를 단정하지 않으며, 실제 프로그램·요금은 등록 업체 안내와 상담을 기준으로 확인해 주세요.";
  return [p1, p2, p3, p4];
}

async function rewriteWithOpenAI(item, districtKo) {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return "";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const place = districtKo ? `서울 ${districtKo} 출장마사지` : "서울 출장마사지·홈타이";
  const system = [
    "당신은 한국어 웹페이지용 카피라이터입니다.",
    "제공된 RSS 제목·요약은 참고용일 뿐입니다. 문장 표절·직접 인용 금지. 완전히 새 문장으로 작성.",
    `페이지 키워드: ${place}, 힐링·바디케어 정보성 톤.`,
    "의료 진단·효능 보장 같은 단정 피함. 선정적 표현 없음.",
    "400자 이상 900자 이하. 빈 줄로 단락 구분(2~4단락).",
  ].join("\n");
  const user = [
    `RSS 제목: ${item.title}`,
    `RSS 요약(참고): ${item.summary}`,
    `원문 링크(출처 표기용, 본문에 URL 나열 금지): ${item.link}`,
    "",
    "위를 바탕으로 해당 지역 방문자에게 도움이 되는 짧은 칼럼을 작성해 주세요.",
  ].join("\n");
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.65,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI HTTP ${res.status}: ${errText.slice(0, 400)}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || "";
}

function paragraphsFromText(text) {
  const t = String(text || "").trim();
  if (!t) return [];
  return t
    .split(/\n\s*\n+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function buildInnerArticleHtml({
  districtKo,
  pageFile,
  item,
  bodyParagraphs,
  imgSrc,
  neighborFiles,
}) {
  const placeLabel = districtKo ? `서울 ${districtKo}` : "서울";
  const title = escapeHtml(`${placeLabel} · 오늘의 참고 소식`);
  const meta = escapeHtml(
    `${todayKstYmd()} · RSS 참고 · ${item.feedLabel || "건강·라이프"}`
  );
  const paras = bodyParagraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n            ");
  const extImg = /^https?:\/\//i.test(imgSrc);
  const imgEsc = escapeHtml(imgSrc);
  const alt = escapeHtml(`${placeLabel} 안내 이미지`);
  const sourceLine = `참고 출처: <a class="seoul-auto-blog-ext" href="${escapeHtml(item.link)}" rel="nofollow noopener noreferrer" target="_blank">원문 기사 보기</a> · 제목·본문은 참고하여 새로 정리했습니다.`;

  const home = "index.html#blog-posts";
  const shops = "shops.html";
  const self = `${pageFile}#blog-posts`;
  const n1 = neighborFiles[0] || "index.html";
  const n2 = neighborFiles[1] || "shops.html";

  return `${MARK_START}
        <article class="seoul-auto-blog-card" data-auto-blog="1">
          <div class="seoul-auto-blog-media">
            <img src="${imgEsc}" alt="${alt}" width="640" height="360" loading="lazy"${extImg ? ' referrerpolicy="no-referrer"' : ""} />
          </div>
          <div class="seoul-auto-blog-body">
            <h3 class="seoul-auto-blog-title">${title}</h3>
            <p class="seoul-auto-blog-meta muted">${meta}</p>
            <div class="seoul-auto-blog-text">
            ${paras}
            </div>
            <p class="fineprint seoul-auto-blog-source">${sourceLine}</p>
            <nav class="seoul-auto-blog-nav" aria-label="사이트 링크">
              <a class="btn ghost" href="${escapeHtml(home)}">홈 · 글·초안</a>
              <a class="btn ghost" href="${escapeHtml(shops)}">등록 업체</a>
              <a class="btn ghost" href="${escapeHtml(self)}">이 페이지 상단</a>
              <a class="btn ghost" href="${escapeHtml(n1)}">인근: ${escapeHtml(districtFromFilename(n1) || n1)}</a>
              <a class="btn ghost" href="${escapeHtml(n2)}">인근: ${escapeHtml(districtFromFilename(n2) || n2)}</a>
            </nav>
          </div>
        </article>
        ${MARK_END}`;
}

function injectIntoBlogSection(html, innerArticle) {
  const escS = MARK_START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escE = MARK_END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = new RegExp(`${escS}[\\s\\S]*?${escE}`);
  if (html.includes(MARK_START) && html.includes(MARK_END)) {
    return html.replace(block, innerArticle.trimEnd());
  }
  if (STUB_RE.test(html)) {
    return html.replace(STUB_RE, innerArticle.trimEnd());
  }
  return null;
}

async function main() {
  const dry = process.argv.includes("--dry-run");
  const useOpenAi = process.argv.includes("--openai");
  const force = process.argv.includes("--force");

  if (!fs.existsSync(SOURCES_JSON)) {
    console.error("없음:", SOURCES_JSON);
    process.exit(1);
  }
  const feeds = loadFeeds();
  if (!feeds.length) {
    console.error("content/rss-sources.json 의 feeds 가 비어 있습니다.");
    process.exit(1);
  }

  const ymd = todayKstYmd();
  console.log("[fill-seoul-blog] KST date:", ymd, dry ? "(dry-run)" : "");

  const items = await collectItems(feeds);
  if (!items.length) {
    console.error("RSS에서 항목을 가져오지 못했습니다.");
    process.exit(1);
  }

  const targets = listSeoulHtmlTargets();
  let ok = 0;
  for (const name of targets) {
    const fp = path.join(ROOT, name);
    if (!fs.existsSync(fp)) {
      console.warn("skip missing:", name);
      continue;
    }
    let html = fs.readFileSync(fp, "utf8");
    if (!html.includes('id="blog-posts"')) {
      console.warn("skip no #blog-posts:", name);
      continue;
    }
    if (!force && html.includes(MARK_START)) {
      console.log("skip (이미 자동 블록 있음, 덮어쓰려면 --force):", name);
      continue;
    }

    const districtKo = districtFromFilename(name);
    const item = pickItemForPage(items, name, districtKo, ymd);
    const imgSrc = rssImageOrHero(item, districtKo);
    let bodyParas = buildLocalBody(districtKo, item);
    if (useOpenAi) {
      try {
        const ai = await rewriteWithOpenAI(item, districtKo);
        const split = paragraphsFromText(ai);
        if (split.length) bodyParas = split;
      } catch (e) {
        console.warn("[openai]", name, e.message || e);
      }
      await new Promise((r) => setTimeout(r, 400));
    }

    const neighbors =
      name === "index.html" ? indexNeighborFiles(targets) : neighborDistrictFiles(targets, name);

    const inner = buildInnerArticleHtml({
      districtKo,
      pageFile: name,
      item,
      bodyParagraphs: bodyParas,
      imgSrc,
      neighborFiles: neighbors,
    });

    const next = injectIntoBlogSection(html, inner);
    if (!next) {
      console.warn("inject 실패(스텁/마커 없음):", name);
      continue;
    }
    if (dry) {
      console.log("[dry]", name, "←", truncate(item.title, 60));
      ok++;
      continue;
    }
    fs.writeFileSync(fp, next, "utf8");
    console.log("updated:", name, "←", truncate(item.title, 50));
    ok++;
  }
  console.log("[fill-seoul-blog] 완료:", ok, "/", targets.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
