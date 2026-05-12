/**
 * 출장 카드 데이터 ↔ shops-outcall-matched 연동 유틸
 */
(function (global) {
  function normPhone(p) {
    return String(p || "").replace(/\D/g, "");
  }

  /**
   * @param {object} card window.outcallShopCardData 항목
   * @param {Array} shops shops-outcall-matched의 shops 배열
   * @returns {string|null} matched shop id
   */
  function resolveMatchedShopId(card, shops) {
    if (!card || !Array.isArray(shops)) return null;
    const p = normPhone(card.phone);
    if (p) {
      const byPhone = shops.find(function (s) {
        return normPhone(s.phone) === p;
      });
      if (byPhone) return byPhone.id;
    }
    const byName = shops.find(function (s) {
      return s.name === card.name;
    });
    return byName ? byName.id : null;
  }

  function regionIncludesSeoul(region) {
    return String(region || "").includes("서울");
  }

  /**
   * 상대 이미지 경로를 절대 URL로
   */
  function resolveImageUrl(path, baseUrl) {
    var base = baseUrl || "https://msg1000.com/";
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return base.replace(/\/?$/, "/") + String(path).replace(/^\//, "");
  }

  global.OutcallShopUtils = {
    normPhone: normPhone,
    resolveMatchedShopId: resolveMatchedShopId,
    regionIncludesSeoul: regionIncludesSeoul,
    resolveImageUrl: resolveImageUrl,
  };
})(typeof window !== "undefined" ? window : globalThis);
