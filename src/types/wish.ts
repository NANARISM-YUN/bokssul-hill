export interface Blessing {
  id: string;
  author: string;
  comment: string;
  time: string;
}

export interface Wish {
  id: string;
  nickname: string;
  content: string;
  isMine: boolean;
  hasMyBlessing: boolean;
  blessings: Blessing[];
  targetBlessings: number;
  status: 'hanging' | 'ascending' | 'star';
  branchPos: [number, number, number];
  starPos: [number, number, number];
  color: string;
}

export type CameraMode = 'follow' | 'tree' | 'sky';

// sweep(싸리빗자루 쓸기) 액션 추가
export type PlayerAction = 'idle' | 'jump' | 'roll' | 'bow' | 'sit' | 'sweep';

// 불교 신화 모티프 5종 랜덤 보상화(寶相華)
export type FlowerType = 'white_lotus' | 'pink_lotus' | 'peony' | 'gold_plum' | 'blue_bosang';

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

// ownerId를 통해 마지막으로 공을 친 유저의 기기만 물리 연산을 주도함 (멀티 끊김 원천 방지)
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

// 싸리빗자루로 쓸어내야 하는 검은 액운(厄運) 먼지령
export interface MisfortuneSpirit {
  id: string;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  scale: number;
}