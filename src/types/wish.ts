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

export type PlayerAction = 'idle' | 'jump' | 'roll' | 'bow' | 'sit';

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
}