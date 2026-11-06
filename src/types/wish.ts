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