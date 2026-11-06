import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sparkles } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  Sparkles as SparkleIcon,
  Star,
  ScrollText,
  Compass,
} from 'lucide-react';

import type { Wish, Blessing, CameraMode } from './types/wish';
import { BRANCH_POSITIONS, STAR_POSITIONS } from './utils/terrain';
import {
  TraditionalClouds,
  UnifiedHillTerrain,
  WishTreeAndGuardian,
} from './components/three/WorldEnvironment';
import { BokssulPlayerAndCamera } from './components/three/BokssulPlayer';
import { WishPouchObject } from './components/three/WishPouchObject';
import { VirtualJoystick } from './components/ui/VirtualJoystick';
import { WishWriteModal, WishDetailModal } from './components/ui/WishModals';

export default function App() {
  const TARGET_BLESSINGS = 3;

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

  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [pouchColor, setPouchColor] = useState('#e53935');

  const [blessingAuthor, setBlessingAuthor] = useState('');
  const [blessingComment, setBlessingComment] = useState('');

  const [cameraMode, setCameraMode] = useState<CameraMode>('follow');
  const [focusedTarget, setFocusedTarget] = useState<
    [number, number, number] | null
  >(null);
  const [isNightMode, setIsNightMode] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(
    '소원지를 걸고 이웃의 소원에 정성 어린 덕담을 남겨보세요!'
  );

  const keys = useRef<{ [key: string]: boolean }>({});
  const joystickVec = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const selectedWish = wishes.find((w) => w.id === selectedWishId) || null;
  const isAnyModalOpen = isWriteModalOpen || Boolean(selectedWishId);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isWriteModalOpen || selectedWishId) return;
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
  }, [isWriteModalOpen, selectedWishId]);

  const hangingCount = wishes.filter((w) => w.status === 'hanging').length;
  const starCount = wishes.filter((w) => w.status === 'star').length;

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

    setWishes((prev) => [...prev, newWish]);
    setNickname('');
    setContent('');
    setIsWriteModalOpen(false);
    setCameraMode('tree');
    setFocusedTarget(newWish.branchPos);
    setBannerMessage(
      `👑 '${newWish.nickname}'님의 소원지가 당산나무에 걸렸습니다!`
    );
  };

  const handleAddBlessing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWish || !blessingComment.trim()) return;

    const authorName = blessingAuthor.trim() || '익명의 복쓸덩이';
    const newBlessing: Blessing = {
      id: Date.now().toString(),
      author: authorName,
      comment: blessingComment.trim(),
      time: '방금 전',
    };

    const nextBlessings = [...selectedWish.blessings, newBlessing];
    setWishes((prev) =>
      prev.map((w) =>
        w.id === selectedWish.id
          ? { ...w, blessings: nextBlessings, hasMyBlessing: true }
          : w
      )
    );
    setBlessingComment('');

    if (nextBlessings.length >= selectedWish.targetBlessings) {
      setBannerMessage(
        `✨ 지성이면 감천! '${selectedWish.nickname}'님의 소원에 복 기운이 가득 찼습니다!`
      );
    }
  };

  const handleAscendToStar = (wishId: string) => {
    const target = wishes.find((w) => w.id === wishId);
    if (!target || target.status !== 'hanging') return;

    setSelectedWishId(null);
    setIsNightMode(true);
    setCameraMode('sky');
    setFocusedTarget(null);
    setBannerMessage(
      `🌌 정성이 하늘에 닿아 '${target.nickname}'님의 소원이 밤하늘의 별로 승천합니다!`
    );

    setWishes((prev) =>
      prev.map((w) => (w.id === wishId ? { ...w, status: 'ascending' } : w))
    );

    setTimeout(() => {
      setWishes((prev) =>
        prev.map((w) => (w.id === wishId ? { ...w, status: 'star' } : w))
      );
      setBannerMessage(
        `⭐ '${target.nickname}'님의 소원이 별이 되었습니다! 하늘의 별을 터치해보세요.`
      );
    }, 3400);
  };

  return (
    <div
      className={`fixed inset-0 w-full h-[100dvh] overflow-hidden select-none transition-colors duration-1000 ${
        isNightMode
          ? 'bg-gradient-to-b from-slate-950 via-indigo-950 to-emerald-950'
          : 'bg-gradient-to-b from-[#689f38] via-[#9ccc65] to-[#dcedc8]'
      }`}
    >
      {/* --- Level 2 (HUD): 높이 44px(h-11)로 완벽히 통일된 상단 바 --- */}
      <header className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-1.5 pointer-events-none">
        {/* 좌측 브랜드 로고 박스 (h-11 고정) */}
        <div className="h-11 bg-[#fcf9f2]/95 backdrop-blur-md px-2.5 md:px-3.5 rounded-2xl shadow-lg border border-amber-900/20 pointer-events-auto flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-xl bg-red-800 flex items-center justify-center text-amber-100 font-serif font-black text-xs shadow-inner border border-amber-400/50">
            福
          </div>
          <h1 className="font-extrabold text-stone-900 text-xs md:text-sm whitespace-nowrap">
            복쓸싸리 동산
          </h1>
        </div>

        {/* 우측 시점 전환 & 낮밤 스위치 (h-11 고정) */}
        <div className="flex items-center gap-1 pointer-events-auto">
          <div className="h-11 bg-[#fcf9f2]/95 backdrop-blur-md px-1 rounded-2xl shadow-lg border border-stone-300 flex items-center gap-0.5">
            <button
              onClick={() => {
                setFocusedTarget(null);
                setCameraMode('follow');
              }}
              className={`h-8 px-2.5 rounded-xl text-[11px] font-extrabold transition flex items-center gap-1 whitespace-nowrap ${
                cameraMode === 'follow' && !focusedTarget
                  ? 'bg-lime-800 text-white shadow'
                  : 'text-stone-700 hover:bg-stone-200/70'
              }`}
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span>산책</span>
            </button>

            <button
              onClick={() => {
                setFocusedTarget(null);
                setCameraMode('tree');
              }}
              className={`h-8 px-2.5 rounded-xl text-[11px] font-extrabold transition flex items-center gap-1 whitespace-nowrap ${
                cameraMode === 'tree' && !focusedTarget
                  ? 'bg-lime-800 text-white shadow'
                  : 'text-stone-700 hover:bg-stone-200/70'
              }`}
            >
              <span>🌳나무({hangingCount})</span>
            </button>

            <button
              onClick={() => {
                setFocusedTarget(null);
                setCameraMode('sky');
                setIsNightMode(true);
              }}
              className={`h-8 px-2.5 rounded-xl text-[11px] font-extrabold transition flex items-center gap-1 whitespace-nowrap ${
                cameraMode === 'sky'
                  ? 'bg-indigo-950 text-amber-300 shadow'
                  : 'text-stone-700 hover:bg-stone-200/70'
              }`}
            >
              <Star className="w-3 h-3 fill-amber-400 text-amber-500 shrink-0" />
              <span>별({starCount})</span>
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
        <ambientLight intensity={isNightMode ? 0.42 : 0.85} />
        <directionalLight
          position={[14, 24, 16]}
          intensity={isNightMode ? 0.45 : 1.3}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />

        <Sparkles
          count={isNightMode ? 200 : 65}
          scale={[42, 26, 42]}
          position={[0, 10, 0]}
          size={isNightMode ? 4 : 3}
          speed={0.4}
          color="#fef08a"
        />

        <TraditionalClouds isNightMode={isNightMode} />
        <UnifiedHillTerrain />
        <WishTreeAndGuardian
          onOpenWrite={() => setIsWriteModalOpen(true)}
          hideLabels={isAnyModalOpen}
          showGreeting={isNearTree}
        />

        <BokssulPlayerAndCamera
          keys={keys}
          joystickVec={joystickVec}
          controlsRef={controlsRef}
          cameraMode={cameraMode}
          focusedTarget={focusedTarget}
          onNearTreeChange={setIsNearTree}
          hideLabels={isAnyModalOpen}
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
          minPolarAngle={0.05}
          maxPolarAngle={Math.PI / 2 + 0.28}
          minDistance={5}
          maxDistance={36}
          enablePan={false}
        />
      </Canvas>

      {/* --- Level 2 (HUD): 하단 안전 영역(bottom-4)에 맞춘 조이스틱 & 소원지 작성 버튼 --- */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-end justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <VirtualJoystick
            onMove={(vec) => {
              joystickVec.current = vec;
              if (Math.hypot(vec.x, vec.y) > 0.1) {
                setFocusedTarget(null);
                setCameraMode('follow');
              }
            }}
          />
        </div>

        <div className="pointer-events-auto">
          <button
            onClick={() => setIsWriteModalOpen(true)}
            className={`h-12 px-4 md:px-6 rounded-2xl font-extrabold text-xs md:text-sm shadow-2xl flex items-center gap-1.5 transition transform active:scale-95 border-2 ${
              isNearTree
                ? 'bg-amber-400 hover:bg-amber-300 text-stone-950 border-white ring-4 ring-amber-300/60 animate-pulse'
                : 'bg-red-800 hover:bg-red-700 text-amber-50 border-amber-400/50'
            }`}
          >
            <ScrollText className="w-4 h-4 shrink-0" />
            <span>
              {isNearTree ? '소원지 올리기 ✨' : '소원지 작성'}
            </span>
          </button>
        </div>
      </div>

      {/* --- Level 3 (z-50): 소원 작성 & 상세 열람 모달 --- */}
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