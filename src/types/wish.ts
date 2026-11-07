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
  stamp: string; // 텍스트 댓글 대신 들어가는 응원 인장 이모티콘
  color?: string;
  time: string;
}

export interface Wish {
  id: string;
  nickname: string;
  sealId?: WishSealId; // 6대 전통 기원 문양 ID
  content: string;     // 기원 문양 타이틀 (예: "🧧 홍복 · 만사형통")
  isMine: boolean;
  isGoldenBean?: boolean; // 붉은 팥(🫘)을 넣어 만든 황금 액막이 주머니 여부
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