/**
 * window.shopsDataOutcallMatched = {...}; 형태 파일에서 JSON 객체 추출
 */
(function (global) {
  async function loadMatchedShopsData(fetchUrl) {
    var res = await fetch(fetchUrl, { credentials: "same-origin" });
    if (!res.ok) throw new Error("매칭 데이터 로드 실패: " + res.status);
    var text = await res.text();
    var start = text.indexOf("{");
    var end = text.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("매칭 데이터 형식 오류");
    return JSON.parse(text.slice(start, end + 1));
  }

  global.loadMatchedShopsData = loadMatchedShopsData;
})(typeof window !== "undefined" ? window : globalThis);
