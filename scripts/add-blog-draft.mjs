/**
 * content/drafts/*.md 초안 추가 + (선택) 표지 이미지 복사 후 매니페스트 갱신
 *
 * 예:
 *   node scripts/add-blog-draft.mjs --slug 2026-05-15-gangnam-walk --date 2026-05-15 ^
 *     --title "강남 퇴근길 산책" --series "서울 > 강남" --cover ./my-photo.jpg --file ./body.md
 *
 * 본문이 짧을 때는 --text "마크다운..." 로 직접 넣을 수 있습니다.
 * 끝에 자동으로 npm run blog:manifest 를 실행합니다.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DRAFTS = path.join(ROOT, "content", "drafts");
const IMG_BLOG = path.join(ROOT, "images", "blog");

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return "";
  return process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : "";
}

function main() {
  const slug = arg("slug");
  const date = arg("date");
  const title = arg("title");
  const series = arg("series");
  const regionPath = arg("region-path") || arg("region_path");
  let cover = arg("cover");
  const file = arg("file");
  const text = arg("text");

  if (!slug || !/^[\w.-]+$/.test(slug)) {
    console.error("필수: --slug 영문-숫자-하이픈-점 (예: 2026-05-15-gangnam-walk)");
    process.exit(1);
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error("필수: --date YYYY-MM-DD");
    process.exit(1);
  }
  if (!title) {
    console.error("필수: --title \"글 제목\"");
    process.exit(1);
  }

  let bodyMd = "";
  if (file) {
    const fp = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
    if (!fs.existsSync(fp)) {
      console.error("본문 파일 없음:", fp);
      process.exit(1);
    }
    bodyMd = fs.readFileSync(fp, "utf8").trim();
  } else if (text) {
    bodyMd = text.replace(/\\n/g, "\n");
  } else {
    bodyMd = "## 개요\n\n내용을 이어서 작성하세요.\n";
  }

  let coverRel = "";
  if (cover) {
    const src = path.isAbsolute(cover) ? cover : path.join(process.cwd(), cover);
    if (!fs.existsSync(src)) {
      console.error("표지 이미지 없음:", src);
      process.exit(1);
    }
    fs.mkdirSync(IMG_BLOG, { recursive: true });
    const ext = path.extname(src) || ".jpg";
    const destName = `${slug}-cover${ext}`;
    const dest = path.join(IMG_BLOG, destName);
    fs.copyFileSync(src, dest);
    coverRel = `images/blog/${destName}`;
    console.log("표지 복사:", dest);
  }

  const fm = [
    "---",
    `date: ${date}`,
    `custom_title: "${title.replace(/"/g, '\\"')}"`,
    series ? `series: "${series.replace(/"/g, '\\"')}"` : "",
    regionPath ? `region_path: "${regionPath.replace(/"/g, '\\"')}"` : "",
    coverRel ? `cover_image: "${coverRel}"` : "",
    "---",
    "",
    bodyMd,
    "",
  ]
    .filter(Boolean)
    .join("\n");

  fs.mkdirSync(DRAFTS, { recursive: true });
  const out = path.join(DRAFTS, `${slug}.md`);
  if (fs.existsSync(out)) {
    console.error("이미 존재:", out);
    process.exit(1);
  }
  fs.writeFileSync(out, fm, "utf8");
  console.log("작성:", out);

  const r = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "blog:manifest"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

main();
