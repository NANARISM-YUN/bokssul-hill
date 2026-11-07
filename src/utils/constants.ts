import type {
  Wish,
  RollingOrb,
  MisfortuneSpirit,
  FlowerType,
  WishSealId,
} from '../types/wish';
import { BRANCH_POSITIONS, STAR_POSITIONS } from './terrain';

export const TARGET_BLESSINGS = 5; // 5번의 공덕 응원이 모이면 별 승천 개방

// 소원 걸기 및 응원 공덕(🔮) 밸런스
export const WISH_KARMA_COST = 15;       // 일반 소원 걸기 필요 공덕 (약 5분 플레이)
export const WISH_BEAN_KARMA_COST = 10;  // 붉은 팥(🫘 1알) 사용 시 할인 공덕 + 기본 기운 +2 부여
export const BLESS_KARMA_COST = 2;       // 타인 소원에 불어넣는 공덕

// 6대 무언(Zero-Text) 전통 기원 문양
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

// 텍스트 없이 소통하는 8종 감정표현 이모티콘
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

export const KARMA_THRESHOLDS = {
  SPROUT: 10,
  BUD: 30,
  BLOOM: 60,
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
  const baseSectorAngle = Math.random() * Math.PI * 2;

  return [0, 1, 2].map((idx) => {
    const angle =
      baseSectorAngle +
      idx * ((Math.PI * 2) / 3) +
      (Math.random() - 0.5) * 0.7;
    const radius = 6.5 + Math.random() * 9.5;
    const x = Math.cos(angle) * radius;
    let z = Math.sin(angle) * radius;

    if (Math.hypot(x - 0, z - 6.0) < 3.5) {
      z += 4.5;
    }

    return {
      id: idx + 1,
      x: Number(x.toFixed(2)),
      z: Number(z.toFixed(2)),
      vx: 0,
      vz: 0,
      color: palette[idx],
      collected: false,
      ownerId: null,
      updatedAt: Date.now(),
    };
  });
};

export const generateInitialSpirits = (): MisfortuneSpirit[] => {
  return [0, 1, 2, 3].map((idx) => {
    const angle = (idx * Math.PI) / 2 + (Math.random() - 0.5) * 0.6;
    const radius = 7.5 + Math.random() * 8.5;
    return {
      id: `spirit_${idx}_${Date.now()}`,
      x: Number((Math.cos(angle) * radius).toFixed(2)),
      z: Number((Math.sin(angle) * radius).toFixed(2)),
      hp: 3,
      maxHp: 3,
      scale: 0.9 + Math.random() * 0.35,
    };
  });
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
    blessings: [
      { id: 'b4', author: '첨성대별지기', stamp: '🍀', time: '5분 전' },
      { id: 'b5', author: '달빛산책', stamp: '🙏', time: '3분 전' },
      { id: 'b6', author: '복쓸덩이친구', stamp: '❤️', time: '2분 전' },
      { id: 'b7', author: '선청이', stamp: '✨', time: '1분 전' },
      { id: 'b8', author: '경주복쓸이', stamp: '🙏', time: '방금 전' },
    ],
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
    blessings: [
      { id: 'b9', author: '경주복쓸이', stamp: '✨', time: '10분 전' },
      { id: 'b10', author: '달빛산책', stamp: '🙏', time: '8분 전' },
      { id: 'b11', author: '선청이', stamp: '🍀', time: '6분 전' },
      { id: 'b12', author: '포항해맞이', stamp: '❤️', time: '4분 전' },
      { id: 'b13', author: '첨성대별지기', stamp: '✨', time: '1분 전' },
    ],
    targetBlessings: TARGET_BLESSINGS,
    status: 'star',
    branchPos: BRANCH_POSITIONS[2],
    starPos: STAR_POSITIONS[2],
    color: '#fb8c00',
  },
];