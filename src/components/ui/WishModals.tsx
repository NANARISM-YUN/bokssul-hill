import React, { useState } from 'react';
import { X, Sparkles as SparkleIcon } from 'lucide-react';
import type { Wish, WishSealId } from '../../types/wish';
import {
  WISH_SEALS,
  BLESS_STAMPS,
  WISH_KARMA_COST,
  WISH_BEAN_KARMA_COST,
  BLESS_KARMA_COST,
} from '../../utils/constants';

export const WishWriteModal = ({
  isOpen,
  onClose,
  onCreateSealWish,
  myKarma,
  myRedBeans,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreateSealWish: (
    sealId: WishSealId,
    useRedBean: boolean,
    color: string
  ) => void;
  myKarma: number;
  myRedBeans: number;
}) => {
  const [selectedSeal, setSelectedSeal] = useState<WishSealId>('fortune');
  const [useRedBean, setUseRedBean] = useState(false);
  const [pouchColor, setPouchColor] = useState('#e53935');

  if (!isOpen) return null;

  const currentSeal =
    WISH_SEALS.find((s) => s.id === selectedSeal) || WISH_SEALS[0];
  const requiredKarma = useRedBean ? WISH_BEAN_KARMA_COST : WISH_KARMA_COST;
  const canAfford =
    myKarma >= requiredKarma && (!useRedBean || myRedBeans >= 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAfford) return;
    onCreateSealWish(selectedSeal, useRedBean, pouchColor);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-[#fbf6e9] w-full max-w-[390px] max-h-[88dvh] overflow-y-auto rounded-3xl p-5 shadow-2xl border-4 border-double border-amber-900/40 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-amber-900/15 pb-3">
          <div>
            <span className="text-[10px] font-extrabold text-red-800 bg-red-100 px-2 py-0.5 rounded-full">
              無言發願 · 마음으로 찍는 기원 인장
            </span>
            <h2 className="text-base font-extrabold text-stone-900 mt-0.5">
              당산나무에 어떤 기원을 올릴까요?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 내 보유 공덕 & 팥 현황 */}
        <div className="flex items-center justify-between bg-amber-100/80 px-3.5 py-2 rounded-2xl border border-amber-900/15 text-xs font-extrabold text-amber-950">
          <span>내 보유 재화</span>
          <span className="flex items-center gap-2">
            <span>🔮 공덕 {myKarma}점</span>
            <span>·</span>
            <span>🫘 붉은 팥 {myRedBeans}알</span>
          </span>
        </div>

        {/* 6대 전통 기원 문양 선택 그리드 */}
        <div>
          <label className="block text-xs font-extrabold text-stone-700 mb-2">
            1. 6대 기원 문양(인장) 선택
          </label>
          <div className="grid grid-cols-3 gap-2">
            {WISH_SEALS.map((seal) => {
              const isSelected = selectedSeal === seal.id;
              return (
                <button
                  type="button"
                  key={seal.id}
                  onClick={() => {
                    setSelectedSeal(seal.id);
                    setPouchColor(seal.defaultColor);
                  }}
                  className={`p-2.5 rounded-2xl border-2 flex flex-col items-center gap-1 transition transform active:scale-95 ${
                    isSelected
                      ? 'bg-red-50 border-red-700 ring-2 ring-red-700/20 shadow-md scale-[1.02]'
                      : 'bg-white/80 border-stone-200 hover:bg-white text-stone-700'
                  }`}
                >
                  <span className="text-2xl">{seal.icon}</span>
                  <span className="text-[11px] font-black text-stone-900 whitespace-nowrap">
                    {seal.title.split(' · ')[1]}
                  </span>
                  <span className="text-[9px] font-serif font-bold text-red-800/80">
                    {seal.hanja}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 px-3 py-2 bg-white/90 rounded-xl border border-amber-900/15 text-center">
            <p className="text-xs font-extrabold text-red-900">
              {currentSeal.icon} {currentSeal.title}
            </p>
            <p className="text-[11px] text-stone-600 mt-0.5">
              "{currentSeal.desc}"
            </p>
          </div>
        </div>

        {/* 붉은 팥(액막이) 추가 옵션 */}
        <div className="bg-red-950/5 p-3 rounded-2xl border border-red-900/20">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="space-y-0.5">
              <div className="text-xs font-extrabold text-red-950 flex items-center gap-1">
                <span>🫘 붉은 팥 1알 함께 넣기 (황금 액막이 주머니)</span>
              </div>
              <p className="text-[10px] text-stone-600">
                필요 공덕이 10점으로 줄어들고, 기본 정성 기운 +2개가 바로 채워집니다!
              </p>
            </div>
            <input
              type="checkbox"
              checked={useRedBean}
              disabled={myRedBeans < 1 && !useRedBean}
              onChange={(e) => setUseRedBean(e.target.checked)}
              className="w-5 h-5 accent-red-800 rounded cursor-pointer"
            />
          </label>
        </div>

        {/* 복주머니 빛깔 선택 */}
        <div>
          <label className="block text-xs font-extrabold text-stone-700 mb-1.5">
            2. 복주머니 비단 빛깔
          </label>
          <div className="flex gap-2">
            {[
              { c: '#e53935', n: '다홍' },
              { c: '#fb8c00', n: '황금' },
              { c: '#d81b60', n: '연분홍' },
              { c: '#43a047', n: '비취' },
              { c: '#1e88e5', n: '청옥' },
              { c: '#8e24aa', n: '자수정' },
            ].map((item) => (
              <button
                type="button"
                key={item.c}
                onClick={() => setPouchColor(item.c)}
                className={`flex-1 py-1.5 rounded-xl text-[10px] font-extrabold text-white shadow transition ${
                  pouchColor === item.c
                    ? 'ring-2 ring-stone-900 scale-105'
                    : 'opacity-55'
                }`}
                style={{ backgroundColor: item.c }}
              >
                {item.n}
              </button>
            ))}
          </div>
        </div>

        {/* 발원 버튼 (공덕 부족 시 안내 표시) */}
        <button
          type="submit"
          disabled={!canAfford}
          className={`w-full py-3 rounded-2xl font-extrabold text-xs md:text-sm shadow-lg transition flex items-center justify-center gap-1.5 ${
            canAfford
              ? 'bg-red-800 hover:bg-red-700 text-amber-50 cursor-pointer'
              : 'bg-stone-300 text-stone-500 cursor-not-allowed'
          }`}
        >
          {canAfford ? (
            <>
              <SparkleIcon className="w-4 h-4 text-amber-300" />
              <span>
                🔮 공덕 {requiredKarma}점
                {useRedBean ? ' + 🫘 팥 1알' : ''}로 당산나무에 걸기
              </span>
            </>
          ) : (
            <span>
              🧹 동산에서 공덕을 더 모아주세요 ({myKarma}/{requiredKarma}점)
            </span>
          )}
        </button>
      </form>
    </div>
  );
};

export const WishDetailModal = ({
  wish,
  onClose,
  onSendBlessStamp,
  onAscendToStar,
  myKarma,
}: {
  wish: Wish | null;
  onClose: () => void;
  onSendBlessStamp: (stampIcon: string) => void;
  onAscendToStar: (wishId: string) => void;
  myKarma: number;
}) => {
  const [selectedStamp, setSelectedStamp] = useState('🙏');

  if (!wish) return null;

  const isFull = wish.blessings.length >= wish.targetBlessings;
  const sealInfo =
    WISH_SEALS.find((s) => s.id === wish.sealId) || WISH_SEALS[0];
  const canBless = myKarma >= BLESS_KARMA_COST;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#fbf6e9] w-full max-w-[380px] max-h-[85dvh] overflow-y-auto rounded-3xl p-5 shadow-2xl border-4 border-double border-amber-900/40 space-y-4"
      >
        <div className="flex items-start justify-between border-b border-amber-900/15 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{sealInfo.icon}</span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-stone-900">
                  {wish.nickname}님의 기원
                </span>
                {wish.isGoldenBean && (
                  <span className="px-2 py-0.5 bg-amber-300 text-stone-950 rounded-full text-[9px] font-black">
                    🫘 황금 액막이
                  </span>
                )}
              </div>
              <p className="text-sm font-black text-red-900">
                {sealInfo.title} ({sealInfo.hanja})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 전통 인장 카드 */}
        <div className="bg-white/90 p-4 rounded-2xl border border-amber-900/15 text-center space-y-2 shadow-inner">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-800 text-amber-100 flex flex-col items-center justify-center font-serif font-black text-lg border-2 border-amber-400 shadow">
            {sealInfo.hanja}
          </div>
          <p className="text-xs font-bold text-stone-700 leading-relaxed">
            "{sealInfo.desc}"
          </p>
        </div>

        {/* 정성(공덕) 게이지 및 보탠 이웃들의 발도장 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-extrabold">
            <span className="text-stone-700">모인 정성 구슬(氣)</span>
            <span className="text-amber-800">
              {wish.blessings.length} / {wish.targetBlessings}개
            </span>
          </div>
          <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-red-600 transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  (wish.blessings.length / wish.targetBlessings) * 100
                )}%`,
              }}
            />
          </div>

          {/* 이웃들이 남긴 무언의 응원 인장 배지 목록 */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {wish.blessings.length === 0 ? (
              <p className="text-[11px] text-stone-400 py-1">
                아직 첫 기운이 모이지 않았습니다. 첫 복 기운을 불어넣어 주세요!
              </p>
            ) : (
              wish.blessings.map((b) => (
                <div
                  key={b.id}
                  className="px-2.5 py-1 bg-amber-100/90 border border-amber-400/50 rounded-full text-[11px] font-bold text-stone-800 flex items-center gap-1 shadow-sm"
                >
                  <span>{b.stamp || '🙏'}</span>
                  <span>{b.author}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 정성이 가득 찼을 때: 밤하늘 별 승천 버튼 */}
        {isFull && wish.status === 'hanging' && (
          <button
            onClick={() => onAscendToStar(wish.id)}
            className="w-full py-3 bg-gradient-to-r from-indigo-950 via-purple-900 to-indigo-950 hover:opacity-95 text-amber-300 rounded-2xl font-extrabold text-xs md:text-sm shadow-xl border border-amber-300/60 flex items-center justify-center gap-1.5 animate-pulse"
          >
            <SparkleIcon className="w-4 h-4 text-amber-300" />
            <span>🌌 천기 개방: 모두와 함께 밤하늘의 별로 띄우기!</span>
          </button>
        )}

        {/* 무언의 공덕 불어넣기 (보시하면 오히려 내 보상화 공덕 +3 보너스) */}
        <div className="border-t border-amber-900/15 pt-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-stone-800">
              응원 인장 선택 (내 공덕 🔮{BLESS_KARMA_COST} 소모 ➔ 보시 보너스 🌸+3)
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {BLESS_STAMPS.map((st) => (
              <button
                type="button"
                key={st.icon}
                onClick={() => setSelectedStamp(st.icon)}
                className={`py-2 rounded-xl border text-center transition ${
                  selectedStamp === st.icon
                    ? 'bg-amber-200 border-amber-600 font-extrabold scale-105 shadow'
                    : 'bg-white border-stone-200 opacity-75'
                }`}
              >
                <div className="text-lg">{st.icon}</div>
                <div className="text-[9px] text-stone-700 font-bold">
                  {st.name}
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={!canBless}
            onClick={() => onSendBlessStamp(selectedStamp)}
            className={`w-full py-2.5 rounded-xl text-xs font-extrabold shadow transition ${
              canBless
                ? 'bg-lime-800 hover:bg-lime-700 text-white cursor-pointer'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed'
            }`}
          >
            {canBless
              ? `${selectedStamp} 내 복기운 불어넣어 응원하기 (보유 🔮${myKarma})`
              : `🧹 공덕이 부족합니다 (필요 🔮${BLESS_KARMA_COST} / 보유 ${myKarma})`}
          </button>
        </div>
      </div>
    </div>
  );
};