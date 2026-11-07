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

// Phase 4: 내 동산 커스텀 조경 아이템 6종 ID
export type GardenItemId =
  | 'cherry_tree'
  | 'campfire'
  | 'stone_pagoda'
  | 'wood_bench'
  | 'lantern_pair'
  | 'ssari_gate';

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
  isBoss?: boolean; // Phase 4: 거대 먹구름 대액운 여부
}

export interface BeanPlot {
  id: number;
  x: number;
  z: number;
  stage: 'empty' | 'sprout' | 'growing' | 'ready';
  plantedAt: number | null;
}