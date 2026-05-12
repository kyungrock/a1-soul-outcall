(function () {
  var MATCHED_URL = "data/shops-outcall-matched.json";

  async function loadMatchedShopsBundle() {
    if (window.shopsDataOutcallMatched && window.shopsDataOutcallMatched.shops) {
      return window.shopsDataOutcallMatched;
    }
    if (typeof window.loadMatchedShopsData === "function") {
      try {
        return await window.loadMatchedShopsData(MATCHED_URL);
      } catch (e) {
        console.warn("[shops-list] fetch fallback 실패:", e);
      }
    }
    return { shops: [] };
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildDetailHref(card, shops) {
    var U = window.OutcallShopUtils;
    var mid = U.resolveMatchedShopId(card, shops);
    if (mid) return "shop-detail.html?id=" + encodeURIComponent(mid);
    return "shop-detail.html?cardId=" + encodeURIComponent(String(card.id));
  }

  function renderCard(card, shops) {
    var U = window.OutcallShopUtils;
    var img = escapeHtml(card.image || "");
    var name = escapeHtml(card.name);
    var district = escapeHtml(card.district || card.address || "");
    var price = escapeHtml(card.price || "");
    var rating =
      card.rating != null
        ? '<span class="shop-card-meta">' +
          escapeHtml(String(card.rating)) +
          " · 리뷰 " +
          escapeHtml(String(card.reviewCount != null ? card.reviewCount : 0)) +
          "</span>"
        : "";
    var href = buildDetailHref(card, shops);
    return (
      '<a class="shop-card" href="' +
      href +
      '">' +
      '<span class="shop-card-image-wrap">' +
      '<img src="' +
      img +
      '" alt="" loading="lazy" width="400" height="225" />' +
      "</span>" +
      '<span class="shop-card-body">' +
      '<span class="shop-card-name">' +
      name +
      "</span>" +
      '<span class="shop-card-district">' +
      district +
      "</span>" +
      '<span class="shop-card-price">' +
      price +
      "</span>" +
      rating +
      "</span>" +
      "</a>"
    );
  }

  async function init() {
    var grid = document.getElementById("shop-card-grid");
    if (!grid) return;

    if (!window.outcallShopCardData) {
      grid.innerHTML =
        '<p class="shop-empty">카드 데이터가 없습니다. <code>data/shop-card-data-outcall.js</code>가 있는지, 브라우저 네트워크 탭에서 404·스크립트 오류를 확인하세요.</p>';
      return;
    }
    if (!window.OutcallShopUtils) {
      grid.innerHTML =
        '<p class="shop-empty"><code>js/outcall-shop-utils.js</code>를 불러오지 못했습니다.</p>';
      return;
    }

    var U = window.OutcallShopUtils;
    var matched = await loadMatchedShopsBundle();
    var shops = (matched && matched.shops) || [];
    var seoulCards = window.outcallShopCardData.filter(function (c) {
      return U.regionIncludesSeoul(c.region);
    });

    grid.innerHTML = seoulCards
      .map(function (card) {
        return renderCard(card, shops);
      })
      .join("");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
