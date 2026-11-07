import React, { useState } from 'react';
import { X, Download, Sparkles, Gift, RefreshCw, MapPin } from 'lucide-react';
import type { FlowerType } from '../../types/wish';
import {
  FLOWER_NAMES,
  DAILY_FORTUNES,
  KARMA_THRESHOLDS,
} from '../../utils/constants';

// 1. 오늘의 보상화 운세 & 소장용 부적 카드 이미지 다운로드 모달
export const DailyFortuneModal = ({
  isOpen,
  onClose,
  todayKey,
  myNickname,
  flowerType,
  myKarma,
  onRerollFlower,
}: {
  isOpen: boolean;
  onClose: () => void;
  todayKey: string;
  myNickname: string;
  flowerType: FlowerType;
  myKarma: number;
  onRerollFlower: () => void;
}) => {
  if (!isOpen) return null;

  const isBloomed = myKarma >= KARMA_THRESHOLDS.BLOOM;
  const fortune = DAILY_FORTUNES[flowerType] || DAILY_FORTUNES.pink_lotus;
  const flowerTitle = FLOWER_NAMES[flowerType];

  // HTML5 Canvas로 전통 부적 카드를 그려 즉시 이미지(.png)로 저장하는 함수
  const handleDownloadAmulet = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. 한지 배경 그라데이션
    const grad = ctx.createLinearGradient(0, 0, 0, 1080);
    grad.addColorStop(0, '#fbf6e9');
    grad.addColorStop(1, '#f3e5ab');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 720, 1080);

    // 2. 전통 이중 테두리
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 10;
    ctx.strokeRect(32, 32, 656, 1016);
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.strokeRect(48, 48, 624, 984);

    // 3. 상단 날짜 및 타이틀
    ctx.fillStyle = '#7f1d1d';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`복쓸싸리 동산 · 일일 수호 부적 (${todayKey})`, 360, 110);

    // 4. 중앙 붉은 인장 원형 및 한자
    ctx.beginPath();
    ctx.arc(360, 260, 95, 0, Math.PI * 2);
    ctx.fillStyle = '#991b1b';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#facc15';
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = '900 54px serif';
    ctx.fillText(fortune.hanja, 360, 278);

    // 5. 꽃 이름 및 주인공 이름
    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(`${myNickname}님의 오늘의 보상화: ${flowerTitle}`, 360, 425);

    ctx.fillStyle = fortune.accentColor;
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(fortune.title, 360, 475);

    // 6. 점괘 본문 박스
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.fillRect(75, 520, 570, 290);
    ctx.strokeStyle = '#d6d3d1';
    ctx.lineWidth = 2;
    ctx.strokeRect(75, 520, 570, 290);

    ctx.fillStyle = '#292524';
    ctx.font = 'bold 24px sans-serif';
    const words = fortune.summary;
    ctx.fillText(words.slice(0, 22), 360, 585);
    if (words.length > 22) {
      ctx.fillText(words.slice(22), 360, 625);
    }

    ctx.fillStyle = '#44403c';
    ctx.font = '21px sans-serif';
    ctx.fillText(`🍀 행운의 물건: ${fortune.luckyItem}`, 360, 705);
    ctx.fillText(`📍 행운의 장소: ${fortune.luckyPlace}`, 360, 755);

    // 7. 하단 낙관
    ctx.fillStyle = '#78716c';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(
      '🧹 싸리빗자루가 액운을 쓸어내고 붉은 팥이 만복을 지킵니다',
      360,
      910
    );
    ctx.fillStyle = '#991b1b';
    ctx.font = '900 22px serif';
    ctx.fillText('— 경주 황리단길 수호신 복쓸싸리 印 —', 360, 965);

    const link = document.createElement('a');
    link.download = `복쓸싸리_오늘의부적_${todayKey}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#fbf6e9] w-full max-w-[390px] max-h-[88dvh] overflow-y-auto rounded-3xl p-5 shadow-2xl border-4 border-double border-amber-900/40 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-amber-900/15 pb-3">
          <div>
            <span className="text-[10px] font-extrabold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full">
              🪷 1일 1개화 · 오늘의 보상화 점괘 ({todayKey})
            </span>
            <h2 className="text-base font-extrabold text-stone-900 mt-0.5">
              오늘의 수호꽃과 행운 부적
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isBloomed ? (
          /* 아직 오늘의 공덕 30점을 채우기 전 */
          <div className="bg-white/90 p-5 rounded-2xl border border-amber-900/15 text-center space-y-3">
            <div className="text-4xl animate-bounce">🌷</div>
            <h3 className="text-sm font-black text-stone-900">
              오늘의 보상화가 아직 봉오리 상태입니다!
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              동산에서 액운을 쓸어내거나 복구슬을 바구니에 넣어
              <br />
              <strong>오늘의 공덕 {KARMA_THRESHOLDS.BLOOM}점</strong>을 채우면
              머리 위에 꽃이 만개하며 오늘의 운세 부적이 열립니다.
            </p>
            <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-red-600 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (myKarma / KARMA_THRESHOLDS.BLOOM) * 100
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs font-extrabold text-amber-900">
              현재 🔮 {myKarma} / {KARMA_THRESHOLDS.BLOOM}점 (남은 공덕:{' '}
              {KARMA_THRESHOLDS.BLOOM - myKarma}점)
            </p>
          </div>
        ) : (
          /* 오늘의 보상화 만개 완료 시: 운세 카드 표시 및 앨범 저장 */
          <div className="space-y-3.5">
            <div className="bg-gradient-to-b from-[#fffdf7] to-[#f7eed3] p-4 rounded-2xl border-2 border-red-900/30 shadow-inner text-center space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-stone-500">
                <span>{todayKey}</span>
                <button
                  type="button"
                  onClick={onRerollFlower}
                  className="flex items-center gap-1 text-amber-800 hover:underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>다른 꽃 기운 보기</span>
                </button>
              </div>

              <div className="w-16 h-16 mx-auto rounded-full bg-red-800 border-2 border-amber-400 text-amber-200 flex items-center justify-center font-serif font-black text-base shadow-md">
                {fortune.hanja}
              </div>

              <div>
                <div className="text-xs font-extrabold text-stone-600">
                  {myNickname}님의 머리 위에 피어난 꽃
                </div>
                <div className="text-base font-black text-red-900 mt-0.5">
                  {flowerTitle} — {fortune.title}
                </div>
              </div>

              <p className="text-xs font-extrabold text-stone-800 bg-amber-100/70 p-2.5 rounded-xl">
                "{fortune.summary}"
              </p>

              <p className="text-[11px] text-stone-600 leading-relaxed text-left px-1">
                {fortune.detail}
              </p>

              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-900/10 text-left text-[11px] space-y-1 font-bold text-stone-700">
                <div>🍀 행운의 물건: {fortune.luckyItem}</div>
                <div>📍 행운의 장소: {fortune.luckyPlace}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadAmulet}
              className="w-full py-3 bg-red-800 hover:bg-red-700 text-amber-50 rounded-2xl font-extrabold text-xs md:text-sm shadow-xl flex items-center justify-center gap-2 transition transform active:scale-95"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>내 앨범에 오늘의 부적 카드 이미지 저장하기</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// 2. O2O 오프라인 성지(황리단길 쇼룸) & 실물 굿즈 연동 모달
export const O2OConnectModal = ({
  isOpen,
  onClose,
  claimedCodes,
  onRedeemCode,
}: {
  isOpen: boolean;
  onClose: () => void;
  claimedCodes: string[];
  onRedeemCode: (code: string) => { ok: boolean; message: string };
}) => {
  const [inputCode, setInputCode] = useState('');
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const res = onRedeemCode(inputCode);
    setFeedback(res);
    if (res.ok) setInputCode('');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#fbf6e9] w-full max-w-[380px] rounded-3xl p-5 shadow-2xl border-4 border-double border-amber-900/40 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-amber-900/15 pb-3">
          <div>
            <span className="text-[10px] font-extrabold text-red-900 bg-red-100 px-2 py-0.5 rounded-full">
              📍 O2O 오프라인 성지 & 굿즈 연동
            </span>
            <h2 className="text-base font-extrabold text-stone-900 mt-0.5">
              오프라인 복채 · 굿즈 코드 등록
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-amber-100/70 p-3.5 rounded-2xl border border-amber-900/15 space-y-1.5 text-xs text-stone-700">
          <div className="font-extrabold text-amber-950 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-red-700" />
            <span>현실의 복쓸싸리와 온라인 동산을 연결하세요!</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            오프라인 쇼룸(황리단길 등) 방문 인증 코드나 실물 굿즈(경주 붉은팥 액막이 키링 등)에 동봉된 암호를 입력하면 <strong>즉시 오늘의 보상화가 만개하고 대량의 붉은 팥</strong>이 지급됩니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="예: 황리단길 / 팥키링 / 복쓸싸리"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-xs font-extrabold text-stone-900"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-red-800 hover:bg-red-700 text-amber-50 rounded-xl text-xs font-extrabold whitespace-nowrap shadow"
            >
              인증하기
            </button>
          </div>

          {/* 원클릭 프로토타입 테스트 버튼 */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[10px] font-bold text-stone-500">
              빠른 테스트:
            </span>
            {['황리단길', '팥키링', '복쓸싸리'].map((sample) => (
              <button
                type="button"
                key={sample}
                onClick={() => {
                  const res = onRedeemCode(sample);
                  setFeedback(res);
                }}
                className="px-2 py-1 rounded-lg bg-white border border-stone-300 text-[10px] font-extrabold text-stone-700 hover:bg-amber-100"
              >
                {sample}
              </button>
            ))}
          </div>
        </form>

        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs font-bold ${
              feedback.ok
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-rose-100 text-rose-900 border border-rose-300'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {claimedCodes.length > 0 && (
          <div className="border-t border-amber-900/15 pt-2.5">
            <div className="text-[10px] font-extrabold text-stone-500 mb-1">
              내가 보유한 오프라인 인연 증표
            </div>
            <div className="flex flex-wrap gap-1.5">
              {claimedCodes.map((c) => (
                <span
                  key={c}
                  className="px-2.5 py-1 bg-amber-300/80 text-stone-950 rounded-full text-[10px] font-black flex items-center gap-1"
                >
                  <Gift className="w-3 h-3" />
                  {c} 인증 완료
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};