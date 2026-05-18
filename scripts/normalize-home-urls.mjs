/**
 * 홈 링크·앵커에서 index.html 제거 (GitHub Pages는 / 로 index 자동 제공)
 * 실행: node scripts/normalize-home-urls.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function collectHtmlFiles(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === "scripts") continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) collectHtmlFiles(p, acc);
    else if (ent.name.endsWith(".html")) acc.push(p);
  }
  return acc;
}

function normalizeHtml(content, filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  const isRootIndex = rel === "index.html";
  let h = content.replace(/\r\n/g, "\n");
  h = h.replace(/href="\.\.\/index\.html"/g, 'href="../"');
  h = h.replace(/href="index\.html"/g, 'href="./"');
  if (isRootIndex) {
    h = h.replace(/index\.html#/g, "#");
  }
  return h;
}

let changed = 0;
for (const fp of collectHtmlFiles(ROOT)) {
  const before = fs.readFileSync(fp, "utf8");
  const after = normalizeHtml(before, fp);
  if (after !== before) {
    fs.writeFileSync(fp, after, "utf8");
    changed++;
  }
}
console.log(`[normalize-home-urls] ${changed} HTML files updated`);
