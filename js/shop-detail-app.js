(function () {
  var MATCHED_URL = "data/shops-outcall-matched.json";

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** tel: 링크용 — 숫자만 (국내 050 등 호환) */
  function telDigits(phone) {
    return String(phone || "").replace(/\D/g, "");
  }

  function setStickyCallBar(phone) {
    var bar = document.getElementById("shop-detail-call-bar");
    if (!bar) return;
    document.body.classList.remove("has-sticky-call");
    if (phone) {
      var digits = telDigits(phone);
      if (!digits) {
        bar.innerHTML = "";
        bar.hidden = true;
        return;
      }
      bar.innerHTML =
        '<a class="detail-sticky-call__btn" href="tel:' +
        escapeHtml(digits) +
        '">' +
        '<span class="detail-sticky-call__icon" aria-hidden="true"></span>' +
        '<span class="detail-sticky-call__text">' +
        '<span class="detail-sticky-call__label">전화 상담</span>' +
        '<span class="detail-sticky-call__num">' +
        escapeHtml(phone) +
        "</span></span></a>";
      bar.hidden = false;
      document.body.classList.add("has-sticky-call");
    } else {
      bar.innerHTML = "";
      bar.hidden = true;
    }
  }

  function getQuery() {
    var q = {};
    var params = new URLSearchParams(window.location.search);
    if (params.get("id")) q.shopId = params.get("id");
    if (params.get("cardId")) q.cardId = params.get("cardId");
    return q;
  }

  function findCardById(cardId) {
    var id = Number(cardId);
    return window.outcallShopCardData.find(function (c) {
      return c.id === id;
    });
  }

  function findShopById(shops, id) {
    return shops.find(function (s) {
      return s.id === id;
    });
  }

  function renderCourses(courses) {
    if (!courses || !courses.length) return "";
    var html =
      '<section class="detail-block detail-courses" id="courses"><h2 class="detail-block-title">가격표 · 코스 안내</h2>';
    courses.forEach(function (cat) {
      html +=
        '<article class="course-block"><h3 class="course-category">' +
        escapeHtml(cat.category) +
        "</h3>";
      html += '<ul class="course-card-list">';
      (cat.items || []).forEach(function (it) {
        html += '<li class="course-row">';
        html += '<div class="course-row-head">';
        html +=
          '<span class="course-name">' + escapeHtml(it.name) + "</span>";
        if (it.duration) {
          html +=
            '<span class="course-dur-badge">' + escapeHtml(it.duration) + "</span>";
        }
        if (it.price) {
          html +=
            '<span class="course-price-val">' + escapeHtml(it.price) + "</span>";
        }
        html += "</div>";
        if (it.description) {
          html +=
            '<p class="course-row-desc">' + escapeHtml(it.description) + "</p>";
        }
        html += "</li>";
      });
      html += "</ul></article>";
    });
    html += "</section>";
    return html;
  }

  function renderReviews(list, title) {
    title = title || "리뷰";
    if (!list || !list.length) return "";
    var html =
      '<section class="detail-block detail-reviews" id="reviews"><h2 class="detail-block-title">' +
      escapeHtml(title) +
      '</h2><ul class="review-list">';
    list.forEach(function (r) {
      var who = r.author || r.name || "";
      var body = r.review || r.reviewBody || r.content || r.comment || "";
      html +=
        "<li><strong>" +
        escapeHtml(who) +
        "</strong> " +
        escapeHtml(String(r.rating || "")) +
        " <time>" +
        escapeHtml(r.date || "") +
        "</time><p>" +
        escapeHtml(body) +
        "</p></li>";
    });
    html += "</ul></section>";
    return html;
  }

  function renderFeatures(features) {
    if (!features || !features.length) return "";
    var html =
      '<section class="detail-block detail-features"><h2 class="detail-block-title">특징</h2><ul class="feature-chip-list">';
    features.forEach(function (f) {
      html += '<li class="feature-chip">' + escapeHtml(f) + "</li>";
    });
    html += "</ul></section>";
    return html;
  }

  function renderTags(tags) {
    if (!tags || !tags.length) return "";
    var html =
      '<section class="detail-block detail-tags-block"><h2 class="detail-block-title">태그</h2><p class="detail-tags">';
    tags.forEach(function (t) {
      html +=
        '<span class="detail-tag-chip">' + escapeHtml(t) + "</span>";
    });
    html += "</p></section>";
    return html;
  }

  function pickReviews(shop, card) {
    if (shop && shop.reviews && shop.reviews.length) return shop.reviews;
    if (card && card.reviews && card.reviews.length) return card.reviews;
    return [];
  }

  async function loadMatchedShopsBundle() {
    if (window.shopsDataOutcallMatched && window.shopsDataOutcallMatched.shops) {
      return window.shopsDataOutcallMatched;
    }
    if (typeof window.loadMatchedShopsData === "function") {
      try {
        return await window.loadMatchedShopsData(MATCHED_URL);
      } catch (e) {
        console.warn("[shop-detail] fetch fallback 실패:", e);
      }
    }
    return { shops: [] };
  }

  async function init() {
    var root = document.getElementById("shop-detail-root");
    if (!root) return;

    setStickyCallBar(null);

    if (!window.outcallShopCardData) {
      root.innerHTML = "<p>카드 데이터가 없습니다.</p>";
      return;
    }

    if (!window.OutcallShopUtils) {
      root.innerHTML = "<p>유틸 스크립트를 불러오지 못했습니다.</p>";
      return;
    }

    var q = getQuery();
    var U = window.OutcallShopUtils;
    var matched = await loadMatchedShopsBundle();
    var shops = (matched && matched.shops) || [];

    var shop = q.shopId ? findShopById(shops, q.shopId) : null;
    var card = q.cardId ? findCardById(q.cardId) : null;

    /** cardId만 넘어온 경우에도 매칭 JSON에서 shop 로드 → 가격표·특징 표시 */
    if (!shop && card) {
      var rid = U.resolveMatchedShopId(card, shops);
      if (rid) shop = findShopById(shops, rid);
    }

    if (!card && shop) {
      card = window.outcallShopCardData.find(function (c) {
        return U.resolveMatchedShopId(c, shops) === shop.id;
      });
    }

    if (!shop && !card) {
      root.innerHTML = "<p>업체를 찾을 수 없습니다.</p>";
      document.title = "업체 없음 | 서울출장마사지 - 20대,30대 힐링출장 서비스";
      setStickyCallBar(null);
      return;
    }

    var title = (shop && shop.name) || (card && card.name) || "업체";
    document.title =
      title + " | 서울출장마사지 - 20대,30대 힐링출장 서비스";

    var imgPath = shop && shop.image ? shop.image : card && card.image;
    var heroSrc = U.resolveImageUrl(imgPath);

    var rating =
      shop && shop.rating != null
        ? shop.rating
        : card && card.rating != null
          ? card.rating
          : null;
    var reviewCount =
      shop && shop.reviewCount != null
        ? shop.reviewCount
        : card && card.reviewCount != null
          ? card.reviewCount
          : null;

    var html = "";
    html +=
      '<header class="detail-hero">' +
      (heroSrc
        ? '<img src="' +
          escapeHtml(heroSrc) +
          '" alt="" class="detail-hero-img" />'
        : "") +
      '<div class="detail-hero-text inner">' +
      "<h1>" +
      escapeHtml(title) +
      "</h1>";

    var metaParts = [];
    if (shop) {
      if (shop.district) metaParts.push(escapeHtml(shop.district));
      if (shop.price) metaParts.push(escapeHtml(shop.price));
    } else if (card) {
      if (card.district || card.address) {
        metaParts.push(escapeHtml(card.district || card.address));
      }
      if (card.price) metaParts.push(escapeHtml(card.price));
    }
    if (rating != null) {
      metaParts.push(
        "★ " +
          escapeHtml(String(rating)) +
          (reviewCount != null ? " · 리뷰 " + escapeHtml(String(reviewCount)) : "")
      );
    }
    if (metaParts.length) {
      html += '<p class="detail-meta">' + metaParts.join(" · ") + "</p>";
    }
    html += "</div></header>";

    html += '<div class="inner detail-content">';

    var phone = (shop && shop.phone) || (card && card.phone);
    if (phone) {
      var tel = telDigits(phone);
      html +=
        '<div class="detail-phone-card">' +
        '<p class="detail-phone-card__hint">예약 · 문의</p>' +
        '<a class="detail-phone-card__link" href="tel:' +
        escapeHtml(tel) +
        '">' +
        '<span class="detail-phone-card__num">' +
        escapeHtml(phone) +
        "</span>" +
        '<span class="detail-phone-card__action">전화 걸기</span></a></div>';
    }

    if (shop && shop.courses && shop.courses.length) {
      html += renderCourses(shop.courses);
    } else {
      html +=
        '<section class="detail-block detail-courses-empty"><h2 class="detail-block-title">가격표 · 코스 안내</h2><p class="detail-missing">연동된 상세 코스 데이터가 없습니다. 아래 소개 문구·전화 상담을 참고해 주세요.</p></section>';
    }

    var desc = (shop && shop.description) || (card && card.description);
    if (desc) {
      html +=
        '<section class="detail-block"><h2 class="detail-block-title">소개</h2><p class="detail-desc">' +
        escapeHtml(desc) +
        "</p></section>";
    }

    if (card && card.greeting) {
      html +=
        '<section class="detail-block detail-greeting"><h2 class="detail-block-title">한 줄 안내</h2><p class="detail-greeting-text">' +
        escapeHtml(card.greeting) +
        "</p></section>";
    }

    var locParts = [];
    if (shop) {
      if (shop.region) locParts.push("<strong>지역</strong> " + escapeHtml(shop.region));
      if (shop.type) locParts.push("<strong>유형</strong> " + escapeHtml(shop.type));
      if (shop.address) locParts.push("<strong>주소</strong> " + escapeHtml(shop.address));
      if (shop.detailAddress) {
        locParts.push("<strong>상세</strong> " + escapeHtml(shop.detailAddress));
      }
    } else if (card) {
      if (card.region) locParts.push("<strong>지역</strong> " + escapeHtml(card.region));
      if (card.type) locParts.push("<strong>유형</strong> " + escapeHtml(card.type));
      if (card.address) locParts.push("<strong>주소</strong> " + escapeHtml(card.address));
      if (card.detailAddress) {
        locParts.push("<strong>상세</strong> " + escapeHtml(card.detailAddress));
      }
      if (card.country) {
        locParts.push("<strong>국가</strong> " + escapeHtml(card.country));
      }
    }
    if (locParts.length) {
      html +=
        '<section class="detail-block"><h2 class="detail-block-title">위치 · 유형</h2><p class="detail-loc">' +
        locParts.join("<br />") +
        "</p></section>";
    }

    if (shop && shop.operatingHours) {
      html +=
        '<section class="detail-block"><h2 class="detail-block-title">운영 시간</h2><p class="detail-plain">' +
        escapeHtml(shop.operatingHours) +
        "</p></section>";
    } else if (card && card.operatingHours) {
      html +=
        '<section class="detail-block"><h2 class="detail-block-title">운영 시간</h2><p class="detail-plain">' +
        escapeHtml(card.operatingHours) +
        "</p></section>";
    }

    var svcList =
      shop && shop.services && shop.services.length > 0
        ? shop.services
        : card && card.services && card.services.length > 0
          ? card.services
          : null;
    if (svcList) {
      html +=
        '<section class="detail-block detail-services"><h2 class="detail-block-title">서비스</h2><ul class="service-chip-list">';
      svcList.forEach(function (s) {
        html += '<li class="service-chip">' + escapeHtml(s) + "</li>";
      });
      html += "</ul></section>";
    }

    if (shop && shop.staffInfo) {
      html +=
        '<section class="detail-block"><h2 class="detail-block-title">관리사 · 안내</h2><p class="detail-desc">' +
        escapeHtml(shop.staffInfo) +
        "</p></section>";
    }

    if (shop && shop.features && shop.features.length) {
      html += renderFeatures(shop.features);
    }

    if (shop && shop.tags && shop.tags.length) {
      html += renderTags(shop.tags);
    }

    html += renderReviews(pickReviews(shop, card), "리뷰");

    if (shop && shop.status) {
      html +=
        '<section class="detail-block detail-meta-foot"><p><small>상태: ' +
        escapeHtml(shop.status) +
        "</small></p></section>";
    }

    html +=
      '<p class="back-wrap"><a class="btn ghost" href="shops.html">목록으로</a></p>';
    html += "</div>";

    root.innerHTML = html;
    setStickyCallBar(phone);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
