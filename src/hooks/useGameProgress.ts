import { useState, useCallback, useEffect } from 'react';
import type { FlowerType, ZoneMode, BeanPlot } from '../types/wish';
import { FLOWER_TYPES, KARMA_THRESHOLDS } from '../utils/constants';

export const getGrowthStage = (karma: number): 0 | 1 | 2 | 3 => {
  if (karma >= KARMA_THRESHOLDS.BLOOM) return 3;
  if (karma >= KARMA_THRESHOLDS.BUD) return 2;
  if (karma >= KARMA_THRESHOLDS.SPROUT) return 1;
  return 0;
};

const INITIAL_BEAN_PLOTS: BeanPlot[] = [
  { id: 1, x: -3.2, z: 6.4, stage: 'empty', plantedAt: null },
  { id: 2, x: 0.0, z: 6.8, stage: 'ready', plantedAt: Date.now() - 30000 }, // 첫 방문 시 바로 수확해볼 수 있는 익은 팥 1포기 제공
  { id: 3, x: 3.2, z: 6.4, stage: 'empty', plantedAt: null },
];

export const useGameProgress = () => {
  // 내 고유 동산 주소 ID (영구 유지)
  const [myGardenId] = useState<string>(() => {
    const saved = localStorage.getItem('bokssul_garden_id');
    if (saved) return saved;
    const created = 'g_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem('bokssul_garden_id', created);
    return created;
  });

  // 초대 링크(?garden=xxx)로 접속했는지 확인
  const [visitingGardenId, setVisitingGardenId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('garden');
  });

  const [zoneMode, setZoneMode] = useState<ZoneMode>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('garden') ? 'my_garden' : 'public';
  });

  const [karma, setKarma] = useState<number>(() => {
    const saved = localStorage.getItem('bokssul_karma');
    return saved ? parseInt(saved, 10) : 15; // 첫 소원/팥심기 체험용 기본 공덕 15점
  });

  const [redBeans, setRedBeans] = useState<number>(() => {
    const saved = localStorage.getItem('bokssul_redbeans');
    return saved ? parseInt(saved, 10) : 3;
  });

  const [flowerType] = useState<FlowerType>(() => {
    const saved = localStorage.getItem('bokssul_flower') as FlowerType | null;
    if (saved && FLOWER_TYPES.includes(saved)) return saved;
    const picked =
      FLOWER_TYPES[Math.floor(Math.random() * FLOWER_TYPES.length)];
    localStorage.setItem('bokssul_flower', picked);
    return picked;
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

  // 팥 텃밭 실시간 성장 타이머 (심은 후 10초 뒤 줄기 ➔ 20초 뒤 붉은 팥 열매 완성)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setBeanPlots((prev) => {
        let changed = false;
        const next = prev.map((plot) => {
          if (!plot.plantedAt || plot.stage === 'empty' || plot.stage === 'ready') {
            return plot;
          }
          const elapsed = now - plot.plantedAt;
          if (elapsed >= 20000 && plot.stage !== 'ready') {
            changed = true;
            return { ...plot, stage: 'ready' as const };
          }
          if (elapsed >= 9000 && plot.stage === 'sprout') {
            changed = true;
            return { ...plot, stage: 'growing' as const };
          }
          return plot;
        });
        if (changed) {
          localStorage.setItem('bokssul_bean_plots', JSON.stringify(next));
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // 텃밭에 팥 심기 (🔮 공덕 5점 투자)
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

  // 싸리빗자루로 텃밭을 쓸어주면 정성으로 즉시 성장!
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

  // 다 자란 붉은 팥 수확하기
  const harvestBean = useCallback((plotId: number) => {
    setBeanPlots((prev) => {
      const next = prev.map((p) =>
        p.id === plotId ? { ...p, stage: 'empty' as const, plantedAt: null } : p
      );
      localStorage.setItem('bokssul_bean_plots', JSON.stringify(next));
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

  // 현재 접속할 실시간 채널 이름 (광장 vs 개인 동산 분리)
  const activeRoomName =
    zoneMode === 'public'
      ? 'bokssul-hill-room'
      : `bokssul-garden-${visitingGardenId || myGardenId}`;

  return {
    karma,
    addKarma,
    redBeans,
    addRedBeans,
    flowerType,
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
  };
};