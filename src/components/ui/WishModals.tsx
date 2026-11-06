import React from 'react';
import { Sparkles as SparkleIcon, MessageCircleHeart, Crown, X } from 'lucide-react';
import type { Wish } from '../../types/wish';

interface WriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  targetBlessings: number;
  pouchColor: string;
  setPouchColor: (c: string) => void;
  nickname: string;
  setNickname: (n: string) => void;
  content: string;
  setContent: (c: string) => void;
}

export const WishWriteModal = ({
  isOpen,
  onClose,
  onSubmit,
  targetBlessings,
  pouchColor,
  setPouchColor,
  nickname,
  setNickname,
  content,
  setContent,
}: WriteModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="relative bg-[#fbf6e9] w-full max-w-[390px] max-h-[84dvh] flex flex-col rounded-3xl shadow-2xl border-4 border-double border-amber-900/40 overflow-hidden"
      >
        {/* 1. 상단 고정 헤더 */}
        <div className="px-5 pt-5 pb-3 border-b border-amber-900/15 flex items-center justify-between bg-[#fbf6e9] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded border-2 border-red-700 text-red-700 flex flex-col items-center justify-center text-[9px] font-black leading-none select-none bg-red-50/70 shrink-0">
              <span>至誠</span>
              <span>感天</span>
            </div>
            <div>
              <h2 className="text-sm md:text-base font-extrabold text-stone-900 leading-tight">
                소원지 작성하기 (發願)
              </h2>
              <p className="text-[11px] text-stone-500 mt-0.5">
                이웃의 덕담 {targetBlessings}개가 모이면 밤하늘의 별이 됩니다
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200/70 hover:bg-stone-300 flex items-center justify-center text-stone-700 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. 중앙 스크롤 본문 영역 */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="block text-xs font-extrabold text-stone-700 mb-1.5">
              복주머니 빛깔 선택
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { code: '#e53935', label: '주홍(홍복)' },
                { code: '#fb8c00', label: '황금(재복)' },
                { code: '#d81b60', label: '분홍(인연)' },
                { code: '#43a047', label: '청록(건강)' },
              ].map((c) => (
                <button
                  type="button"
                  key={c.code}
                  onClick={() => setPouchColor(c.code)}
                  className={`py-2 rounded-xl text-[11px] font-extrabold text-white shadow transition ${
                    pouchColor === c.code
                      ? 'ring-2 ring-stone-900 scale-[1.03]'
                      : 'opacity-65'
                  }`}
                  style={{ backgroundColor: c.code }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-stone-700 mb-1">
              발원자 이름 (호/닉네임)
            </label>
            <input
              type="text"
              required
              maxLength={12}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="예: 경주복쓸이"
              className="w-full min-w-0 box-border px-3.5 py-2.5 rounded-xl bg-[#fffdf7] border border-amber-900/30 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-800"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-stone-700 mb-1">
              소원 내용 (소원지에 새길 말씀)
            </label>
            <textarea
              required
              maxLength={120}
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="간절히 이루고 싶은 소망을 정성껏 적어주세요..."
              className="w-full min-w-0 box-border px-3.5 py-2.5 rounded-xl bg-[#fffdf7] border border-amber-900/30 text-sm font-bold text-stone-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-800 resize-none"
            />
          </div>
        </div>

        {/* 3. 하단 고정 액션 버튼 */}
        <div className="px-5 py-3.5 bg-[#f5eedc] border-t border-amber-900/15 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-stone-600 bg-white border border-stone-300 hover:bg-stone-100 transition"
          >
            취소
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-xl text-xs font-extrabold bg-red-800 hover:bg-red-700 text-amber-100 shadow-md border border-amber-400/40 transition"
          >
            🧧 낙관 찍고 당산나무에 걸기
          </button>
        </div>
      </form>
    </div>
  );
};

interface DetailModalProps {
  wish: Wish | null;
  onClose: () => void;
  onAddBlessing: (e: React.FormEvent) => void;
  onAscendToStar: (wishId: string) => void;
  blessingAuthor: string;
  setBlessingAuthor: (a: string) => void;
  blessingComment: string;
  setBlessingComment: (c: string) => void;
}

export const WishDetailModal = ({
  wish,
  onClose,
  onAddBlessing,
  onAscendToStar,
  blessingAuthor,
  setBlessingAuthor,
  blessingComment,
  setBlessingComment,
}: DetailModalProps) => {
  if (!wish) return null;

  const isQiFull = wish.blessings.length >= wish.targetBlessings;

  const quickBlessings = [
    '지극한 정성이 하늘에 닿아 꼭 이루어지길 기원합니다!',
    '따뜻한 소망에 제 복 기운도 함께 보탭니다 ✨',
    '복쓸싸리의 가호로 올 한 해 만사형통하시길!',
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#fbf6e9] w-full max-w-[390px] max-h-[84dvh] flex flex-col rounded-3xl shadow-2xl border-4 border-double border-amber-900/40 overflow-hidden"
      >
        {/* 1. 상단 고정 상태 헤더 */}
        <div className="px-5 pt-4 pb-3 border-b border-amber-900/15 flex items-center justify-between bg-[#fbf6e9] shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                wish.status === 'star'
                  ? 'bg-indigo-950 text-amber-300'
                  : isQiFull
                  ? 'bg-amber-400 text-stone-950'
                  : 'bg-amber-200/90 text-amber-950'
              }`}
            >
              {wish.status === 'star'
                ? '⭐ 밤하늘의 별이 된 소원'
                : isQiFull
                ? '✨ 복기운 충만 (승천 준비 완료)'
                : '📜 당산나무에 걸린 소원지'}
            </span>

            {wish.isMine && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-900 text-amber-200 text-[10px] font-bold">
                <Crown className="w-3 h-3 fill-amber-300 text-amber-300" />
                나의 소원
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200/70 hover:bg-stone-300 flex items-center justify-center text-stone-700 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. 중앙 단일 스크롤 영역 (이중 스크롤 제거) */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* 소원 본문 카드 */}
          <div className="bg-[#fffdf7] border-2 border-amber-900/20 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-stone-900 font-extrabold text-sm md:text-base leading-relaxed break-keep">
              "{wish.content}"
            </p>
            <div className="mt-2.5 flex items-center justify-center gap-2">
              <span className="text-xs text-stone-600 font-bold">
                — 발원자: {wish.nickname} —
              </span>
              <span className="px-1.5 py-0.5 border border-red-700 text-red-700 text-[9px] font-black rounded">
                祈願印
              </span>
            </div>
          </div>

          {/* 정성 게이지 및 덕담 목록 */}
          <div>
            <div className="flex items-center justify-between text-xs font-extrabold text-stone-700 mb-1.5">
              <span className="flex items-center gap-1">
                <MessageCircleHeart className="w-4 h-4 text-rose-600" />이 소원에 모인 정성(덕담)
              </span>
              <span className="text-rose-700">
                {wish.blessings.length} / {wish.targetBlessings} 정성
              </span>
            </div>

            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-rose-600 via-amber-500 to-yellow-400 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (wish.blessings.length / wish.targetBlessings) * 100
                  )}%`,
                }}
              />
            </div>

            <div className="space-y-2">
              {wish.blessings.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-3 bg-stone-100/80 rounded-xl">
                  아직 남겨진 덕담이 없습니다. 첫 번째 정성을 보태주세요!
                </p>
              ) : (
                wish.blessings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-amber-100/60 border border-amber-300/70 rounded-xl px-3.5 py-2.5 text-left"
                  >
                    <div className="flex justify-between text-[11px] font-extrabold text-amber-950 mb-0.5">
                      <span>🧧 {b.author}님의 덕담</span>
                      <span className="text-stone-400 font-normal">{b.time}</span>
                    </div>
                    <p className="text-xs text-stone-800 font-medium break-keep leading-snug">
                      {b.comment}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* [3-A 적용] 기운 충만(3/3) 달성 시: 입력폼 대신 '천기 개방' 박스만 깔끔하게 노출 */}
          {wish.status === 'hanging' && isQiFull && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-center border-2 border-amber-400 shadow-lg">
              <p className="text-xs font-extrabold text-amber-200 mb-2.5 break-keep">
                ✨ 세 번의 진심 어린 덕담이 모여 복 기운이 충만해졌습니다!
              </p>
              <button
                type="button"
                onClick={() => onAscendToStar(wish.id)}
                className="w-full py-3 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-stone-950 rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-1.5 transition transform active:scale-95"
              >
                <SparkleIcon className="w-4 h-4 shrink-0" />
                <span>천기 개방: 이 소원을 밤하늘의 별로 띄우기!</span>
              </button>
            </div>
          )}

          {/* [3-A & 4-A 적용] 아직 3/3 미만일 때만 덕담 입력 폼 표시 (상하 2줄 배치로 박스 이탈 방지) */}
          {wish.status === 'hanging' && !isQiFull && (
            <form
              onSubmit={onAddBlessing}
              className="bg-white/95 rounded-2xl p-3.5 border border-amber-900/20 space-y-2.5"
            >
              <p className="text-xs font-extrabold text-stone-800">
                🙏 따뜻한 덕담 한마디로 복 기운 보태기 (積善)
              </p>

              {/* 빠른 덕담 문구 */}
              <div className="flex flex-col gap-1">
                {quickBlessings.map((q, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setBlessingComment(q)}
                    className="w-full text-[11px] bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-950 font-bold px-2.5 py-1.5 rounded-lg transition text-left truncate"
                  >
                    + "{q}"
                  </button>
                ))}
              </div>

              {/* 4-A 적용: 윗줄 내 이름, 아랫줄 덕담 내용 상하 2줄 배치 */}
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  maxLength={10}
                  value={blessingAuthor}
                  onChange={(e) => setBlessingAuthor(e.target.value)}
                  placeholder="내 이름 (선택 · 미입력 시 익명 복쓸덩이)"
                  className="w-full min-w-0 box-border px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
                <input
                  type="text"
                  required
                  maxLength={60}
                  value={blessingComment}
                  onChange={(e) => setBlessingComment(e.target.value)}
                  placeholder="소원이 이루어지도록 진심 어린 덕담을 적어주세요"
                  className="w-full min-w-0 box-border px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-800 hover:bg-red-700 text-amber-100 rounded-xl text-xs font-extrabold shadow flex items-center justify-center gap-1.5 transition"
              >
                <MessageCircleHeart className="w-4 h-4 shrink-0" />
                <span>정성 담은 덕담 남기고 복구슬 띄우기 (+1)</span>
              </button>
            </form>
          )}
        </div>

        {/* 3. 하단 고정 닫기 버튼 */}
        <div className="px-5 py-3 bg-[#f5eedc] border-t border-amber-900/15 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-extrabold transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};