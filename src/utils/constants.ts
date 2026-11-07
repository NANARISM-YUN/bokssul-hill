import type { Wish, RollingOrb, MisfortuneSpirit, FlowerType } from '../types/wish';
import { BRANCH_POSITIONS, STAR_POSITIONS } from './terrain';

export const TARGET_BLESSINGS = 3;

// 보상화 개화 단계별 필요 공덕(🔮) 기준
export const KARMA_THRESHOLDS = {
  SPROUT: 10, // 2단계: 영험한 새싹
  BUD: 30,    // 3단계: 빛나는 꽃봉오리
  BLOOM: 60,  // 4단계: 보상화 만개 + 황금 두광(후광)
};

export const FLOWER_TYPES: FlowerType[] = [
  'white_lotus', // 백련화
  'pink_lotus',  // 홍련화
  'peony',       // 모란화
  'gold_plum',   // 황매화
  'blue_bosang', // 청보상화
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

// 동산 곳곳에 출몰하는 액운(厄運) 먼지령 4마리 생성
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
    content:
      '복쓸싸리 동산을 찾은 모든 분들의 가정에 만복이 깃들고 소망이 이루어지길 발원합니다.',
    isMine: true,
    hasMyBlessing: true,
    blessings: [
      {
        id: 'b1',
        author: '황리단길나그네',
        comment: '따뜻한 마음이 하늘에 닿아 꼭 큰 복으로 돌아올 겁니다!',
        time: '방금 전',
      },
      {
        id: 'b2',
        author: '포항해맞이',
        comment: '올 한 해 하시는 일마다 술술 풀리시기를 함께 기원합니다.',
        time: '3분 전',
      },
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
    content:
      '우리 가족 모두 아프지 않고 건강하며 매일 웃음꽃이 피어나기를 소원합니다.',
    isMine: false,
    hasMyBlessing: false,
    blessings: [
      {
        id: 'b3',
        author: '첨성대별지기',
        comment:
          '가족을 생각하는 지극한 정성이 밤하늘의 별처럼 빛나길 바랍니다.',
        time: '5분 전',
      },
      {
        id: 'b4',
        author: '남산소나무',
        comment: '건강이 최고의 복이지요! 온 가족의 무병장수를 응원합니다.',
        time: '2분 전',
      },
      {
        id: 'b5',
        author: '복쓸덩이친구',
        comment: '정성이 가득 모였네요! 하늘의 별로 떠올라 꼭 이루어지세요!',
        time: '1분 전',
      },
    ],
    targetBlessings: TARGET_BLESSINGS,
    status: 'hanging',
    branchPos: BRANCH_POSITIONS[1],
    starPos: STAR_POSITIONS[1],
    color: '#fb8c00',
  },
  {
    id: '3',
    nickname: '동해안길손',
    content:
      '새롭게 시작하는 일에 좋은 인연들이 모이고 세상에 보탬이 되는 결실을 맺기를!',
    isMine: false,
    hasMyBlessing: true,
    blessings: [
      {
        id: 'b6',
        author: '경주복쓸이',
        comment:
          '좋은 뜻으로 시작하시는 일에 귀인들이 구름처럼 모이길 기원합니다!',
        time: '10분 전',
      },
      {
        id: 'b7',
        author: '달빛산책',
        comment: '정성이 모이면 하늘이 감동합니다. 끝까지 응원할게요!',
        time: '4분 전',
      },
      {
        id: 'b8',
        author: '선청이',
        comment: '하늘의 별이 되어 앞길을 환히 비춰주기를!',
        time: '1분 전',
      },
    ],
    targetBlessings: TARGET_BLESSINGS,
    status: 'star',
    branchPos: BRANCH_POSITIONS[2],
    starPos: STAR_POSITIONS[2],
    color: '#d81b60',
  },
];