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

export default function App() {
  const {
    karma,
    addKarma,
    redBeans,
    addRedBeans,
    flowerType,
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
  const [isJoystickDragging, setIsJoystickDragging] = useState(false);

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
    '🧹 광장에서 액운을 정화하고 🏡 내 동산 조경 도감으로 정원을 꾸며보세요!'
  );

  const keys = useRef<{ [key: string]: boolean }>({});
  const joystickVec = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

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
    isGardenShopOpen;
  const followingPlayer = followingId ? remotePlayers[followingId] || null : null;
  const remoteList = Object.values(remotePlayers);

  const handleTriggerAction = useCallback(
    (action: PlayerAction, label: string, bonusKarma = 0) => {
      if (actionTimerRef.current) {
        window.clearTimeout(actionTimerRef.current);
        actionTimerRef.current = null;
      }

      const nextKarma = karma + bonusKarma;
      if (bonusKarma > 0) addKarma(bonusKarma);

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

  // 싸리빗자루 쓸기 & 거대 대액운(Boss) 스폰/정화 처리
  const handleSweepSpirits = useCallback(
    (targetSpiritId?: string) => {
      if (zoneMode === 'my_garden') {
        boostAllPlots();
        handleTriggerAction(
          'sweep',
          '🧹 정성껏 텃밭을 쓸어 팥이 탐스럽게 익었습니다!',
          1
        );
        return;
      }

      const pPos = playerPosRef.current;
      let hitAny = false;
      let purifiedNormal = false;
      let purifiedBoss = false;

      const updated = spiritsRef.current
        .map((sp) => {
          const hitRange = sp.isBoss ? 4.2 : 3.2;
          const dist = Math.hypot(sp.x - pPos.x, sp.z - pPos.z);
          if (sp.id === targetSpiritId && dist > hitRange) {
            setClickTarget({ x: sp.x, z: sp.z });
            return sp;
          }
          if (dist <= hitRange || sp.id === targetSpiritId) {
            hitAny = true;
            const nextHp = sp.hp - 1;
            if (nextHp <= 0) {
              if (sp.isBoss) purifiedBoss = true;
              else purifiedNormal = true;
              return null;
            }
            return { ...sp, hp: nextHp };
          }
          return sp;
        })
        .filter(Boolean) as MisfortuneSpirit[];

      // 일반 액운 3마리를 정화할 때마다 거대 먹구름 대액운(Boss) 출현!
      if (purifiedNormal) {
        purifiedCountRef.current += 1;
        if (
          purifiedCountRef.current % 3 === 0 &&
          !updated.some((s) => s.isBoss)
        ) {
          updated.push(generateBossSpirit());
          setBannerMessage(
            '⚡ 당산나무 앞마당에 거대 먹구름 대액운이 출현했습니다! 힘을 합쳐 쓸어내세요!'
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
      } else if (purifiedNormal) {
        handleTriggerAction('sweep', '🧹 액운 정화 완료! (🔮공덕 +3)', 3);
      } else if (hitAny) {
        handleTriggerAction('sweep', '🧹 쓱싹쓱싹! 액운 쓸어내기!', 1);
      } else {
        handleTriggerAction('sweep', '🧹 싸리빗자루 손질 중!');
      }
    },
    [
      zoneMode,
      boostAllPlots,
      broadcastSpirits,
      handleTriggerAction,
      addRedBeans,
      triggerMeteorFestival,
    ]
  );

  // 붉은 팥(🫘) 뿌리기: 일반 액운은 즉사, 거대 대액운에게는 특효 데미지 3!
  const handleThrowRedBean = useCallback(() => {
    if (redBeans < 1 || spiritsRef.current.length === 0) return;
    addRedBeans(-1);

    const pPos = playerPosRef.current;
    // 보스가 있으면 보스를 우선 타격, 없으면 가장 가까운 액운 타격
    let targetIdx = spiritsRef.current.findIndex((s) => s.isBoss);
    if (targetIdx === -1) {
      let minDist = Infinity;
      spiritsRef.current.forEach((sp, i) => {
        const d = Math.hypot(sp.x - pPos.x, sp.z - pPos.z);
        if (d < minDist) {
          minDist = d;
          targetIdx = i;
        }
      });
    }

    let purifiedBoss = false;
    const updated = spiritsRef.current
      .map((sp, i) => {
        if (i !== targetIdx) return sp;
        if (sp.isBoss) {
          const nextHp = sp.hp - 3;
          if (nextHp <= 0) {
            purifiedBoss = true;
            return null;
          }
          return { ...sp, hp: nextHp };
        }
        return null; // 일반 액운은 일격 정화
      })
      .filter(Boolean) as MisfortuneSpirit[];

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
        '🫘 붉은 팥으로 거대 대액운 완전 정화! (🔮+8 · 🫘+1)',
        8
      );
      triggerMeteorFestival();
    } else {
      handleTriggerAction(
        'jump',
        '🫘 붉은 팥 액막이 적중! (🔮공덕 +5)',
        5
      );
    }
  }, [
    redBeans,
    addRedBeans,
    broadcastSpirits,
    handleTriggerAction,
    triggerMeteorFestival,
  ]);

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
          '🫘 영험한 붉은 팥 2알 수확 완료! (🔮공덕 +2)',
          2
        );
      } else {
        setBannerMessage(
          '🌿 팥이 자라는 중입니다! 하단 [🧹쓸기]를 누르면 즉시 익습니다!'
        );
      }
    },
    [karma, addKarma, plantBean, harvestBean, addRedBeans, handleTriggerAction]
  );

  // [Phase 4 핵심] 내 동산 조경 오브제 교환 및 배치 토글
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
        handleTriggerAction('jump', `${item.icon} '${item.name}' 내 동산에 배치 완료!`);
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
        addKarma(3);
        if (!allCollected) {
          handleTriggerAction('jump', `🧺 골인! 🔮공덕 +3 (${count}/3)`);
        }
      }

      broadcastOrbs(currentOrbs, allCollected && !meteorActive);

      if (allCollected && !meteorActive) {
        triggerMeteorFestival();
      }
    },
    [
      meteorActive,
      addKarma,
      broadcastOrbs,
      triggerMeteorFestival,
      handleTriggerAction,
    ]
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
        onSweepAction={() => handleSweepSpirits()}
        onThrowRedBean={handleThrowRedBean}
        onOpenWriteModal={() => setIsWriteModalOpen(true)}
        onJoystickDragChange={setIsJoystickDragging}
        onJoystickMove={(vec) => {
          joystickVec.current = vec;
          if (Math.hypot(vec.x, vec.y) > 0.1) {
            if (myAction === 'sit') setMyAction('idle');
            setAscendingWishNickname(null);
            setFocusedTarget(null);
            setCameraMode('follow');
          }
        }}
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
          count={isNightMode ? 220 : 65}
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

        {zoneMode === 'public' ? (
          <>
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
              onSweepSpirit={(id) => handleSweepSpirits(id)}
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

        <BokssulPlayerAndCamera
          keys={keys}
          joystickVec={joystickVec}
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
          onPositionBroadcast={broadcastPosition}
        />

        <OtherPlayers
          players={remotePlayers}
          hideLabels={isAnyModalOpen}
          followingId={followingId}
          onSelectFollow={(id) => handleToggleFollow(id)}
        />

        {wishes.map((w) => (
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
          enabled={!isJoystickDragging}
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
    </div>
  );
}