import { useState, useCallback, useEffect } from 'react';
import type {
  FlowerType,
  ZoneMode,
  BeanPlot,
  GardenItemId,
  GardenDecorMap,
} from '../types/wish';
import {
  FLOWER_TYPES,
  KARMA_THRESHOLDS,
  O2O_REWARD_CODES,
  GARDEN_CATALOG,
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
  { id: 2, x: 0.0, z: 4.0, stage: 'ready', plantedAt: Date.now() - 70000 },
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

  // 하루 시작 기본 공덕 10점 (노력을 통해 100점까지 모아야 만개)
  const [karma, setKarma] = useState<number>(() => {
    const savedDate = localStorage.getItem('bokssul_daily_date');
    if (savedDate !== todayKey) {
      localStorage.setItem('bokssul_daily_date', todayKey);
      localStorage.setItem('bokssul_karma', '10');
      return 10;
    }
    const saved = localStorage.getItem('bokssul_karma');
    return saved ? parseInt(saved, 10) : 10;
  });

  const [redBeans, setRedBeans] = useState<number>(() => {
    const saved = localStorage.getItem('bokssul_redbeans');
    return saved ? parseInt(saved, 10) : 2;
  });

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

  // 조경물 배치 좌표 & 회전값 저장 맵
  const [decorLayout, setDecorLayout] = useState<GardenDecorMap>(() => {
    const saved = localStorage.getItem('bokssul_decor_layout');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });

  // 팥 성장 타이머 (30초 줄기 -> 60초 수확 가능)
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
          if (elapsed >= 60000) return { ...plot, stage: 'ready' as const };
          if (elapsed >= 30000 && plot.stage === 'sprout') {
            return { ...plot, stage: 'growing' as const };
          }
          return plot;
        });
        localStorage.setItem('bokssul_bean_plots', JSON.stringify(next));
        return next;
      });
    }, 4000);

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
          message: '이미 수령하신 오프라인 공덕 코드입니다!',
        };
      }
      const nextClaimed = [...claimedCodes, code];
      setClaimedCodes(nextClaimed);
      localStorage.setItem('bokssul_o2o_codes', JSON.stringify(nextClaimed));
      addKarma(reward.karma);
      addRedBeans(reward.beans);
      return {
        ok: true,
        message: `${reward.title} 완료! (🔮공덕 +${reward.karma} · 🫘팥 +${reward.beans} 지급!)`,
      };
    },
    [claimedCodes, addKarma, addRedBeans]
  );

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

  // 싸리빗자루로 텃밭을 돌보면 성장 시간이 12초씩 단축됨
  const boostAllPlots = useCallback(() => {
    setBeanPlots((prev) => {
      const now = Date.now();
      const next = prev.map((p) => {
        if (!p.plantedAt || p.stage === 'empty' || p.stage === 'ready') return p;
        const boostedTime = p.plantedAt - 12000;
        const elapsed = now - boostedTime;
        return {
          ...p,
          plantedAt: boostedTime,
          stage:
            elapsed >= 60000
              ? ('ready' as const)
              : elapsed >= 30000
              ? ('growing' as const)
              : ('sprout' as const),
        };
      });
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
    const catalogItem = GARDEN_CATALOG.find((c) => c.id === itemId);
    const defaultPos = catalogItem ? catalogItem.defaultPos : [0, 6];

    setUnlockedDecor((prev) => {
      if (prev.includes(itemId)) return prev;
      const next = [...prev, itemId];
      localStorage.setItem('bokssul_unlocked_decor', JSON.stringify(next));
      return next;
    });

    setDecorLayout((prev) => {
      const next: GardenDecorMap = {
        ...prev,
        [itemId]: { x: defaultPos[0], z: defaultPos[1], rot: 0 },
      };
      localStorage.setItem('bokssul_decor_layout', JSON.stringify(next));
      return next;
    });
  }, []);

  const togglePlacedDecor = useCallback((itemId: GardenItemId) => {
    const catalogItem = GARDEN_CATALOG.find((c) => c.id === itemId);
    const defaultPos = catalogItem ? catalogItem.defaultPos : [0, 6];

    setDecorLayout((prev) => {
      const next: GardenDecorMap = { ...prev };
      if (next[itemId]) {
        delete next[itemId];
      } else {
        next[itemId] = { x: defaultPos[0], z: defaultPos[1], rot: 0 };
      }
      localStorage.setItem('bokssul_decor_layout', JSON.stringify(next));
      return next;
    });
  }, []);

  // 배치된 조경물을 원하는 바닥 좌표로 이동
  const moveDecorPosition = useCallback(
    (itemId: GardenItemId, x: number, z: number) => {
      setDecorLayout((prev) => {
        const current = prev[itemId] || { x: 0, z: 0, rot: 0 };
        const next: GardenDecorMap = {
          ...prev,
          [itemId]: {
            ...current,
            x: Number(x.toFixed(2)),
            z: Number(z.toFixed(2)),
          },
        };
        localStorage.setItem('bokssul_decor_layout', JSON.stringify(next));
        return next;
      });
    },
    []
  );

  // 배치된 조경물 45도 회전
  const rotateDecor = useCallback((itemId: GardenItemId) => {
    setDecorLayout((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      const next: GardenDecorMap = {
        ...prev,
        [itemId]: {
          ...current,
          rot: Number(((current.rot + Math.PI / 4) % (Math.PI * 2)).toFixed(2)),
        },
      };
      localStorage.setItem('bokssul_decor_layout', JSON.stringify(next));
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
    decorLayout,
    setDecorLayout,
    unlockAndPlaceDecor,
    togglePlacedDecor,
    moveDecorPosition,
    rotateDecor,
    claimedCodes,
    redeemO2OCode,
  };
};