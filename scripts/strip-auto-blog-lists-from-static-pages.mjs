/**
 * 자동 연동 제거: data/blog-draft-manifest.js + js/blog-list-on-index.js 로 채우던
 * 「오늘의 글·초안」블록을 정적 HTML에서 뺍니다. (페이지마다 수동 마크업 전제)
 * blog-article.html 은 매니페스트가 본문용이므로 건드리지 않습니다.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

/** `</main>` 바로 앞에 붙었던 자동 섹션 */
const SECTION_BEFORE_MAIN_RE =
  /\n    <section id="blog-posts" class="section alt" aria-labelledby="blog-heading">[\s\S]*?\n    <\/section>(?=\n  <\/main>)/;

const MANIFEST_LINE_RE = /\n  <script src="data\/blog-draft-manifest\.js"><\/script>/g;
const LIST_SCRIPT_LINE_RE = /\n  <script src="js\/blog-list-on-index\.js" defer><\/script>/g;

const INDEX_SECTION_OLD = `    <section id="blog-posts" class="section alt" aria-labelledby="blog-heading">
      <div class="inner">
        <span class="section-kicker">Blog</span>
        <h2 id="blog-heading">오늘의 글·초안</h2>
        <p class="section-lead blog-draft-help">
          한 페이지에 10개까지 보입니다. 글이 많아지면 이 페이지 주소에 <code>?draftPage=2#blog-posts</code> 를 붙이거나 아래 페이지 번호를 눌러 주세요. 새 글은
          <code>npm run blog:add-draft</code> 로 마크다운과 표지 이미지를 등록한 뒤 목록에 반영됩니다.
        </p>
        <div id="blog-draft-list"></div>
      </div>
    </section>`;

const INDEX_SECTION_NEW = `    <section id="blog-posts" class="section alt" aria-labelledby="blog-heading">
      <div class="inner">
        <span class="section-kicker">Blog</span>
        <h2 id="blog-heading">오늘의 글·초안</h2>
        <p class="section-lead muted">이 영역은 이 HTML 파일에서만 직접 편집합니다.</p>
        <!-- 카드·문단·링크 등을 여기에 넣으세요 -->
      </div>
    </section>`;

function shouldProcess(name) {
  if (!name.endsWith(".html")) return false;
  if (name.startsWith("google") && name.endsWith(".html")) return false;
  if (name === "blog-article.html") return false;
  return true;
}

function stripHtml(html, isIndex) {
  let out = html;
  if (isIndex) {
    if (out.includes(INDEX_SECTION_OLD)) {
      out = out.replace(INDEX_SECTION_OLD, INDEX_SECTION_NEW);
    }
  } else {
    out = out.replace(SECTION_BEFORE_MAIN_RE, "");
  }
  out = out.replace(LIST_SCRIPT_LINE_RE, "");
  out = out.replace(MANIFEST_LINE_RE, "");
  return out;
}

let changed = 0;
for (const ent of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (!ent.isFile()) continue;
  const name = ent.name;
  if (!shouldProcess(name)) continue;
  const fp = path.join(ROOT, name);
  const before = fs.readFileSync(fp, "utf8");
  const after = stripHtml(before, name === "index.html");
  if (after !== before) {
    fs.writeFileSync(fp, after, "utf8");
    changed++;
  }
}

console.log("strip-auto-blog-lists: updated files:", changed);
