import { useState, useCallback, useEffect } from 'react';
import type {
  FlowerType,
  ZoneMode,
  BeanPlot,
  GardenItemId,
} from '../types/wish';
import {
  FLOWER_TYPES,
  KARMA_THRESHOLDS,
  O2O_REWARD_CODES,
} from '../utils/constants';

export const getGrowthStage = (karma: number): 0 | 1 | 2 | 3 => {
  if (karma >= KARMA_THRESHOLDS.BLOOM) return 3;
  if (karma >= KARMA_THRESHOLDS.BUD) return 2;
  if (karma >= KARMA_THRESHOLDS.SPROUT) return 1;
  return 0;
};

const getTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};

const INITIAL_BEAN_PLOTS: BeanPlot[] = [
  { id: 1, x: -3.2, z: 3.5, stage: 'empty', plantedAt: null },
  { id: 2, x: 0.0, z: 4.0, stage: 'ready', plantedAt: Date.now() - 30000 },
  { id: 3, x: 3.2, z: 3.5, stage: 'empty', plantedAt: null },
];

export const useGameProgress = () => {
  const todayKey = getTodayKey();

  const [myGardenId] = useState<string>(() => {
    const saved = localStorage.getItem('bokssul_garden_id');
    if (saved) return saved;
    const created = 'g_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem('bokssul_garden_id', created);
    return created;
  });

  const [visitingGardenId, setVisitingGardenId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('garden');
  });

  const [zoneMode, setZoneMode] = useState<ZoneMode>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('garden') ? 'my_garden' : 'public';
  });

  // [1일 유지 보상화 시스템] 날짜가 바뀌면 오늘의 보상화 종류와 일일 개화 공덕이 새로 시작됨!
  const [flowerType, setFlowerType] = useState<FlowerType>(() => {
    const savedDate = localStorage.getItem('bokssul_daily_date');
    const savedFlower = localStorage.getItem('bokssul_flower') as FlowerType | null;
    if (savedDate === todayKey && savedFlower && FLOWER_TYPES.includes(savedFlower)) {
      return savedFlower;
    }
    const picked = FLOWER_TYPES[Math.floor(Math.random() * FLOWER_TYPES.length)];
    localStorage.setItem('bokssul_flower', picked);
    return picked;
  });

  const [karma, setKarma] = useState<number>(() => {
    const savedDate = localStorage.getItem('bokssul_daily_date');
    if (savedDate !== todayKey) {
      localStorage.setItem('bokssul_daily_date', todayKey);
      localStorage.setItem('bokssul_karma', '15'); // 매일 기본 시작 공덕 15점 부여 (15점만 더 모으면 오늘의 꽃 만개!)
      return 15;
    }
    const saved = localStorage.getItem('bokssul_karma');
    return saved ? parseInt(saved, 10) : 15;
  });

  const [redBeans, setRedBeans] = useState<number>(() => {
    const saved = localStorage.getItem('bokssul_redbeans');
    return saved ? parseInt(saved, 10) : 3;
  });

  // O2O 매장/굿즈 인증 배지 목록
  const [claimedCodes, setClaimedCodes] = useState<string[]>(() => {
    const saved = localStorage.getItem('bokssul_o2o_codes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [beanPlots, setBeanPlots] = useState<BeanPlot[]>(() => {
    const saved = localStorage.getItem('bokssul_bean_plots');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_BEAN_PLOTS;
      }
    }
    return INITIAL_BEAN_PLOTS;
  });

  const [unlockedDecor, setUnlockedDecor] = useState<GardenItemId[]>(() => {
    const saved = localStorage.getItem('bokssul_unlocked_decor');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [placedDecor, setPlacedDecor] = useState<GardenItemId[]>(() => {
    const saved = localStorage.getItem('bokssul_placed_decor');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // ⭐ [렉 해결 핵심] 자라고 있는 팥이 있을 때만 타이머를 예약하여 불필요한 1초 리렌더링을 100% 제거!
  useEffect(() => {
    const growingPlots = beanPlots.filter(
      (p) => p.stage === 'sprout' || p.stage === 'growing'
    );
    if (growingPlots.length === 0) return;

    const timer = setTimeout(() => {
      const now = Date.now();
      setBeanPlots((prev) => {
        const next = prev.map((plot) => {
          if (!plot.plantedAt || plot.stage === 'empty' || plot.stage === 'ready') {
            return plot;
          }
          const elapsed = now - plot.plantedAt;
          if (elapsed >= 18000) return { ...plot, stage: 'ready' as const };
          if (elapsed >= 8000 && plot.stage === 'sprout') {
            return { ...plot, stage: 'growing' as const };
          }
          return plot;
        });
        localStorage.setItem('bokssul_bean_plots', JSON.stringify(next));
        return next;
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [beanPlots]);

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

  // O2O 코드 등록 함수 (매장 방문 / 굿즈 QR 연동)
  const redeemO2OCode = useCallback(
    (rawCode: string): { ok: boolean; message: string } => {
      const code = rawCode.trim();
      const reward = O2O_REWARD_CODES[code];
      if (!reward) {
        return {
          ok: false,
          message:
            '유효하지 않은 코드입니다. (체험 코드: 황리단길 / 팥키링 / 복쓸싸리)',
        };
      }
      if (claimedCodes.includes(code)) {
        return {
          ok: false,
          message: '이미 오늘 수령하신 오프라인 공덕 코드입니다!',
        };
      }
      const nextClaimed = [...claimedCodes, code];
      setClaimedCodes(nextClaimed);
      localStorage.setItem('bokssul_o2o_codes', JSON.stringify(nextClaimed));
      addKarma(reward.karma);
      addRedBeans(reward.beans);
      return {
        ok: true,
        message: `${reward.title} 완료! (🔮공덕 +${reward.karma} · 🫘팥 +${reward.beans} 지급 & 오늘의 보상화 즉시 만개!)`,
      };
    },
    [claimedCodes, addKarma, addRedBeans]
  );

  // 오늘의 꽃 다시 뽑기 (원할 때 다른 꽃 운세도 볼 수 있는 리롤 기능)
  const rerollTodayFlower = useCallback(() => {
    const others = FLOWER_TYPES.filter((f) => f !== flowerType);
    const picked = others[Math.floor(Math.random() * others.length)];
    setFlowerType(picked);
    localStorage.setItem('bokssul_flower', picked);
  }, [flowerType]);

  const plantBean = useCallback((plotId: number) => {
    setBeanPlots((prev) => {
      const next = prev.map((p) =>
        p.id === plotId
          ? { ...p, stage: 'sprout' as const, plantedAt: Date.now() }
          : p
      );
      localStorage.setItem('bokssul_bean_plots', JSON.stringify(next));
      return next;
    });
  }, []);

  const boostAllPlots = useCallback(() => {
    setBeanPlots((prev) => {
      const next = prev.map((p) =>
        p.stage === 'sprout' || p.stage === 'growing'
          ? { ...p, stage: 'ready' as const }
          : p
      );
      localStorage.setItem('bokssul_bean_plots', JSON.stringify(next));
      return next;
    });
  }, []);

  const harvestBean = useCallback((plotId: number) => {
    setBeanPlots((prev) => {
      const next = prev.map((p) =>
        p.id === plotId ? { ...p, stage: 'empty' as const, plantedAt: null } : p
      );
      localStorage.setItem('bokssul_bean_plots', JSON.stringify(next));
      return next;
    });
  }, []);

  const unlockAndPlaceDecor = useCallback((itemId: GardenItemId) => {
    setUnlockedDecor((prev) => {
      if (prev.includes(itemId)) return prev;
      const next = [...prev, itemId];
      localStorage.setItem('bokssul_unlocked_decor', JSON.stringify(next));
      return next;
    });
    setPlacedDecor((prev) => {
      if (prev.includes(itemId)) return prev;
      const next = [...prev, itemId];
      localStorage.setItem('bokssul_placed_decor', JSON.stringify(next));
      return next;
    });
  }, []);

  const togglePlacedDecor = useCallback((itemId: GardenItemId) => {
    setPlacedDecor((prev) => {
      const next = prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId];
      localStorage.setItem('bokssul_placed_decor', JSON.stringify(next));
      return next;
    });
  }, []);

  const switchZone = useCallback(
    (targetZone: ZoneMode) => {
      setZoneMode(targetZone);
      if (targetZone === 'public') {
        setVisitingGardenId(null);
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        const gid = visitingGardenId || myGardenId;
        setVisitingGardenId(gid);
        window.history.replaceState({}, '', `?garden=${gid}`);
      }
    },
    [myGardenId, visitingGardenId]
  );

  const activeRoomName =
    zoneMode === 'public'
      ? 'bokssul-hill-room'
      : `bokssul-garden-${visitingGardenId || myGardenId}`;

  return {
    todayKey,
    karma,
    addKarma,
    redBeans,
    addRedBeans,
    flowerType,
    rerollTodayFlower,
    growthStage: getGrowthStage(karma),
    zoneMode,
    switchZone,
    myGardenId,
    visitingGardenId,
    activeRoomName,
    beanPlots,
    plantBean,
    boostAllPlots,
    harvestBean,
    unlockedDecor,
    placedDecor,
    setPlacedDecor,
    unlockAndPlaceDecor,
    togglePlacedDecor,
    claimedCodes,
    redeemO2OCode,
  };
};