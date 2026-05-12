/**
 * 매일 블로그 초안 준비
 * - content/rss-sources.json 의 RSS에서 최근 글 하나를 고름(요일별로 순환)
 * - content/drafts/YYYY-MM-DD.md 로 저장 (원문은 짧게 인용만, 무단 전재 금지)
 * - 선택: OPENAI_API_KEY 가 있으면 서울·출장마사지(홈타이·힐링) 정보성 톤으로 재작성
 *
 * 실행: npm run content:draft
 * 옵션: --no-ai   AI 재작성 생략(로컬 서울·홈타이 초안만 기록)
 *       --force    오늘(한국 기준) 날짜 파일이 이미 있어도 덮어씀 (기본은 유지하고 건너뜀)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Parser from "rss-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SOURCES_JSON = path.join(ROOT, "content", "rss-sources.json");
const DRAFTS_DIR = path.join(ROOT, "content", "drafts");

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "SoulOutcallDailyDraft/1.0 (private site)" },
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

function todayKstParts() {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return { ymd: `${y}-${m}-${d}` };
}

function loadFeeds() {
  if (!fs.existsSync(SOURCES_JSON)) {
    console.error("없음:", SOURCES_JSON);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(SOURCES_JSON, "utf8"));
  const feeds = Array.isArray(raw.feeds) ? raw.feeds : [];
  const urls = feeds
    .map((x) => (typeof x === "string" ? { url: x, label: "" } : x))
    .filter((x) => x && x.url && String(x.url).startsWith("http"));
  return urls;
}

async function collectItems(feedEntries) {
  const items = [];
  for (const f of feedEntries) {
    try {
      const feed = await parser.parseURL(f.url);
      for (const it of feed.items || []) {
        if (!it.link || !it.title) continue;
        items.push({
          title: stripHtml(it.title),
          link: String(it.link).trim(),
          published: it.pubDate || it.isoDate || "",
          summary: truncate(stripHtml(it.contentSnippet || it.content || ""), 900),
          feedLabel: f.label || "",
          feedUrl: f.url,
        });
      }
    } catch (e) {
      console.warn("[RSS 건너뜀]", f.url, e.message || e);
    }
  }
  return items;
}

function pickDaily(items, seedYmd) {
  if (!items.length) return null;
  let h = 0;
  for (let i = 0; i < seedYmd.length; i++) h = (h * 31 + seedYmd.charCodeAt(i)) >>> 0;
  const idx = h % items.length;
  items.sort((a, b) => {
    const da = Date.parse(a.published) || 0;
    const db = Date.parse(b.published) || 0;
    return db - da;
  });
  return items[idx];
}

/**
 * AI 없을 때 발행용 초안만 생성 (표절 없이 소식 제목·요약을 ‘일상 피로·홈타이’ 관점으로만 연결).
 */
function buildLocalSeoulArticle(item) {
  const title = String(item.title || "").replace(/\s+/g, " ").trim();
  const sum = String(item.summary || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
  const p1 = [
    "서울에서 하루를 보내다 보면 출퇴근·좌식 업무가 겹치면서 목·어깨·허리가 뻐근한 날이 잦습니다.",
    "집이나 숙소처럼 익숙한 공간에서 시간만 맞추면 되는 홈타이·출장 케어는 이동 스트레스를 줄이는 데 도움이 될 수 있습니다.",
  ].join(" ");
  const p2 = sum
    ? `참고로 오늘 RSS에서 짚은 소식은 「${title}」입니다. 전문 내용을 그대로 옮기지는 않고, ‘몸의 부담을 줄이고 휴식을 어떻게 설계할지’라는 일상 관점만 이어서 씁니다. 발췌 요지: ${sum}${sum.length >= 220 ? "…" : ""}`
    : `오늘 RSS에서 가져온 소식 제목은 「${title}」입니다. 세부 내용은 인용하지 않고, 장시간 자세와 누적 피로를 가볍게 푸는 습관을 떠올리며 정리했습니다.`;
  const p3 = [
    "상담할 때는 당일 컨디션(특히 뻐근한 부위·원하는 압의 강도)을 짧게 전해 주면 코스 조율이 수월합니다.",
    "예약 가능 시간과 방문 가능 구간은 업체마다 다르므로 연락으로 한 번 확인해 두시는 것이 좋습니다.",
  ].join(" ");
  const p4 =
    "의료적 효과를 단정하지는 않으며, 실제 프로그램·요금은 각 업체 안내와 상담 내용을 기준으로 결정하면 됩니다.";
  return [p1, "", p2, "", p3, "", p4].join("\n");
}

async function rewriteWithOpenAI(item) {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return "";

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");

  const system = [
    "당신은 한국어 블로그용 카피라이터입니다.",
    "아래 제공된 제목·요약은 참고용일 뿐이며, 문장 표절·직접 인용 금지. 완전히 새 내용으로 다시 작성.",
    "테마는 서울 지역 사용자가 집이나 원하는 장소에서 받는 출장형 마사지(홈타이)·플로 케어·당일 회복 같은 힐링 정보에 맞춤.",
    "의료 진단·효능 보장 같은 단정 피함. 선정적·노출 묘사 없이 건전한 업종 소개 스타일.",
    "본문 길이 400자 이상 ~ 1200자 이하 선호. 줄바꿈으로 단락 구분.",
  ].join("\n");

  const user = [
    `출처 제목: ${item.title}`,
    `요약 참고:\n${item.summary}`,
    `출처 URL(출처 줄에 명시 용도): ${item.link}`,
    "",
    "위를 바탕으로 오늘 날짜에 올릴 블로그 초안 하나를 작성해 주세요.",
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
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI HTTP ${res.status}: ${errText.slice(0, 400)}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || "";
}

const noAi =
  process.argv.includes("--no-ai") || process.env.CONTENT_DRAFT_NO_AI === "1";

async function main() {
  const { ymd } = todayKstParts();
  const outPath = path.join(DRAFTS_DIR, `${ymd}-daily-draft.md`);
  const force = process.argv.includes("--force");

  /** 기존 초안 유지: 같은 날 파일이 있으면 기본값으로 덮어쓰지 않음 · 이전 날짜 .md는 그대로 둠 */
  if (!force && fs.existsSync(outPath)) {
    console.log("당일 초안이 이미 있어 유지합니다. 덮어쓰려면 --force:", outPath);
    process.exit(0);
  }

  fs.mkdirSync(DRAFTS_DIR, { recursive: true });

  const feedEntries = loadFeeds();
  if (!feedEntries.length) {
    console.error(
      "RSS가 비어 있습니다. content/rss-sources.json 의 feeds 에 공개 RSS 주소를 넣어 주세요."
    );
    process.exit(1);
  }

  const all = await collectItems(feedEntries);
  const item = pickDaily(all, ymd);
  if (!item) {
    console.error("가져온 글이 없습니다. RSS 주소 또는 네트워크를 확인하세요.");
    process.exit(1);
  }

  let adaptedSection = buildLocalSeoulArticle(item);

  if (!noAi) {
    try {
      const rewritten = await rewriteWithOpenAI(item);
      if (rewritten) adaptedSection = rewritten;
    } catch (e) {
      console.warn("[draft] AI 재작성 생략, 로컬 초안만 사용:", e.message || e);
    }
  }

  const meta = [
    "---",
    `date: "${ymd}"`,
    `status: draft`,
    `source_title: ${JSON.stringify(item.title)}`,
    `source_link: ${JSON.stringify(item.link)}`,
    "---",
    "",
    "## 블로그 초안 (서울·출장 톤)",
    "",
    adaptedSection,
    "",
    "## 참고 소식 출처",
    `- 피드: ${item.feedLabel || item.feedUrl || "RSS"}`,
    `- 기사·글 링크: ${item.link}`,
    `- 본문은 원문을 복사하지 않고, 서울·홈타이·일상 피로 관점으로 새로 쓴 초안입니다.`,
    "",
  ];

  const body = meta.join("\n");

  fs.writeFileSync(outPath, body, "utf8");
  console.log("작성 완료:", outPath);
  console.log("참조 소식:", item.title);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
