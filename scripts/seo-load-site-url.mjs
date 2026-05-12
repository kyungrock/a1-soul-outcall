import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

/**
 * 우선순위: SITE_URL 환경변수 > seo-config.json 의 siteUrl
 * @returns {string|null} 끝 슬래시 없음 또는 null (미설정)
 */
export function loadSiteUrl() {
  const fromEnv = (process.env.SITE_URL || "").trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;

  try {
    const raw = fs.readFileSync(path.join(ROOT, "seo-config.json"), "utf8");
    const parsed = JSON.parse(raw);
    const u = String(parsed.siteUrl || "").trim().replace(/\/+$/, "");
    if (u) return u;
  } catch {
    /**/
  }

  return null;
}

/** 절대 OG/Twitter 이미지 URL 또는 null */
export function loadOgImageAbsolute(siteUrl) {
  if (!siteUrl) return null;
  try {
    const raw = fs.readFileSync(path.join(ROOT, "seo-config.json"), "utf8");
    const parsed = JSON.parse(raw);
    const img = String(parsed.ogImagePath || "").trim();
    if (!img) return null;
    if (/^https?:\/\//i.test(img)) return img;
    const pathClean = img.replace(/^\//, "");
    return `${siteUrl}/${pathClean}`;
  } catch {
    return null;
  }
}
