import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Gift, RefreshCw, MapPin, Sparkles } from 'lucide-react';
import type { FlowerType } from '../../types/wish';
import {
  FLOWER_NAMES,
  DAILY_FORTUNES,
  KARMA_THRESHOLDS,
} from '../../utils/constants';

// 신문 오늘의 운세 스타일의 꽃별 3대 핵심 점괘 요약
const CONCISE_FORTUNE_TABLE: Record<
  FlowerType,
  { headline: string; wealth: string; relation: string; action: string }
> = {
  white_lotus: {
    headline: '마음의 먼지가 씻기고 뜻밖의 길보(吉報)가 찾아오는 날',
    wealth: '작은 지출은 줄이고 문서·계약에서 실속을 챙기세요.',
    relation: '오래된 지인에게서 반가운 연락이나 도움의 손길이 옵니다.',
    action: '오후에 따뜻한 차 한 잔과 함께 창문을 열어 환기하기',
  },
  pink_lotus: {
    headline: '다정한 인연운이 만개하여 웃음꽃과 귀인이 따르는 날',
    wealth: '주변 사람에게 베푼 작은 호의가 더 큰 복으로 돌아옵니다.',
    relation: '막혔던 오해가 풀리고 연인·가족과 화목함이 깊어집니다.',
    action: '먼저 밝게 인사 건네기 · 달콤한 팥 간식 나누기',
  },
  peony: {
    headline: '재물과 성취의 기운이 머리 위에 가득 차오르는 대길일',
    wealth: '공들여온 일에서 기대 이상의 금전적·실질적 결실이 맺힙니다.',
    relation: '당당하고 자신감 있는 태도가 사람들의 신뢰를 모읍니다.',
    action: '미뤄두었던 중요한 결정이나 계획 과감히 실행하기',
  },
  gold_plum: {
    headline: '막혔던 문제를 단번에 뚫어주는 반짝이는 지혜의 날',
    wealth: '새로운 아이디어가 곧 재복으로 연결되는 총명한 흐름입니다.',
    relation: '대화가 술술 통하고 내 의견을 귀담아듣는 조력자를 만납니다.',
    action: '떠오르는 생각을 메모하고 햇살 좋은 길 산책하기',
  },
  blue_bosang: {
    headline: '궂은 액운은 물러가고 전화위복의 기회를 잡는 수호의 날',
    wealth: '예상치 못한 난관도 오히려 이득으로 바뀌는 든든한 운세입니다.',
    relation: '나를 지켜주는 귀인이 곁에 있으니 마음이 든든하고 평온합니다.',
    action: '불필요한 걱정은 싸리빗자루로 털어내고 일찍 휴식하기',
  },
};

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
  const scratchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isScratched, setIsScratched] = useState<boolean>(() => {
    return localStorage.getItem(`bokssul_scratched_${todayKey}`) === 'true';
  });
  const isDrawingRef = useRef(false);

  const isBloomed = myKarma >= KARMA_THRESHOLDS.BLOOM;
  const fortune = DAILY_FORTUNES[flowerType] || DAILY_FORTUNES.pink_lotus;
  const concise =
    CONCISE_FORTUNE_TABLE[flowerType] || CONCISE_FORTUNE_TABLE.pink_lotus;
  const flowerTitle = FLOWER_NAMES[flowerType];

  // 황금 복권 스크래치 레이어 초기화
  useEffect(() => {
    if (!isOpen || !isBloomed || isScratched) return;
    const canvas = scratchCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'source-over';
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#facc15');
    grad.addColorStop(0.5, '#fef08a');
    grad.addColorStop(1, '#eab308');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    ctx.fillStyle = '#713f12';
    ctx.font = '900 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ 황금 복권 부적 ✨', canvas.width / 2, canvas.height / 2 - 14);
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(
      '👆 손가락으로 문질러 오늘의 복을 긁어보세요!',
      canvas.width / 2,
      canvas.height / 2 + 16
    );
  }, [isOpen, isBloomed, isScratched, flowerType]);

  const handleScratchMove = (clientX: number, clientY: number) => {
    const canvas = scratchCanvasRef.current;
    if (!canvas || isScratched) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 32, 0, Math.PI * 2);
    ctx.fill();

    // 긁힌 면적 비율 계산 (38% 이상 긁히면 전체 자동 오픈)
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparentPixels = 0;
    for (let i = 3; i < imgData.length; i += 16) {
      if (imgData[i] < 128) transparentPixels++;
    }
    const ratio = transparentPixels / (imgData.length / 16);
    if (ratio > 0.35) {
      setIsScratched(true);
      localStorage.setItem(`bokssul_scratched_${todayKey}`, 'true');
    }
  };

  const handleDownloadAmulet = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, 0, 960);
    grad.addColorStop(0, '#fffbeb');
    grad.addColorStop(1, '#fef3c7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 720, 960);

    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 10;
    ctx.strokeRect(28, 28, 664, 904);

    // 상단 헤더
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(60, 70, 600, 64);
    ctx.fillStyle = '#fef08a';
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`복쓸싸리 오늘의 운세 · ${todayKey}`, 360, 112);

    // 핵심 수호꽃 & 한자(1줄 고정)
    ctx.fillStyle = '#1c1917';
    ctx.font = '900 40px sans-serif';
    ctx.fillText(`${flowerTitle} (${fortune.hanja})`, 360, 215);

    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`"${concise.headline}"`, 360, 275);

    // 3단 요약 박스
    const rows = [
      { label: '💰 재물·성취운', text: concise.wealth },
      { label: '🤝 인연·대인운', text: concise.relation },
      { label: '🍀 액막이 처방', text: concise.action },
      { label: '📍 행운의 장소', text: `${fortune.luckyPlace} (${fortune.luckyItem})` },
    ];

    rows.forEach((r, idx) => {
      const y = 330 + idx * 120;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(65, y, 590, 98);
      ctx.strokeStyle = '#e7e5e4';
      ctx.lineWidth = 2;
      ctx.strokeRect(65, y, 590, 98);

      ctx.fillStyle = '#991b1b';
      ctx.font = '900 22px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(r.label, 90, y + 38);

      ctx.fillStyle = '#292524';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(r.text, 90, y + 74);
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#78716c';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`${myNickname}님의 하루를 수호신 복쓸싸리가 지킵니다 🐾`, 360, 875);

    const link = document.createElement('a');
    link.download = `복쓸싸리_오늘의운세_${todayKey}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3.5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#fbf6e9] w-full max-w-[365px] rounded-3xl p-4 shadow-2xl border-4 border-double border-amber-900/40 space-y-3"
      >
        {/* 심플 헤더 */}
        <div className="flex items-center justify-between border-b border-amber-900/15 pb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-red-800 text-amber-100 rounded-md text-[10px] font-black">
              오늘의 운세
            </span>
            <span className="text-xs font-extrabold text-stone-600">
              {todayKey}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isBloomed ? (
          <div className="bg-white/90 p-4 rounded-2xl border border-amber-900/15 text-center space-y-2.5">
            <div className="text-3xl animate-bounce">🌷</div>
            <h3 className="text-sm font-black text-stone-900">
              공덕 {KARMA_THRESHOLDS.BLOOM}점을 채우면 오늘의 운세 복권이 열립니다!
            </h3>
            <p className="text-[11px] text-stone-600">
              액운을 함께 정화하거나 복구슬을 바구니에 골인시켜 공덕을 모아보세요.
            </p>
            <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
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
              현재 🔮 {myKarma} / {KARMA_THRESHOLDS.BLOOM}점
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 상단 꽃 타이틀 배너 (줄바꿈 깨짐 방지) */}
            <div className="bg-red-900 text-amber-50 p-3 rounded-2xl shadow flex items-center justify-between">
              <div>
                <div className="text-[10px] text-amber-200 font-bold">
                  {myNickname}님의 수호꽃 점괘
                </div>
                <div className="text-base font-black flex items-center gap-1.5 mt-0.5">
                  <span>{flowerTitle}</span>
                  <span className="text-xs px-2 py-0.5 bg-amber-400 text-stone-950 rounded-md font-serif font-black">
                    {fortune.hanja}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onRerollFlower();
                  setIsScratched(false);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-[10px] font-bold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>다시 뽑기</span>
              </button>
            </div>

            {/* 신문 오늘의 운세 스타일 3단 요약 카드 + 복권 스크래치 오버레이 */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-amber-900/20 bg-white shadow-inner">
              <div className="p-3.5 space-y-2.5">
                {/* 한 줄 총평 */}
                <div className="bg-amber-100/80 px-3 py-2 rounded-xl text-center">
                  <p className="text-xs font-black text-red-950 leading-snug">
                    "{concise.headline}"
                  </p>
                </div>

                {/* 3대 운세 요약 표 */}
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex gap-2 items-start bg-stone-50 p-2 rounded-xl">
                    <span className="font-black text-amber-900 shrink-0 w-16">
                      💰 재물운
                    </span>
                    <span className="text-stone-700 font-bold">
                      {concise.wealth}
                    </span>
                  </div>
                  <div className="flex gap-2 items-start bg-stone-50 p-2 rounded-xl">
                    <span className="font-black text-rose-900 shrink-0 w-16">
                      🤝 인연운
                    </span>
                    <span className="text-stone-700 font-bold">
                      {concise.relation}
                    </span>
                  </div>
                  <div className="flex gap-2 items-start bg-stone-50 p-2 rounded-xl">
                    <span className="font-black text-emerald-900 shrink-0 w-16">
                      🍀 개운법
                    </span>
                    <span className="text-stone-700 font-bold">
                      {concise.action}
                    </span>
                  </div>
                  <div className="flex gap-2 items-center bg-amber-50/70 px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold text-stone-600">
                    <span>📍 행운 스팟: {fortune.luckyPlace}</span>
                    <span>·</span>
                    <span>{fortune.luckyItem}</span>
                  </div>
                </div>
              </div>

              {/* 복권 스크래치 캔버스 (처음 등장 시 덮여 있음) */}
              {!isScratched && (
                <canvas
                  ref={scratchCanvasRef}
                  width={340}
                  height={250}
                  onPointerDown={(e) => {
                    isDrawingRef.current = true;
                    handleScratchMove(e.clientX, e.clientY);
                  }}
                  onPointerMove={(e) => {
                    if (!isDrawingRef.current) return;
                    handleScratchMove(e.clientX, e.clientY);
                  }}
                  onPointerUp={() => {
                    isDrawingRef.current = false;
                  }}
                  onTouchMove={(e) => {
                    const touch = e.touches[0];
                    if (touch) handleScratchMove(touch.clientX, touch.clientY);
                  }}
                  className="absolute inset-0 w-full h-full cursor-pointer touch-none"
                />
              )}
            </div>

            {!isScratched ? (
              <button
                type="button"
                onClick={() => {
                  setIsScratched(true);
                  localStorage.setItem(`bokssul_scratched_${todayKey}`, 'true');
                }}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-2xl font-extrabold text-xs shadow flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>한 번에 결과 바로 보기</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDownloadAmulet}
                className="w-full py-2.5 bg-red-800 hover:bg-red-700 text-amber-50 rounded-2xl font-extrabold text-xs shadow-lg flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Download className="w-4 h-4 text-amber-300" />
                <span>오늘의 운세 부적 이미지 저장하기</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

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
        className="bg-[#fbf6e9] w-full max-w-[360px] rounded-3xl p-5 shadow-2xl border-4 border-double border-amber-900/40 space-y-3.5"
      >
        <div className="flex items-center justify-between border-b border-amber-900/15 pb-2.5">
          <h2 className="text-sm font-extrabold text-stone-900 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-red-700" />
            <span>오프라인 매장 · 굿즈 코드 등록</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-stone-200 text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="코드 입력 (예: 황리단길 / 팥키링)"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs font-extrabold text-stone-900"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-red-800 text-amber-50 rounded-xl text-xs font-extrabold whitespace-nowrap"
            >
              등록
            </button>
          </div>

          <div className="flex items-center gap-1 pt-0.5">
            <span className="text-[10px] font-bold text-stone-500">체험:</span>
            {['황리단길', '팥키링', '복쓸싸리'].map((sample) => (
              <button
                type="button"
                key={sample}
                onClick={() => setFeedback(onRedeemCode(sample))}
                className="px-2 py-0.5 rounded-lg bg-white border border-stone-300 text-[10px] font-extrabold text-stone-700"
              >
                {sample}
              </button>
            ))}
          </div>
        </form>

        {feedback && (
          <div
            className={`p-2.5 rounded-xl text-[11px] font-bold ${
              feedback.ok
                ? 'bg-emerald-100 text-emerald-900'
                : 'bg-rose-100 text-rose-900'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {claimedCodes.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {claimedCodes.map((c) => (
              <span
                key={c}
                className="px-2 py-0.5 bg-amber-300 text-stone-950 rounded-full text-[10px] font-black flex items-center gap-1"
              >
                <Gift className="w-3 h-3" />
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};