import { useState, useCallback } from 'react';
import type { FlowerType, ZoneMode } from '../types/wish';
import { FLOWER_TYPES, KARMA_THRESHOLDS } from '../utils/constants';

export const getGrowthStage = (karma: number): 0 | 1 | 2 | 3 => {
  if (karma >= KARMA_THRESHOLDS.BLOOM) return 3;  // 만개 + 후광
  if (karma >= KARMA_THRESHOLDS.BUD) return 2;    // 꽃봉오리
  if (karma >= KARMA_THRESHOLDS.SPROUT) return 1; // 새싹
  return 0;                                       // 기본 사과머리
};

export const useGameProgress = () => {
  const [karma, setKarma] = useState<number>(() => {
    const saved = localStorage.getItem('bokssul_karma');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [redBeans, setRedBeans] = useState<number>(() => {
    const saved = localStorage.getItem('bokssul_redbeans');
    return saved ? parseInt(saved, 10) : 3; // 기본 체험용 붉은 팥 3알 지급
  });

  const [flowerType] = useState<FlowerType>(() => {
    const saved = localStorage.getItem('bokssul_flower') as FlowerType | null;
    if (saved && FLOWER_TYPES.includes(saved)) return saved;
    const picked = FLOWER_TYPES[Math.floor(Math.random() * FLOWER_TYPES.length)];
    localStorage.setItem('bokssul_flower', picked);
    return picked;
  });

  const [zoneMode, setZoneMode] = useState<ZoneMode>('public');

  const addKarma = useCallback((amount: number) => {
    setKarma((prev) => {
      const next = Math.max(0, prev + amount);
      localStorage.setItem('bokssul_karma', String(next));
      return next;
    });
  }, []);

  const addRedBeans = useCallback((amount: number) => {
    setRedBeans((prev) => {
      const next = Math.max(0, prev + amount);
      localStorage.setItem('bokssul_redbeans', String(next));
      return next;
    });
  }, []);

  const growthStage = getGrowthStage(karma);

  return {
    karma,
    addKarma,
    redBeans,
    addRedBeans,
    flowerType,
    growthStage,
    zoneMode,
    setZoneMode,
  };
};