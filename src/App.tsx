import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sparkles } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  Sparkles as SparkleIcon,
  Star,
  ScrollText,
  Compass,
  Users,
  Smile,
  Footprints,
} from 'lucide-react';

import type {
  Wish,
  Blessing,
  CameraMode,
  RemotePlayer,
  PlayerAction,
  RollingOrb,
} from './types/wish';
import { BRANCH_POSITIONS, STAR_POSITIONS } from './utils/terrain';
import { supabase } from './utils/supabase';
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
import { VirtualJoystick } from './components/ui/VirtualJoystick';
import { WishWriteModal, WishDetailModal } from './components/ui/WishModals';

const RANDOM_COLORS = [
  '#e53935',
  '#fb8c00',
  '#d81b60',
  '#43a047',
  '#1e88e5',
  '#8e24aa',
];

const INITIAL_ORBS: RollingOrb[] = [
  { id: 1, x: -4.5, z: 9.0, vx: 0, vz: 0, collected: false },
  { id: 2, x: 4.8, z: 8.5, vx: 0, vz: 0, collected: false },
  { id: 3, x: 0.2, z: 12.2, vx: 0, vz: 0, collected: false },
];

export default function App() {
  const TARGET_BLESSINGS = 3;

  const myIdRef = useRef<string>(
    'user_' + Math.random().toString(36).substring(2, 9)
  );
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
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // 바닥 클릭 이동 & 기차놀이(따라가기) 상태
  const [clickTarget, setClickTarget] = useState<{ x: number; z: number } | null>(
    null
  );
  const [followingId, setFollowingId] = useState<string | null>(null);

  // 협동 복구슬 & 유성우 이벤트 상태
  const orbsRef = useRef<RollingOrb[]>(INITIAL_ORBS);
  const [orbsState, setOrbsState] = useState<RollingOrb[]>(INITIAL_ORBS);
  const [meteorActive, setMeteorActive] = useState(false);

  const [remotePlayers, setRemotePlayers] = useState<
    Record<string, RemotePlayer>
  >({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const myLatestCoordsRef = useRef({
    x: 0,
    z: 8.5,
    rot: Math.PI,
    isMoving: false,
  });

  const [wishes, setWishes] = useState<Wish[]>([
    {
      id: '1',
      nickname: '경주복쓸이',
      content:
        '복쓸싸리 동산을 찾은 모든 분들의 가정에 만복이 깃들고 소망이 이루어지길 발원합니다.',
      isMine: true,
      hasMyBlessing: true,
      blessings: [
        {
          id: 'b1',
          author: '황리단길나그네',
          comment: '따뜻한 마음이 하늘에 닿아 꼭 큰 복으로 돌아올 겁니다!',
          time: '방금 전',
        },
        {
          id: 'b2',
          author: '포항해맞이',
          comment: '올 한 해 하시는 일마다 술술 풀리시기를 함께 기원합니다.',
          time: '3분 전',
        },
      ],
      targetBlessings: TARGET_BLESSINGS,
      status: 'hanging',
      branchPos: BRANCH_POSITIONS[0],
      starPos: STAR_POSITIONS[0],
      color: '#e53935',
    },
    {
      id: '2',
      nickname: '황리단길산책러',
      content:
        '우리 가족 모두 아프지 않고 건강하며 매일 웃음꽃이 피어나기를 소원합니다.',
      isMine: false,
      hasMyBlessing: false,
      blessings: [
        {
          id: 'b3',
          author: '첨성대별지기',
          comment:
            '가족을 생각하는 지극한 정성이 밤하늘의 별처럼 빛나길 바랍니다.',
          time: '5분 전',
        },
        {
          id: 'b4',
          author: '남산소나무',
          comment: '건강이 최고의 복이지요! 온 가족의 무병장수를 응원합니다.',
          time: '2분 전',
        },
        {
          id: 'b5',
          author: '복쓸덩이친구',
          comment: '정성이 가득 모였네요! 하늘의 별로 떠올라 꼭 이루어지세요!',
          time: '1분 전',
        },
      ],
      targetBlessings: TARGET_BLESSINGS,
      status: 'hanging',
      branchPos: BRANCH_POSITIONS[1],
      starPos: STAR_POSITIONS[1],
      color: '#fb8c00',
    },
    {
      id: '3',
      nickname: '동해안길손',
      content:
        '새롭게 시작하는 일에 좋은 인연들이 모이고 세상에 보탬이 되는 결실을 맺기를!',
      isMine: false,
      hasMyBlessing: true,
      blessings: [
        {
          id: 'b6',
          author: '경주복쓸이',
          comment:
            '좋은 뜻으로 시작하시는 일에 귀인들이 구름처럼 모이길 기원합니다!',
          time: '10분 전',
        },
        {
          id: 'b7',
          author: '달빛산책',
          comment: '정성이 모이면 하늘이 감동합니다. 끝까지 응원할게요!',
          time: '4분 전',
        },
        {
          id: 'b8',
          author: '선청이',
          comment: '하늘의 별이 되어 앞길을 환히 비춰주기를!',
          time: '1분 전',
        },
      ],
      targetBlessings: TARGET_BLESSINGS,
      status: 'star',
      branchPos: BRANCH_POSITIONS[2],
      starPos: STAR_POSITIONS[2],
      color: '#d81b60',
    },
  ]);

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
    '바닥을 터치해 산책하거나 황금 복구슬 3개를 제단에 모아 별똥별을 불러보세요!'
  );

  const keys = useRef<{ [key: string]: boolean }>({});
  const joystickVec = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const selectedWish = wishes.find((w) => w.id === selectedWishId) || null;
  const isAnyModalOpen =
    isWriteModalOpen || Boolean(selectedWishId) || isProfileModalOpen;
  const followingPlayer = followingId ? remotePlayers[followingId] || null : null;

  // 유성우 발동 및 리스폰 트리거
  const triggerMeteorFestival = useCallback(() => {
    setMeteorActive(true);
    setIsNightMode(true);
    setCameraMode('sky');
    setFocusedTarget(null);
    setBannerMessage(
      '🌠 복구슬 3개가 모두 모여 밤하늘에 소원 유성우(별똥별)가 쏟아집니다!'
    );

    setTimeout(() => {
      setMeteorActive(false);
      const respawned = INITIAL_ORBS.map((o) => ({
        ...o,
        x: (Math.random() - 0.5) * 12,
        z: 7.5 + Math.random() * 6,
        collected: false,
      }));
      orbsRef.current = respawned;
      setOrbsState(respawned);
      setBannerMessage('🔮 동산에 새로운 황금 복구슬 3개가 다시 나타났습니다!');
    }, 10000);
  }, []);

  // --- Supabase Realtime 멀티플레이 채널 ---
  useEffect(() => {
    const myId = myIdRef.current;
    const channel = supabase.channel('bokssul-hill-room', {
      config: {
        presence: { key: myId },
        broadcast: { self: false },
      },
    });

    channelRef.current = channel;

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      setRemotePlayers((prev) => {
        const next: Record<string, RemotePlayer> = {};
        Object.entries(state).forEach(([key, list]) => {
          if (key === myId || !list || list.length === 0) return;
          const info = list[0] as unknown as Partial<RemotePlayer>;
          const existing = prev[key];
          next[key] = {
            id: key,
            nickname: info.nickname || existing?.nickname || '복쓸이',
            color: info.color || existing?.color || '#e53935',
            x: existing?.x ?? info.x ?? 0,
            z: existing?.z ?? info.z ?? 8.5,
            rot: existing?.rot ?? info.rot ?? Math.PI,
            isMoving: existing?.isMoving ?? false,
            action: existing?.action ?? 'idle',
            emote: existing?.emote ?? null,
            lastSeen: Date.now(),
          };
        });
        return next;
      });
    });

    channel.on('broadcast', { event: 'player-move' }, ({ payload }) => {
      if (!payload || payload.id === myId) return;
      setRemotePlayers((prev) => ({
        ...prev,
        [payload.id]: {
          ...(prev[payload.id] || {}),
          id: payload.id,
          nickname: payload.nickname,
          color: payload.color,
          x: payload.x,
          z: payload.z,
          rot: payload.rot,
          isMoving: payload.isMoving,
          action: payload.action ?? prev[payload.id]?.action ?? 'idle',
          emote: payload.emote ?? prev[payload.id]?.emote ?? null,
          lastSeen: Date.now(),
        },
      }));
    });

    channel.on('broadcast', { event: 'orb-sync' }, ({ payload }) => {
      if (!payload || !payload.orbs) return;
      orbsRef.current = payload.orbs;
      setOrbsState(payload.orbs);
      if (payload.meteorTriggered) {
        triggerMeteorFestival();
      }
    });

    channel.on('broadcast', { event: 'wish-sync' }, ({ payload }) => {
      if (!payload || !payload.wishes) return;
      const incoming = (payload.wishes as Wish[]).map((w) => ({
        ...w,
        isMine: false,
      }));
      setWishes(incoming);
      if (payload.banner) setBannerMessage(payload.banner);
      if (payload.nightMode !== undefined) setIsNightMode(payload.nightMode);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          id: myId,
          nickname: myNickname,
          color: myColor,
          x: myLatestCoordsRef.current.x,
          z: myLatestCoordsRef.current.z,
          rot: myLatestCoordsRef.current.rot,
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myNickname, myColor, triggerMeteorFestival]);

  const handlePositionBroadcast = useCallback(
    (coords: { x: number; z: number; rot: number; isMoving: boolean }) => {
      myLatestCoordsRef.current = coords;
      if (!channelRef.current) return;
      channelRef.current.send({
        type: 'broadcast',
        event: 'player-move',
        payload: {
          id: myIdRef.current,
          nickname: myNickname,
          color: myColor,
          ...coords,
          action: myAction,
          emote: myEmote,
        },
      });
    },
    [myNickname, myColor, myAction, myEmote]
  );

  // 4대 바디랭귀지 모션 실행
  const handleTriggerAction = (action: PlayerAction, label: string) => {
    setMyAction(action);
    setMyEmote(label);
    setIsActionMenuOpen(false);

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'player-move',
        payload: {
          id: myIdRef.current,
          nickname: myNickname,
          color: myColor,
          ...myLatestCoordsRef.current,
          action,
          emote: label,
        },
      });
    }

    if (action !== 'sit') {
      setTimeout(() => {
        setMyAction('idle');
        setMyEmote(null);
      }, 2800);
    } else {
      setTimeout(() => setMyEmote(null), 2500);
    }
  };

  // 복구슬 밀었을 때 실시간 동기화 & 3개 달성 시 유성우 발동
  const handleOrbPushed = useCallback(
    (nextOrbs: RollingOrb[]) => {
      setOrbsState([...nextOrbs]);
      const allCollected = nextOrbs.every((o) => o.collected);

      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'orb-sync',
          payload: {
            orbs: nextOrbs,
            meteorTriggered: allCollected && !meteorActive,
          },
        });
      }

      if (allCollected && !meteorActive) {
        triggerMeteorFestival();
      }
    },
    [meteorActive, triggerMeteorFestival]
  );

  // 친구와 박치기 하이파이브 시 알림
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

  const hangingCount = wishes.filter((w) => w.status === 'hanging').length;
  const starCount = wishes.filter((w) => w.status === 'star').length;
  const remoteList = Object.values(remotePlayers);
  const totalOnlineCount = remoteList.length + 1;

  const broadcastWishes = (
    nextWishes: Wish[],
    banner?: string,
    nightMode?: boolean
  ) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'wish-sync',
      payload: {
        wishes: nextWishes,
        banner,
        nightMode,
      },
    });
  };

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
    const msg = `🌌 정성이 하늘에 닿아 '${target.nickname}'님의 소원이 밤하늘의 별로 승천합니다!`;
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
      setBannerMessage(
        `⭐ '${target.nickname}'님의 소원이 별이 되었습니다! 화면을 돌려 별을 터치해보세요.`
      );
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

  // 친구 따라가기(기차놀이) 토글
  const handleToggleFollow = (targetId?: string) => {
    if (targetId) {
      setFollowingId((prev) => (prev === targetId ? null : targetId));
      setClickTarget(null);
    } else if (remoteList.length > 0) {
      const nextFriend = remoteList[0];
      setFollowingId((prev) => (prev ? null : nextFriend.id));
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
      {/* --- Level 2 (HUD): 상단 바 --- */}
      <header className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-1.5 pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <div className="h-11 bg-[#fcf9f2]/95 backdrop-blur-md px-2.5 md:px-3.5 rounded-2xl shadow-lg border border-amber-900/20 flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-xl bg-red-800 flex items-center justify-center text-amber-100 font-serif font-black text-xs shadow-inner border border-amber-400/50">
              福
            </div>
            <h1 className="font-extrabold text-stone-900 text-xs md:text-sm whitespace-nowrap">
              복쓸싸리 동산
            </h1>
          </div>

          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="h-11 bg-stone-900/85 hover:bg-stone-900 backdrop-blur-md px-2.5 rounded-2xl shadow-lg border border-white/15 flex items-center gap-1.5 text-white text-[11px] font-extrabold transition shrink-0"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <Users className="w-3.5 h-3.5 text-emerald-300" />
            <span>{totalOnlineCount}명</span>
          </button>

          {/* [3번 & 6번] 접속한 친구가 있을 때 바로 찾아가 기차놀이하는 버튼 */}
          {remoteList.length > 0 && (
            <button
              onClick={() => handleToggleFollow()}
              className={`h-11 px-2.5 rounded-2xl shadow-lg text-[11px] font-extrabold flex items-center gap-1 transition shrink-0 ${
                followingId
                  ? 'bg-amber-400 text-stone-950 ring-2 ring-white animate-pulse'
                  : 'bg-[#fcf9f2]/95 text-stone-800 border border-stone-300'
              }`}
            >
              <Footprints className="w-3.5 h-3.5 shrink-0" />
              <span>{followingId ? '기차놀이 중' : '친구 따라가기'}</span>
            </button>
          )}
        </div>

        {/* 우측 시점 전환 & 낮밤 스위치 */}
        <div className="flex items-center gap-1 pointer-events-auto">
          <div className="h-11 bg-[#fcf9f2]/95 backdrop-blur-md px-1 rounded-2xl shadow-lg border border-stone-300 flex items-center gap-0.5">
            <button
              onClick={() => {
                setFocusedTarget(null);
                setCameraMode('follow');
              }}
              className={`h-8 px-2 rounded-xl text-[11px] font-extrabold transition flex items-center gap-1 whitespace-nowrap ${
                cameraMode === 'follow' && !focusedTarget
                  ? 'bg-lime-800 text-white shadow'
                  : 'text-stone-700 hover:bg-stone-200/70'
              }`}
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">산책</span>
            </button>

            <button
              onClick={() => {
                setFocusedTarget(null);
                setCameraMode('tree');
              }}
              className={`h-8 px-2 rounded-xl text-[11px] font-extrabold transition flex items-center gap-1 whitespace-nowrap ${
                cameraMode === 'tree' && !focusedTarget
                  ? 'bg-lime-800 text-white shadow'
                  : 'text-stone-700 hover:bg-stone-200/70'
              }`}
            >
              <span>🌳({hangingCount})</span>
            </button>

            <button
              onClick={() => {
                setFocusedTarget(null);
                setCameraMode('sky');
                setIsNightMode(true);
                setBannerMessage(
                  '🌌 밤하늘을 드래그해 둘러보고 빛나는 별을 터치해 소원을 확인해보세요!'
                );
              }}
              className={`h-8 px-2 rounded-xl text-[11px] font-extrabold transition flex items-center gap-1 whitespace-nowrap ${
                cameraMode === 'sky'
                  ? 'bg-indigo-950 text-amber-300 shadow'
                  : 'text-stone-700 hover:bg-stone-200/70'
              }`}
            >
              <Star className="w-3 h-3 fill-amber-400 text-amber-500 shrink-0" />
              <span>({starCount})</span>
            </button>
          </div>

          <button
            onClick={() => setIsNightMode(!isNightMode)}
            className="h-11 w-11 bg-[#fcf9f2]/95 hover:bg-white text-stone-800 rounded-2xl shadow-lg text-sm font-extrabold border border-stone-300 flex items-center justify-center transition shrink-0"
            title="낮/밤 전환"
          >
            {isNightMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* --- 상단 알림 배너 --- */}
      {bannerMessage && !isAnyModalOpen && (
        <div className="absolute top-16 left-3 right-3 z-20 flex justify-center pointer-events-none">
          <div className="bg-amber-400/95 backdrop-blur-sm text-stone-950 px-3.5 py-1.5 rounded-full font-extrabold text-[11px] md:text-xs shadow-lg flex items-center justify-between gap-2 w-full max-w-md pointer-events-auto">
            <div className="flex items-center gap-1.5 truncate">
              <SparkleIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{bannerMessage}</span>
            </div>
            <button
              onClick={() => setBannerMessage(null)}
              className="text-[10px] underline opacity-75 hover:opacity-100 shrink-0 pl-1"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* --- Level 1: 3D WebGL 캔버스 --- */}
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

        {/* 밤하늘 협동 유성우 이펙트 */}
        <MeteorShowerEffect active={meteorActive} />

        <TraditionalClouds isNightMode={isNightMode} />
        <UnifiedHillTerrain
          onGroundClick={(pt) => {
            if (myAction === 'sit') setMyAction('idle');
            setFollowingId(null);
            setFocusedTarget(null);
            setCameraMode('follow');
            setClickTarget(pt);
          }}
        />

        {/* 바닥 클릭 이동 물결 마커 & 협동 복구슬 제단 */}
        <ClickTargetMarker target={clickTarget} />
        <WishAltarAndOrbs
          orbs={orbsState}
          hideLabels={isAnyModalOpen}
          meteorActive={meteorActive}
        />

        <WishTreeAndGuardian
          onPetGuardian={() => {
            handleTriggerAction('jump', '🐾 복쓸싸리님 쓰담쓰담!');
          }}
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
          orbsRef={orbsRef}
          onOrbPushed={handleOrbPushed}
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
          onPositionBroadcast={handlePositionBroadcast}
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

      {/* --- Level 2 (HUD): 하단 조이스틱 & 4대 몸짓 액션 휠 & 소원지 버튼 --- */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-end justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <VirtualJoystick
            onMove={(vec) => {
              joystickVec.current = vec;
              if (Math.hypot(vec.x, vec.y) > 0.1) {
                if (myAction === 'sit') setMyAction('idle');
                setFocusedTarget(null);
                setCameraMode('follow');
              }
            }}
          />
        </div>

        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {/* [4번] 펼쳐지는 4대 비언어 바디랭귀지 버튼 메뉴 */}
          {isActionMenuOpen && (
            <div className="bg-[#fcf9f2]/95 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border-2 border-amber-900/20 flex items-center gap-1 animate-bounce">
              <button
                onClick={() => handleTriggerAction('jump', '🙌 만세 점프!')}
                className="px-2.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-stone-900 text-[11px] font-extrabold transition"
              >
                🙌 점프
              </button>
              <button
                onClick={() => handleTriggerAction('roll', '🌀 데구르르!')}
                className="px-2.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-stone-900 text-[11px] font-extrabold transition"
              >
                🌀 구르기
              </button>
              <button
                onClick={() => handleTriggerAction('bow', '🙇 복 받으시개!')}
                className="px-2.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-stone-900 text-[11px] font-extrabold transition"
              >
                🙇 절하기
              </button>
              <button
                onClick={() =>
                  handleTriggerAction(
                    myAction === 'sit' ? 'idle' : 'sit',
                    myAction === 'sit' ? '🐾 산책 출발!' : '🍞 식빵 굽는 중...'
                  )
                }
                className={`px-2.5 py-2 rounded-xl text-[11px] font-extrabold transition ${
                  myAction === 'sit'
                    ? 'bg-lime-800 text-white'
                    : 'bg-amber-100 hover:bg-amber-200 text-stone-900'
                }`}
              >
                🍞 앉기
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
              className="h-12 px-3.5 rounded-2xl bg-white/95 hover:bg-white text-stone-800 font-extrabold text-xs shadow-xl border border-stone-300 flex items-center gap-1.5 transition transform active:scale-95"
            >
              <Smile className="w-4 h-4 text-amber-500 shrink-0" />
              <span>몸짓</span>
            </button>

            <button
              onClick={() => setIsWriteModalOpen(true)}
              className={`h-12 px-4 md:px-5 rounded-2xl font-extrabold text-xs md:text-sm shadow-2xl flex items-center gap-1.5 transition transform active:scale-95 border-2 ${
                isNearTree
                  ? 'bg-amber-400 hover:bg-amber-300 text-stone-950 border-white ring-4 ring-amber-300/60 animate-pulse'
                  : 'bg-red-800 hover:bg-red-700 text-amber-50 border-amber-400/50'
              }`}
            >
              <ScrollText className="w-4 h-4 shrink-0" />
              <span>{isNearTree ? '소원지 올리기 ✨' : '소원지 작성'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- 내 복쓸덩이 프로필 모달 --- */}
      {isProfileModalOpen && (
        <div
          onClick={() => setIsProfileModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveProfile}
            className="bg-[#fbf6e9] w-full max-w-[340px] rounded-3xl p-5 shadow-2xl border-4 border-double border-amber-900/40 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-amber-900/15 pb-2.5">
              <h3 className="text-sm font-extrabold text-stone-900">
                🐾 내 복쓸덩이 꾸미기 ({totalOnlineCount}명 접속 중)
              </h3>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-stone-700 mb-1">
                내 복쓸덩이 이름
              </label>
              <input
                type="text"
                required
                maxLength={10}
                value={myNickname}
                onChange={(e) => setMyNickname(e.target.value)}
                className="w-full min-w-0 box-border px-3 py-2 rounded-xl bg-white border border-stone-300 text-sm font-bold text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-stone-700 mb-1.5">
                머리끈 색상
              </label>
              <div className="flex gap-2">
                {RANDOM_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setMyColor(c)}
                    className={`w-8 h-8 rounded-full shadow transition ${
                      myColor === c
                        ? 'ring-2 ring-stone-900 scale-110'
                        : 'opacity-60'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-lime-800 hover:bg-lime-700 text-white rounded-xl text-xs font-extrabold shadow"
            >
              적용하기
            </button>
          </form>
        </div>
      )}

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