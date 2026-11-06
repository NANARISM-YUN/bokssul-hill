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
} from './types/wish';
import { BRANCH_POSITIONS, STAR_POSITIONS } from './utils/terrain';
import {
  TARGET_BLESSINGS,
  RANDOM_COLORS,
  INITIAL_WISHES,
  generateScatteredOrbs,
} from './utils/constants';
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
import { HudOverlay } from './components/ui/HudOverlay';
import { WishWriteModal, WishDetailModal } from './components/ui/WishModals';

export default function App() {
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

  const [clickTarget, setClickTarget] = useState<{ x: number; z: number } | null>(
    null
  );
  const [followingId, setFollowingId] = useState<string | null>(null);

  // 60fps 구슬 물리용 Ref (리렌더링 방지) 및 골인 개수 표시용 State
  const orbsRef = useRef<RollingOrb[]>(generateScatteredOrbs());
  const [collectedCount, setCollectedCount] = useState(0);
  const [meteorActive, setMeteorActive] = useState(false);

  // 내 캐릭터 실시간 위치/속도 공유 Ref
  const playerPosRef = useRef({
    x: (Math.random() - 0.5) * 4,
    z: 8.2 + Math.random() * 2,
  });
  const playerMoveVecRef = useRef({ x: 0, z: 0, isMoving: false });

  const [wishes, setWishes] = useState<Wish[]>(INITIAL_WISHES);
  const [isNearTree, setIsNearTree] = useState(false);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [selectedWishId, setSelectedWishId] = useState<string | null>(null);

  const [nickname, setNickname] = useState(myNickname);
  const [content, setContent] = useState('');
  const [pouchColor, setPouchColor] = useState('#e53935');
  const [blessingAuthor, setBlessingAuthor] = useState(myNickname);
  const [blessingComment, setBlessingComment] = useState('');

  const [cameraMode, setCameraMode] = useState<CameraMode>('follow');
  const [focusedTarget, setFocusedTarget] = useState<
    [number, number, number] | null
  >(null);
  const [isNightMode, setIsNightMode] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(
    '오색 복구슬 3개를 바구니에 골인시켜 별똥별을 불러보세요!'
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
    setCameraMode('sky');
    setFocusedTarget(null);
    setBannerMessage('🌠 복바구니에 구슬이 가득 차 밤하늘에 별똥별이 쏟아집니다!');

    setTimeout(() => {
      setMeteorActive(false);
      const respawned = generateScatteredOrbs();
      orbsRef.current = respawned;
      setCollectedCount(0);
      setBannerMessage('🔮 동산 곳곳에 새로운 오색 복구슬들이 나타났습니다!');
    }, 10000);
  }, []);

  const {
    remotePlayers,
    broadcastPosition,
    broadcastAction,
    broadcastOrbs,
    broadcastWishes,
  } = useMultiplayer({
    myNickname,
    myColor,
    myAction,
    myEmote,
    orbsRef,
    setCollectedCount,
    onMeteorTriggered: triggerMeteorFestival,
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
    (action: PlayerAction, label: string) => {
      setMyAction(action);
      setMyEmote(label);
      broadcastAction(action, label);

      if (action !== 'sit') {
        setTimeout(() => {
          setMyAction('idle');
          setMyEmote(null);
        }, 2800);
      } else {
        setTimeout(() => setMyEmote(null), 2500);
      }
    },
    [broadcastAction]
  );

  const handleOrbEvent = useCallback(
    (currentOrbs: RollingOrb[], justCollected: boolean) => {
      const count = currentOrbs.filter((o) => o.collected).length;
      setCollectedCount(count);
      const allCollected = count === currentOrbs.length;

      if (justCollected && !allCollected) {
        setMyEmote(`🧺 골인! (${count}/3)`);
        setTimeout(() => setMyEmote(null), 2000);
      }

      broadcastOrbs(currentOrbs, allCollected && !meteorActive);

      if (allCollected && !meteorActive) {
        triggerMeteorFestival();
      }
    },
    [meteorActive, broadcastOrbs, triggerMeteorFestival]
  );

  const handleHighFive = useCallback((friendName: string) => {
    setMyEmote(`⚡ ${friendName}님과 복 박치기!`);
    setTimeout(() => setMyEmote(null), 2200);
  }, []);

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

  const handleAddWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !content.trim()) return;

    const branchIdx = wishes.length % BRANCH_POSITIONS.length;
    const starIdx = wishes.length % STAR_POSITIONS.length;

    const newWish: Wish = {
      id: Date.now().toString(),
      nickname: nickname.trim(),
      content: content.trim(),
      isMine: true,
      hasMyBlessing: false,
      blessings: [],
      targetBlessings: TARGET_BLESSINGS,
      status: 'hanging',
      branchPos: BRANCH_POSITIONS[branchIdx],
      starPos: STAR_POSITIONS[starIdx],
      color: pouchColor,
    };

    const nextWishes = [...wishes, newWish];
    const msg = `👑 '${newWish.nickname}'님의 소원지가 당산나무에 걸렸습니다!`;
    setWishes(nextWishes);
    setContent('');
    setIsWriteModalOpen(false);
    setCameraMode('tree');
    setFocusedTarget(newWish.branchPos);
    setBannerMessage(msg);
    broadcastWishes(nextWishes, msg);
  };

  const handleAddBlessing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWish || !blessingComment.trim()) return;

    const authorName = blessingAuthor.trim() || myNickname || '익명의 복쓸덩이';
    const newBlessing: Blessing = {
      id: Date.now().toString(),
      author: authorName,
      comment: blessingComment.trim(),
      time: '방금 전',
    };

    const nextBlessings = [...selectedWish.blessings, newBlessing];
    const nextWishes = wishes.map((w) =>
      w.id === selectedWish.id
        ? { ...w, blessings: nextBlessings, hasMyBlessing: true }
        : w
    );

    setWishes(nextWishes);
    setBlessingComment('');

    let msg: string | undefined;
    if (nextBlessings.length >= selectedWish.targetBlessings) {
      msg = `✨ 지성이면 감천! '${selectedWish.nickname}'님의 소원에 복 기운이 가득 찼습니다!`;
      setBannerMessage(msg);
    }
    broadcastWishes(nextWishes, msg);
  };

  const handleAscendToStar = (wishId: string) => {
    const target = wishes.find((w) => w.id === wishId);
    if (!target || target.status !== 'hanging') return;

    setSelectedWishId(null);
    setIsNightMode(true);
    setCameraMode('sky');
    setFocusedTarget(null);
    const msg = `🌌 정성이 하늘에 닿아 '${target.nickname}'님의 소원이 별로 승천합니다!`;
    setBannerMessage(msg);

    const ascendingWishes = wishes.map((w) =>
      w.id === wishId ? { ...w, status: 'ascending' as const } : w
    );
    setWishes(ascendingWishes);
    broadcastWishes(ascendingWishes, msg, true);

    setTimeout(() => {
      setWishes((prev) => {
        const finalWishes = prev.map((w) =>
          w.id === wishId ? { ...w, status: 'star' as const } : w
        );
        broadcastWishes(
          finalWishes,
          `⭐ '${target.nickname}'님의 소원이 별이 되었습니다!`,
          true
        );
        return finalWishes;
      });
      setBannerMessage(`⭐ '${target.nickname}'님의 소원이 밤하늘의 별이 되었습니다!`);
    }, 3400);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('bokssul_nick', myNickname);
    localStorage.setItem('bokssul_color', myColor);
    setNickname(myNickname);
    setBlessingAuthor(myNickname);
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
              '🌌 밤하늘을 드래그해 둘러보고 별을 터치해 소원을 열어보세요!'
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
        onTriggerAction={handleTriggerAction}
        onOpenWriteModal={() => setIsWriteModalOpen(true)}
        onJoystickDragChange={setIsJoystickDragging}
        onJoystickMove={(vec) => {
          joystickVec.current = vec;
          if (Math.hypot(vec.x, vec.y) > 0.1) {
            if (myAction === 'sit') setMyAction('idle');
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
              setFocusedTarget(null);
              setCameraMode('follow');
            }
            setClickTarget(pt);
          }}
        />

        <ClickTargetMarker target={clickTarget} />

        <WishAltarAndOrbs
          orbsRef={orbsRef}
          playerPosRef={playerPosRef}
          playerMoveVecRef={playerMoveVecRef}
          collectedCount={collectedCount}
          hideLabels={isAnyModalOpen}
          meteorActive={meteorActive}
          onOrbEvent={handleOrbEvent}
        />

        <WishTreeAndGuardian
          onPetGuardian={() =>
            handleTriggerAction('jump', '🐾 복쓸싸리님 쓰담쓰담!')
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
        onSubmit={handleAddWish}
        targetBlessings={TARGET_BLESSINGS}
        pouchColor={pouchColor}
        setPouchColor={setPouchColor}
        nickname={nickname}
        setNickname={setNickname}
        content={content}
        setContent={setContent}
      />

      <WishDetailModal
        wish={selectedWish}
        onClose={() => setSelectedWishId(null)}
        onAddBlessing={handleAddBlessing}
        onAscendToStar={handleAscendToStar}
        blessingAuthor={blessingAuthor}
        setBlessingAuthor={setBlessingAuthor}
        blessingComment={blessingComment}
        setBlessingComment={setBlessingComment}
      />
    </div>
  );
}