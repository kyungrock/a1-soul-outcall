/**
 * content/drafts/*.md 스캔 → data/blog-draft-manifest.js / .json
 * 실행: npm run blog:manifest
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DRAFTS = path.join(ROOT, "content", "drafts");
const OUT_JS = path.join(ROOT, "data", "blog-draft-manifest.js");
const OUT_JSON = path.join(ROOT, "data", "blog-draft-manifest.json");

function parseFrontmatter(raw) {
  const text = String(raw || "").replace(/^\uFEFF/, "");
  if (!/^---\r?\n/.test(text)) return { meta: {}, body: text.trim() };
  const end = text.indexOf("\n---", 4);
  if (end === -1) return { meta: {}, body: text.trim() };
  const fmRaw = text.slice(4, end);
  const body = text.slice(end + "\n---".length).replace(/^\r?\n/, "");
  const meta = {};
  for (const line of fmRaw.split(/\r?\n/)) {
    const m = /^([a-zA-Z0-9_]+):\s*(.*)$/.exec(line.trim());
    if (!m) continue;
    let v = m[2].trim();
    if (/^"(.*)"$/.test(v)) v = v.slice(1, -1);
    meta[m[1]] = v;
  }
  return { meta, body: body.trim() };
}

function firstHeading(md) {
  const m = /^##\s+(.+)$/m.exec(md);
  return m ? m[1].trim() : "";
}

function excerptFromBody(body, max = 148) {
  let chunk = body.split(/\n---\s*\n/)[0] || body;
  let t = chunk
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^#{1,6}\s+.*/gm, " ")
    .replace(/\*\*?|\*|_/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const dot = t.indexOf(". ");
  if (dot >= 60 && dot < max + 80) return t.slice(0, dot + 1);
  if (t.length <= max) return t;
  return t.slice(0, max - 1) + "…";
}

function safeSlug(fname) {
  const base = path.basename(fname, ".md");
  if (/^[\w.-]+$/.test(base)) return base;
  return null;
}

function main() {
  if (!fs.existsSync(DRAFTS)) {
    fs.mkdirSync(DRAFTS, { recursive: true });
  }
  const files = fs
    .readdirSync(DRAFTS)
    .filter((f) => f.endsWith(".md") && f !== "README.md");
  const items = [];

  for (const f of files.sort()) {
    const slug = safeSlug(f);
    if (!slug) continue;
    const raw = fs.readFileSync(path.join(DRAFTS, f), "utf8");
    const { meta, body } = parseFrontmatter(raw);
    let title =
      meta.custom_title ||
      meta.source_title ||
      firstHeading(body) ||
      slug.replace(/-daily-draft$/, "").replace(/-/g, ".");
    if (typeof title !== "string" || !title.trim()) title = slug;
    const date =
      meta.date ||
      (/^(\d{4}-\d{2}-\d{2})-/.exec(slug) || [])[1] ||
      "";
    const series = (meta.series || "").trim();
    const region_path = (meta.region_path || "").trim();
    const cover_image = (meta.cover_image || "").trim();

    items.push({
      slug,
      title: title.trim(),
      date,
      excerpt: excerptFromBody(body),
      series: series || undefined,
      region_path: region_path || undefined,
      cover_image: cover_image || undefined,
      /** file:// 포함 어디서든 본문 표시 가능하도록 초안 원문 전체(UTF-8) */
      mdSource: raw,
    });
  }

  items.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  fs.mkdirSync(path.dirname(OUT_JS), { recursive: true });
  fs.writeFileSync(
    OUT_JSON,
    JSON.stringify(
      items,
      function (k, v) {
        return k === "mdSource" ? undefined : v;
      },
      2
    ),
    "utf8"
  );

  const body = `window.blogDraftManifest = ${JSON.stringify(items, null, 2)};\n`;
  fs.writeFileSync(
    OUT_JS,
    `/**\n * npm run blog:manifest 로 생성됩니다.\n */\n${body}`,
    "utf8"
  );

  console.log(`[blog:manifest] ${items.length}개 초안 → data/blog-draft-manifest.js`);
}

main();
