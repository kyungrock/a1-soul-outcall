/**
 * 출장 카드 썸네일을 msg1000에서 받아 프로젝트 images/ 에 저장합니다.
 * 실행: node scripts/fetch-outcall-images.mjs
 */
import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "images");

const FILES = [
  "20대인스타이쁜이.jpg",
  "한국20대이쁜이.jpg",
  "24시한국일본혼혈.jpg",
  "VVIP20대여신한국인홈케어.jpg",
  "T팬티콜걸.jpg",
  "20대이쁘니탱글출장.jpg",
  "우크라이나출장.jpg",
  "출장마사지_도쿄핫.jpg",
  "출장마사지_원정녀.jpg",
  "출장마사지_재팬혼혈.jpg",
  "출장마사지_비키니출장.jpg",
  "출장마사지_vip20대힐링_한국홈케어.jpg",
  "출장마사지_쏘핫.jpg",
  "출장마사지_슴살화끈색녀.jpg",
  "출장마사지_BJ발정난색끼년출장.jpg",
  "출장마사지_란제리구멍출장.jpg",
];

function fetchToFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlink(dest, () => {});
        return fetchToFile(new URL(res.headers.location, url).href, dest)
          .then(resolve)
          .catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        reject(new Error(`HTTP ${res.statusCode} ${url}`));
        return;
      }
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve()));
    });
    req.on("error", (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

function imageUrl(name) {
  const enc = encodeURIComponent(name);
  return `https://msg1000.com/images/${enc}`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let ok = 0;
  let fail = 0;
  for (const name of FILES) {
    const dest = path.join(OUT_DIR, name);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log("[skip]", name);
      ok++;
      continue;
    }
    const url = imageUrl(name);
    try {
      await fetchToFile(url, dest);
      const sz = fs.statSync(dest).size;
      console.log("[ok]", name, sz, "bytes");
      ok++;
    } catch (e) {
      console.error("[fail]", name, e.message);
      fail++;
    }
  }
  console.log(`Done: ${ok} ok, ${fail} fail → ${OUT_DIR}`);
  if (fail) process.exitCode = 1;
}

main();
