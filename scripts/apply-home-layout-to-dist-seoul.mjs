/**
 * dist-seoul-*.html 메인 영역을 index.html 과 같이
 * main#home-layout > .hero + .home-shops-blog-wrap(동기화 블록) 형태로 맞춥니다.
 * (모바일에서 등록 업체가 히어로 위로 오는 flex order 동일 적용)
 */
import fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const SYNC_START = "<!-- SYNC_HOME_REGISTERED_SHOPS_FROM_INDEX_START -->";

function alreadyHomeLayout(html) {
  if (!html.includes('<main id="main" class="home-layout">')) return false;
  const hero = html.indexOf('<section class="hero"');
  const sync = html.indexOf(SYNC_START);
  return hero !== -1 && sync !== -1 && hero < sync;
}

function applyShopsMain(html) {
  let out = html;
  out = out.replace(
    '  <main id="main" class="shops-main">\n    <div class="inner">',
    '  <main id="main" class="home-layout">\n    <section class="hero" aria-labelledby="district-page-h1">\n    <div class="inner">'
  );
  out = out.replace("<h1 class=\"shops-page-title\">", '<h1 id="district-page-h1" class="shops-page-title">');
  out = out.replace(
    "    </div>\n<!-- SYNC_HOME_REGISTERED_SHOPS_FROM_INDEX_START -->",
    "    </div>\n    </section>\n\n<!-- SYNC_HOME_REGISTERED_SHOPS_FROM_INDEX_START -->"
  );
  return out;
}

function applyDistrictStatic(html) {
  let out = html.replace(
    '  <main id="main" class="region-landing-main district-static-main">\n    <section class="section" aria-labelledby="district-static-h1">\n      <div class="inner">',
    '  <main id="main" class="home-layout">\n    <section class="hero" aria-labelledby="district-static-h1">\n      <div class="inner">'
  );
  out = out.replace(
    "      </div>\n\n<!-- SYNC_HOME_REGISTERED_SHOPS_FROM_INDEX_START -->",
    "      </div>\n    </section>\n\n<!-- SYNC_HOME_REGISTERED_SHOPS_FROM_INDEX_START -->"
  );
  out = out.replace(
    "<!-- SYNC_HOME_REGISTERED_SHOPS_FROM_INDEX_END -->\n    </section>\n  </main>",
    "<!-- SYNC_HOME_REGISTERED_SHOPS_FROM_INDEX_END -->\n  </main>"
  );
  return out;
}

function processFile(filePath) {
  let html = fs.readFileSync(filePath, "utf8");
  if (alreadyHomeLayout(html)) return "skip";

  const hadShopsMain = html.includes('class="shops-main">');
  const hadDistrict = html.includes("district-static-main");

  if (hadShopsMain && !hadDistrict) {
    html = applyShopsMain(html);
  } else if (hadDistrict) {
    html = applyDistrictStatic(html);
  } else {
    throw new Error("shops-main 또는 district-static-main 패턴이 없습니다.");
  }

  if (!alreadyHomeLayout(html)) {
    throw new Error("변환 후에도 home-layout 검증 실패: " + filePath);
  }

  fs.writeFileSync(filePath, html, "utf8");
  return "ok";
}

const names = fs.readdirSync(root).filter((n) => /^dist-seoul-.*\.html$/i.test(n));

let ok = 0;
let skipped = 0;
for (const name of names.sort()) {
  const p = join(root, name);
  const r = processFile(p);
  if (r === "skip") skipped++;
  else ok++;
  console.log(r, name);
}

console.log("apply-home-layout:", ok, "updated,", skipped, "skipped");
