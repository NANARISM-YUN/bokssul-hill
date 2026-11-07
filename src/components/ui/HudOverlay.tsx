import React, { useState } from 'react';
import {
  Sparkles as SparkleIcon,
  Star,
  ScrollText,
  Compass,
  Smile,
  PartyPopper,
  Share2,
  Home,
  Globe,
  Store,
  Gift,
  Move,
  RotateCw,
  Settings,
  X,
} from 'lucide-react';
import type {
  CameraMode,
  PlayerAction,
  FlowerType,
  ZoneMode,
  GardenItemId,
  GardenDecorMap,
  MisfortuneSpirit,
} from '../../types/wish';
import {
  RANDOM_COLORS,
  FLOWER_NAMES,
  KARMA_THRESHOLDS,
  QUICK_EMOTES,
  GARDEN_CATALOG,
  type GardenCatalogItem,
} from '../../utils/constants';
import { getGrowthStage } from '../../hooks/useGameProgress';

interface HudOverlayProps {
  zoneMode: ZoneMode;
  onSwitchZone: (zone: ZoneMode) => void;
  onCopyInviteLink: () => void;
  totalOnlineCount: number;
  cameraMode: CameraMode;
  hasFocusedTarget: boolean;
  onSelectCameraMode: (mode: CameraMode) => void;
  hangingCount: number;
  starCount: number;
  isNightMode: boolean;
  onToggleNightMode: () => void;
  bannerMessage: string | null;
  activeBoss: MisfortuneSpirit | null;
  isAnyModalOpen: boolean;
  isNearTree: boolean;
  myAction: PlayerAction;
  onTriggerAction: (action: PlayerAction, label: string) => void;
  onSmartPurifyAction: () => void;
  onOpenWriteModal: () => void;
  onOpenFortuneModal: () => void;
  onOpenO2OModal: () => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  isGardenShopOpen: boolean;
  setIsGardenShopOpen: (open: boolean) => void;
  isEditDecorMode: boolean;
  setIsEditDecorMode: (edit: boolean) => void;
  selectedDecorId: GardenItemId | null;
  onRotateSelectedDecor: () => void;
  unlockedDecor: GardenItemId[];
  decorLayout: GardenDecorMap;
  onBuyOrToggleDecor: (item: GardenCatalogItem) => void;
  myNickname: string;
  setMyNickname: (name: string) => void;
  myColor: string;
  setMyColor: (color: string) => void;
  myKarma: number;
  myRedBeans: number;
  myFlowerType: FlowerType;
  autoWatchAscension: boolean;
  setAutoWatchAscension: (val: boolean) => void;
  ascendingWishNickname: string | null;
  onCelebrateAscension: () => void;
  onExitAscensionView: () => void;
  onSaveProfile: (e: React.FormEvent) => void;
}

export const HudOverlay = ({
  zoneMode,
  onSwitchZone,
  onCopyInviteLink,
  totalOnlineCount,
  cameraMode,
  hasFocusedTarget,
  onSelectCameraMode,
  hangingCount,
  starCount,
  isNightMode,
  onToggleNightMode,
  bannerMessage,
  activeBoss,
  isAnyModalOpen,
  isNearTree,
  myAction,
  onTriggerAction,
  onSmartPurifyAction,
  onOpenWriteModal,
  onOpenFortuneModal,
  onOpenO2OModal,
  isProfileModalOpen,
  setIsProfileModalOpen,
  isGardenShopOpen,
  setIsGardenShopOpen,
  isEditDecorMode,
  setIsEditDecorMode,
  selectedDecorId,
  onRotateSelectedDecor,
  unlockedDecor,
  decorLayout,
  onBuyOrToggleDecor,
  myNickname,
  setMyNickname,
  myColor,
  setMyColor,
  myKarma,
  myRedBeans,
  myFlowerType,
  autoWatchAscension,
  setAutoWatchAscension,
  ascendingWishNickname,
  onCelebrateAscension,
  onExitAscensionView,
  onSaveProfile,
}: HudOverlayProps) => {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const stage = getGrowthStage(myKarma);
  const isBloomed = stage === 3;
  const stageLabels = ['🌰 씨앗', '🌱 새싹', '🌷 봉오리', '🪷 오늘 만개!'];

  const handleActionClick = (action: PlayerAction, label: string) => {
    setIsActionMenuOpen(false);
    onTriggerAction(action, label);
  };

  const canUseRedBeanBoost =
    zoneMode === 'public' && Boolean(activeBoss) && myRedBeans > 0;

  const selectedCatalogItem = GARDEN_CATALOG.find(
    (c) => c.id === selectedDecorId
  );

  return (
    <>
      {/* --- 상단 1줄 고정 헤더 (홍보영상 시그니처 브랜드 로고 반영) --- */}
      <header className="absolute top-3 left-2.5 right-2.5 z-20 flex items-center justify-between gap-1 pointer-events-none whitespace-nowrap">
        {/* 좌측: 홍보영상 엔딩 로고 스타일 [복쓸싸리] + 재화 & 설정 캡슐 */}
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="h-9 bg-[#fef9c3]/95 hover:bg-[#fef08a] backdrop-blur-md pl-2 pr-2.5 rounded-full shadow-lg border-2 border-[#ff5722]/30 flex items-center gap-1.5 pointer-events-auto transition active:scale-95 shrink-0"
          title="내 복쓸덩이 정보 및 설정 열기"
        >
          {/* 다홍빛 시그니처 로고 */}
          <span className="font-serif font-black text-xs tracking-tight text-[#ff5722] drop-shadow-sm">
            복쓸싸리
          </span>
          <span className="w-px h-3 bg-amber-900/20" />
          <span className="text-[11px] font-extrabold text-stone-900 flex items-center gap-1">
            <span>🔮{myKarma}</span>
            <span className="text-stone-400">·</span>
            <span>🫘{myRedBeans}</span>
          </span>
          <Settings className="w-3.5 h-3.5 text-stone-600" />
        </button>

        {/* 중앙: 광장 ↔ 내동산 스위치 */}
        <div className="h-9 bg-[#fcf9f2]/95 backdrop-blur-md p-1 rounded-full shadow-lg border border-stone-300/80 flex items-center gap-0.5 pointer-events-auto shrink-0">
          <button
            onClick={() => onSwitchZone('public')}
            className={`h-7 px-2.5 rounded-full text-[11px] font-extrabold transition flex items-center gap-1 ${
              zoneMode === 'public'
                ? 'bg-[#ff5722] text-white shadow'
                : 'text-stone-700 hover:bg-stone-200/70'
            }`}
          >
            <Globe className="w-3 h-3 shrink-0" />
            <span>광장</span>
          </button>
          <button
            onClick={() => onSwitchZone('my_garden')}
            className={`h-7 px-2.5 rounded-full text-[11px] font-extrabold transition flex items-center gap-1 ${
              zoneMode === 'my_garden'
                ? 'bg-lime-800 text-white shadow'
                : 'text-stone-700 hover:bg-stone-200/70'
            }`}
          >
            <Home className="w-3 h-3 shrink-0" />
            <span>내동산</span>
          </button>
        </div>

        {/* 우측: 시점 전환 캡슐 */}
        <div className="h-9 bg-[#fcf9f2]/95 backdrop-blur-md p-1 rounded-full shadow-lg border border-stone-300/80 flex items-center gap-0.5 pointer-events-auto shrink-0">
          <button
            onClick={() => onSelectCameraMode('follow')}
            className={`h-7 px-2 rounded-full text-[11px] font-extrabold transition flex items-center ${
              cameraMode === 'follow' && !hasFocusedTarget
                ? 'bg-lime-800 text-white shadow'
                : 'text-stone-700 hover:bg-stone-200/70'
            }`}
            title="내 캐릭터 시점"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>

          {zoneMode === 'public' && (
            <button
              onClick={() => onSelectCameraMode('tree')}
              className={`h-7 px-2 rounded-full text-[11px] font-extrabold transition flex items-center gap-0.5 ${
                cameraMode === 'tree' && !hasFocusedTarget
                  ? 'bg-lime-800 text-white shadow'
                  : 'text-stone-700 hover:bg-stone-200/70'
              }`}
              title="당산나무 보기"
            >
              <span>🌳</span>
              <span>{hangingCount}</span>
            </button>
          )}

          <button
            onClick={() => onSelectCameraMode('sky')}
            className={`h-7 px-2 rounded-full text-[11px] font-extrabold transition flex items-center gap-0.5 ${
              cameraMode === 'sky'
                ? 'bg-indigo-950 text-amber-300 shadow'
                : 'text-stone-700 hover:bg-stone-200/70'
            }`}
            title="밤하늘 별자리 보기"
          >
            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
            <span>{starCount}</span>
          </button>
        </div>
      </header>

      {/* --- 거대 대액운(HP 150) 협동 레이드 게이지 바 --- */}
      {zoneMode === 'public' && activeBoss && !isAnyModalOpen && (
        <div className="absolute top-14 left-4 right-4 z-20 flex justify-center pointer-events-none">
          <div className="bg-fuchsia-950/90 backdrop-blur-md border border-fuchsia-400/70 px-3.5 py-1.5 rounded-2xl shadow-xl flex items-center gap-2.5 w-full max-w-xs">
            <span className="text-[11px] font-black text-amber-200 whitespace-nowrap">
              ⚡ 대액운
            </span>
            <div className="flex-1 h-2.5 bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-fuchsia-500 to-amber-400 transition-all duration-300"
                style={{
                  width: `${(activeBoss.hp / activeBoss.maxHp) * 100}%`,
                }}
              />
            </div>
            <span className="text-[11px] font-black text-fuchsia-200 whitespace-nowrap">
              {activeBoss.hp}/{activeBoss.maxHp}
            </span>
          </div>
        </div>
      )}

      {/* --- 내 동산 조경 배치 편집 안내 바 --- */}
      {zoneMode === 'my_garden' && isEditDecorMode && !isAnyModalOpen && (
        <div className="absolute top-14 left-3 right-3 z-20 flex justify-center pointer-events-none">
          <div className="bg-amber-950/95 backdrop-blur-md border-2 border-amber-400 px-3.5 py-2 rounded-2xl shadow-2xl flex items-center justify-between gap-2 w-full max-w-sm pointer-events-auto">
            <div className="text-[11px] font-extrabold text-amber-100 truncate">
              {selectedCatalogItem
                ? `${selectedCatalogItem.icon} [${selectedCatalogItem.name}] 이동할 바닥을 터치하세요!`
                : '✋ 이동할 조경물을 먼저 터치해 선택하세요'}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {selectedDecorId && (
                <button
                  onClick={onRotateSelectedDecor}
                  className="px-2.5 py-1 rounded-xl bg-amber-400 text-stone-950 text-[10px] font-black flex items-center gap-1"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>회전</span>
                </button>
              )}
              <button
                onClick={() => setIsEditDecorMode(false)}
                className="px-2.5 py-1 rounded-xl bg-white/20 text-white text-[10px] font-bold"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- 자동 숨김 토스트 배너 --- */}
      {bannerMessage &&
        !isAnyModalOpen &&
        !activeBoss &&
        !(zoneMode === 'my_garden' && isEditDecorMode) && (
          <div className="absolute top-14 left-4 right-4 z-20 flex justify-center pointer-events-none">
            <div className="bg-stone-900/85 backdrop-blur-md text-amber-200 px-4 py-1.5 rounded-full font-bold text-[11px] shadow-xl border border-amber-400/30 flex items-center gap-1.5 max-w-sm truncate">
              <SparkleIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{bannerMessage}</span>
            </div>
          </div>
        )}

      {/* --- 별 승천 합동 축하 & 자유 이탈 바 --- */}
      {ascendingWishNickname && !isAnyModalOpen && (
        <div className="absolute bottom-20 left-4 right-4 z-30 flex justify-center pointer-events-none">
          <div className="bg-indigo-950/90 backdrop-blur-md border-2 border-amber-300/80 rounded-2xl p-2.5 shadow-2xl flex items-center gap-2 pointer-events-auto">
            <button
              onClick={onCelebrateAscension}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black flex items-center gap-1.5 shadow animate-bounce whitespace-nowrap"
            >
              <PartyPopper className="w-4 h-4 shrink-0" />
              <span>🧧 {ascendingWishNickname}님 별 축하! (🔮+2)</span>
            </button>
            <button
              onClick={onExitAscensionView}
              className="px-2.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold whitespace-nowrap"
            >
              시점 복귀
            </button>
          </div>
        </div>
      )}

      {/* --- 하단 컨트롤 바 --- */}
      <div className="absolute bottom-4 left-3 right-3 z-20 flex items-end justify-between gap-2 pointer-events-none whitespace-nowrap">
        <div className="pointer-events-auto shrink-0">
          <button
            onClick={onOpenFortuneModal}
            className={`h-11 px-3.5 rounded-full font-extrabold text-xs shadow-xl flex items-center gap-1.5 transition transform active:scale-95 border-2 whitespace-nowrap ${
              isBloomed
                ? 'bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 text-stone-950 border-white ring-2 ring-amber-300/70 animate-pulse'
                : 'bg-[#fcf9f2]/95 text-stone-800 border-stone-300'
            }`}
          >
            <span>{isBloomed ? '🪷' : '🌷'}</span>
            <span>
              {isBloomed
                ? '오늘의 운세 부적!'
                : `운세 (${myKarma}/${KARMA_THRESHOLDS.BLOOM})`}
            </span>
          </button>
        </div>

        <div className="pointer-events-auto flex flex-col items-end gap-2 shrink-0">
          {isActionMenuOpen && (
            <div className="bg-[#fcf9f2]/95 backdrop-blur-md p-2.5 rounded-3xl shadow-2xl border-2 border-amber-900/20 w-[250px] space-y-2">
              <div className="text-[10px] font-extrabold text-stone-500 px-1">
                온몸으로 표현하기 (몸짓 4종)
              </div>
              <div className="grid grid-cols-4 gap-1">
                <button
                  onClick={() => handleActionClick('jump', '🙌 만세!')}
                  className="py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-stone-900 text-[10px] font-extrabold"
                >
                  🙌 점프
                </button>
                <button
                  onClick={() => handleActionClick('roll', '🌀 데구르르!')}
                  className="py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-stone-900 text-[10px] font-extrabold"
                >
                  🌀 구르기
                </button>
                <button
                  onClick={() => handleActionClick('bow', '🙇 복 받으시개!')}
                  className="py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-stone-900 text-[10px] font-extrabold"
                >
                  🙇 절하기
                </button>
                <button
                  onClick={() =>
                    handleActionClick(
                      myAction === 'sit' ? 'idle' : 'sit',
                      myAction === 'sit' ? '🐾 출발!' : '🍞 식빵 굽기'
                    )
                  }
                  className={`py-1.5 rounded-xl text-[10px] font-extrabold ${
                    myAction === 'sit'
                      ? 'bg-lime-800 text-white'
                      : 'bg-amber-100 hover:bg-amber-200 text-stone-900'
                  }`}
                >
                  🍞 앉기
                </button>
              </div>

              <div className="text-[10px] font-extrabold text-stone-500 px-1 pt-1 border-t border-stone-200">
                마음 이모티콘 (8종)
              </div>
              <div className="grid grid-cols-4 gap-1">
                {QUICK_EMOTES.map((em) => (
                  <button
                    key={em.icon}
                    onClick={() => handleActionClick('idle', em.label)}
                    className="py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-base shadow-sm active:scale-90 transition"
                    title={em.label}
                  >
                    {em.icon}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            {zoneMode === 'my_garden' && (
              <>
                <button
                  onClick={() => setIsEditDecorMode(!isEditDecorMode)}
                  className={`h-11 px-3 rounded-full font-extrabold text-xs shadow-xl border flex items-center gap-1 transition active:scale-95 whitespace-nowrap ${
                    isEditDecorMode
                      ? 'bg-amber-400 text-stone-950 border-white ring-2 ring-amber-300'
                      : 'bg-[#fcf9f2]/95 text-stone-800 border-stone-300'
                  }`}
                >
                  <Move className="w-3.5 h-3.5 shrink-0" />
                  <span>{isEditDecorMode ? '편집중' : '배치편집'}</span>
                </button>

                <button
                  onClick={() => setIsGardenShopOpen(true)}
                  className="h-11 px-3.5 rounded-full bg-amber-900 hover:bg-amber-800 text-amber-100 font-extrabold text-xs shadow-xl border border-amber-300/60 flex items-center gap-1 transition active:scale-95 whitespace-nowrap"
                >
                  <Store className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>조경도감</span>
                </button>
              </>
            )}

            <button
              onClick={onSmartPurifyAction}
              className={`h-11 px-4 rounded-full font-extrabold text-xs shadow-xl border-2 flex items-center gap-1 transition transform active:scale-95 whitespace-nowrap ${
                canUseRedBeanBoost
                  ? 'bg-red-800 hover:bg-red-700 text-amber-100 border-amber-300 animate-bounce'
                  : 'bg-amber-400 hover:bg-amber-300 text-stone-950 border-white'
              }`}
            >
              <span>{canUseRedBeanBoost ? '🫘' : '🧹'}</span>
              <span>{canUseRedBeanBoost ? '팥액막이!' : '쓸기'}</span>
            </button>

            <button
              onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
              className="h-11 px-3.5 rounded-full bg-[#fcf9f2]/95 hover:bg-white text-stone-800 font-extrabold text-xs shadow-xl border border-stone-300 flex items-center gap-1 transition transform active:scale-95 whitespace-nowrap"
            >
              <Smile className="w-4 h-4 text-amber-500 shrink-0" />
              <span>표현</span>
            </button>

            {zoneMode === 'public' && isNearTree && (
              <button
                onClick={onOpenWriteModal}
                className="h-11 px-4 rounded-full font-extrabold text-xs shadow-2xl flex items-center gap-1 transition transform active:scale-95 border-2 bg-[#ff5722] hover:bg-[#f4511e] text-white border-amber-200 ring-4 ring-amber-300/50 animate-pulse whitespace-nowrap"
              >
                <ScrollText className="w-3.5 h-3.5 shrink-0" />
                <span>기원 올리기 ✨</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- 내 동산 조경 도감 모달 --- */}
      {isGardenShopOpen && (
        <div
          onClick={() => setIsGardenShopOpen(false)}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#fbf6e9] w-full max-w-[400px] max-h-[85dvh] overflow-y-auto rounded-3xl p-5 shadow-2xl border-4 border-double border-amber-900/40 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-amber-900/15 pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-lime-900 bg-lime-200 px-2 py-0.5 rounded-full">
                  🏡 내 동산 꾸미기 · 공덕 교환소
                </span>
                <h3 className="text-base font-extrabold text-stone-900 mt-0.5">
                  전통 조경 오브제 도감
                </h3>
              </div>
              <button
                onClick={() => setIsGardenShopOpen(false)}
                className="p-1.5 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-amber-100/80 px-3.5 py-2 rounded-2xl border border-amber-900/15 text-xs font-extrabold text-amber-950">
              <span>내 보유 재화</span>
              <span className="flex items-center gap-2">
                <span>🔮 공덕 {myKarma}점</span>
                <span>·</span>
                <span>🫘 붉은 팥 {myRedBeans}알</span>
              </span>
            </div>

            <div className="space-y-2.5">
              {GARDEN_CATALOG.map((item) => {
                const isUnlocked = unlockedDecor.includes(item.id);
                const isPlaced = Boolean(decorLayout[item.id]);
                const canAfford =
                  myKarma >= item.karmaCost && myRedBeans >= item.beanCost;

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border-2 flex items-center justify-between gap-3 transition ${
                      isPlaced
                        ? 'bg-lime-50/90 border-lime-700'
                        : 'bg-white/90 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-stone-900 truncate">
                          {item.name}
                        </div>
                        <p className="text-[10px] text-stone-600 line-clamp-2">
                          {item.desc}
                        </p>
                        {!isUnlocked && (
                          <div className="text-[10px] font-extrabold text-amber-900 mt-0.5">
                            필요: 🔮{item.karmaCost} · 🫘{item.beanCost}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!isUnlocked && !canAfford}
                      onClick={() => onBuyOrToggleDecor(item)}
                      className={`px-3 py-2 rounded-xl text-[11px] font-extrabold whitespace-nowrap shrink-0 shadow transition ${
                        isUnlocked
                          ? isPlaced
                            ? 'bg-lime-800 text-white'
                            : 'bg-stone-200 text-stone-800 hover:bg-stone-300'
                          : canAfford
                          ? 'bg-[#ff5722] hover:bg-[#f4511e] text-white'
                          : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      {isUnlocked
                        ? isPlaced
                          ? '✓ 배치됨'
                          : '배치하기'
                        : '교환하기'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- 홍보영상 시그니처 브랜드 헤더가 들어간 통합 설정 모달 --- */}
      {isProfileModalOpen && (
        <div
          onClick={() => setIsProfileModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={onSaveProfile}
            className="bg-[#fbf6e9] w-full max-w-[360px] max-h-[88dvh] overflow-y-auto rounded-3xl p-5 shadow-2xl border-4 border-double border-amber-900/40 space-y-3.5"
          >
            {/* 홍보영상 4번째 캡처 시그니처 배너 */}
            <div className="bg-[#fef9c3] border-2 border-[#ff5722]/30 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <div className="font-serif font-black text-lg text-[#ff5722] tracking-tight">
                  복쓸싸리 동산
                </div>
                <div className="text-[10px] font-extrabold text-stone-600">
                  🟢 현재 {totalOnlineCount}명의 복쓸덩이가 산책 중
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 rounded-full bg-white/80 text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-100/80 border border-amber-900/15 rounded-2xl p-3 space-y-1">
              <div className="flex items-center justify-between text-xs font-extrabold text-amber-950">
                <span>오늘의 수호꽃: {FLOWER_NAMES[myFlowerType]}</span>
                <span className="px-2 py-0.5 bg-amber-300 rounded-full text-[10px]">
                  {stageLabels[stage]}
                </span>
              </div>
              <p className="text-[11px] text-stone-700 font-bold">
                보유 공덕: 🔮 {myKarma}점 · 붉은 팥: 🫘 {myRedBeans}알
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  onOpenO2OModal();
                }}
                className="p-2.5 rounded-2xl bg-stone-900 text-amber-200 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow"
              >
                <Gift className="w-4 h-4 text-amber-400" />
                <span>O2O 코드 등록</span>
              </button>

              <button
                type="button"
                onClick={onToggleNightMode}
                className="p-2.5 rounded-2xl bg-white border border-stone-300 text-stone-800 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>{isNightMode ? '☀️ 낮으로 전환' : '🌙 밤으로 전환'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onCopyInviteLink();
                  setIsProfileModalOpen(false);
                }}
                className="p-2.5 rounded-2xl bg-white border border-stone-300 text-stone-800 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5 text-lime-800" />
                <span>초대 링크 복사</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  onOpenWriteModal();
                }}
                className="p-2.5 rounded-2xl bg-[#ff5722] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <ScrollText className="w-3.5 h-3.5" />
                <span>기원 인장 올리기</span>
              </button>
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
                    className={`w-7 h-7 rounded-full shadow transition ${
                      myColor === c
                        ? 'ring-2 ring-stone-900 scale-110'
                        : 'opacity-60'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="bg-white/80 p-3 rounded-2xl border border-stone-200">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-extrabold text-stone-800">
                    🌟 별 승천 연출 함께 보기
                  </div>
                  <div className="text-[10px] text-stone-500">
                    소원이 하늘로 떠오를 때 시선이 자동으로 따라갑니다
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoWatchAscension}
                  onChange={(e) => setAutoWatchAscension(e.target.checked)}
                  className="w-5 h-5 accent-lime-800 rounded cursor-pointer"
                />
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-lime-800 hover:bg-lime-700 text-white rounded-xl text-xs font-extrabold shadow"
            >
              설정 저장하기
            </button>
          </form>
        </div>
      )}
    </>
  );
};