import type {
  Wish,
  RollingOrb,
  MisfortuneSpirit,
  FlowerType,
  WishSealId,
  GardenItemId,
} from '../types/wish';
import { BRANCH_POSITIONS, STAR_POSITIONS } from './terrain';

export const TARGET_BLESSINGS = 10; // 10번의 응원이 모여야 별 승천 개방

export const WISH_KARMA_COST = 50;      // 기원 인장 올리기 50공덕
export const WISH_BEAN_KARMA_COST = 35; // 붉은 팥 1알 사용 시 35공덕 + 초기 기운 +3
export const BLESS_KARMA_COST = 5;      // 이웃 소원 응원 시 5공덕 소모 (보시 보너스 +7 반환)

// 5~10분 몰입형 보상화 개화 단계
export const KARMA_THRESHOLDS = {
  SPROUT: 25, // 1단계: 새싹
  BUD: 60,    // 2단계: 꽃봉오리
  BLOOM: 100, // 3단계: 오늘의 보상화 만개 & 운세 부적 해금!
};

export const FLOWER_TYPES: FlowerType[] = [
  'white_lotus',
  'pink_lotus',
  'peony',
  'gold_plum',
  'blue_bosang',
];

export const FLOWER_NAMES: Record<FlowerType, string> = {
  white_lotus: '🪷 백련화',
  pink_lotus: '🌸 홍련화',
  peony: '🌺 모란화',
  gold_plum: '🌼 황매화',
  blue_bosang: '💠 청보상화',
};

export interface DailyFortuneInfo {
  title: string;
  hanja: string;
  summary: string;
  detail: string;
  luckyItem: string;
  luckyPlace: string;
  bgColor: string;
  accentColor: string;
}

export const DAILY_FORTUNES: Record<FlowerType, DailyFortuneInfo> = {
  white_lotus: {
    title: '청정무구(淸淨無垢) · 백련화의 날',
    hanja: '淸淨萬福',
    summary: '마음의 먼지가 씻겨 내려가고 뜻밖의 평안과 귀한 소식이 찾아옵니다.',
    detail:
      '어지럽던 고민이 싸리빗자루에 쓸려가듯 맑아지는 하루입니다. 서두르지 않고 순리대로 걸어가면 오후 무렵 반가운 연락이나 작은 행운이 발걸음을 멈추게 할 것입니다.',
    luckyItem: '따뜻한 차 한 잔과 흰색 소품',
    luckyPlace: '고즈넉한 골목길 · 나무 그늘 아래',
    bgColor: '#f8fafc',
    accentColor: '#0f766e',
  },
  pink_lotus: {
    title: '자비량연(慈悲良緣) · 홍련화의 날',
    hanja: '良緣和合',
    summary: '다정한 인연의 기운이 만개하여 주변 사람들과 웃음꽃이 피어납니다.',
    detail:
      '내가 먼저 건넨 따뜻한 눈빛과 미소가 배가 되어 돌아오는 날입니다. 소중한 사람과 함께 산책하거나 작은 선물을 나누면 막혔던 관계도 봄눈 녹듯 풀려나갑니다.',
    luckyItem: '붉은 팥 디저트 · 분홍빛 키링',
    luckyPlace: '황리단길 산책로 · 아늑한 카페',
    bgColor: '#fdf2f8',
    accentColor: '#be185d',
  },
  peony: {
    title: '부귀영화(富貴榮華) · 모란화의 날',
    hanja: '富貴大吉',
    summary: '풍요와 성취의 기운이 머리 위에 가득 차올라 하는 일마다 빛이 납니다.',
    detail:
      '오랫동안 공들여온 일에서 마침내 탐스러운 결실이 맺히는 운수 대통의 날입니다. 자신감을 가지고 원하는 바를 추진하면 기대 이상의 성과를 거두게 됩니다.',
    luckyItem: '황금빛 장식 · 동전 지갑',
    luckyPlace: '활기찬 상점가 · 복쓸싸리 쇼룸',
    bgColor: '#fff1f2',
    accentColor: '#b91c1c',
  },
  gold_plum: {
    title: '지혜광명(智慧光明) · 황매화의 날',
    hanja: '智慧亨通',
    summary: '막혔던 생각을 뚫어주는 반짝이는 영감과 재복이 함께 깃듭니다.',
    detail:
      '어려운 문제 앞에서도 명쾌한 해답이 떠오르는 총명한 하루입니다. 새로운 계획을 세우거나 중요한 결정을 내리기에 더없이 좋은 길일(吉日)입니다.',
    luckyItem: '노란색 메모지 · 달콤한 간식',
    luckyPlace: '햇살이 잘 드는 창가 · 서점',
    bgColor: '#fefce8',
    accentColor: '#b45309',
  },
  blue_bosang: {
    title: '신묘제액(神妙除厄) · 청보상화의 날',
    hanja: '除厄招福',
    summary: '나쁜 액운은 멀리 물러가고 신비로운 수호 기운이 하루를 지켜줍니다.',
    detail:
      '복쓸싸리의 강력한 액막이 결계가 당신의 오늘을 감싸고 있습니다. 작은 실수나 방해에도 흔들리지 않고 전화위복의 기회를 잡게 되는 특별한 날입니다.',
    luckyItem: '액막이 팥 주머니 · 푸른색 소품',
    luckyPlace: '탁 트인 공원 · 바람이 부는 언덕',
    bgColor: '#f0f9ff',
    accentColor: '#1d4ed8',
  },
};

export const O2O_REWARD_CODES: Record<
  string,
  { title: string; karma: number; beans: number; badge: string }
> = {
  황리단길: {
    title: '🏮 황리단길 복쓸싸리 성지 방문 인증',
    karma: 100,
    beans: 5,
    badge: '👑 성지순례 금관',
  },
  팥키링: {
    title: '🫘 경주 붉은팥 액막이 키링 소장 인증',
    karma: 100,
    beans: 8,
    badge: '🧿 액막이 수호자',
  },
  복쓸싸리: {
    title: '🐾 복쓸싸리 스페셜 프렌즈 기프트',
    karma: 100,
    beans: 5,
    badge: '✨ 복쓸 프렌즈',
  },
};

export interface WishSealInfo {
  id: WishSealId;
  icon: string;
  hanja: string;
  title: string;
  desc: string;
  defaultColor: string;
}

export const WISH_SEALS: WishSealInfo[] = [
  {
    id: 'fortune',
    icon: '🧧',
    hanja: '萬福',
    title: '홍복 · 만사형통',
    desc: '바라는 모든 일이 막힘없이 술술 풀리기를 기원합니다',
    defaultColor: '#e53935',
  },
  {
    id: 'wealth',
    icon: '💰',
    hanja: '財福',
    title: '재복 · 풍요성취',
    desc: '넉넉한 결실과 큰 성취가 가득 깃들기를 기원합니다',
    defaultColor: '#fb8c00',
  },
  {
    id: 'health',
    icon: '🌿',
    hanja: '無病',
    title: '무병 · 심신평안',
    desc: '몸과 마음이 늘 건강하고 평온하기를 기원합니다',
    defaultColor: '#43a047',
  },
  {
    id: 'love',
    icon: '🌸',
    hanja: '良緣',
    title: '인연 · 가내화목',
    desc: '소중한 사람들과 따뜻한 웃음꽃이 피어나기를 기원합니다',
    defaultColor: '#d81b60',
  },
  {
    id: 'wisdom',
    icon: '🎓',
    hanja: '智慧',
    title: '학업 · 지혜합격',
    desc: '맑은 지혜로 목표한 바를 당당히 이루기를 기원합니다',
    defaultColor: '#1e88e5',
  },
  {
    id: 'ward',
    icon: '🌊',
    hanja: '除厄',
    title: '액막이 · 근심소멸',
    desc: '모든 액운과 근심이 싸리빗자루에 쓸려 사라지기를 기원합니다',
    defaultColor: '#8e24aa',
  },
];

export interface GardenCatalogItem {
  id: GardenItemId;
  name: string;
  icon: string;
  desc: string;
  karmaCost: number;
  beanCost: number;
  defaultPos: [number, number];
}

export const GARDEN_CATALOG: GardenCatalogItem[] = [
  {
    id: 'campfire',
    name: '따뜻한 모닥불 화로',
    icon: '🔥',
    desc: '타오르는 불꽃과 돌 테두리로 동산을 아늑하게 데워줍니다',
    karmaCost: 25,
    beanCost: 2,
    defaultPos: [0, 0.5],
  },
  {
    id: 'cherry_tree',
    name: '천년 겹벚꽃 나무',
    icon: '🌸',
    desc: '화사한 분홍 꽃비가 흩날리는 영험한 벚꽃나무입니다',
    karmaCost: 40,
    beanCost: 4,
    defaultPos: [-4.8, -1.5],
  },
  {
    id: 'stone_pagoda',
    name: '오층 황금 소원석탑',
    icon: '🪨',
    desc: '꼭대기에 황금 보주가 회전하며 동산의 복기운을 모아줍니다',
    karmaCost: 40,
    beanCost: 4,
    defaultPos: [4.8, -1.5],
  },
  {
    id: 'wood_bench',
    name: '풍류 대청 평상',
    icon: '🪵',
    desc: '친구들과 올라가 다과를 즐기며 식빵을 굽기 좋은 넓은 평상입니다',
    karmaCost: 30,
    beanCost: 3,
    defaultPos: [-4.5, 7.2],
  },
  {
    id: 'lantern_pair',
    name: '청사초롱 쌍등',
    icon: '🏮',
    desc: '전통 청홍 비단 등불이 동산의 밤길을 환하게 밝혀줍니다',
    karmaCost: 30,
    beanCost: 3,
    defaultPos: [4.5, 7.2],
  },
  {
    id: 'ssari_gate',
    name: '액막이 황금 싸리문',
    icon: '🎐',
    desc: '금줄과 싸리나무로 엮어 사악한 기운을 막아주는 전통 대문입니다',
    karmaCost: 60,
    beanCost: 6,
    defaultPos: [0, 11.2],
  },
];

export const QUICK_EMOTES = [
  { icon: '👋', label: '👋 반가워개!' },
  { icon: '❤️', label: '❤️ 복 받으시개!' },
  { icon: '🙏', label: '🙏 비나이다!' },
  { icon: '✨', label: '✨ 대박이개!' },
  { icon: '🐾', label: '🐾 이리 오시개!' },
  { icon: '🎵', label: '🎵 덩실덩실~' },
  { icon: '🎁', label: '🎁 복 기운 나눔!' },
  { icon: '💤', label: '💤 잠시 휴식 중...' },
];

export const BLESS_STAMPS = [
  { icon: '🙏', name: '합장 기원' },
  { icon: '❤️', name: '따뜻한 마음' },
  { icon: '✨', name: '영험한 별기운' },
  { icon: '🍀', name: '만복의 기운' },
];

export const RANDOM_COLORS = [
  '#e53935',
  '#fb8c00',
  '#d81b60',
  '#43a047',
  '#1e88e5',
  '#8e24aa',
];

export const ORB_PALETTE = [
  '#ff5252',
  '#ffd740',
  '#69f0ae',
  '#40c4ff',
  '#e040fb',
];

export const generateScatteredOrbs = (): RollingOrb[] => {
  const palette = [...ORB_PALETTE].sort(() => Math.random() - 0.5);
  return [0, 1, 2].map((idx) => ({
    id: idx + 1,
    x: idx === 0 ? -4.2 : idx === 1 ? 5.2 : 0.5,
    z: idx === 0 ? 8.8 : idx === 1 ? 9.2 : 12.5,
    vx: 0,
    vz: 0,
    color: palette[idx],
    collected: idx > 0,
    ownerId: null,
    updatedAt: Date.now(),
  }));
};

// ⭐ [난이도 대폭 상향] 일반 액운 HP 30!
export const generateInitialSpirits = (): MisfortuneSpirit[] => {
  return [0, 1, 2].map((idx) => {
    const angle = (idx * Math.PI * 2) / 3 + (Math.random() - 0.5) * 0.5;
    const radius = 8.0 + Math.random() * 7.5;
    return {
      id: `spirit_${idx}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      x: Number((Math.cos(angle) * radius).toFixed(2)),
      z: Number((Math.sin(angle) * radius).toFixed(2)),
      hp: 30,
      maxHp: 30,
      scale: 0.95 + Math.random() * 0.25,
      isBoss: false,
    };
  });
};

// ⭐ [난이도 대폭 상향] 거대 먹구름 대액운(보스) HP 150!
export const generateBossSpirit = (): MisfortuneSpirit => {
  const angle = (Math.random() - 0.5) * 1.4;
  const radius = 9.5 + Math.random() * 2.5;
  return {
    id: `boss_${Date.now()}`,
    x: Number((Math.sin(angle) * radius).toFixed(2)),
    z: Number((Math.cos(angle) * radius).toFixed(2)),
    hp: 150,
    maxHp: 150,
    scale: 2.3,
    isBoss: true,
  };
};

export const INITIAL_WISHES: Wish[] = [
  {
    id: '1',
    nickname: '경주복쓸이',
    sealId: 'fortune',
    content: '🧧 홍복 · 만사형통',
    isMine: true,
    isGoldenBean: true,
    hasMyBlessing: true,
    blessings: [
      { id: 'b1', author: '황리단길나그네', stamp: '🙏', time: '방금 전' },
      { id: 'b2', author: '포항해맞이', stamp: '✨', time: '2분 전' },
      { id: 'b3', author: '남산소나무', stamp: '❤️', time: '5분 전' },
    ],
    targetBlessings: TARGET_BLESSINGS,
    status: 'hanging',
    branchPos: BRANCH_POSITIONS[0],
    starPos: STAR_POSITIONS[0],
    color: '#e53935',
  },
  {
    id: '2',
    nickname: '황리단길산책러',
    sealId: 'health',
    content: '🌿 무병 · 심신평안',
    isMine: false,
    hasMyBlessing: false,
    blessings: Array.from({ length: 9 }, (_, i) => ({
      id: `b_init_${i}`,
      author: `이웃복쓸이${i + 1}`,
      stamp: ['🍀', '🙏', '❤️', '✨'][i % 4],
      time: '방금 전',
    })),
    targetBlessings: TARGET_BLESSINGS,
    status: 'hanging',
    branchPos: BRANCH_POSITIONS[1],
    starPos: STAR_POSITIONS[1],
    color: '#43a047',
  },
  {
    id: '3',
    nickname: '동해안길손',
    sealId: 'wealth',
    content: '💰 재복 · 풍요성취',
    isMine: false,
    hasMyBlessing: true,
    blessings: Array.from({ length: 10 }, (_, i) => ({
      id: `b_star_${i}`,
      author: `별지기${i + 1}`,
      stamp: '✨',
      time: '10분 전',
    })),
    targetBlessings: TARGET_BLESSINGS,
    status: 'star',
    branchPos: BRANCH_POSITIONS[2],
    starPos: STAR_POSITIONS[2],
    color: '#fb8c00',
  },
];