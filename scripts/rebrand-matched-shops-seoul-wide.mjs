/**
 * shops-outcall-matched: 종로 고정 문구 → 서울 전역 출장으로 통일
 * node scripts/rebrand-matched-shops-seoul-wide.mjs
 */
import fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const paths = [
  join(root, "data", "shops-outcall-matched.json"),
  join(root, "중요한정보", "shops-outcall-matched.json"),
];

/** id별 서울 전역 소개(주소·본문·후기 등 종로 지명 제거) */
const PACK = {
  seoul_instapretty_001: {
    address: "서울 전역 원룸·오피스텔·호텔·주택가 홈타이 출장",
    detailAddress:
      "서울 시내 어디든 방문 가능합니다. 지하철역 출구·건물 로비·주차장 중 만나기 편한 곳을 정해 주시면 이동 동선을 줄입니다. 야간·새벽은 수신 상태에 따라 달라질 수 있습니다.",
    description:
      "서울 전역을 오가며 하루를 보낸 분들을 위한 방문형 케어입니다. 장시간 걸음 뒤에는 종아리·발목부터, 책상·노트북 위주였다면 견갑·목 라인을 먼저 짚습니다. 실내 환기가 잘되면 오일 단계를 길게, 답답하면 건식 비중을 올려 드립니다.",
    greeting:
      "안녕하세요. 오늘은 ‘많이 걸었다’와 ‘많이 앉았다’ 중 어느 쪽에 가까우셨는지 한마디만 알려 주세요. 서울 전역 라인은 그에 맞춰 첫 손을 놓는 위치부터 정합니다.",
    staffInfo: "서울 전역 출장 경험 | 컨디션 맞춤 압 | 통화만으로 순서 안내",
    features: [
      "서울 전역 홈타이·호텔·오피스",
      "걷기·앉기 패턴에 맞춘 순서",
      "역 출구·로비 기준 만남 조율",
      "유선 연결 시 시간대 상담",
      "천연 오일·건식 병행 가능",
      "20대 라인 상담",
    ],
    reviews: [
      {
        author: "야근후님",
        rating: 5,
        date: "2026-05-21",
        reviewBody:
          "퇴근하고 숙소 들어와 서울 출장 불렀어요. 발목까지 무거운 줄 몰랐는데 아래부터 풀어 주니 어깨도 따라 가벼워졌습니다. 만남 지점만 문자로 정했더니 수월했어요.",
      },
      {
        author: "재택근무님",
        rating: 5,
        date: "2026-05-22",
        reviewBody:
          "모니터만 본 날이라 승모만 부탁했더니 그 라인만 길게 잡아 주셨습니다. 서울 전역이라 다음에도 같은 방식으로 부를 것 같아요.",
      },
    ],
    tags: ["서울", "서울 전역", "출장마사지", "홈타이", "20대"],
  },
  seoul_korean_pretty_001: {
    address: "서울 전역 주거·숙박·업무 공간 출장",
    detailAddress:
      "동·호·엘리베이터 번호를 알려 주시면 로비에서 만남까지 빨라집니다. 좁은 원룸도 가능한 자세만 미리 말씀해 주세요.",
    description:
      "서울 어디서든 한국 20대 라인으로 말이 통하는 상담을 드립니다. 첫 이용이어도 통화에서 코스명과 소요만 정하면 순서가 헷갈리지 않습니다. 장시간 이동 뒤엔 하체, 회의만 있었다면 상체 비중을 올립니다.",
    greeting: "오늘 가장 신경 쓰이는 부위 한 군데만 짧게 적어 주세요. 서울 전역은 그 한 줄로 시작 지점을 정합니다.",
    staffInfo: "서울 전역 | 한국 20대 라인 | 부위·시간 맞춤",
    features: [
      "서울 전역 방문",
      "한국 20대 라인 소통",
      "원룸·오피스텔 동선 익숙",
      "첫 이용 코스 안내",
      "야간 상담(수신 시)",
      "건식·오일 선택",
    ],
    reviews: [
      {
        author: "송파거주님",
        rating: 5,
        date: "2026-05-20",
        reviewBody: "집이 좁다고 하니 엎드리기 편한 쪽만 먼저 잡아 주셨어요. 서울 전역이라 주소만 정확히 주면 된다고 하셔서 편했습니다.",
      },
      {
        author: "마포야근님",
        rating: 5,
        date: "2026-05-23",
        reviewBody: "회의만 하루 종일이었다고 하니 목·어깨만 길게 받았어요. 다음에도 같은 라인으로 부를게요.",
      },
    ],
    tags: ["서울", "서울 전역", "출장마사지", "홈타이", "한국인"],
  },
  seoul_24hour_korean_japanese_001: {
    address: "서울 전역 24시간 상담 가능 출장",
    detailAddress:
      "새벽·심야는 문자로 주소·만남 위치를 남겨 주시면 연결 속도가 빨라집니다. 숙박 시설은 건물명과 지도 핀을 함께 보내 주세요.",
    description:
      "서울 전역에서 한국식 직선 압과 일본식 리듬을 섞는 혼혈 라인입니다. 처음엔 호흡에 맞춰 천천히 올리고, 야근 직후엔 목·등을 먼저 짚는 편이 많습니다.",
    greeting: "지금 시간대와 가장 뻐근한 곳(목·허리·다리 중)만 적어 주세요. 서울 전역 24시 라인은 그 두 가지로 순서를 잡습니다.",
    staffInfo: "서울 전역 24시 | 한·일 혼혈 | 심야 문자 확인",
    features: [
      "서울 전역 24시",
      "한·일 혼합 손맛",
      "심야·새벽 문자 안내",
      "숙박·원룸 핀 병행",
      "야근 후 상체 케어",
      "유선 상담",
    ],
    reviews: [
      {
        author: "서초새벽님",
        rating: 5,
        date: "2026-05-18",
        reviewBody: "문자 답 오고 나서 시간 맞췄어요. 혼혈 스타일이라 손끝이 부드럽고 허리만 부탁했는데 그 라인만 길게 받았습니다.",
      },
      {
        author: "은평주말님",
        rating: 5,
        date: "2026-05-24",
        reviewBody: "주말 낮에만 가능하다고 했더니 그 시간에 맞춰 주셨어요. 서울 전역이라 역 앞에서 만나기로 했더니 찾기 쉬웠어요.",
      },
    ],
    tags: ["서울", "서울 전역", "출장마사지", "24시", "한일혼혈"],
  },
  seoul_vvip_goddess_korean_001: {
    address: "서울 전역 고급 주거·레지던스·호텔 VIP 출장",
    detailAddress:
      "게이트·로비 통과 방식이 건물마다 다릅니다. 경비실 이름·QR 필요 여부를 통화 때 함께 남겨 주세요. 실내가 건조하면 오일 농도부터 맞춥니다.",
    description:
      "서울 전역 고층·단지에서도 말이 통하는 한국인 VIP 라인으로 진행합니다. 시간을 넉넉히 쓸수록 어깨·등 라인이 차분히 내려가고, 조명·냉방 선호만 정해 두시면 흐름이 끊기지 않습니다.",
    greeting: "‘조용히 풀기’가 우선인지, ‘깊게 풀기’가 우선인지 골라 주세요. 서울 VIP 라인은 그 선택에 맞춰 시간 배분을 다시 짭니다.",
    staffInfo: "서울 전역 VIP | 한국인 케어 | 게이트·로비 안내",
    features: [
      "서울 전역 VIP",
      "한국인 스웨디시",
      "고층·단지 동선",
      "실내 건조 반영",
      "조명·냉방 맞춤",
      "넉넉한 시간 권장",
    ],
    reviews: [
      {
        author: "한남레지던스님",
        rating: 5,
        date: "2026-05-19",
        reviewBody: "로비 안내만 미리 보냈더니 지연 없이 왔어요. 스웨 후 어깨가 한동안 덜 팽팽했습니다.",
      },
      {
        author: "여의오피스님",
        rating: 5,
        date: "2026-05-22",
        reviewBody: "조명 어둡게 해 달라고 했더니 그대로 맞춰 주셨고 말은 짧게 해 주셔서 집중해서 받았습니다.",
      },
    ],
    tags: ["서울", "서울 전역", "출장마사지", "VIP", "한국인"],
  },
  seoul_tpanty_callgirl_001: {
    address: "서울 전역 테마형 단계 코스 출장",
    detailAddress:
      "테마 코스는 통화에서 단계와 소요를 먼저 확정합니다. 붐비는 시간대엔 역 출구 기준 만남을 권합니다.",
    description:
      "서울 전역에서 건식으로 긴장을 낮춘 뒤 이완으로 넘어가는 흐름을 기본으로 합니다. 낮과 밤 이동 패턴이 다를 때는 만남 위치 하나만 정해 두면 지연이 줄어듭니다.",
    greeting: "먼저 ‘오늘은 건식만 할지, 뒤에 이완도 넣을지’ 정해 주세요. 서울 전역 테마 라인은 순서만 정해 두면 받는 내내 편합니다.",
    staffInfo: "서울 전역 테마 | 단계형 코스 | 출구 합류",
    features: [
      "서울 전역 테마 출장",
      "단계형 코스 상담",
      "역 출구 합류",
      "건식 후 이완 순서",
      "혼잡 시간 조율",
      "통화로 코스 확정",
    ],
    reviews: [
      {
        author: "토요일관람님",
        rating: 5,
        date: "2026-05-20",
        reviewBody: "하루 종일 걸었다고 하니 종아리부터 잡아 주셨어요. 건식 길게 하고 뒤는 짧게 하자고 했더니 그대로였습니다.",
      },
      {
        author: "강남숙소님",
        rating: 5,
        date: "2026-05-21",
        reviewBody: "역 앞에서 만나자 했더니 금방 찾았습니다. 단계 설명이 통화 때 끝나서 현장에서 헷갈릴 일이 없었어요.",
      },
    ],
    tags: ["서울", "서울 전역", "출장마사지", "테마", "홈타이"],
  },
  seoul_ukraine_001: {
    address: "서울 전역 한강변·공원·주거 오피스 출장",
    detailAddress: "산책·러닝 직후라면 샤워 여부만 알려 주세요. 오피스텔은 동·호와 엘리베이터가 여러 대이면 동 이름까지 부탁드립니다.",
    description:
      "서울 전역에서 산책·이동 뒤 종아리가 먼저 말하는 경우가 많습니다. 호흡에 맞춰 박자를 나누고, 킥보드·자전거 이동 날에는 허벅지 앞쪽을 짧게 여러 번 풀어 드립니다.",
    greeting: "한강·공원을 많이 걸었는지, 카페·실내에만 있었는지 알려 주세요. 서울 전역 유러피언 라인은 그에 맞춰 하체 비중을 조절합니다.",
    staffInfo: "서울 전역 | 산책·이동 후 하체 | 동·호 안내",
    features: [
      "서울 전역 방문",
      "산책·러닝 후 하체",
      "오피스텔 동선",
      "유선 상담",
      "스케줄 안내",
      "홈타이",
    ],
    reviews: [
      {
        author: "반포산책님",
        rating: 5,
        date: "2026-05-19",
        reviewBody: "공원만 돌았다고 하니 발바닥부터 시원하게 풀어 주셨어요. 동 이름 문자로 보냈더니 엘리베이터 앞에서 만났습니다.",
      },
      {
        author: "마포러닝님",
        rating: 5,
        date: "2026-05-24",
        reviewBody: "러닝 후라 햄스트링만 짧게 부탁했더니 그 라인만 반복해서 풀어 주셨어요. 서울 전역이라 다음 주에도 부를게요.",
      },
    ],
    tags: ["서울", "서울 전역", "출장마사지", "유러피언", "홈타이"],
  },
  seoul_tokyo_hot_001: {
    address: "서울 전역 야간·막차 시간대 출장",
    detailAddress: "야간·막차 시간대는 출구 번호 하나만 정해도 합류가 빠릅니다. 술자리 전·후 여부만 알려 주시면 압 안내가 달라집니다.",
    description:
      "서울 전역 야간 동선은 어깨가 먼저 뭉치거나, 술자리 전엔 목·등이 예민해지는 경우가 많습니다. 한·일 혼합 라인이라 설명을 짧게 해도 따라오기 쉬운 편입니다.",
    greeting: "막차까지 남은 시간과 술자리 전인지 후인지 짧게 알려 주세요. 서울 전역 야간 라인은 그에 맞춰 속도를 맞춥니다.",
    staffInfo: "서울 전역 | 한·일 혼합 | 야간 합류",
    features: [
      "서울 전역 야간",
      "한·일 혼합",
      "역 출구 합류",
      "심야 상담",
      "막차 시간 조율",
      "홈타이",
    ],
    reviews: [
      {
        author: "신촌심야님",
        rating: 5,
        date: "2026-05-20",
        reviewBody: "막차 끊긴 뒤라 숨만 헐떡였는데 혼혈 스타일로 받으니 어깨가 넓게 풀렸어요. 역 스크린도어 앞에서 만나자 하셔서 찾기 쉬웠습니다.",
      },
    ],
    tags: ["서울", "서울 전역", "출장마사지", "야간", "한일혼혈"],
  },
  seoul_wonjeong_001: {
    address: "서울 전역 상가·오피스 밀집 일대 출장",
    detailAddress: "골목 숙소는 건물명과 지도 핀을 문자로 함께 보내 주세요. 고층 오피스텔은 동 이름·층수를 꼭 적어 주세요.",
    description:
      "서울 전역에서 통로를 오래 걷거나 키보드만 본 날이 겹치기 쉽습니다. 시간이 짧으면 목·승모만, 여유가 있으면 손목·전완까지 이어 붙입니다.",
    greeting: "받을 수 있는 시간이 40분 안쪽인지 한 시간 넘는지 알려 주세요. 서울 전역 원정 라인은 시간에 따라 넣는 부위 수가 달라집니다.",
    staffInfo: "서울 전역 | 골목·고층 안내 | 부분·전신 협의",
    features: [
      "서울 전역 방문",
      "상가·오피스 동선",
      "짧은 시간 부분 집중",
      "키보드·이동 피로",
      "365일 상담",
      "지정 장소 방문",
    ],
    reviews: [
      {
        author: "구로사무실님",
        rating: 5,
        date: "2026-05-21",
        reviewBody: "하루 종일 키보드만 쳤다고 하니 손목·견갑만 오래 풀어 주셨어요. 핀 보냈더니 전화 한 통 없이 왔습니다.",
      },
    ],
    tags: ["서울", "서울 전역", "출장마사지", "원정녀", "홈타이"],
  },
  seoul_japan_mixed_001: {
    address: "서울 전역 외국인 밀집 상가·역세권 출장",
    detailAddress: "밤 시간대는 창문 닫힘 여부만 알려 주셔도 진행 속도를 맞춥니다. 골목 숙소는 호수·층을 꼭 적어 주세요.",
    description:
      "서울 전역에서 낮엔 상가 통로를 오래 걷고 밤엔 자세가 바뀌는 패턴이 많습니다. 타이처럼 넓게 풀기와 스웨처럼 천천히 이어 붙이기 사이에서 몸 느낌만 말해 주시면 첫 손 위치가 달라집니다.",
    greeting: "가까운 역 이름 하나만 골라 주세요. 서울 전역 재팬 혼혈 라인은 그 한 줄로 합류 지점을 정합니다.",
    staffInfo: "서울 전역 혼혈 | 역·골목 합류 | 타이·스웨 단계",
    features: [
      "서울 전역 역세권",
      "타이·스웨 단계 선택",
      "역 출구 합류",
      "원룸 동·호 안내",
      "야간 소음 반영",
      "홈타이 방문",
    ],
    reviews: [
      {
        author: "이태원근무님",
        rating: 5,
        date: "2026-05-22",
        reviewBody: "상가만 돌았는데도 종아리가 팽팽했어요. 역 몇 번 출구인지 문자로만 정했는데 합류가 빨랐습니다.",
      },
    ],
    tags: ["서울", "서울 전역", "출장마사지", "재팬혼혈", "타이"],
  },
  seoul_pretty_tangle_001: {
    address: "서울 전역 공원·야외 일정 후 출장",
    detailAddress: "야외 일정 뒤에는 햇볕·땀 상태만 알려 주세요. 짧은 시간이면 시작 시각을 먼저 말씀해 주세요.",
    description:
      "서울 전역에서 낮엔 산책·행사를 돌고 밤엔 숙소로 바로 들어가는 패턴이 많습니다. ‘목이 더 급하다’처럼 한 줄만 덧붙이면 스포츠 압과 오일 순서를 바꿔 드립니다.",
    greeting: "공원·야외를 더 돌았는지, 사무실·숙소에 오래 앉았는지 알려 주세요. 서울 전역 탱글 라인은 그에 맞춰 순서를 잡습니다.",
    staffInfo: "서울 전역 | 산책·행사 패턴 | 순서 조율",
    features: [
      "서울 전역 방문",
      "야외 후 하체",
      "야근 후 상체",
      "믹스 코스 상담",
      "원룸 방문",
      "유선 상담",
    ],
    reviews: [
      {
        author: "올림픽공원산책님",
        rating: 5,
        date: "2026-05-21",
        reviewBody: "공원 한 바퀴만 돌았다고 하니 무릎만 짧게 풀어 주셨어요. 간판 사진 보내니 전화 없이 문 앞까지 왔습니다.",
      },
    ],
    tags: ["서울", "서울 전역", "출장마사지", "탱글", "홈타이"],
  },
  seoul_bikini_outcall_001: {
    address: "서울 전역 한강·공원 인근 출장",
    detailAddress: "야외 일정이 겹치면 샤워 여부만 알려 주셔도 됩니다. 산책 직후엔 발·종아리부터 짚는 경우가 많습니다.",
    description:
      "서울 전역 산책 뒤엔 종아리·발바닥이 먼저 말을 합니다. 타이 비중을 올릴지 아로마 비중을 올릴지 당일 컨디션에 맞춰 조절합니다.",
    greeting: "야외를 많이 걸었는지, 역 주변만 짧게 오셨는지 알려 주세요. 서울 전역 비키니 라인은 그에 맞춰 비중을 나눕니다.",
    staffInfo: "서울 전역 | 타이·아로마 비중 | 역 합류",
    features: [
      "서울 전역 방문",
      "산책·러닝 후 종아리·발",
      "역 이름 합류",
      "태국식·오일 선택",
      "VIP 별도 상담",
      "홈 방문형",
    ],
    reviews: [
      {
        author: "한강산책후님",
        rating: 5,
        date: "2026-05-22",
        reviewBody: "산책만 하고 와서 발바닥이 화끈했는데 타이식으로 먼저 내려가니 저녁까지 걸음이 가벼웠어요. 역 쪽에서 만나자 하셔서 길 물어볼 일이 없었습니다.",
      },
    ],
    tags: ["서울", "서울 전역", "출장마사지", "비키니", "타이"],
  },
  seoul_vip_20s_healing_korean_homecare_001: {
    address: "서울 전역 고층 오피스텔·레지던스 출장",
    detailAddress: "냉방이 센 실내는 건조하다고만 말해 주셔도 오일 농도부터 맞춥니다. 지하주차장과 로비가 연결되면 통로 이름을 알려 주세요.",
    description:
      "서울 전역 고층에서 회의와 이동이 겹쳐 목만 남고 몸은 괜찮다거나 허리만 묵직하다처럼 부위가 쏠립니다. 스웨디시 한 코스 안에서도 위·아래 시간 배분을 조금씩 바꿔 드립니다.",
    greeting: "실내가 건조한 편인지, 에어컨 바람이 얼굴로 직접 오는지 한 가지만 알려 주세요. 서울 전역 VIP 홈케어는 그에 맞춰 건식·스웨 비중을 맞춥니다.",
    staffInfo: "서울 전역 고층 | 한국인 스웨 | 건조 실내 오일",
    features: [
      "서울 전역 VIP",
      "스웨디시 집중",
      "실내 건조 반영",
      "지하 통로·로비 안내",
      "한국인 케어",
      "야간·새벽 여유 권장",
    ],
    reviews: [
      {
        author: "여의오피스텔님",
        rating: 5,
        date: "2026-05-20",
        reviewBody: "에어컨 바람이 얼굴로 온다고 하니 스웨 시간을 줄이고 건식 비중을 올려 주셨어요. 로비 동 이름만 알려 줬더니 복도에서 금방 만났습니다.",
      },
    ],
    tags: ["서울", "서울 전역", "출장마사지", "VIP", "스웨디시"],
  },
  seoul_sohot_outcall_001: {
    address: "서울 전역 야간 전용 출장",
    detailAddress: "야간 창에만 확정됩니다. 막차 시간과 술자리 전·후 여부만 알려 주시면 압 안내가 달라집니다.",
    description:
      "서울 전역 야간에는 어깨가 먼저 뭉치거나, 술자리 전엔 목·등이 예민해지는 경우가 많습니다. 한국 라인은 넓게 풀기, 일본 라인은 리듬을 짧게 끊듯 이완하는 식으로 손맛이 달라집니다.",
    greeting: "지금 시각, 막차까지 남은 시간, 술자리 전인지 후인지 세 가지만 알려 주세요. 서울 전역 쏘핫 라인은 그 세 가지로 속도를 맞춥니다.",
    staffInfo: "서울 전역 야간 | 한국·일본 스웨 | 역 합류",
    features: [
      "서울 전역 야간 창",
      "한국·일본 스웨 선택",
      "역 출구 합류",
      "심야 상담",
      "홈 방문",
      "막차 조율",
    ],
    reviews: [
      {
        author: "강남심야님",
        rating: 5,
        date: "2026-05-21",
        reviewBody: "막차 끊긴 뒤라 숨만 헐떡였는데 한국 라인으로 받으니 어깨가 넓게 풀렸어요. 역 스크린도어 앞에서 만나자 하셔서 사람 속에서도 금방 찾았습니다.",
      },
    ],
    tags: ["서울", "서울 전역", "출장마사지", "야간", "쏘핫"],
  },
  seoul_24hour_sexy_outcall_001: {
    address: "서울 전역 역세권 호텔·오피스 출장",
    detailAddress: "호텔은 지하 연결 출구, 오피스는 건물 별칭·층을 알려 주세요. 회의 직후엔 앉아 있던 대략 시간만 적어 주셔도 스포츠 비중이 달라집니다.",
    description:
      "서울 전역 호텔·오피스는 새벽 출장과 늦은 회식이 겹칩니다. 짧은 시간이면 스포츠로 뭉침만 빼고, 숙소에서 길게 쉴 계획이면 스웨 쪽으로 이어 붙이는 식으로 목표만 바꿔 맞춥니다.",
    greeting: "빨리 풀고 자야 하는 날인지, 내일까지 천천히 풀어도 되는 날인지 알려 주세요. 서울 전역 24시 라인은 그에 맞춰 코스 길이를 맞춥니다.",
    staffInfo: "서울 전역 24시 | 호텔·오피스 | 지하 연결",
    features: [
      "서울 전역 24시",
      "호텔·오피스 방문",
      "스포츠·오일·스웨",
      "믹스 코스 문의",
      "한국인 스웨",
      "지하 통로 안내",
    ],
    reviews: [
      {
        author: "역삼호텔님",
        rating: 5,
        date: "2026-05-19",
        reviewBody: "새벽 체크인이라 역 지하 상가 안내 문자만 받고 만났어요. 앞쪽은 스포츠로 눌러 당기고 뒤는 스웨만 받았더니 다음 날 회의 자세가 한결 편했습니다.",
      },
    ],
    tags: ["서울", "서울 전역", "출장마사지", "24시", "호텔"],
  },
  seoul_bj_sexy_outcall_001: {
    address: "서울 전역 숙박 밀집·원룸 일대 출장",
    detailAddress: "숙박 밀집 구간은 간판이 비슷할 때가 많습니다. 건물명과 지번 핀을 같이 보내 주세요. 건식만 원하시는 날도 미리 말씀해 주세요.",
    description:
      "서울 전역에서 걷다 보면 종아리가, 장시간 앉으면 견갑이 먼저 굳습니다. 한국 라인은 압을 조금 더 직선적으로, 타이 라인은 리듬을 길게 이어 붙입니다.",
    greeting: "건식으로만 끝내실지, 뒤에 스웨를 붙일지 통화에서 한 번만 정해 주세요. 서울 전역 믹스 라인은 그 한 번으로 손맛을 고릅니다.",
    staffInfo: "서울 전역 | 한국·타이 믹스 | 건식 선행",
    features: [
      "서울 전역 방문",
      "건식·스웨 단계",
      "한국·타이 라인",
      "건물명·핀 안내",
      "24시 상담",
      "VVIP 믹스 문의",
    ],
    reviews: [
      {
        author: "영등포숙소님",
        rating: 5,
        date: "2026-05-22",
        reviewBody: "간판 세 개가 비슷해서 사진까지 보냈더니 골목 안까지 바로 오셨어요. 건식으로 견갑이 먼저 풀리고 이어진 스웨로 숨이 깊어졌습니다.",
      },
    ],
    tags: ["서울", "서울 전역", "출장마사지", "건식", "스웨디시"],
  },
  seoul_lingerie_hole_outcall_001: {
    address: "서울 전역 주거·게스트하우스 출장",
    detailAddress: "좁은 실내는 의자·침대 중 편한 쪽만 알려 주세요. 차 진입이 어려운 골목은 근처 편의점 앞에서 도보 합류를 안내합니다.",
    description:
      "서울 전역 주거가에서 경사와 좁은 골목이 섞인 날과 오래 앉은 날의 피로가 다릅니다. 건식으로 호흡을 넓히는 쪽이 익숙하면 길게, 향·오일이 부담스러우면 스웨 시간만 줄여 드립니다.",
    greeting: "언덕·계단을 많이 올랐는지, 평지를 많이 걸었는지 알려 주세요. 서울 전역 라인은 그에 따라 하체 비중부터 달리합니다.",
    staffInfo: "서울 전역 주거 | 건식·스웨 비율 | 도보 합류",
    features: [
      "서울 전역 방문",
      "건식 위주 가능",
      "스웨 시간 단축 요청",
      "좁은 실내 동선",
      "편의점 앞 합류",
      "유선 상담",
    ],
    reviews: [
      {
        author: "원룸거주님",
        rating: 5,
        date: "2026-05-20",
        reviewBody: "방이 길쭉해서 엎드리기 불편하다고 하니 옆으로 누워 견갑만 길게 풀어 주셨어요. 골목 입구 약국 앞에서 만나자 해서 찾는 데 부담이 없었습니다.",
      },
    ],
    tags: ["서울", "서울 전역", "출장마사지", "홈타이", "건식"],
  },
};

function fixCourses(courses) {
  if (!Array.isArray(courses)) return;
  for (const c of courses) {
    if (typeof c.category === "string") {
      c.category = c.category.replace(/종로 출장/g, "서울 출장");
    }
    for (const it of c.items || []) {
      if (typeof it.description === "string") {
        it.description = it.description.replace(/종로 일대 방문형/g, "서울 일대 방문형");
      }
    }
  }
}

function scrubRemaining(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/서울 종로구/g, "서울 전역")
    .replace(/종로 출장/g, "서울 출장")
    .replace(/종로 일대/g, "서울 일대")
    .replace(/종로 전용/g, "서울 전역")
    .replace(/종로 한복판/g, "서울 시내")
    .replace(/종로 남측/g, "서울 남쪽 생활권")
    .replace(/종로 북동/g, "서울 북동 생활권")
    .replace(/종로 서측/g, "서울 서측 생활권")
    .replace(/종로 중심가/g, "서울 도심")
    .replace(/종로 중북/g, "서울 도심 북쪽")
    .replace(/종로 코어/g, "서울 도심 코어")
    .replace(/종로 골목/g, "좁은 골목")
    .replace(/종로 안/g, "서울 시내")
    .replace(/종로5가/g, "서울 도심")
    .replace(/종로3가역/g, "지하철역 인근")
    .replace(/종로3·4가/g, "도심 역세권")
    .replace(/종로 한복판 코스/g, "서울 전역 코스")
    .replace(/종로구/g, "서울 전역")
    .replace(/(?<!세)종로(?!대로)/g, "서울");
}

function deepScrub(val) {
  if (typeof val === "string") return scrubRemaining(val);
  if (Array.isArray(val)) return val.map(deepScrub);
  if (val && typeof val === "object") {
    const o = {};
    for (const k of Object.keys(val)) o[k] = deepScrub(val[k]);
    return o;
  }
  return val;
}

function applyPack(shop) {
  const p = PACK[shop.id];
  if (!p) {
    console.warn("No PACK for", shop.id);
    return;
  }
  shop.district = "서울";
  Object.assign(shop, {
    address: p.address,
    detailAddress: p.detailAddress,
    description: p.description,
    greeting: p.greeting,
    staffInfo: p.staffInfo,
    features: [...p.features],
    reviews: JSON.parse(JSON.stringify(p.reviews)),
    tags: [...new Set(p.tags)],
  });
  fixCourses(shop.courses);
  const scrubbed = deepScrub(shop);
  Object.assign(shop, scrubbed);
  shop.district = "서울";
  shop.tags = [...new Set(PACK[shop.id].tags)];
}

/** shop-card-종로-outcall.js 생성용 — build-jongno-district-data.mjs 와 동일 id·파일 매핑 */
const CARD_EXTRA = {
  seoul_instapretty_001: { id: 9, country: "korea,Thailand,japan", file: "company-seoul-instapretty-outcall.html" },
  seoul_korean_pretty_001: { id: 10, country: "korea,Thailand,japan", file: "company-seoul-korean-pretty-outcall.html" },
  seoul_24hour_korean_japanese_001: { id: 11, country: "korea,japan,Thailand", file: "company-seoul-24hour-korean-japanese-outcall.html" },
  seoul_vvip_goddess_korean_001: { id: 12, country: "korea", file: "company-seoul-vvip-goddess-korean-outcall.html" },
  seoul_tpanty_callgirl_001: { id: 13, country: "korea,Thailand", file: "company-seoul-tpanty-callgirl-outcall.html" },
  seoul_ukraine_001: { id: 15, country: "korea,russia,Thailand", file: "company-seoul-ukraine-outcall.html" },
  seoul_tokyo_hot_001: { id: 16, country: "korea,japan", file: "company-seoul-tokyo-hot-outcall.html" },
  seoul_wonjeong_001: { id: 17, country: "korea,japan", file: "company-seoul-wonjeong-outcall.html" },
  seoul_japan_mixed_001: { id: 18, country: "korea,japan", file: "company-seoul-japan-mixed-outcall.html" },
  seoul_pretty_tangle_001: { id: 14, country: "korea,japan,Thailand", file: "company-seoul-pretty-tangle-outcall.html" },
  seoul_bikini_outcall_001: { id: 23, country: "Thailand,japan", file: "company-seoul-bikini-outcall.html" },
  seoul_vip_20s_healing_korean_homecare_001: { id: 24, country: "korea", file: "company-seoul-vip-20s-healing-korean-homecare-outcall.html" },
  seoul_sohot_outcall_001: { id: 25, country: "korea,japan", file: "company-seoul-sohot-outcall.html" },
  seoul_24hour_sexy_outcall_001: { id: 26, country: "korea,japan,Thailand", file: "company-seoul-24hour-sexy-outcall.html" },
  seoul_bj_sexy_outcall_001: { id: 31, country: "korea,Thailand", file: "company-seoul-bj-sexy-outcall.html" },
  seoul_lingerie_hole_outcall_001: { id: 33, country: "korea,Thailand", file: "company-seoul-lingerie-hole-outcall.html" },
};

function cardType(s) {
  const t = String(s.type || "출장마사지");
  if (t === "outcall") return "출장마사지";
  return t;
}

function fmtCardReviews(reviews) {
  return (reviews || []).map((r) => ({
    author: r.author,
    rating: r.rating,
    date: r.date,
    review: r.reviewBody || r.review || r.content || "",
  }));
}

function buildCardBlockJs(s) {
  const ex = CARD_EXTRA[s.id];
  if (!ex) throw new Error("CARD_EXTRA 누락: " + s.id);
  const name = s.name;
  const price = s.price || "";
  const alt = `서울 출장마사지 ${name} — ${price}`;
  const services = Array.isArray(s.services) && s.services.length ? s.services : ["출장마사지"];
  const o = {
    id: ex.id,
    shopDetailId: s.id,
    name,
    type: cardType(s),
    country: ex.country,
    region: s.region || "서울",
    district: s.district || "서울",
    address: s.address || "",
    detailAddress: s.detailAddress || "",
    phone: s.phone || "",
    rating: s.rating != null ? s.rating : 4.9,
    reviewCount:
      s.reviewCount != null ? s.reviewCount : (s.reviews && s.reviews.length) || 0,
    price,
    description: s.description || "",
    image: s.image || "",
    alt,
    services,
    operatingHours: s.operatingHours || "",
    file: ex.file,
    showHealingShop: true,
    greeting: s.greeting || "",
    reviews: fmtCardReviews(s.reviews),
  };
  return (
    "  " +
    JSON.stringify(o, null, 2)
      .split("\n")
      .map((line, i) => (i === 0 ? line : "  " + line))
      .join("\n")
  );
}

function writeShopCardJongnoJs(data) {
  const cardPath = join(root, "data", "shop-card-종로-outcall.js");
  const importantPath = join(root, "중요한정보", "shop-card-종로-outcall.js");
  const header =
    "// 업체 카드 — shops-outcall-matched·상세와 동기화(서울 전역 문구)\n" +
    "// 생성: scripts/rebrand-matched-shops-seoul-wide.mjs\n" +
    "window.outcallShopCardData = [\n";
  const body = data.shops.map((s) => buildCardBlockJs(s) + ",").join("\n\n");
  const out = header + body + "\n];\n";
  fs.writeFileSync(cardPath, out, "utf8");
  if (fs.existsSync(join(root, "중요한정보"))) {
    fs.writeFileSync(importantPath, out, "utf8");
  }
}

function main() {
  const dataPath = join(root, "data", "shops-outcall-matched.json");
  const raw = fs.readFileSync(dataPath, "utf8");
  const data = JSON.parse(raw);

  for (const shop of data.shops || []) {
    applyPack(shop);
    shop.reviewCount = Array.isArray(shop.reviews) ? shop.reviews.length : shop.reviewCount;
  }

  const outJson = JSON.stringify(data, null, 2) + "\n";
  for (const p of paths) {
    if (fs.existsSync(p)) fs.writeFileSync(p, outJson, "utf8");
  }

  const jsOut =
    "window.shopsDataOutcallMatched = " + JSON.stringify(data, null, 2) + ";\n";
  fs.writeFileSync(join(root, "data", "shops-outcall-matched.js"), jsOut, "utf8");
  fs.writeFileSync(join(root, "data", "shops-outcall-종로-Details.js"), jsOut, "utf8");

  writeShopCardJongnoJs(data);

  console.log(
    "Updated shops-outcall-matched (json×2, js, 종로-Details.js), shop-card-종로-outcall.js, shops:",
    data.shops.length
  );
}

main();
