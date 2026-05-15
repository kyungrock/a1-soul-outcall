/**
 * 매니페스트·JS 없이「Blog / 오늘의 글·초안」섹션 껍데기만 삽입합니다.
 * id="blog-posts" 가 없는 루트 .html 의 </main> 직전에 넣습니다.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SECTION = `    <section id="blog-posts" class="section alt" aria-labelledby="blog-heading">
      <div class="inner">
        <span class="section-kicker">Blog</span>
        <h2 id="blog-heading">오늘의 글·초안</h2>
        <p class="section-lead muted">이 영역은 이 HTML 파일에서만 직접 편집합니다.</p>
        <!-- 카드·문단·링크 등을 여기에 넣으세요 -->
      </div>
    </section>`;

const MAIN_FOOTER_RE = /\n( {2}<\/main>)(\r?\n(?:\r?\n)?)( {2}<footer)/i;

function shouldProcess(name) {
  if (!name.endsWith(".html")) return false;
  if (name === "index.html") return false;
  if (name.startsWith("google") && name.endsWith(".html")) return false;
  if (name === "blog-article.html" || name === "shop-detail.html") return false;
  return true;
}

let inserted = 0;
for (const ent of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (!ent.isFile()) continue;
  const name = ent.name;
  if (!shouldProcess(name)) continue;
  const fp = path.join(ROOT, name);
  let html = fs.readFileSync(fp, "utf8");
  if (html.includes('id="blog-posts"')) continue;
  if (!MAIN_FOOTER_RE.test(html)) {
    console.warn("inject-blog-stub: skip (no </main>→<footer):", name);
    continue;
  }
  const next = html.replace(MAIN_FOOTER_RE, (_m, mainClose, mid, foot) => {
    return "\n" + SECTION + "\n" + mainClose + mid + foot;
  });
  if (next !== html) {
    fs.writeFileSync(fp, next, "utf8");
    inserted++;
  }
}

console.log("inject-blog-posts-section-stub: inserted:", inserted);
