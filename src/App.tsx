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
import { HudOverlay } from './components/ui/HudOverlay';
import { WishWriteModal, WishDetailModal } from './components/ui/WishModals';

export default function App() {
  const { karma, addKarma, redBeans, addRedBeans, flowerType } =
    useGameProgress();

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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isJoystickDragging, setIsJoystickDragging] = useState(false);

  // 타인의 별 승천 연출 자동 보기 ON/OFF 설정
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
    '🧹 싸리빗자루로 액운을 쓸거나 복구슬을 모아 기원 인장을 올려보세요!'
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
      setCameraMode('sky');
      setFocusedTarget(null);
    }
    addKarma(5);
    setBannerMessage(
      '🌠 별똥별 축제 발동! 동산의 모든 복쓸덩이가 공덕 +5점을 받았습니다!'
    );

    setTimeout(() => {
      setMeteorActive(false);
      const respawned = generateScatteredOrbs();
      orbsRef.current = respawned;
      setCollectedCount(0);
      setBannerMessage('🔮 동산 곳곳에 새로운 오색 복구슬들이 나타났습니다!');
    }, 10000);
  }, [addKarma, autoWatchAscension]);

  // 다른 유저가 별을 띄웠을 때 자동 감상 처리 (설정이 ON일 때만 시점 전환)
  const handleRemoteAscension = useCallback(
    (ascendNick: string) => {
      setAscendingWishNickname(ascendNick);
      if (autoWatchAscension) {
        setIsNightMode(true);
        setCameraMode('sky');
        setFocusedTarget(null);
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
    broadcastWishes,
  } = useMultiplayer({
    myNickname,
    myColor,
    myAction,
    myEmote,
    myKarma: karma,
    myFlowerType: flowerType,
    orbsRef,
    spiritsRef,
    wishesRef,
    setSpirits,
    setCollectedCount,
    onMeteorTriggered: triggerMeteorFestival,
    onRemoteAscension: handleRemoteAscension,
    setWishes,
    setBannerMessage,
    setIsNightMode,
  });

  const selectedWish = wishes.find((w) => w.id === selectedWishId) || null;
  const isAnyModalOpen =
    isWriteModalOpen || Boolean(selectedWishId) || isProfileModalOpen;
  const followingPlayer = followingId ? remotePlayers[followingId] || null : null;
  const remoteList = Object.values(remotePlayers);

  const handleTriggerAction = useCallback(
    (action: PlayerAction, label: string, bonusKarma = 0) => {
      const nextKarma = karma + bonusKarma;
      if (bonusKarma > 0) addKarma(bonusKarma);
      setMyAction(action);
      setMyEmote(label);
      broadcastAction(action, label, nextKarma);

      if (action !== 'sit') {
        setTimeout(() => {
          setMyAction('idle');
          setMyEmote(null);
        }, 2400);
      } else {
        setTimeout(() => setMyEmote(null), 2400);
      }
    },
    [karma, addKarma, broadcastAction]
  );

  const handleSweepSpirits = useCallback(
    (targetSpiritId?: string) => {
      const pPos = playerPosRef.current;
      let hitAny = false;
      let purifiedAny = false;

      const updated = spiritsRef.current
        .map((sp) => {
          const dist = Math.hypot(sp.x - pPos.x, sp.z - pPos.z);
          if (sp.id === targetSpiritId && dist > 3.2) {
            setClickTarget({ x: sp.x, z: sp.z });
            return sp;
          }
          if (dist <= 3.2 || sp.id === targetSpiritId) {
            hitAny = true;
            const nextHp = sp.hp - 1;
            if (nextHp <= 0) {
              purifiedAny = true;
              return null;
            }
            return { ...sp, hp: nextHp };
          }
          return sp;
        })
        .filter(Boolean) as MisfortuneSpirit[];

      if (updated.length < 2) {
        const extra = generateInitialSpirits()[0];
        updated.push(extra);
      }

      spiritsRef.current = updated;
      setSpirits(updated);
      broadcastSpirits(updated);

      if (purifiedAny) {
        handleTriggerAction('sweep', '🧹 액운 정화 완료! (🔮공덕 +3)', 3);
      } else if (hitAny) {
        handleTriggerAction('sweep', '🧹 쓱싹쓱싹! 액운 쓸어내기!', 1);
      } else {
        handleTriggerAction('sweep', '🧹 싸리빗자루 손질 중!');
      }
    },
    [broadcastSpirits, handleTriggerAction]
  );

  const handleOrbEvent = useCallback(
    (currentOrbs: RollingOrb[], justCollected: boolean) => {
      const count = currentOrbs.filter((o) => o.collected).length;
      setCollectedCount(count);
      const allCollected = count === currentOrbs.length;

      if (justCollected) {
        addKarma(3);
        if (!allCollected) {
          setMyEmote(`🧺 골인! 🔮공덕 +3 (${count}/3)`);
          setTimeout(() => setMyEmote(null), 2200);
        }
      }

      broadcastOrbs(currentOrbs, allCollected && !meteorActive);

      if (allCollected && !meteorActive) {
        triggerMeteorFestival();
      }
    },
    [meteorActive, addKarma, broadcastOrbs, triggerMeteorFestival]
  );

  const handleHighFive = useCallback(
    (friendName: string) => {
      addKarma(2);
      setMyEmote(`⚡ ${friendName}님과 복 박치기! (🔮+2)`);
      setTimeout(() => setMyEmote(null), 2200);
    },
    [addKarma]
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

  // [Phase 2 핵심] 무언의 6대 기원 문양으로 소원 걸기
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
          { id: `bean_1_${Date.now()}`, author: '붉은팥액막이', stamp: '🫘', time: '방금 전' },
          { id: `bean_2_${Date.now()}`, author: '수호신복쓸싸리', stamp: '✨', time: '방금 전' },
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

  // [Phase 2 핵심] 텍스트 없이 응원 스탬프 + 공덕 불어넣기 (보시 보너스)
  const handleSendBlessStamp = (stampIcon: string) => {
    if (!selectedWish || karma < BLESS_KARMA_COST) return;

    // 내 공덕 2점을 소원에 넣으면 보시(布施)의 공덕으로 +3점을 돌려받아 순증가(+1) 및 꽃 개화 촉진!
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
    handleTriggerAction('bow', `${stampIcon} 보시 공덕 달성! (🌸보상화 기운 상승)`);

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
    setIsNightMode(true);
    setCameraMode('sky');
    setFocusedTarget(null);
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
      setBannerMessage(`⭐ '${target.nickname}'님의 기원이 밤하늘의 별이 되었습니다!`);
    }, 4200);
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
          : 'bg-gradient-to-b from-[#689f38] via-[#9ccc65] to-[#dcedc8]'
      }`}
    >
      <HudOverlay
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
        isAnyModalOpen={isAnyModalOpen}
        isNearTree={isNearTree}
        myAction={myAction}
        onTriggerAction={(action, label) => handleTriggerAction(action, label)}
        onSweepAction={() => handleSweepSpirits()}
        onOpenWriteModal={() => setIsWriteModalOpen(true)}
        onJoystickDragChange={setIsJoystickDragging}
        onJoystickMove={(vec) => {
          joystickVec.current = vec;
          // 별 승천 감상 중이라도 조이스틱을 움직이면 즉시 내 시점으로 자유 이탈!
          if (Math.hypot(vec.x, vec.y) > 0.1) {
            if (myAction === 'sit') setMyAction('idle');
            setAscendingWishNickname(null);
            setFocusedTarget(null);
            setCameraMode('follow');
          }
        }}
        isProfileModalOpen={isProfileModalOpen}
        setIsProfileModalOpen={setIsProfileModalOpen}
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