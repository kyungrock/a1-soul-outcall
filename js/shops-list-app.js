/**
 * 정적 카드: index.html / shops.html 에 `npm run shop:cards` 로 삽입된
 * <!--STATIC_SHOP_CARDS_BEGIN--> … <!--STATIC_SHOP_CARDS_END--> 가 있으면 그대로 둡니다(소스 보기용).
 * 마커만 있고 article 이 없을 때만 아래 템플릿으로 채웁니다. (scripts/render-static-shop-cards.mjs 와 동기)
 */
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

  /** 카드 본문: alt 키워드(서울 전지역 출장마사지·상호·요금)를 도입에 포함 — render-static-shop-cards.mjs 와 동기 */
  function buildShopCardGreetingEscaped(card, m) {
    var altLine = String(card.alt || "").trim();
    var body = String((m && m.description) || card.description || card.greeting || "").trim();
    var name = String(card.name || "").trim();
    var price = String(card.price || "").trim();
    var fallbackLead =
      name && price
        ? "서울 전지역 출장마사지 " + name + " — " + price
        : name
          ? "서울 전지역 출장마사지 " + name
          : "서울 전지역 출장마사지";
    var lead = altLine || fallbackLead;
    if (!body) {
      return escapeHtml(lead + ". 홈타이·출장 상담으로 일정·코스를 안내합니다.");
    }
    var norm = body.replace(/\s+/g, " ").trim();
    var leadNorm = lead.replace(/\s+/g, " ").trim();
    if (norm.indexOf(leadNorm) === 0 || norm.indexOf(leadNorm + ".") === 0) {
      return escapeHtml(body);
    }
    return escapeHtml(lead + ". " + body);
  }

  function normPhone(p) {
    return String(p || "").replace(/\D/g, "");
  }

  function resolveMatchedShopId(card, shops) {
    if (!card || !Array.isArray(shops)) return null;
    if (card.shopDetailId) {
      var byDetail = shops.find(function (s) {
        return s.id === card.shopDetailId;
      });
      if (byDetail) return byDetail.id;
    }
    var p = normPhone(card.phone);
    if (p) {
      var byPhone = shops.find(function (s) {
        return normPhone(s.phone) === p;
      });
      if (byPhone) return byPhone.id;
    }
    var byName = shops.find(function (s) {
      return s.name === card.name;
    });
    return byName ? byName.id : null;
  }

  function findMatchedShop(card, shops) {
    var id = resolveMatchedShopId(card, shops);
    if (!id) return null;
    return shops.find(function (s) {
      return s.id === id;
    }) || null;
  }

  function buildDetailHref(card, shops) {
    var mid = resolveMatchedShopId(card, shops);
    if (mid) return "shop-detail.html?id=" + encodeURIComponent(mid);
    return "shop-detail.html?cardId=" + encodeURIComponent(String(card.id));
  }

  function regionIncludesSeoul(region) {
    return String(region || "").includes("서울");
  }

  function buildArticleHtml(card, shops) {
    var m = findMatchedShop(card, shops);
    var href = escapeHtml(buildDetailHref(card, shops));
    var name = String(card.name || "").trim();
    var img = escapeHtml(card.image || "");
    var alt = escapeHtml((card.alt || name || "업체").trim());
    var titleEsc = escapeHtml(name);
    var district = escapeHtml(
      String((m && (m.district || m.address)) || card.district || card.address || "").trim()
    );
    var hoursRaw = String((m && m.operatingHours) || card.operatingHours || "").trim();
    var hoursEsc = escapeHtml(hoursRaw || "—");
    var priceEsc = escapeHtml(String(card.price || "").trim());
    var phone = String((m && m.phone) || card.phone || "").trim();
    var telDigits = normPhone(phone);
    var phoneEsc = escapeHtml(phone);
    var descEsc = buildShopCardGreetingEscaped(card, m);

    var services = (m && m.services) || card.services;
    var tagList = Array.isArray(services) ? services.filter(Boolean).slice(0, 8) : [];
    var tagsHtml = tagList.length
      ? "\n              <div class=\"shop-card-tags\">\n" +
        tagList
          .map(function (t) {
            return '                <span class="shop-card-tag">' + escapeHtml(String(t)) + "</span>";
          })
          .join("\n") +
        "\n              </div>"
      : "";

    var phoneRow =
      phone && telDigits
        ? '<span class="shop-card-phone" data-tel="' +
          escapeHtml(telDigits) +
          '">📞 ' +
          phoneEsc +
          "</span>"
        : phone
        ? '<span class="shop-card-phone" data-tel="">📞 ' + phoneEsc + "</span>"
        : "";

    return (
      "      <article class=\"shop-card\">\n" +
      '        <a href="' +
      href +
      '" class="shop-card-hit" aria-label="' +
      titleEsc +
      ' 상세보기">\n' +
      '          <div class="shop-card-image">\n' +
      '            <img src="' +
      img +
      '" alt="' +
      alt +
      '" loading="lazy" width="400" height="225" />\n' +
      "          </div>\n" +
      '          <div class="shop-card-body">\n' +
      '            <div class="shop-card-header">\n' +
      '              <h2 class="shop-card-title">' +
      titleEsc +
      "</h2>\n" +
      "            </div>\n" +
      '            <div class="shop-card-meta">\n' +
      '              <span>📍 <span>' +
      district +
      "</span></span>\n" +
      '              <span>⏱ <span>' +
      hoursEsc +
      "</span></span>\n" +
      "            </div>\n" +
      '            <div class="shop-card-price-row">\n' +
      '              <div class="shop-card-price">' +
      priceEsc +
      "</div>\n" +
      "              " +
      phoneRow +
      "\n" +
      "            </div>\n" +
      '            <p class="shop-card-greeting">' +
      descEsc +
      "</p>" +
      tagsHtml +
      '\n            <div class="shop-card-footer">\n' +
      '              <span class="shop-card-link">\n' +
      "                상세 보기\n" +
      "                <span>↗</span>\n" +
      "              </span>\n" +
      "            </div>\n" +
      "          </div>\n" +
      "        </a>\n" +
      "      </article>"
    );
  }

  async function init() {
    var grid = document.getElementById("shop-card-grid");
    if (!grid) return;

    if (grid.getAttribute("data-static-shop-cards") === "1" && grid.querySelector("article.shop-card")) {
      return;
    }

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
        return buildArticleHtml(card, shops);
      })
      .join("\n\n");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
