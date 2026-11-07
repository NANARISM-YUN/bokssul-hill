import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sparkles } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import type {
  Wish,
  Blessing,
  CameraMode,
  PlayerAction,
  RollingOrb,
  MisfortuneSpirit,
  WishSealId,
  BeanPlot,
  GardenItemId,
} from './types/wish';
import { BRANCH_POSITIONS, STAR_POSITIONS } from './utils/terrain';
import {
  TARGET_BLESSINGS,
  RANDOM_COLORS,
  INITIAL_WISHES,
  WISH_SEALS,
  WISH_KARMA_COST,
  WISH_BEAN_KARMA_COST,
  BLESS_KARMA_COST,
  KARMA_THRESHOLDS,
  generateScatteredOrbs,
  generateInitialSpirits,
  generateBossSpirit,
  type GardenCatalogItem,
} from './utils/constants';
import { useGameProgress } from './hooks/useGameProgress';
import { useMultiplayer } from './hooks/useMultiplayer';
import {
  TraditionalClouds,
  UnifiedHillTerrain,
  WishTreeAndGuardian,
} from './components/three/WorldEnvironment';
import { BokssulPlayerAndCamera } from './components/three/BokssulPlayer';
import { OtherPlayers } from './components/three/OtherPlayers';
import { WishPouchObject } from './components/three/WishPouchObject';
import {
  ClickTargetMarker,
  MeteorShowerEffect,
  WishAltarAndOrbs,
} from './components/three/InteractiveEvents';
import { MisfortuneSystem } from './components/three/MisfortuneSystem';
import { PersonalGardenSystem } from './components/three/PersonalGardenSystem';
import { HudOverlay } from './components/ui/HudOverlay';
import { WishWriteModal, WishDetailModal } from './components/ui/WishModals';
import {
  DailyFortuneModal,
  O2OConnectModal,
} from './components/ui/FortuneAndO2OModals';

export default function App() {
  const {
    todayKey,
    karma,
    addKarma,
    redBeans,
    addRedBeans,
    flowerType,
    rerollTodayFlower,
    zoneMode,
    switchZone,
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
  } = useGameProgress();

  const [myNickname, setMyNickname] = useState<string>(
    () =>
      localStorage.getItem('bokssul_nick') ||
      `복쓸이${Math.floor(10 + Math.random() * 89)}`
  );
  const [myColor, setMyColor] = useState<string>(
    () =>
      localStorage.getItem('bokssul_color') ||
      RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)]
  );
  const [myAction, setMyAction] = useState<PlayerAction>('idle');
  const [myEmote, setMyEmote] = useState<string | null>(null);
  const actionTimerRef = useRef<number | null>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGardenShopOpen, setIsGardenShopOpen] = useState(false);
  const [isFortuneModalOpen, setIsFortuneModalOpen] = useState(false);
  const [isO2OModalOpen, setIsO2OModalOpen] = useState(false);

  const [autoWatchAscension, setAutoWatchAscension] = useState<boolean>(() => {
    return localStorage.getItem('bokssul_autowatch') !== 'false';
  });
  const [ascendingWishNickname, setAscendingWishNickname] = useState<
    string | null
  >(null);

  const [clickTarget, setClickTarget] = useState<{ x: number; z: number } | null>(
    null
  );
  const [followingId, setFollowingId] = useState<string | null>(null);

  const orbsRef = useRef<RollingOrb[]>(generateScatteredOrbs());
  const [collectedCount, setCollectedCount] = useState(0);
  const [meteorActive, setMeteorActive] = useState(false);

  const initialSpirits = useRef<MisfortuneSpirit[]>(generateInitialSpirits());
  const spiritsRef = useRef<MisfortuneSpirit[]>(initialSpirits.current);
  const [spirits, setSpirits] = useState<MisfortuneSpirit[]>(
    initialSpirits.current
  );
  const purifiedCountRef = useRef(0);

  const placedDecorRef = useRef<GardenItemId[]>(placedDecor);
  useEffect(() => {
    placedDecorRef.current = placedDecor;
  }, [placedDecor]);

  const playerPosRef = useRef({
    x: (Math.random() - 0.5) * 4,
    z: 8.2 + Math.random() * 2,
  });
  const playerMoveVecRef = useRef({ x: 0, z: 0, isMoving: false });

  const [wishes, setWishes] = useState<Wish[]>(INITIAL_WISHES);
  const wishesRef = useRef<Wish[]>(wishes);
  useEffect(() => {
    wishesRef.current = wishes;
  }, [wishes]);

  const [isNearTree, setIsNearTree] = useState(false);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [selectedWishId, setSelectedWishId] = useState<string | null>(null);

  const [cameraMode, setCameraMode] = useState<CameraMode>('follow');
  const [focusedTarget, setFocusedTarget] = useState<
    [number, number, number] | null
  >(null);
  const [isNightMode, setIsNightMode] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(
    '👆 바닥을 터치해 산책하고 액운을 쓸어 오늘의 보상화 운세 부적을 받아보세요!'
  );

  const keys = useRef<{ [key: string]: boolean }>({});
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  // URL 파라미터(?gift=황리단길 등)로 O2O QR 스캔 접속 시 자동 보상 처리
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const giftCode = params.get('gift');
    if (giftCode) {
      const res = redeemO2OCode(giftCode);
      setBannerMessage(res.message);
      if (res.ok) {
        setIsFortuneModalOpen(true);
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [redeemO2OCode]);

  useEffect(() => {
    if (!bannerMessage) return;
    const timer = setTimeout(() => setBannerMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [bannerMessage]);

  const triggerMeteorFestival = useCallback(() => {
    setMeteorActive(true);
    setIsNightMode(true);
    if (autoWatchAscension) {
      setFocusedTarget(null);
      setCameraMode('sky');
    }
    addKarma(5);
    setBannerMessage(
      '🌠 밤하늘에 축복의 별똥별이 쏟아집니다! (모든 복쓸덩이 🔮공덕 +5)'
    );

    setTimeout(() => {
      setMeteorActive(false);
      const respawned = generateScatteredOrbs();
      orbsRef.current = respawned;
      setCollectedCount(0);
    }, 10000);
  }, [addKarma, autoWatchAscension]);

  const handleRemoteAscension = useCallback(
    (ascendNick: string) => {
      setAscendingWishNickname(ascendNick);
      if (autoWatchAscension) {
        setIsNightMode(true);
        setFocusedTarget(null);
        setCameraMode('sky');
      }
      setTimeout(() => {
        setAscendingWishNickname(null);
      }, 4500);
    },
    [autoWatchAscension]
  );

  const {
    myId,
    remotePlayers,
    broadcastPosition,
    broadcastAction,
    broadcastOrbs,
    broadcastSpirits,
    broadcastGardenDecor,
    broadcastWishes,
  } = useMultiplayer({
    roomName: activeRoomName,
    myNickname,
    myColor,
    myAction,
    myEmote,
    myKarma: karma,
    myFlowerType: flowerType,
    orbsRef,
    spiritsRef,
    wishesRef,
    placedDecorRef,
    setSpirits,
    setCollectedCount,
    onMeteorTriggered: triggerMeteorFestival,
    onRemoteAscension: handleRemoteAscension,
    onRemoteDecorSync: (incomingDecor) => {
      setPlacedDecor(incomingDecor);
    },
    setWishes,
    setBannerMessage,
    setIsNightMode,
  });

  const selectedWish = wishes.find((w) => w.id === selectedWishId) || null;
  const ascendingWish = wishes.find((w) => w.status === 'ascending') || null;
  const activeBoss = spirits.find((s) => s.isBoss) || null;
  const isAnyModalOpen =
    isWriteModalOpen ||
    Boolean(selectedWishId) ||
    isProfileModalOpen ||
    isGardenShopOpen ||
    isFortuneModalOpen ||
    isO2OModalOpen;
  const followingPlayer = followingId ? remotePlayers[followingId] || null : null;
  const remoteList = Object.values(remotePlayers);

  const handleTriggerAction = useCallback(
    (action: PlayerAction, label: string, bonusKarma = 0) => {
      if (actionTimerRef.current) {
        window.clearTimeout(actionTimerRef.current);
        actionTimerRef.current = null;
      }

      const prevKarma = karma;
      const nextKarma = karma + bonusKarma;
      if (bonusKarma > 0) addKarma(bonusKarma);

      // 방금 얻은 공덕으로 오늘의 보상화가 처음 만개(30점 달성)했을 때 자동으로 운세 부적 모달 오픈!
      if (
        prevKarma < KARMA_THRESHOLDS.BLOOM &&
        nextKarma >= KARMA_THRESHOLDS.BLOOM
      ) {
        setTimeout(() => {
          setIsFortuneModalOpen(true);
        }, 900);
      }

      setMyAction(action);
      setMyEmote(label);
      broadcastAction(action, label, nextKarma);

      actionTimerRef.current = window.setTimeout(() => {
        if (action !== 'sit') {
          setMyAction('idle');
        }
        setMyEmote(null);
        broadcastAction(action === 'sit' ? 'sit' : 'idle', null, nextKarma);
        actionTimerRef.current = null;
      }, 3200);
    },
    [karma, addKarma, broadcastAction]
  );

  // ⭐ [진단사항 1 & 2 통합] 액운을 정화하면 그 자리에서 오색 복구슬이 퐁! 드랍되고, 보스 상대 시 팥 액막이가 자동 발동하는 스마트 정화 함수
  const handleSmartPurifySpirits = useCallback(
    (targetSpiritId?: string) => {
      if (zoneMode === 'my_garden') {
        boostAllPlots();
        handleTriggerAction(
          'sweep',
          '🧹 정성껏 텃밭을 쓸어 팥이 탐스럽게 익었습니다!',
          2
        );
        return;
      }

      const pPos = playerPosRef.current;
      const useBeanPower = Boolean(activeBoss) && redBeans > 0;
      if (useBeanPower) {
        addRedBeans(-1);
      }

      let hitAny = false;
      let purifiedNormalPos: { x: number; z: number } | null = null;
      let purifiedBoss = false;

      const updated = spiritsRef.current
        .map((sp) => {
          const hitRange = sp.isBoss ? 5.5 : 3.4;
          const dist = Math.hypot(sp.x - pPos.x, sp.z - pPos.z);
          if (sp.id === targetSpiritId && dist > hitRange) {
            setClickTarget({ x: sp.x, z: sp.z });
            return sp;
          }
          if (dist <= hitRange || sp.id === targetSpiritId) {
            hitAny = true;
            const dmg = useBeanPower && sp.isBoss ? 3 : 1;
            const nextHp = sp.hp - dmg;
            if (nextHp <= 0) {
              if (sp.isBoss) purifiedBoss = true;
              else purifiedNormalPos = { x: sp.x, z: sp.z };
              return null;
            }
            return { ...sp, hp: nextHp };
          }
          return sp;
        })
        .filter(Boolean) as MisfortuneSpirit[];

      // [진단사항 1 핵심] 액운이 정화된 바로 그 자리에서 숨겨져 있던 오색 복구슬이 퐁! 하고 튀어나옴!
      if (purifiedNormalPos) {
        purifiedCountRef.current += 1;
        const hiddenOrbIdx = orbsRef.current.findIndex((o) => o.collected);
        if (hiddenOrbIdx !== -1) {
          const dropPos = purifiedNormalPos as { x: number; z: number };
          orbsRef.current[hiddenOrbIdx] = {
            ...orbsRef.current[hiddenOrbIdx],
            x: dropPos.x,
            z: dropPos.z,
            vx: (Math.random() - 0.5) * 4,
            vz: (Math.random() - 0.5) * 4,
            collected: false,
            ownerId: myId,
            updatedAt: Date.now(),
          };
          const activeOrbsCount = orbsRef.current.filter(
            (o) => !o.collected
          ).length;
          setCollectedCount(3 - activeOrbsCount);
          broadcastOrbs(orbsRef.current, false);
        }

        if (
          purifiedCountRef.current % 3 === 0 &&
          !updated.some((s) => s.isBoss)
        ) {
          updated.push(generateBossSpirit());
          setBannerMessage(
            '⚡ 거대 먹구름 대액운 출현! [🫘팥 액막이] 버튼으로 물리치세요!'
          );
        }
      }

      if (updated.filter((s) => !s.isBoss).length < 2) {
        updated.push(generateInitialSpirits()[0]);
      }

      spiritsRef.current = updated;
      setSpirits(updated);
      broadcastSpirits(updated, purifiedBoss);

      if (purifiedBoss) {
        addRedBeans(1);
        handleTriggerAction(
          'jump',
          '🎉 거대 대액운 합동 정화 성공! (🔮+8 · 🫘+1)',
          8
        );
        triggerMeteorFestival();
      } else if (purifiedNormalPos) {
        handleTriggerAction(
          'sweep',
          '🧹 액운 정화 완료! 그 자리에서 ✨복구슬이 솟아났습니다! (🔮+4)',
          4
        );
      } else if (hitAny) {
        handleTriggerAction(
          'sweep',
          useBeanPower
            ? '🫘 붉은 팥 액막이 강타! (데미지 3!)'
            : '🧹 쓱싹쓱싹! 액운 쓸어내기!',
          1
        );
      } else {
        handleTriggerAction(
          'sweep',
          '🧹 액운을 터치하면 가까이 다가가 쓸어냅니다!'
        );
      }
    },
    [
      zoneMode,
      activeBoss,
      redBeans,
      myId,
      addRedBeans,
      boostAllPlots,
      broadcastOrbs,
      broadcastSpirits,
      handleTriggerAction,
      triggerMeteorFestival,
    ]
  );

  const handleInteractBeanPlot = useCallback(
    (plot: BeanPlot) => {
      if (plot.stage === 'empty') {
        if (karma < 5) {
          setBannerMessage('🔮 팥 씨앗을 심으려면 공덕 5점이 필요합니다!');
          return;
        }
        addKarma(-5);
        plantBean(plot.id);
        handleTriggerAction('bow', '🌱 공덕 5점으로 붉은 팥 씨앗을 심었습니다!');
      } else if (plot.stage === 'ready') {
        harvestBean(plot.id);
        addRedBeans(2);
        handleTriggerAction(
          'jump',
          '🫘 영험한 붉은 팥 2알 수확 완료! (🔮공덕 +3)',
          3
        );
      } else {
        setBannerMessage(
          '🌿 팥이 자라는 중입니다! 하단 [🧹쓸기]를 누르면 즉시 익습니다!'
        );
      }
    },
    [karma, addKarma, plantBean, harvestBean, addRedBeans, handleTriggerAction]
  );

  const handleBuyOrToggleDecor = useCallback(
    (item: GardenCatalogItem) => {
      if (unlockedDecor.includes(item.id)) {
        const nextPlaced = placedDecor.includes(item.id)
          ? placedDecor.filter((id) => id !== item.id)
          : [...placedDecor, item.id];
        togglePlacedDecor(item.id);
        broadcastGardenDecor(nextPlaced);
      } else {
        if (karma < item.karmaCost || redBeans < item.beanCost) return;
        addKarma(-item.karmaCost);
        addRedBeans(-item.beanCost);
        unlockAndPlaceDecor(item.id);
        const nextPlaced = [...placedDecor, item.id];
        broadcastGardenDecor(nextPlaced);
        handleTriggerAction(
          'jump',
          `${item.icon} '${item.name}' 내 동산에 배치 완료!`
        );
      }
    },
    [
      unlockedDecor,
      placedDecor,
      karma,
      redBeans,
      addKarma,
      addRedBeans,
      togglePlacedDecor,
      unlockAndPlaceDecor,
      broadcastGardenDecor,
      handleTriggerAction,
    ]
  );

  const handleCopyInviteLink = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url);
    setBannerMessage(
      '🔗 내 동산 초대 링크가 복사되었습니다! 친구에게 공유해보세요!'
    );
  }, []);

  const handleOrbEvent = useCallback(
    (currentOrbs: RollingOrb[], justCollected: boolean) => {
      const count = currentOrbs.filter((o) => o.collected).length;
      setCollectedCount(count);
      const allCollected = count === currentOrbs.length;

      if (justCollected) {
        if (!allCollected) {
          handleTriggerAction('jump', `🧺 바구니 골인! (🔮공덕 +4)`, 4);
        }
      }

      broadcastOrbs(currentOrbs, allCollected && !meteorActive);

      if (allCollected && !meteorActive) {
        triggerMeteorFestival();
      }
    },
    [meteorActive, broadcastOrbs, triggerMeteorFestival, handleTriggerAction]
  );

  const handleHighFive = useCallback(
    (friendName: string) => {
      handleTriggerAction('jump', `⚡ ${friendName}님과 복 박치기! (🔮+2)`, 2);
    },
    [handleTriggerAction]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isAnyModalOpen) return;
      keys.current[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [isAnyModalOpen]);

  const handleCreateSealWish = (
    sealId: WishSealId,
    useRedBean: boolean,
    color: string
  ) => {
    const cost = useRedBean ? WISH_BEAN_KARMA_COST : WISH_KARMA_COST;
    if (karma < cost || (useRedBean && redBeans < 1)) return;

    addKarma(-cost);
    if (useRedBean) addRedBeans(-1);

    const sealInfo = WISH_SEALS.find((s) => s.id === sealId) || WISH_SEALS[0];
    const branchIdx = wishes.length % BRANCH_POSITIONS.length;
    const starIdx = wishes.length % STAR_POSITIONS.length;

    const initialBlessings: Blessing[] = useRedBean
      ? [
          {
            id: `bean_1_${Date.now()}`,
            author: '붉은팥액막이',
            stamp: '🫘',
            time: '방금 전',
          },
          {
            id: `bean_2_${Date.now()}`,
            author: '수호신복쓸싸리',
            stamp: '✨',
            time: '방금 전',
          },
        ]
      : [];

    const newWish: Wish = {
      id: Date.now().toString(),
      nickname: myNickname,
      sealId,
      content: `${sealInfo.icon} ${sealInfo.title}`,
      isMine: true,
      isGoldenBean: useRedBean,
      hasMyBlessing: false,
      blessings: initialBlessings,
      targetBlessings: TARGET_BLESSINGS,
      status: 'hanging',
      branchPos: BRANCH_POSITIONS[branchIdx],
      starPos: STAR_POSITIONS[starIdx],
      color,
    };

    const nextWishes = [...wishes, newWish];
    const msg = `👑 '${myNickname}'님이 [${sealInfo.icon}${sealInfo.title}] 기원 복주머니를 올렸습니다!`;
    setWishes(nextWishes);
    setIsWriteModalOpen(false);
    setCameraMode('tree');
    setFocusedTarget(newWish.branchPos);
    setBannerMessage(msg);
    broadcastWishes(nextWishes, msg);
  };

  const handleSendBlessStamp = (stampIcon: string) => {
    if (!selectedWish || karma < BLESS_KARMA_COST) return;

    addKarma(-BLESS_KARMA_COST + 3);

    const newBlessing: Blessing = {
      id: Date.now().toString(),
      author: myNickname,
      stamp: stampIcon,
      time: '방금 전',
    };

    const nextBlessings = [...selectedWish.blessings, newBlessing];
    const nextWishes = wishes.map((w) =>
      w.id === selectedWish.id
        ? { ...w, blessings: nextBlessings, hasMyBlessing: true }
        : w
    );

    setWishes(nextWishes);
    handleTriggerAction(
      'bow',
      `${stampIcon} 보시 공덕 달성! (🌸보상화 기운 상승)`
    );

    let msg = `${stampIcon} '${myNickname}'님이 '${selectedWish.nickname}'님의 기원에 복기운을 불어넣었습니다!`;
    if (nextBlessings.length >= selectedWish.targetBlessings) {
      msg = `✨ 지성이면 감천! '${selectedWish.nickname}'님의 기원에 복 기운이 가득 찼습니다!`;
    }
    setBannerMessage(msg);
    broadcastWishes(nextWishes, msg);
  };

  const handleAscendToStar = (wishId: string) => {
    const target = wishes.find((w) => w.id === wishId);
    if (!target || target.status !== 'hanging') return;

    setSelectedWishId(null);
    setFocusedTarget(null);
    setIsNightMode(true);
    setCameraMode('sky');
    setAscendingWishNickname(target.nickname);

    const msg = `🌌 정성이 하늘에 닿아 '${target.nickname}'님의 기원이 밤하늘의 별로 승천합니다!`;
    setBannerMessage(msg);

    const ascendingWishes = wishes.map((w) =>
      w.id === wishId ? { ...w, status: 'ascending' as const } : w
    );
    setWishes(ascendingWishes);
    broadcastWishes(ascendingWishes, msg, true, target.nickname);

    setTimeout(() => {
      setAscendingWishNickname(null);
      setWishes((prev) => {
        const finalWishes = prev.map((w) =>
          w.id === wishId ? { ...w, status: 'star' as const } : w
        );
        broadcastWishes(
          finalWishes,
          `⭐ '${target.nickname}'님의 기원이 영원한 별이 되었습니다!`,
          true
        );
        return finalWishes;
      });
      setFocusedTarget(target.starPos);
      setBannerMessage(`⭐ '${target.nickname}'님의 기원이 밤하늘의 별이 되었습니다!`);
    }, 4000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('bokssul_nick', myNickname);
    localStorage.setItem('bokssul_color', myColor);
    localStorage.setItem('bokssul_autowatch', String(autoWatchAscension));
    setIsProfileModalOpen(false);
  };

  const handleToggleFollow = (targetId?: string) => {
    if (targetId) {
      setFollowingId((prev) => (prev === targetId ? null : targetId));
      setClickTarget(null);
    } else if (remoteList.length > 0) {
      setFollowingId((prev) => (prev ? null : remoteList[0].id));
      setClickTarget(null);
    }
  };

  // [진단사항 3 반영] 내 동산에서는 거대 당산나무에 걸린 주머니를 숨기고 밤하늘 별만 남겨 공간 정체성 분리 & 렉 방지
  const visibleWishes =
    zoneMode === 'public'
      ? wishes
      : wishes.filter((w) => w.status === 'star');

  return (
    <div
      className={`fixed inset-0 w-full h-[100dvh] overflow-hidden select-none transition-colors duration-1000 ${
        isNightMode
          ? 'bg-gradient-to-b from-slate-950 via-indigo-950 to-emerald-950'
          : zoneMode === 'my_garden'
          ? 'bg-gradient-to-b from-[#558b2f] via-[#aed581] to-[#fff9c4]'
          : 'bg-gradient-to-b from-[#689f38] via-[#9ccc65] to-[#dcedc8]'
      }`}
    >
      <HudOverlay
        zoneMode={zoneMode}
        onSwitchZone={(z) => {
          switchZone(z);
          setFocusedTarget(null);
          setCameraMode('follow');
          setBannerMessage(
            z === 'my_garden'
              ? '🏡 내 동산에 도착했습니다! 팥을 수확하고 [조경 도감]으로 정원을 꾸며보세요.'
              : '🌐 모두의 당산나무 광장에 도착했습니다!'
          );
        }}
        onCopyInviteLink={handleCopyInviteLink}
        totalOnlineCount={remoteList.length + 1}
        hasRemotePlayers={remoteList.length > 0}
        followingId={followingId}
        onToggleFollow={() => handleToggleFollow()}
        cameraMode={cameraMode}
        hasFocusedTarget={Boolean(focusedTarget)}
        onSelectCameraMode={(mode) => {
          setFocusedTarget(null);
          setCameraMode(mode);
          if (mode === 'sky') {
            setIsNightMode(true);
            setBannerMessage(
              '🌌 밤하늘을 드래그해 둘러보고 별을 터치해 기원을 확인해보세요!'
            );
          }
        }}
        hangingCount={wishes.filter((w) => w.status === 'hanging').length}
        starCount={wishes.filter((w) => w.status === 'star').length}
        isNightMode={isNightMode}
        onToggleNightMode={() => setIsNightMode(!isNightMode)}
        bannerMessage={bannerMessage}
        activeBoss={activeBoss}
        isAnyModalOpen={isAnyModalOpen}
        isNearTree={isNearTree}
        myAction={myAction}
        onTriggerAction={(action, label) => handleTriggerAction(action, label)}
        onSmartPurifyAction={() => handleSmartPurifySpirits()}
        onOpenWriteModal={() => setIsWriteModalOpen(true)}
        onOpenFortuneModal={() => setIsFortuneModalOpen(true)}
        onOpenO2OModal={() => setIsO2OModalOpen(true)}
        isProfileModalOpen={isProfileModalOpen}
        setIsProfileModalOpen={setIsProfileModalOpen}
        isGardenShopOpen={isGardenShopOpen}
        setIsGardenShopOpen={setIsGardenShopOpen}
        unlockedDecor={unlockedDecor}
        placedDecor={placedDecor}
        onBuyOrToggleDecor={handleBuyOrToggleDecor}
        myNickname={myNickname}
        setMyNickname={setMyNickname}
        myColor={myColor}
        setMyColor={setMyColor}
        myKarma={karma}
        myRedBeans={redBeans}
        myFlowerType={flowerType}
        autoWatchAscension={autoWatchAscension}
        setAutoWatchAscension={setAutoWatchAscension}
        ascendingWishNickname={ascendingWishNickname}
        onCelebrateAscension={() => {
          handleTriggerAction('jump', '🎉 별 승천 축하하개! (🔮+1)', 1);
        }}
        onExitAscensionView={() => {
          setAscendingWishNickname(null);
          setFocusedTarget(null);
          setCameraMode('follow');
        }}
        onSaveProfile={handleSaveProfile}
      />

      <Canvas shadows camera={{ position: [0, 9.5, 19.5], fov: 45 }}>
        <ambientLight intensity={isNightMode ? 0.45 : 0.85} />
        <directionalLight
          position={[14, 24, 16]}
          intensity={isNightMode ? 0.45 : 1.3}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />

        <Sparkles
          count={isNightMode ? 180 : 50}
          scale={[42, 26, 42]}
          position={[0, 10, 0]}
          size={isNightMode ? 4 : 3}
          speed={0.4}
          color="#fef08a"
        />

        <MeteorShowerEffect active={meteorActive} />
        <TraditionalClouds isNightMode={isNightMode} />

        <UnifiedHillTerrain
          onGroundClick={(pt) => {
            if (myAction === 'sit') setMyAction('idle');
            setFollowingId(null);
            if (cameraMode === 'sky') {
              setAscendingWishNickname(null);
              setFocusedTarget(null);
              setCameraMode('follow');
            }
            setClickTarget(pt);
          }}
        />

        <ClickTargetMarker target={clickTarget} />

        {/* [진단사항 3 반영] 광장(당산나무+액운+복바구니) vs 내 동산(아늑한 마당+팥밭+조경물) 완전 분리 */}
        {zoneMode === 'public' ? (
          <>
            <WishTreeAndGuardian
              onPetGuardian={() =>
                handleTriggerAction(
                  'jump',
                  '🐾 복쓸싸리님 참배 완료! (🔮공덕 +2)',
                  2
                )
              }
              hideLabels={isAnyModalOpen}
              showGreeting={isNearTree}
            />
            <WishAltarAndOrbs
              myId={myId}
              orbsRef={orbsRef}
              playerPosRef={playerPosRef}
              playerMoveVecRef={playerMoveVecRef}
              collectedCount={collectedCount}
              hideLabels={isAnyModalOpen}
              meteorActive={meteorActive}
              onOrbEvent={handleOrbEvent}
            />
            <MisfortuneSystem
              spirits={spirits}
              hideLabels={isAnyModalOpen}
              onSweepSpirit={(id) => handleSmartPurifySpirits(id)}
            />
          </>
        ) : (
          <PersonalGardenSystem
            plots={beanPlots}
            placedDecor={placedDecor}
            hideLabels={isAnyModalOpen}
            ownerNickname={myNickname}
            onInteractPlot={handleInteractBeanPlot}
          />
        )}

        <BokssulPlayerAndCamera
          zoneMode={zoneMode}
          keys={keys}
          clickTarget={clickTarget}
          clearClickTarget={() => setClickTarget(null)}
          followingPlayer={followingPlayer}
          stopFollowing={() => setFollowingId(null)}
          remotePlayers={remotePlayers}
          playerPosRef={playerPosRef}
          playerMoveVecRef={playerMoveVecRef}
          onHighFive={handleHighFive}
          controlsRef={controlsRef}
          cameraMode={cameraMode}
          focusedTarget={focusedTarget}
          ascendingWish={ascendingWish}
          onNearTreeChange={setIsNearTree}
          hideLabels={isAnyModalOpen}
          myNickname={myNickname}
          myColor={myColor}
          myAction={myAction}
          myEmote={myEmote}
          myKarma={karma}
          myFlowerType={flowerType}
          hasO2OCrown={claimedCodes.length > 0}
          onPositionBroadcast={broadcastPosition}
        />

        <OtherPlayers
          players={remotePlayers}
          hideLabels={isAnyModalOpen}
          followingId={followingId}
          onSelectFollow={(id) => handleToggleFollow(id)}
        />

        {visibleWishes.map((w) => (
          <WishPouchObject
            key={w.id}
            wish={w}
            hideLabels={isAnyModalOpen}
            showAllTreeLabels={cameraMode === 'tree'}
            onSelect={(clicked) => {
              setSelectedWishId(clicked.id);
              setFocusedTarget(
                clicked.status === 'star' ? clicked.starPos : clicked.branchPos
              );
            }}
          />
        ))}

        <OrbitControls
          ref={controlsRef}
          target={[0, 5.0, 0]}
          minPolarAngle={0.02}
          maxPolarAngle={
            cameraMode === 'sky' ? Math.PI - 0.15 : Math.PI / 2 + 0.28
          }
          minDistance={4}
          maxDistance={38}
          enablePan={false}
        />
      </Canvas>

      <WishWriteModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        onCreateSealWish={handleCreateSealWish}
        myKarma={karma}
        myRedBeans={redBeans}
      />

      <WishDetailModal
        wish={selectedWish}
        onClose={() => setSelectedWishId(null)}
        onSendBlessStamp={handleSendBlessStamp}
        onAscendToStar={handleAscendToStar}
        myKarma={karma}
      />

      {/* 오늘의 보상화 운세 & 소장용 부적 이미지 다운로드 모달 */}
      <DailyFortuneModal
        isOpen={isFortuneModalOpen}
        onClose={() => setIsFortuneModalOpen(false)}
        todayKey={todayKey}
        myNickname={myNickname}
        flowerType={flowerType}
        myKarma={karma}
        onRerollFlower={rerollTodayFlower}
      />

      {/* O2O 매장 방문 / 굿즈 코드 등록 모달 */}
      <O2OConnectModal
        isOpen={isO2OModalOpen}
        onClose={() => setIsO2OModalOpen(false)}
        claimedCodes={claimedCodes}
        onRedeemCode={redeemO2OCode}
      />
    </div>
  );
}