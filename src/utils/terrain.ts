// 통합 물리 지형 높이 함수 (중앙 당산나무 언덕 + 동서남북 4대 봉우리)
export const getTerrainHeight = (x: number, z: number) => {
  const centerHill = 4.6 * Math.exp(-(x * x + z * z) / 140);
  const nwHill = 5.4 * Math.exp(-((x + 16) ** 2 + (z + 13) ** 2) / 110);
  const neHill = 4.9 * Math.exp(-((x - 17) ** 2 + (z + 12) ** 2) / 120);
  const swHill = 3.2 * Math.exp(-((x + 15) ** 2 + (z - 14) ** 2) / 110);
  const seHill = 3.5 * Math.exp(-((x - 15) ** 2 + (z - 14) ** 2) / 115);
  const gentleWave = 0.25 * Math.sin(x * 0.22) * Math.cos(z * 0.22);

  return centerHill + nwHill + neHill + swHill + seHill + gentleWave - 0.6;
};

// 나뭇가지 소원 복주머니 배치 좌표
export const BRANCH_POSITIONS: [number, number, number][] = [
  [-2.6, 6.6, 2.3],
  [2.7, 6.8, 1.9],
  [-0.8, 6.3, 3.1],
  [-3.0, 7.3, -1.0],
  [2.5, 6.5, -2.2],
  [0.6, 7.6, 2.6],
  [2.1, 7.5, 0.3],
  [-2.1, 6.4, -2.5],
  [0.9, 7.0, -2.9],
  [-3.2, 6.7, 0.7],
  [3.0, 7.1, -0.5],
  [0.0, 8.2, -1.4],
];

// 밤하늘 별자리 좌표
export const STAR_POSITIONS: [number, number, number][] = [
  [-8, 18, -6],
  [9, 19, -5],
  [0, 21, -8],
  [-11, 17, 2],
  [8, 18, 4],
  [3, 22, -2],
  [-5, 20, 5],
  [10, 17, -9],
  [-4, 19, -3],
  [5, 20, 2],
  [-9, 18, -1],
  [0, 23, -5],
];