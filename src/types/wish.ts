export type WishSealId =
  | 'fortune'
  | 'wealth'
  | 'health'
  | 'love'
  | 'wisdom'
  | 'ward';

export interface Blessing {
  id: string;
  author: string;
  stamp: string;
  color?: string;
  time: string;
}

export interface Wish {
  id: string;
  nickname: string;
  sealId?: WishSealId;
  content: string;
  isMine: boolean;
  isGoldenBean?: boolean;
  hasMyBlessing: boolean;
  blessings: Blessing[];
  targetBlessings: number;
  status: 'hanging' | 'ascending' | 'star';
  branchPos: [number, number, number];
  starPos: [number, number, number];
  color: string;
}

export type CameraMode = 'follow' | 'tree' | 'sky';

export type PlayerAction = 'idle' | 'jump' | 'roll' | 'bow' | 'sit' | 'sweep';

export type FlowerType =
  | 'white_lotus'
  | 'pink_lotus'
  | 'peony'
  | 'gold_plum'
  | 'blue_bosang';

export type ZoneMode = 'public' | 'my_garden';

export interface RemotePlayer {
  id: string;
  nickname: string;
  color: string;
  x: number;
  z: number;
  rot: number;
  isMoving: boolean;
  action?: PlayerAction;
  emote?: string | null;
  karma?: number;
  flowerType?: FlowerType;
  lastSeen: number;
}

export interface RollingOrb {
  id: number;
  x: number;
  z: number;
  vx: number;
  vz: number;
  color: string;
  collected: boolean;
  ownerId?: string | null;
  updatedAt?: number;
}

export interface MisfortuneSpirit {
  id: string;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  scale: number;
}

// Phase 3: 내 동산 붉은 팥(赤豆) 텃밭 데이터 구조
export interface BeanPlot {
  id: number;
  x: number;
  z: number;
  stage: 'empty' | 'sprout' | 'growing' | 'ready';
  plantedAt: number | null;
}