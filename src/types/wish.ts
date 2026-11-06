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

// 실시간 멀티플레이 접속자 데이터 구조
export interface RemotePlayer {
  id: string;
  nickname: string;
  color: string;
  x: number;
  z: number;
  rot: number;
  isMoving: boolean;
  emote?: string | null;
  lastSeen: number;
}