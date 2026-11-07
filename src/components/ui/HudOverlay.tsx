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
  KARMA_THRESHOLDS,
  MAX_KARMA,
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
  const isKarmaMax = myKarma >= MAX_KARMA;

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
      {/* --- 상단 바: 모바일 화면 폭 100% 안에 안정적으로 들어오는 콤팩트 레이아웃 --- */}
      <header className="absolute top-2.5 inset-x-2 z-20 flex items-center justify-between gap-1 pointer-events-none">
        {/* 좌측: 브랜드 로고 + 공덕(최대 10점 한도 표시) + 설정 아이콘 */}
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="h-9 bg-[#fef9c3]/95 backdrop-blur-md px-2.5 rounded-full shadow-md border border-[#ff5722]/30 flex items-center gap-1.5 pointer-events-auto active:scale-95 shrink-0"
        >
          <span className="font-serif font-black text-[11px] text-[#ff5722]">
            복쓸싸리
          </span>
          <span className="text-[11px] font-extrabold text-stone-900 flex items-center gap-1">
            <span className={isKarmaMax ? 'text-red-700 font-black' : ''}>
              🔮{myKarma}/{MAX_KARMA}
            </span>
            <span className="text-stone-400">·</span>
            <span>🫘{myRedBeans}</span>
          </span>
          <Settings className="w-3.5 h-3.5 text-stone-600" />
        </button>

        {/* 중앙: 광장 / 내동산 스위치 */}
        <div className="h-9 bg-[#fcf9f2]/95 backdrop-blur-md p-0.5 rounded-full shadow-md border border-stone-300/80 flex items-center pointer-events-auto shrink-0">
          <button
            onClick={() => onSwitchZone('public')}
            className={`h-7 px-2 rounded-full text-[11px] font-extrabold transition flex items-center gap-0.5 ${
              zoneMode === 'public'
                ? 'bg-[#ff5722] text-white shadow'
                : 'text-stone-700'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>광장</span>
          </button>
          <button
            onClick={() => onSwitchZone('my_garden')}
            className={`h-7 px-2 rounded-full text-[11px] font-extrabold transition flex items-center gap-0.5 ${
              zoneMode === 'my_garden'
                ? 'bg-lime-800 text-white shadow'
                : 'text-stone-700'
            }`}
          >
            <Home className="w-3 h-3" />
            <span>내동산</span>
          </button>
        </div>

        {/* 우측: 잘리지 않는 시점 캡슐 */}
        <div className="h-9 bg-[#fcf9f2]/95 backdrop-blur-md p-0.5 rounded-full shadow-md border border-stone-300/80 flex items-center pointer-events-auto shrink-0">
          <button
            onClick={() => onSelectCameraMode('follow')}
            className={`h-7 w-7 rounded-full flex items-center justify-center transition ${
              cameraMode === 'follow' && !hasFocusedTarget
                ? 'bg-lime-800 text-white shadow'
                : 'text-stone-700'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
          </button>

          {zoneMode === 'public' && (
            <button
              onClick={() => onSelectCameraMode('tree')}
              className={`h-7 px-1.5 rounded-full text-[10px] font-extrabold transition flex items-center gap-0.5 ${
                cameraMode === 'tree' && !hasFocusedTarget
                  ? 'bg-lime-800 text-white shadow'
                  : 'text-stone-700'
              }`}
            >
              <span>🌳{hangingCount}</span>
            </button>
          )}

          <button
            onClick={() => onSelectCameraMode('sky')}
            className={`h-7 px-1.5 rounded-full text-[10px] font-extrabold transition flex items-center gap-0.5 ${
              cameraMode === 'sky'
                ? 'bg-indigo-950 text-amber-300 shadow'
                : 'text-stone-700'
            }`}
          >
            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
            <span>{starCount}</span>
          </button>
        </div>
      </header>

      {/* --- 대액운 게이지 바 --- */}
      {zoneMode === 'public' && activeBoss && !isAnyModalOpen && (
        <div className="absolute top-13 inset-x-4 z-20 flex justify-center pointer-events-none">
          <div className="bg-fuchsia-950/90 backdrop-blur-md border border-fuchsia-400/70 px-3.5 py-1.5 rounded-2xl shadow-xl flex items-center gap-2.5 w-full max-w-xs">
            <span className="text-[11px] font-black text-amber-200">
              ⚡ 대액운
            </span>
            <div className="flex-1 h-2 bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-fuchsia-500 to-amber-400 transition-all duration-300"
                style={{
                  width: `${(activeBoss.hp / activeBoss.maxHp) * 100}%`,
                }}
              />
            </div>
            <span className="text-[11px] font-black text-fuchsia-200">
              {activeBoss.hp}/{activeBoss.maxHp}
            </span>
          </div>
        </div>
      )}

      {/* --- 내 동산 조경 배치 편집 컨트롤 바 --- */}
      {zoneMode === 'my_garden' && isEditDecorMode && !isAnyModalOpen && (
        <div className="absolute top-13 inset-x-3 z-20 flex justify-center pointer-events-none">
          <div className="bg-amber-950/95 backdrop-blur-md border-2 border-amber-400 px-3 py-2 rounded-2xl shadow-2xl flex items-center justify-between gap-2 w-full max-w-sm pointer-events-auto">
            <div className="text-[11px] font-extrabold text-amber-100 truncate">
              {selectedCatalogItem
                ? `${selectedCatalogItem.icon} 이동할 땅을 터치하세요!`
                : '✋ 옮길 조경물을 먼저 터치하세요'}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {selectedDecorId && (
                <button
                  onClick={onRotateSelectedDecor}
                  className="px-2 py-1 rounded-xl bg-amber-400 text-stone-950 text-[10px] font-black flex items-center gap-1"
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

      {/* --- 토스트 알림 --- */}
      {bannerMessage &&
        !isAnyModalOpen &&
        !activeBoss &&
        !(zoneMode === 'my_garden' && isEditDecorMode) && (
          <div className="absolute top-13 inset-x-4 z-20 flex justify-center pointer-events-none">
            <div className="bg-stone-900/85 backdrop-blur-md text-amber-200 px-3.5 py-1.5 rounded-full font-bold text-[11px] shadow-xl border border-amber-400/30 flex items-center gap-1.5 max-w-full truncate">
              <SparkleIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{bannerMessage}</span>
            </div>
          </div>
        )}

      {/* --- 별 승천 축하 바 --- */}
      {ascendingWishNickname && !isAnyModalOpen && (
        <div className="absolute bottom-18 inset-x-3 z-30 flex justify-center pointer-events-none">
          <div className="bg-indigo-950/90 backdrop-blur-md border-2 border-amber-300/80 rounded-2xl p-2 shadow-2xl flex items-center gap-2 pointer-events-auto">
            <button
              onClick={onCelebrateAscension}
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-stone-950 text-xs font-black flex items-center gap-1 shadow animate-bounce"
            >
              <PartyPopper className="w-4 h-4 shrink-0" />
              <span>🧧 {ascendingWishNickname}님 별 축하!</span>
            </button>
            <button
              onClick={onExitAscensionView}
              className="px-2.5 py-1.5 rounded-xl bg-white/15 text-white text-[11px] font-bold"
            >
              복귀
            </button>
          </div>
        </div>
      )}

      {/* --- 하단 바: 화면 밖으로 절대 밀려나지 않는 안전 정렬 --- */}
      <div className="absolute bottom-3.5 inset-x-2.5 z-20 flex items-end justify-between gap-1.5 pointer-events-none">
        {/* 좌측 하단: 오늘의 운세 복권 버튼 */}
        <button
          onClick={onOpenFortuneModal}
          className={`h-10 px-3 rounded-full font-extrabold text-xs shadow-xl flex items-center gap-1 pointer-events-auto transition active:scale-95 border-2 shrink-0 ${
            isBloomed
              ? 'bg-gradient-to-r from-amber-300 to-amber-400 text-stone-950 border-white ring-2 ring-amber-300/70 animate-pulse'
              : 'bg-[#fcf9f2]/95 text-stone-800 border-stone-300'
          }`}
        >
          <span>{isBloomed ? '🪷' : '🌷'}</span>
          <span>
            {isBloomed
              ? '오늘의 운세!'
              : `운세 (${myKarma}/${KARMA_THRESHOLDS.BLOOM})`}
          </span>
        </button>

        {/* 우측 하단: 액션 팝업 & 최대 3개 버튼 유지 */}
        <div className="pointer-events-auto relative flex flex-col items-end gap-2 shrink-0">
          {/* 화면 오른쪽 끝에 딱 맞춰 정렬되어 잘리지 않는 표현 팝업 */}
          {isActionMenuOpen && (
            <div className="absolute bottom-12 right-0 bg-[#fcf9f2]/95 backdrop-blur-md p-2.5 rounded-3xl shadow-2xl border-2 border-amber-900/20 w-[236px] space-y-2 z-30">
              <div className="text-[10px] font-extrabold text-stone-500 px-1">
                몸짓 표현 (4종)
              </div>
              <div className="grid grid-cols-4 gap-1">
                <button
                  onClick={() => handleActionClick('jump', '🙌 만세!')}
                  className="py-1.5 rounded-xl bg-amber-100 text-stone-900 text-[10px] font-extrabold"
                >
                  🙌 점프
                </button>
                <button
                  onClick={() => handleActionClick('roll', '🌀 데구르르!')}
                  className="py-1.5 rounded-xl bg-amber-100 text-stone-900 text-[10px] font-extrabold"
                >
                  🌀 구르기
                </button>
                <button
                  onClick={() => handleActionClick('bow', '🙇 복 받으시개!')}
                  className="py-1.5 rounded-xl bg-amber-100 text-stone-900 text-[10px] font-extrabold"
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
                      : 'bg-amber-100 text-stone-900'
                  }`}
                >
                  🍞 앉기
                </button>
              </div>

              <div className="text-[10px] font-extrabold text-stone-500 px-1 pt-1 border-t border-stone-200">
                이모티콘 (8종)
              </div>
              <div className="grid grid-cols-4 gap-1">
                {QUICK_EMOTES.map((em) => (
                  <button
                    key={em.icon}
                    onClick={() => handleActionClick('idle', em.label)}
                    className="py-1.5 rounded-xl bg-white border border-stone-200 text-base shadow-sm active:scale-90"
                  >
                    {em.icon}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            {zoneMode === 'my_garden' && (
              <button
                onClick={() => setIsGardenShopOpen(true)}
                className="h-10 px-3 rounded-full bg-amber-900 text-amber-100 font-extrabold text-xs shadow-xl border border-amber-300/60 flex items-center gap-1 active:scale-95"
              >
                <Store className="w-3.5 h-3.5 text-amber-300" />
                <span>조경</span>
              </button>
            )}

            <button
              onClick={onSmartPurifyAction}
              className={`h-10 px-3.5 rounded-full font-extrabold text-xs shadow-xl border-2 flex items-center gap-1 active:scale-95 ${
                canUseRedBeanBoost
                  ? 'bg-red-800 text-amber-100 border-amber-300 animate-bounce'
                  : 'bg-amber-400 text-stone-950 border-white'
              }`}
            >
              <span>{canUseRedBeanBoost ? '🫘' : '🧹'}</span>
              <span>{canUseRedBeanBoost ? '팥액막이' : '쓸기'}</span>
            </button>

            <button
              onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
              className="h-10 px-3 rounded-full bg-[#fcf9f2]/95 text-stone-800 font-extrabold text-xs shadow-xl border border-stone-300 flex items-center gap-1 active:scale-95"
            >
              <Smile className="w-4 h-4 text-amber-500" />
              <span>표현</span>
            </button>

            {zoneMode === 'public' && isNearTree && (
              <button
                onClick={onOpenWriteModal}
                className="h-10 px-3 rounded-full font-extrabold text-xs shadow-2xl flex items-center gap-1 border-2 bg-[#ff5722] text-white border-amber-200 animate-pulse"
              >
                <ScrollText className="w-3.5 h-3.5" />
                <span>기원</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- 내 동산 조경 도감 모달 ([배치 위치 편집] 버튼 통합) --- */}
      {isGardenShopOpen && (
        <div
          onClick={() => setIsGardenShopOpen(false)}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#fbf6e9] w-full max-w-[380px] max-h-[85dvh] overflow-y-auto rounded-3xl p-4 shadow-2xl border-4 border-double border-amber-900/40 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-amber-900/15 pb-2.5">
              <h3 className="text-sm font-extrabold text-stone-900">
                🏡 내 동산 조경 도감 (🔮{myKarma}/{MAX_KARMA} · 🫘{myRedBeans})
              </h3>
              <button
                onClick={() => setIsGardenShopOpen(false)}
                className="p-1 rounded-full bg-stone-200 text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 조경 위치 이동 모드 진입 버튼 */}
            <button
              type="button"
              onClick={() => {
                setIsGardenShopOpen(false);
                setIsEditDecorMode(true);
              }}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-2xl text-xs font-black shadow flex items-center justify-center gap-1.5"
            >
              <Move className="w-4 h-4" />
              <span>✋ 배치된 조경물 위치 옮기기 / 회전하기</span>
            </button>

            <div className="space-y-2">
              {GARDEN_CATALOG.map((item) => {
                const isUnlocked = unlockedDecor.includes(item.id);
                const isPlaced = Boolean(decorLayout[item.id]);
                const canAfford =
                  myKarma >= item.karmaCost && myRedBeans >= item.beanCost;

                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 ${
                      isPlaced
                        ? 'bg-lime-50 border-lime-700'
                        : 'bg-white border-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-stone-900 truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] font-bold text-amber-900">
                          {isUnlocked
                            ? '보유 중'
                            : `필요: 🔮${item.karmaCost} · 🫘${item.beanCost}`}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!isUnlocked && !canAfford}
                      onClick={() => onBuyOrToggleDecor(item)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold shrink-0 ${
                        isUnlocked
                          ? isPlaced
                            ? 'bg-lime-800 text-white'
                            : 'bg-stone-200 text-stone-800'
                          : canAfford
                          ? 'bg-[#ff5722] text-white'
                          : 'bg-stone-200 text-stone-400'
                      }`}
                    >
                      {isUnlocked ? (isPlaced ? '✓ 배치됨' : '배치') : '교환'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- 3단으로 깔끔하게 다이어트된 설정 모달 --- */}
      {isProfileModalOpen && (
        <div
          onClick={() => setIsProfileModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={onSaveProfile}
            className="bg-[#fbf6e9] w-full max-w-[340px] rounded-3xl p-4 shadow-2xl border-4 border-double border-amber-900/40 space-y-3.5"
          >
            <div className="flex items-center justify-between border-b border-amber-900/15 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-base text-[#ff5722]">
                  복쓸싸리 설정
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold">
                  🟢 {totalOnlineCount}명 산책 중
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 rounded-full bg-stone-200 text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1단: 내 복쓸덩이 이름 & 색상 한 박스에 통합 */}
            <div className="bg-white/90 p-3 rounded-2xl border border-stone-200 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-stone-700 shrink-0">
                  이름
                </span>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={myNickname}
                  onChange={(e) => setMyNickname(e.target.value)}
                  className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl bg-stone-100 border border-stone-300 text-xs font-bold text-stone-900"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-stone-700">
                  머리끈
                </span>
                <div className="flex gap-1.5">
                  {RANDOM_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setMyColor(c)}
                      className={`w-6 h-6 rounded-full transition ${
                        myColor === c
                          ? 'ring-2 ring-stone-900 scale-110'
                          : 'opacity-55'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 2단: 환경 & 퀵 액션 버튼 바 */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={onToggleNightMode}
                className="py-2 rounded-xl bg-white border border-stone-300 text-stone-800 text-[11px] font-extrabold"
              >
                {isNightMode ? '☀️ 낮 전환' : '🌙 밤 전환'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onCopyInviteLink();
                  setIsProfileModalOpen(false);
                }}
                className="py-2 rounded-xl bg-white border border-stone-300 text-stone-800 text-[11px] font-extrabold flex items-center justify-center gap-1"
              >
                <Share2 className="w-3 h-3 text-lime-800" />
                <span>초대복사</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  onOpenO2OModal();
                }}
                className="py-2 rounded-xl bg-stone-900 text-amber-200 text-[11px] font-extrabold flex items-center justify-center gap-1"
              >
                <Gift className="w-3 h-3 text-amber-400" />
                <span>O2O코드</span>
              </button>
            </div>

            {/* 3단: 별 승천 시점 토글 & 저장 */}
            <label className="flex items-center justify-between px-1 cursor-pointer">
              <span className="text-xs font-extrabold text-stone-700">
                🌟 이웃의 별 승천 연출 자동 보기
              </span>
              <input
                type="checkbox"
                checked={autoWatchAscension}
                onChange={(e) => setAutoWatchAscension(e.target.checked)}
                className="w-4 h-4 accent-lime-800 rounded"
              />
            </label>

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