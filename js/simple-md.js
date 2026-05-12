/**
 * 일상 초안 마크다운용 아주 단순 HTML 변환 (코드블록 · 제목 · 문단만 위주).
 */
(function (global) {
  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** --- yaml 제거 후 본문 */
  function stripFrontmatter(text) {
    const raw = String(text || "").replace(/^\uFEFF/, "");
    if (!/^---\r?\n/.test(raw)) return raw.trim();
    const end = raw.indexOf("\n---", 4);
    if (end === -1) return raw.trim();
    return raw.slice(end + "\n---".length).replace(/^\r?\n/, "").trim();
  }

  function markdownToHtml(md) {
    const body = stripFrontmatter(md);
    let i = 0;
    let out = [];
    while (i < body.length) {
      let fence = body.indexOf("```", i);
      if (fence === -1) fence = body.length;

      const textPart = body.slice(i, fence);
      out.push(renderPlainBlocks(textPart));

      if (fence >= body.length) break;

      const close = body.indexOf("```", fence + 3);
      const codeRaw =
        close === -1
          ? body.slice(fence + 3)
          : body.slice(fence + 3, close);
      const code = escapeHtml(codeRaw.replace(/^\r?\n/, "").replace(/\r?\n$/, ""));
      out.push(`<pre><code>${code}</code></pre>`);
      i = close === -1 ? body.length : close + 3;
    }

    return out.join("\n").replace(/\n{3,}/g, "\n\n");
  }

  function renderPlainBlocks(textPart) {
    const lines = textPart.split(/\r?\n/);
    const chunks = [];
    let buf = [];
    function flushP() {
      if (!buf.length) return;
      const p = escapeHtml(buf.join(" ").trim());
      if (p) chunks.push(`<p>${p}</p>`);
      buf = [];
    }
    for (const line of lines) {
      const t = line.trim();
      if (!t) {
        flushP();
        continue;
      }
      const h3 = /^###\s+(.+)$/.exec(t);
      if (h3) {
        flushP();
        chunks.push(`<h3>${escapeHtml(h3[1])}</h3>`);
        continue;
      }
      const h2 = /^##\s+(.+)$/.exec(t);
      if (h2) {
        flushP();
        chunks.push(`<h2>${escapeHtml(h2[1])}</h2>`);
        continue;
      }
      const h1 = /^#\s+(.+)$/.exec(t);
      if (h1) {
        flushP();
        chunks.push(`<h1>${escapeHtml(h1[1])}</h1>`);
        continue;
      }
      const hr = /^(-{3,}|\*{3,})$/.exec(t);
      if (hr) {
        flushP();
        chunks.push("<hr />");
        continue;
      }
      const li = /^[-*]\s+(.+)$/.exec(t);
      if (li) {
        flushP();
        chunks.push(`<ul><li>${escapeHtml(li[1])}</li></ul>`);
        continue;
      }
      buf.push(t.replace(/^_+|_+$/g, ""));
    }
    flushP();
    return chunks.join("\n").replace(/<\/ul>\n<ul>/g, "\n");
  }

  global.SimpleMd = {
    escapeHtml,
    stripFrontmatter,
    markdownToHtml,
  };
})(typeof window !== "undefined" ? window : globalThis);
