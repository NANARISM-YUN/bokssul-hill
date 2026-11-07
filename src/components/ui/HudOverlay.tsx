import React, { useState } from 'react';
import {
  Sparkles as SparkleIcon,
  Star,
  ScrollText,
  Compass,
  Smile,
  Footprints,
} from 'lucide-react';
import type { CameraMode, PlayerAction, FlowerType } from '../../types/wish';
import {
  RANDOM_COLORS,
  FLOWER_NAMES,
  KARMA_THRESHOLDS,
} from '../../utils/constants';
import { getGrowthStage } from '../../hooks/useGameProgress';
import { VirtualJoystick } from './VirtualJoystick';

interface HudOverlayProps {
  totalOnlineCount: number;
  hasRemotePlayers: boolean;
  followingId: string | null;
  onToggleFollow: () => void;
  cameraMode: CameraMode;
  hasFocusedTarget: boolean;
  onSelectCameraMode: (mode: CameraMode) => void;
  hangingCount: number;
  starCount: number;
  isNightMode: boolean;
  onToggleNightMode: () => void;
  bannerMessage: string | null;
  isAnyModalOpen: boolean;
  isNearTree: boolean;
  myAction: PlayerAction;
  onTriggerAction: (action: PlayerAction, label: string) => void;
  onSweepAction: () => void;
  onOpenWriteModal: () => void;
  onJoystickMove: (vec: { x: number; y: number }) => void;
  onJoystickDragChange: (dragging: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  myNickname: string;
  setMyNickname: (name: string) => void;
  myColor: string;
  setMyColor: (color: string) => void;
  myKarma: number;
  myRedBeans: number;
  myFlowerType: FlowerType;
  onSaveProfile: (e: React.FormEvent) => void;
}

export const HudOverlay = ({
  totalOnlineCount,
  hasRemotePlayers,
  followingId,
  onToggleFollow,
  cameraMode,
  hasFocusedTarget,
  onSelectCameraMode,
  hangingCount,
  starCount,
  isNightMode,
  onToggleNightMode,
  bannerMessage,
  isAnyModalOpen,
  isNearTree,
  myAction,
  onTriggerAction,
  onSweepAction,
  onOpenWriteModal,
  onJoystickMove,
  onJoystickDragChange,
  isProfileModalOpen,
  setIsProfileModalOpen,
  myNickname,
  setMyNickname,
  myColor,
  setMyColor,
  myKarma,
  myRedBeans,
  myFlowerType,
  onSaveProfile,
}: HudOverlayProps) => {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const stage = getGrowthStage(myKarma);
  const stageLabels = ['🌰 씨앗', '🌱 새싹', '🌷 봉오리', '🪷 만개'];

  const handleActionClick = (action: PlayerAction, label: string) => {
    setIsActionMenuOpen(false);
    onTriggerAction(action, label);
  };

  return (
    <>
      {/* --- 상단 2-캡슐 통합 헤더 --- */}
      <header className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="h-10 bg-[#fcf9f2]/95 hover:bg-white backdrop-blur-md pl-2 pr-3 rounded-full shadow-lg border border-amber-900/15 flex items-center gap-2 transition active:scale-95"
            title="내 복쓸덩이 & 보상화 정보"
          >
            <div className="w-6 h-6 rounded-full bg-red-800 flex items-center justify-center text-amber-100 font-serif font-black text-[11px] shadow-inner">
              福
            </div>
            <span className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {totalOnlineCount}
            </span>
            <span className="w-px h-3 bg-stone-300" />
            {/* 내 공덕(🔮) & 팥(🫘) 표시 */}
            <span className="text-[11px] font-extrabold text-amber-900 flex items-center gap-1">
              <span>🔮 {myKarma}</span>
              <span className="text-stone-300">·</span>
              <span>🫘 {myRedBeans}</span>
            </span>
          </button>

          {hasRemotePlayers && (
            <button
              onClick={onToggleFollow}
              className={`h-10 px-3 rounded-full shadow-lg text-[11px] font-extrabold flex items-center gap-1 transition ${
                followingId
                  ? 'bg-amber-400 text-stone-950 ring-2 ring-white animate-pulse'
                  : 'bg-[#fcf9f2]/95 text-stone-800 border border-stone-300'
              }`}
            >
              <Footprints className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">
                {followingId ? '기차놀이 중' : '따라가기'}
              </span>
            </button>
          )}
        </div>

        <div className="h-10 bg-[#fcf9f2]/95 backdrop-blur-md p-1 rounded-full shadow-lg border border-stone-300/80 flex items-center gap-0.5 pointer-events-auto">
          <button
            onClick={() => onSelectCameraMode('follow')}
            className={`h-8 px-2.5 rounded-full text-[11px] font-extrabold transition flex items-center gap-1 whitespace-nowrap ${
              cameraMode === 'follow' && !hasFocusedTarget
                ? 'bg-lime-800 text-white shadow'
                : 'text-stone-700 hover:bg-stone-200/70'
            }`}
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">산책</span>
          </button>

          <button
            onClick={() => onSelectCameraMode('tree')}
            className={`h-8 px-2.5 rounded-full text-[11px] font-extrabold transition flex items-center gap-0.5 whitespace-nowrap ${
              cameraMode === 'tree' && !hasFocusedTarget
                ? 'bg-lime-800 text-white shadow'
                : 'text-stone-700 hover:bg-stone-200/70'
            }`}
          >
            <span>🌳</span>
            <span>{hangingCount}</span>
          </button>

          <button
            onClick={() => onSelectCameraMode('sky')}
            className={`h-8 px-2.5 rounded-full text-[11px] font-extrabold transition flex items-center gap-0.5 whitespace-nowrap ${
              cameraMode === 'sky'
                ? 'bg-indigo-950 text-amber-300 shadow'
                : 'text-stone-700 hover:bg-stone-200/70'
            }`}
          >
            <Star className="w-3 h-3 fill-amber-400 text-amber-500 shrink-0" />
            <span>{starCount}</span>
          </button>

          <span className="w-px h-4 bg-stone-300 mx-0.5" />

          <button
            onClick={onToggleNightMode}
            className="h-8 w-8 rounded-full hover:bg-stone-200/70 text-xs flex items-center justify-center transition"
            title="낮/밤 전환"
          >
            {isNightMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* --- 자동 숨김 토스트 배너 --- */}
      {bannerMessage && !isAnyModalOpen && (
        <div className="absolute top-15 left-4 right-4 z-20 flex justify-center pointer-events-none">
          <div className="bg-stone-900/85 backdrop-blur-md text-amber-200 px-4 py-1.5 rounded-full font-bold text-[11px] shadow-xl border border-amber-400/30 flex items-center gap-1.5 max-w-sm truncate">
            <SparkleIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{bannerMessage}</span>
          </div>
        </div>
      )}

      {/* --- 하단 조이스틱 & 싸리빗자루 쓸기 & 몸짓 & 소원지 버튼 --- */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-end justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <VirtualJoystick
            onDragChange={onJoystickDragChange}
            onMove={onJoystickMove}
          />
        </div>

        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {isActionMenuOpen && (
            <div className="bg-[#fcf9f2]/95 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border border-amber-900/20 flex items-center gap-1">
              <button
                onClick={() => handleActionClick('jump', '🙌 만세 점프!')}
                className="px-2.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-stone-900 text-[11px] font-extrabold transition"
              >
                🙌 점프
              </button>
              <button
                onClick={() => handleActionClick('roll', '🌀 데구르르!')}
                className="px-2.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-stone-900 text-[11px] font-extrabold transition"
              >
                🌀 구르기
              </button>
              <button
                onClick={() => handleActionClick('bow', '🙇 복 받으시개!')}
                className="px-2.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-stone-900 text-[11px] font-extrabold transition"
              >
                🙇 절하기
              </button>
              <button
                onClick={() =>
                  handleActionClick(
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

          <div className="flex items-center gap-1.5">
            {/* 싸리빗자루 액운 쓸기 버튼 */}
            <button
              onClick={onSweepAction}
              className="h-11 px-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-xs shadow-xl border-2 border-white flex items-center gap-1 transition transform active:scale-95"
              title="싸리빗자루로 주변 액운 쓸어내기"
            >
              <span>🧹</span>
              <span>쓸기</span>
            </button>

            <button
              onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
              className="h-11 px-3 rounded-full bg-[#fcf9f2]/95 hover:bg-white text-stone-800 font-extrabold text-xs shadow-xl border border-stone-300 flex items-center gap-1 transition transform active:scale-95"
            >
              <Smile className="w-4 h-4 text-amber-500 shrink-0" />
              <span>몸짓</span>
            </button>

            <button
              onClick={onOpenWriteModal}
              className={`h-11 px-3.5 md:px-5 rounded-full font-extrabold text-xs md:text-sm shadow-2xl flex items-center gap-1.5 transition transform active:scale-95 border ${
                isNearTree
                  ? 'bg-red-700 hover:bg-red-600 text-amber-100 border-amber-300 ring-4 ring-amber-300/50 animate-pulse'
                  : 'bg-red-800 hover:bg-red-700 text-amber-50 border-amber-400/50'
              }`}
            >
              <ScrollText className="w-4 h-4 shrink-0" />
              <span>소원</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- 내 복쓸덩이 프로필 & 보상화 성장 모달 --- */}
      {isProfileModalOpen && (
        <div
          onClick={() => setIsProfileModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={onSaveProfile}
            className="bg-[#fbf6e9] w-full max-w-[340px] rounded-3xl p-5 shadow-2xl border-4 border-double border-amber-900/40 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-amber-900/15 pb-2.5">
              <h3 className="text-sm font-extrabold text-stone-900">
                🐾 내 복쓸덩이 & 보상화 ({totalOnlineCount}명 산책 중)
              </h3>
            </div>

            {/* 내 보상화 개화 현황 카드 */}
            <div className="bg-amber-100/80 border border-amber-900/15 rounded-2xl p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-extrabold text-amber-950">
                <span>내 운명의 꽃: {FLOWER_NAMES[myFlowerType]}</span>
                <span className="px-2 py-0.5 bg-amber-300 rounded-full text-[10px]">
                  {stageLabels[stage]}
                </span>
              </div>
              <p className="text-[11px] text-stone-700 font-bold">
                현재 공덕: 🔮 {myKarma}점 · 보유 팥: 🫘 {myRedBeans}알
              </p>
              <p className="text-[10px] text-stone-600">
                {stage === 0 &&
                  `🌱 새싹 개화까지 공덕 ${KARMA_THRESHOLDS.SPROUT - myKarma}점 남음`}
                {stage === 1 &&
                  `🌷 꽃봉오리까지 공덕 ${KARMA_THRESHOLDS.BUD - myKarma}점 남음`}
                {stage === 2 &&
                  `🪷 보상화 만개 & 황금 후광까지 공덕 ${KARMA_THRESHOLDS.BLOOM - myKarma}점 남음`}
                {stage === 3 &&
                  `✨ 최고 경지 달성! 머리 위에 보상화와 황금 후광이 빛납니다!`}
              </p>
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
              저장하기
            </button>
          </form>
        </div>
      )}
    </>
  );
};