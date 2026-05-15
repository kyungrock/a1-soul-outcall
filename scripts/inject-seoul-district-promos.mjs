/**
 * 서울 자치구 dist-seoul-*.html 에 종로형 district-promo(히어로 + PC 하단) 삽입,
 * 구별 고유 카피 + images/promo-seoul-{slug}-{1|2}.svg 배너 생성.
 *
 * 실행: node scripts/inject-seoul-district-promos.mjs
 */
import fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const imgDir = join(root, "images");

const SYNC_END = "<!-- SYNC_HOME_REGISTERED_SHOPS_FROM_INDEX_END -->";

const q = String.fromCharCode(0x201c);
const qq = String.fromCharCode(0x201d);

/** 구별 지역 슬롯 + 중복 최소화용 한 문단(sp) */
const ROWS = [
  { n: "강남", s: "gangnam", a: "테헤란로·역삼", b: "압구정·청담", c: "코엑스·삼성동", d: "2호선·신분당선", e: "늦은 미팅", f: "숙소·오피스텔", g: "회식 다음 날", sp: "강남은 행사·박람회만 잡혀도 사람이 한꺼번에 몰려서, 종일 서 있다 보면 허벅지부터 당기는 말이 많습니다. 테헤란로에서 미팅을 연이어 끝낸 날엔 집에 가기 전에 몸만 정리하고 싶다는 생각부터 드는 경우도 있어요." },
  { n: "강동", s: "gangdong", a: "천호·길동", b: "강동·둔촌", c: "올림픽대로", d: "5호선·8호선", e: "야간 환승", f: "신축 단지", g: "주말 나들이", sp: "천호역 환승이 잦은 분들은 말씀하시길, 퇴근길만 되면 발바닥이 먼저 항의한다고 해요. 올림픽대로 타고 들어오는 날엔 차만 잠깐 막혀도 스트레스가 확 올라가더라고요." },
  { n: "강북", s: "gangbuk", a: "미아·수유", b: "삼각산·우이천", c: "한적한 주택가", d: "4호선·우이신설", e: "늦은 귀가", f: "자가·택시", g: "등산 후", sp: "우이천·삼각산 쪽은 낮에 걷기 좋은 만큼, 저녁엔 종아리가 먼저 말을 건네는 경우가 많습니다. 주택가 골목은 주차·회전이 빡빡해서, 상담 때 위치 설명을 짧게라도 정리해 두면 편해요." },
  { n: "강서", s: "gangseo", a: "화곡·등촌", b: "김포공항·마곡", c: "강변로 이동", d: "5호선·9호선", e: "새벽 비행", f: "공항 숙소", g: "출장 일정", sp: "김포공항 일정이 겹치면 숙소 들어가기 전에 몸부터 풀고 싶다는 말이 자주 나옵니다. 마곡·등촌 쪽은 이동 거리가 길어져서, 시간대부터 짚는 게 상담 속도에 도움이 된대요." },
  { n: "관악", s: "gwanak", a: "신림·봉천", b: "서울대·관악산", c: "낙성대·당곡", d: "2호선·관악 셔틀", e: "시험·과제", f: "원룸·고시촌", g: "등하교", sp: "시험 기간엔 책상 앞 시간이 길어지기 쉬워서, 손목·목이 같이 뭉친다는 이야기를 많이 듣습니다. 신림 사거리만 지나도 사람이 몰려서, 늦게 끝나면 그냥 집에서 조용히 풀고 싶은 날도 있죠." },
  { n: "광진", s: "gwangjin", a: "건대·화양", b: "뚝섬·아차산", c: "자양·구의", d: "2호선·7호선", e: "밤늦게", f: "오피스텔", g: "축제·공연", sp: "건대입구 쪽은 밤에도 사람이 많아서, 집까지 가기 전에 컨디션만 정리하고 싶다는 문의가 이어진다고 해요. 뚝섬 한강 산책 후엔 바람 맞은 어깨가 먼저 무거워진다는 말도 있고요." },
  { n: "구로", s: "guro", a: "구로디지털단지", b: "신도림·가리봉", c: "철산·개봉", d: "1호선·2호선", e: "야근", f: "근무지 근처", g: "주말 당직", sp: "디지털단지는 야근이 익숙한 동네라서, 늦은 시간대 가능 여부를 먼저 묻는 분들이 많대요. 회의실 의자만 오래 앉아도 허리가 먼저 신호를 보내는 경우가 흔하죠." },
  { n: "금천", s: "geumcheon", a: "가산·독산", b: "시흥동", c: "산업단지·사무", d: "1호선·7호선", e: "두 번째 야근", f: "근처 모텔", g: "현장 출장", sp: "가산디지털단지 쪽은 낮에도 차가 많아서, 이동만으로도 피곤이 쌓이기 쉬워요. 현장·사무를 오가는 날엔 발부터 풀고 싶다는 말이 먼저 나온다고 합니다." },
  { n: "노원", s: "nowon", a: "상계·중계", b: "공릉·월계", c: "태릉·노원역", d: "4호선·7호선", e: "늦은 버스", f: "아파트 단지", g: "장보기 후", sp: "노원은 아파트 단지가 넓게 펼쳐져서, 동 이름만으로도 동선이 꽤 갈립니다. 늦은 버스를 기다리다 보면 어깨가 굳는 날, 집에 들어가기 전 상담을 찾는 경우도 있어요." },
  { n: "도봉", s: "dobong", a: "쌍문·방학", b: "창동·도봉산", c: "우이동", d: "1호선·4호선", e: "저녁 산책", f: "주거지", g: "등산 후", sp: "도봉산 일정이 있으면 내려온 뒤 종아리가 먼저 말을 건네는 경우가 많습니다. 주거지 골목은 조용한 만큼, 상담할 때 시간대만 정확히 말해 주는 게 좋대요." },
  { n: "동대문", s: "dongdaemun", a: "회기·청량리", b: "경희대·외대", c: "장안·답십리", d: "1호선·경의중앙", e: "KTX·ITX", f: "역세권 숙소", g: "전시·행사", sp: "청량리·회기 쪽은 기차 일정이 겹치면 이동이 길어지기 쉬워요. 전시장·대학가 행사 끝나고 숙소 들어가기 직전에 문의하시는 분들도 있다고 합니다." },
  { n: "동작", s: "dongjak", a: "사당·방배", b: "노량진·흑석", c: "한강·반포대교", d: "2호선·4호선·9호선", e: "야간 운전", f: "자택", g: "한강 산책", sp: "한강 산책 후엔 바람 맞은 목·어깨가 먼저 무거워진다는 말이 많습니다. 노량진·흑석 쪽은 교통이 한 번만 꼬여도 귀가가 늦어져서, 시간부터 짚는 상담이 편하대요." },
  { n: "마포", s: "mapo", a: "홍대·상수", b: "연남·합정", c: "공덕·여의대교", d: "2호선·6호선·공항철도", e: "밤늦게", f: "게스트하우스", g: "공연 관람", sp: "홍대·연남은 밤에도 발이 바빠서, 공연 보고 나면 그냥 숙소에서 풀고 싶은 날이 많죠. 합정·상수 사이만 걸어도 생각보다 걸음 수가 확 늘어난다고 해요." },
  { n: "서대문", s: "seodaemun", a: "신촌·이대", b: "연세로·북아현", c: "홍제·북가좌", d: "2호선·경의선", e: "시험 기간", f: "고시원", g: "캠퍼스 일정", sp: "신촌·이대 일대는 책상 앞 시간이 길어지기 쉬워서, 손목·목이 같이 뭉친다는 이야기를 자주 듣습니다. 시험 끝난 날엔 집에서 조용히 이완하고 싶다는 말도 많고요." },
  { n: "서초", s: "seocho", a: "반포·잠원", b: "교대·양재", c: "법조타운·서초역", d: "2호선·3호선·신분당", e: "재판·미팅", f: "오피스", g: "야근 후", sp: "법조타운·강남 접점은 일정이 촘촘하게 겹치기 쉬워요. 재판·미팅이 길어진 날엔 어깨가 먼저 무거워진다는 말이 많습니다. 야근 후엔 집에서 천천히 풀고 싶은 날도 있죠." },
  { n: "성동", s: "seongdong", a: "성수·왕십리", b: "한양대·금호", c: "뚝섬·성수역", d: "2호선·분당선", e: "팝업·전시", f: "카페거리 근처", g: "주말 산책", sp: "성수는 전시·팝업 일정이 잦아서, 하루 종일 서 있다 보면 발이 먼저 항의한다는 말이 많아요. 주말 산책 코스가 길어지면 저녁에 종아리가 불 끈 것처럼 당기기도 하고요." },
  { n: "성북", s: "seongbuk", a: "성신여대·한성대", b: "고려대·안암", c: "돈암·길음", d: "4호선·6호선", e: "도서관 야간", f: "원룸", g: "시험 전날", sp: "안암·고려대 쪽은 언덕·계단이 익숙한 동네라서, 평소보다 종아리에 부담이 가기 쉽습니다. 도서관 야간 끝나고 원룸으로 돌아가기 전, 짧게라도 상담을 찾는 경우도 있어요." },
  { n: "송파", s: "songpa", a: "잠실·문정", b: "석촌·방이", c: "롯데타워·올림픽공원", d: "2호선·8호선·9호선", e: "야구·콘서트", f: "호텔", g: "가족 나들이", sp: "잠실·석촌은 행사·야구만 잡혀도 사람이 몰려서, 하루 종일 서 있다 보면 허리가 먼저 말을 건네요. 가족 나들이 후 호텔로 돌아가기 전에 몸만 정리하고 싶다는 문의도 흔하대요." },
  { n: "양천", s: "yangcheon", a: "목동·신정", b: "오목교·신월", c: "안양천 산책로", d: "2호선·5호선", e: "저녁 운동", f: "아파트", g: "장거리 출퇴근", sp: "안양천 산책 코스는 생각보다 걸음 수가 늘어나서, 저녁만 되면 종아리가 먼저 신호를 보냅니다. 장거리 출퇴근이 잦은 분들은 어깨 결림부터 말씀하시는 경우가 많아요." },
  { n: "영등포", s: "yeongdeungpo", a: "여의도·당산", b: "선유도·문래", c: "국회·증권가", d: "5호선·9호선", e: "보고 마감", f: "오피스텔", g: "회의 후", sp: "여의도는 보고·회의가 길어지기 쉬워서, 목·어깨가 먼저 뭉친다는 말이 많습니다. 당산·문래 쪽은 야근 후 오피스텔로 바로 들어가기 전에 상담을 찾는 경우도 있대요." },
  { n: "용산", s: "yongsan", a: "용산역·한남", b: "이태원·삼각지", c: "KTX·경부선", d: "1호선·4호선·경의", e: "환승 복잡", f: "숙박 시설", g: "출장 방문", sp: "용산역 환승은 한 번만 헷갈려도 시간이 크게 날아가요. KTX·지하철 일정이 겹치면 짐만 들어도 어깨가 먼저 무거워진다는 말도 자주 듣습니다." },
  { n: "은평", s: "eunpyeong", a: "불광·연신내", b: "응암·녹번", c: "진관사 일대", d: "3호선·6호선", e: "늦은 버스", f: "주택가", g: "주말 장보기", sp: "은평은 언덕길이 익숙한 동네라서, 장보기·산책만 해도 종아리에 부담이 가기 쉽습니다. 늦은 버스를 기다리다 보면 어깨가 굳는 날, 집에 들어가기 전 상담을 찾는 경우도 있어요." },
  { n: "중구", s: "junggu", a: "명동·을지로", b: "시청·남대문", c: "충무로·동대입구", d: "1호선·2호선·4호선", e: "관광·쇼핑", f: "호텔", g: "야간 귀가", sp: "명동·을지로는 쇼핑·관광 동선이 길어지기 쉬워서, 저녁만 되면 발바닥이 먼저 항의한다는 말이 많습니다. 호텔 들어가기 직전에 짧게라도 상담을 찾는 분들도 있다고 해요." },
  { n: "중랑", s: "jungnang", a: "면목·사가정", b: "상봉·망우", c: "중랑천·태릉", d: "7호선·경의중앙", e: "새벽 배차", f: "빌라촌", g: "야근 귀가", sp: "중랑천 산책로는 주말에도 사람이 몰려서, 생각보다 걸음 수가 늘어난다고 해요. 망우·상봉 쪽은 배차 간격이 길어지는 시간대가 있어서, 늦게 끝나면 집에서 풀고 싶은 날도 많죠." },
];

function compose(row) {
  const { n, s, a, b, c, d, e, f, g, sp } = row;
  const kw = `${n}출장마사지`;
  const h2 = `${kw}, ${e}에 자주 묻는 이야기`;
  const intro = `${n} ${a} 일대는 일정이 몰리면 발·허리·목이 먼저 끊김을 알려요. ${b}까지 동선이 길어지면 이동만으로도 피로가 쌓이기 쉽죠. ${c} 근처에서 ${g}까지 마치고 ${f}로 돌아가기 전, ${kw} 상담을 찾아보는 경우도 흔합니다.`;

  const bodies = [
    `저는 ${d} 환승이 잦은 편이었는데요. 친구가 ${q}${n}출장은 시간만 정리해 두면 생각보다 단순하다${qq} 해서 처음 전화를 걸어봤습니다. 솔직히 처음엔 어디까지 가능한지, ${e} 뒤에도 괜찮은지부터 물었어요.`,
    `${n}홈타이처럼 조용히 쉬고 싶은 날도 있고, 반대로 ${e} 끝나고는 ${n}야간출장 상담이 필요한 날도 있었죠. 상담하시는 분이 동 이름이랑 대략 시간부터 적어 달라고 하셔서, 급하게 밀어붙이는 느낌은 없었습니다.`,
    sp,
    `${b} 쪽은 이동이 한 번만 꼬여도 시간이 훅 가요. 그래서 ${n}출장 상담할 때는 ${q}${d} 기준으로 몇 분 안에 갈 수 있는 구간인지${qq} 같은 현실적인 기준을 같이 잡아 주시는 경우도 봤습니다. 말만 앞서면 나중에 서로 불편해지니까요.`,
    `${c} 일대는 ${g} 후에도 종아리가 먼저 아프다는 말이 자주 나옵니다. ${e} 끝나고 ${f}에 들어가기 전에 어깨만이라도 내려놓고 싶다면, ${kw} 상담에서 ${q}오늘은 압이 약했으면${qq} 같이 말해 두는 것만으로도 방향이 잡히더라고요.`,
    `제가 느낀 건, 당일 컨디션을 짧게 말해 주는 게 제일 도움이 됐다는 거예요. ${a} 쪽에서 오래 서 있었다고 하니 ${n}마사지 코스 구성을 그쪽으로 맞춰 주시길래요. 이완 위주로 가고 싶다고 하면 ${n}힐링 느낌으로 천천히 잡아 주시는 경우도 있었고요.`,
    `상담 흐름은 대체로 이렇게 갔습니다. 일정·위치·원하시는 강도를 말씀드리고, 가능 여부 확인 → 코스·시간 조율 → 방문 전 준비물(타올·샤워 가능 여부 등)만 짧게 정리. 애매한 부분은 등록 업체 상담으로 다시 확인하는 게 마음이 편했습니다.`,
    `늦게 끝나는 날엔 ${q}지금 이 시간대도 되나요?${qq}를 가장 많이 묻게 되더라고요. 업체마다 운영이 달라서, ${n}야간출장이 가능한지는 상담에서 확정하는 게 맞습니다. 저도 두세 곳 비교해 보고 나서야 패턴이 잡혔어요.`,
    `${q}집이 아니라 숙소인데 괜찮을까요?${qq} 같은 질문도 흔하대요. 그럴 땐 주소 대신 대략 구역만이라도 말씀해 두면, 가능·불가를 빨리 가르는 데 도움이 된다고 하셨습니다. 과장된 약속보다는 범위를 솔직히 말해 주는 상담이 결국 신뢰로 이어진다는 느낌이었어요.`,
    `아래 카드에서 마음에 드는 곳을 눌러 상세를 보신 뒤, 편한 방식으로 한번 문의해 보세요. ${kw} 페이지는 정보 안내에 가깝고, 실제 예약·요금·운영은 업체마다 다르니까요. 짧게라도 일정만 정리해 두고 연락하시면 상담도 훨씬 수월합니다.`,
  ];

  const note =
    "요금·시간·가능 지역·야간 운영 여부는 업체마다 다릅니다. 불확실하면 카드의 연락처로 먼저 확인해 주세요.";

  return { h2, intro, bodies, note, slug: s, name: n, a };
}

function escAttr(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/** variant: hero | below ; heroKind: shops | static */
function promoSection(copy, variant, heroKind) {
  const below = variant === "below";
  let S0, S1, S2, S3;
  if (below) {
    S0 = "    ";
    S1 = "      ";
    S2 = "      ";
    S3 = "        ";
  } else if (heroKind === "shops") {
    S0 = "      ";
    S1 = "        ";
    S2 = "        ";
    S3 = "          ";
  } else {
    S0 = "        ";
    S1 = "          ";
    S2 = "          ";
    S3 = "            ";
  }

  const id = variant === "hero" ? `${copy.slug}-promo-h2` : `${copy.slug}-promo-below-h2`;
  const cls = variant === "hero" ? "district-promo district-promo--in-hero" : "district-promo district-promo--below-shops";

  const img1 = `images/promo-seoul-${copy.slug}-1.svg`;
  const img2 = `images/promo-seoul-${copy.slug}-2.svg`;
  const alt1 = `${copy.name}출장마사지 — ${copy.a} 일대 안내`;
  const alt2 = `${copy.name}출장마사지 — 상담 안내`;
  const fig1 = `${copy.name} 출장 안내`;
  const fig2 = "상담 환영";

  const lines = [];
  lines.push(`${S0}<section class="${cls}" aria-labelledby="${id}">`);
  lines.push(`${S1}<h2 id="${id}">${copy.h2}</h2>`);
  lines.push(`${S2}<p class="district-promo-intro">`);
  lines.push(`${S3}${copy.intro.trim()}`);
  lines.push(`${S2}</p>`);
  for (const b of copy.bodies) {
    lines.push(`${S2}<p class="district-promo-body">`);
    lines.push(`${S3}${b.trim()}`);
    lines.push(`${S2}</p>`);
  }
  lines.push(`${S2}<p class="district-promo-note">${copy.note}</p>`);
  lines.push(`${S2}<div class="district-promo-visuals">`);
  lines.push(`${S2}  <figure>`);
  lines.push(`${S2}    <img src="${img1}" alt="${escAttr(alt1)}" width="800" height="420" loading="lazy" />`);
  lines.push(`${S2}    <figcaption>${fig1}</figcaption>`);
  lines.push(`${S2}  </figure>`);
  lines.push(`${S2}  <figure>`);
  lines.push(`${S2}    <img src="${img2}" alt="${escAttr(alt2)}" width="800" height="420" loading="lazy" />`);
  lines.push(`${S2}    <figcaption>${fig2}</figcaption>`);
  lines.push(`${S2}  </figure>`);
  lines.push(`${S2}</div>`);
  lines.push(`${S0}</section>`);
  return lines.join("\n");
}

function hashHue(slug, salt) {
  let h = 0;
  const str = slug + salt;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}

function escapeSvgText(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function writeSvg(copy, idx) {
  const { slug, name, a } = copy;
  const h1 = hashHue(slug, `a${idx}`);
  const h2 = (h1 + 40 + (idx === 2 ? 80 : 0)) % 360;
  const x2 = idx === 1 ? "100%" : "0%";
  const y2 = idx === 1 ? "100%" : "0%";
  const gid = `grad-${slug}-${idx}`;
  const kw = `${name}출장마사지`;
  const font = "'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif";

  if (idx === 1) {
    const t1 = escapeSvgText(kw);
    const t2 = escapeSvgText(`${name}홈타이 · ${name}출장 · ${a}`);
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="420" viewBox="0 0 800 420" role="img" aria-label="${escapeSvgText(kw + " 안내 배너")}">
  <defs>
    <linearGradient id="${gid}" x1="0%" y1="0%" x2="${x2}" y2="${y2}">
      <stop offset="0%" stop-color="hsl(${h1} 42% 22%)"/>
      <stop offset="55%" stop-color="hsl(${h2} 38% 32%)"/>
      <stop offset="100%" stop-color="hsl(${(h2 + 30) % 360} 35% 44%)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="420" fill="url(#${gid})"/>
  <circle cx="620" cy="90" r="110" fill="#ffffff" opacity="0.06"/>
  <circle cx="130" cy="330" r="85" fill="#ffffff" opacity="0.04"/>
  <path d="M0 285 Q200 205 400 245 T800 225 L800 420 L0 420 Z" fill="#000000" opacity="0.22"/>
  <rect x="36" y="118" width="728" height="168" rx="18" fill="#000000" opacity="0.32"/>
  <text x="400" y="200" text-anchor="middle" fill="#f8fffe" font-family="${font}" font-size="40" font-weight="700">${t1}</text>
  <text x="400" y="252" text-anchor="middle" fill="#e8f5f0" font-family="${font}" font-size="22" font-weight="500">${t2}</text>
</svg>
`;
  }

  const t1 = escapeSvgText(`${name}마사지 · ${name}힐링`);
  const t2 = escapeSvgText(`${name}야간출장 상담 · 등록 업체 안내`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="420" viewBox="0 0 800 420" role="img" aria-label="${escapeSvgText(name + " 출장 상담 배너")}">
  <defs>
    <linearGradient id="${gid}" x1="0%" y1="0%" x2="${x2}" y2="${y2}">
      <stop offset="0%" stop-color="hsl(${h1} 42% 22%)"/>
      <stop offset="55%" stop-color="hsl(${h2} 38% 32%)"/>
      <stop offset="100%" stop-color="hsl(${(h2 + 30) % 360} 35% 44%)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="420" fill="url(#${gid})"/>
  <circle cx="620" cy="90" r="110" fill="#ffffff" opacity="0.06"/>
  <circle cx="130" cy="330" r="85" fill="#ffffff" opacity="0.04"/>
  <path d="M0 285 Q200 205 400 245 T800 225 L800 420 L0 420 Z" fill="#000000" opacity="0.22"/>
  <rect x="36" y="128" width="728" height="148" rx="18" fill="#000000" opacity="0.32"/>
  <text x="400" y="200" text-anchor="middle" fill="#f8fffe" font-family="${font}" font-size="34" font-weight="700">${t1}</text>
  <text x="400" y="248" text-anchor="middle" fill="#e8f5f0" font-family="${font}" font-size="22" font-weight="500">${t2}</text>
</svg>
`;
}

function injectHtml(html, copy, heroKind) {
  const heroBlock = promoSection(copy, "hero", heroKind);
  const belowBlock = promoSection(copy, "below", heroKind);

  const shopsNeedle = `      </p>\n    </div>\n    </section>\n\n<!-- SYNC_HOME_REGISTERED_SHOPS_FROM_INDEX_START -->`;
  const staticNeedle = `        </p>\n      </div>\n    </section>\n\n<!-- SYNC_HOME_REGISTERED_SHOPS_FROM_INDEX_START -->`;

  if (html.includes("district-promo--in-hero")) {
    if (copy.name === "종로") {
      return html
        .replace(/images\/jongno-outcall-banner-1\.png/g, "images/promo-seoul-jongno-1.svg")
        .replace(/images\/jongno-outcall-banner-2\.png/g, "images/promo-seoul-jongno-2.svg");
    }
    return html;
  }

  if (heroKind === "shops" && html.includes(shopsNeedle)) {
    html = html.replace(shopsNeedle, `      </p>\n${heroBlock}\n    </div>\n    </section>\n\n<!-- SYNC_HOME_REGISTERED_SHOPS_FROM_INDEX_START -->`);
  } else if (heroKind === "static" && html.includes(staticNeedle)) {
    html = html.replace(staticNeedle, `        </p>\n${heroBlock}\n      </div>\n    </section>\n\n<!-- SYNC_HOME_REGISTERED_SHOPS_FROM_INDEX_START -->`);
  } else {
    throw new Error(`히어로 삽입 패턴 없음: ${copy.name} (${heroKind})`);
  }

  const endNeedle = `${SYNC_END}\n  </main>`;
  if (!html.includes(endNeedle)) throw new Error(`SYNC_END 패턴 없음: ${copy.name}`);
  html = html.replace(endNeedle, `${SYNC_END}\n${belowBlock}\n  </main>`);
  return html;
}

function jongnoRow() {
  return {
    n: "종로",
    s: "jongno",
    a: "광화문·종로1가",
    b: "인사동·삼청",
    c: "청계천·종묘",
    d: "1호선·3호선·5호선",
    e: "야근",
    f: "숙소·자택",
    g: "회식·관광",
    sp: "인사동·삼청 쪽은 관광 동선이 길어지기 쉬워서, 숙소 들어가기 직전에 문의하시는 경우가 많다고 해요. 광화문 회의만 잡혀도 이동이 길어져서, 늦게 끝나면 그냥 몸만 풀고 싶은 날도 있죠.",
  };
}

function main() {
  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

  const jongnoCopy = compose(jongnoRow());
  const copies = [jongnoCopy, ...ROWS.map(compose)];

  for (const copy of copies) {
    fs.writeFileSync(join(imgDir, `promo-seoul-${copy.slug}-1.svg`), writeSvg(copy, 1), "utf8");
    fs.writeFileSync(join(imgDir, `promo-seoul-${copy.slug}-2.svg`), writeSvg(copy, 2), "utf8");
  }

  const names = fs.readdirSync(root).filter((n) => /^dist-seoul-.*\.html$/i.test(n));
  for (const file of names.sort()) {
    const m = file.match(/^dist-seoul-(.+)\.html$/);
    const districtName = m[1];
    const copy = copies.find((c) => c.name === districtName);
    if (!copy) throw new Error("메타 없음: " + districtName);
    const path = join(root, file);
    let html = fs.readFileSync(path, "utf8");
    const heroKind = html.includes('id="district-page-h1"') ? "shops" : "static";
    html = injectHtml(html, copy, heroKind);
    fs.writeFileSync(path, html, "utf8");
  }

  fixPromoAltUndefined(copies);

  console.log("SVG:", copies.length * 2, "files in images/");
  console.log("dist-seoul-*.html:", names.length, "pages processed");
}

function fixPromoAltUndefined(copies) {
  const bySlug = Object.fromEntries(copies.map((c) => [c.slug, c]));
  const names = fs.readdirSync(root).filter((n) => /^dist-seoul-.*\.html$/i.test(n));
  for (const file of names) {
    const path = join(root, file);
    let html = fs.readFileSync(path, "utf8");
    const next = html.replace(
      /<img src="images\/promo-seoul-([a-z]+)-1\.svg" alt="[^"]*출장마사지 — undefined 일대 안내"/g,
      (full, slug) => {
        const c = bySlug[slug];
        if (!c) return full;
        const alt = `${c.name}출장마사지 — ${c.a} 일대 안내`;
        return `<img src="images/promo-seoul-${slug}-1.svg" alt="${escAttr(alt)}"`;
      }
    );
    if (next !== html) fs.writeFileSync(path, next, "utf8");
  }
}

main();
