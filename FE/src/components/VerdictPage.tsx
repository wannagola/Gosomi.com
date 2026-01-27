import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import {
  Scale,
  Gavel,
  Share2,
  AlertTriangle,
  FileText,
  Paperclip,
  Upload,
} from "lucide-react";
import { Case, LAWS } from "@/types/court";

interface VerdictPageProps {
  case_: Case;
  onAppeal?: (appellant: 'plaintiff' | 'defendant') => void;
  onSelectPenalty?: (penalty: "serious" | "funny") => void;
}

declare global {
  interface Window {
    Kakao: any;
  }
}

export function VerdictPage({
  case_,
  onAppeal,
  onSelectPenalty,
}: VerdictPageProps) {
  const [penaltyTypeSelected, setPenaltyTypeSelected] = useState<
    "serious" | "funny" | null
  >(null);
  const [confirmedPenalty, setConfirmedPenalty] = useState<
    "serious" | "funny" | null
  >(case_.penaltySelected as "serious" | "funny" || null);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // ✅ 캡처 대상(네비게이션 제외하고 “판결문 페이지 내용”만 감싸는 래퍼)
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCapturing) return;

    const runCapture = async () => {
      try {
        const target = captureRef.current;
        if (!target) return;

        // ✅ 버튼 숨김(!isCapturing)이 DOM에 반영되도록 1프레임 대기
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );

        // ✅ html2canvas 타입 정의가 프로젝트와 충돌할 때가 많아서 options는 캐스팅으로 정리
        const canvas = await html2canvas(target, {
          useCORS: true,

          // ⚠️ 여기서 TS가 "backgroundColor 없다"라고 할 수 있어서 캐스팅으로 해결
          backgroundColor: "#05050a",

          scale: Math.min(2, window.devicePixelRatio || 1),

          // ✅ 스크롤 때문에 잘리는 문제 방지
          scrollX: 0,
          scrollY: -window.scrollY,
          windowWidth: document.documentElement.scrollWidth,
          windowHeight: document.documentElement.scrollHeight,

          // ✅ nav 제외
          ignoreElements: (el: HTMLElement) => {
            // 1) id로 잡는 경우
            if (el.id === "app-nav") return true;

            // 2) data 속성으로 잡는 경우
            if (el.dataset?.captureIgnore === "true") return true;

            // 3) nav 태그 일반 제외
            if (el.tagName.toLowerCase() === "nav") return true;

            return false;
          },

          // ✅ 클론 DOM에서 nav 강제 제거(고정요소 찍히는 최후방어)
          onclone: (clonedDoc: Document) => {
            const appNav = clonedDoc.getElementById("app-nav");
            if (appNav) (appNav as HTMLElement).style.display = "none";

            clonedDoc.querySelectorAll("nav").forEach((n: Element) => {
              (n as HTMLElement).style.display = "none";
            });

            clonedDoc
              .querySelectorAll('[data-capture-ignore="true"]')
              .forEach((n: Element) => {
                (n as HTMLElement).style.display = "none";
              });
          },
        } as any);

        const link = document.createElement("a");
        link.download = `verdict-${case_.caseNumber}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (error) {
        console.error("Error during html2canvas capture:", error);
        alert("판결문 이미지 생성에 실패했습니다. 콘솔을 확인해주세요.");
      } finally {
        setIsCapturing(false);
      }
    };

    runCapture();
  }, [isCapturing, case_.caseNumber]);

  const handleConfirmPenalty = (penalty: "serious" | "funny") => {
    setConfirmedPenalty(penalty);
    onSelectPenalty?.(penalty);
  };


  const law = LAWS.find((l) => l.id === case_.lawType);
  
  // Debug: Check if law type is being passed correctly
  console.log('VerdictPage Debug:', { lawType: case_.lawType, law: law?.title });

  // ✅ Prioritize AI-generated penalties from case_, then fallback to static Law data
  // Helper functions to parse JSON data safely
  const parseFaultRatio = () => {
    let ratio = { plaintiff: 50, defendant: 50 };
    if (case_.faultRatio) {
      try {
        const parsed = typeof case_.faultRatio === 'string' 
          ? JSON.parse(case_.faultRatio) 
          : case_.faultRatio;
        
        ratio = {
            plaintiff: parsed.plaintiff || 50,
            defendant: parsed.defendant || 50
        };
      } catch {
        ratio = { plaintiff: 50, defendant: 50 };
      }
    }

    // Normalize to 100
    const total = ratio.plaintiff + ratio.defendant;
    if (total === 0) return { plaintiff: 50, defendant: 50 };

    // Calculate percentage based on total
    const plaintiffPercent = Math.round((ratio.plaintiff / total) * 100);
    // Ensure total is exactly 100 by calculating the remainder
    const defendantPercent = 100 - plaintiffPercent;

    return {
        plaintiff: plaintiffPercent,
        defendant: defendantPercent
    };
  };

  const parsePenalties = () => {
    if (!case_.penalties) return { serious: [], funny: [] };
    try {
      const penalties = typeof case_.penalties === 'string'
        ? JSON.parse(case_.penalties)
        : case_.penalties;
      return {
        serious: penalties.serious || [],
        funny: penalties.funny || []
      };
    } catch {
      return { serious: [], funny: [] };
    }
  };

  const parsedFaultRatio = parseFaultRatio();
  const parsedPenalties = parsePenalties();

  // Find correct Law object - already declared above
  // const law = LAWS.find(l => l.id === case_.lawType);

  const getSeriousPenalty = () => {
    if (parsedPenalties.serious && parsedPenalties.serious.length > 0) {
      return parsedPenalties.serious.map((p: string, i: number) => `${i+1}. ${p}`).join('\n');
    }
    const l: any = law as any;
    return (
      l?.seriousPenalty ??
      l?.serious ??
      l?.penalties?.serious ??
      l?.penalty?.serious ??
      "진지한 벌칙 내용이 준비되지 않았습니다."
    );
  };

  const getFunnyPenalty = () => {
    if (parsedPenalties.funny && parsedPenalties.funny.length > 0) {
      return parsedPenalties.funny.map((p: string, i: number) => `${i+1}. ${p}`).join('\n');
    }
    const l: any = law as any;
    return (
      l?.funnyPenalty ??
      l?.funny ??
      l?.penalties?.funny ??
      l?.penalty?.funny ??
      "재미있는 벌칙 내용이 준비되지 않았습니다."
    );
  };

  const verdict = {
    plaintiffFault: parsedFaultRatio.plaintiff,
    defendantFault: parsedFaultRatio.defendant,
    reasoning: case_.verdictText ?? "판결 내용이 없습니다.",
    verdictText: case_.verdictText ?? "판결 내용이 없습니다.",
  };

  const appellant: 'plaintiff' | 'defendant' = verdict.plaintiffFault > verdict.defendantFault ? 'plaintiff' : 'defendant';

  const juryVotes = case_.juryVotes || {
    plaintiffWins: 15,
    defendantWins: 25,
    bothGuilty: 10,
  };

  const totalJuryVotes =
    juryVotes.plaintiffWins + juryVotes.defendantWins + juryVotes.bothGuilty;

  const juryMajority =
    juryVotes.plaintiffWins > juryVotes.defendantWins &&
    juryVotes.plaintiffWins > juryVotes.bothGuilty
      ? "원고 승"
      : juryVotes.defendantWins > juryVotes.bothGuilty
        ? "피고 승"
        : "쌍방 과실";

  const handleShare = () => setIsCapturing(true);

  const shareKakao = () => {
    if (!window.Kakao) {
      alert("Kakao SDK가 로드되지 않았습니다.");
      return;
    }
    if (!window.Kakao.isInitialized()) {
      const key = import.meta.env.VITE_KAKAO_JS_KEY;
      if (!key) {
        alert("VITE_KAKAO_JS_KEY가 없습니다.");
        return;
      }
      window.Kakao.init(key);
    }

    const title = case_.status.includes('APPEAL') ? `📜 항소심 판결문 도착` : `⚖️ 판결문 도착`;
    const description = `[${case_.plaintiff} vs ${case_.defendant}] 사건의 판결이 선고되었습니다.\n\n` + 
                        `AI 판사와 배심원의 최종 판결을 지금 바로 확인해보세요.`;

    window.Kakao.Link.sendDefault({
      objectType: "feed",
      content: {
        title: title,
        description: description,
        imageUrl: "https://via.placeholder.com/800x400.png?text=Verdict+Result", // Simple, standard placeholder
        link: {
          mobileWebUrl: window.location.href,
          webUrl: window.location.href,
        },
      },
      buttons: [
        {
          title: "판결문 확인하기",
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href,
          },
        },
      ],
    });
  };

  return (
    <div
      ref={captureRef}
      className="min-h-screen bg-gradient-to-b from-[var(--color-court-dark)] to-[#05050a] pb-12 px-6 relative z-10"
      style={{ paddingTop: '150px' }}
    >
      <div className="max-w-5xl mx-auto px-6">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[var(--color-gold-dark)] to-[var(--color-gold-primary)] rounded-full flex items-center justify-center border-4 border-[var(--color-gold-accent)] court-seal">
              <Gavel className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl mb-4">{case_.status === 'APPEAL_VERDICT_READY' ? "항소심 판결문" : "판결문"}</h1>
          <p className="text-xl text-[var(--color-gold-primary)]">
            {case_.caseNumber}
          </p>
        </div>

        {/* 사건 정보 */}
        <div className="official-document rounded-2xl p-8 mb-8">
          <h2 className="text-2xl mb-6">{case_.title}</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="p-4 bg-purple-900 bg-opacity-20 border-l-4 border-purple-600 rounded-r-lg">
              <p className="text-sm text-purple-400 mb-1">원고</p>
              <p className="text-lg font-bold text-white">{case_.plaintiff}</p>
            </div>
            <div className="p-4 bg-orange-900 bg-opacity-20 border-l-4 border-orange-600 rounded-r-lg">
              <p className="text-sm text-orange-400 mb-1">피고</p>
              <p className="text-lg font-bold text-white">{case_.defendant}</p>
            </div>
          </div>

          <div className="p-4 bg-[var(--color-court-dark)] bg-opacity-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">적용 법률</p>
            {law ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex-shrink-0">
                  <img src={law.icon} alt={law.title} className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="font-bold text-[var(--color-gold-accent)]">
                    {law.title}
                  </p>
                  <p className="text-xs text-gray-400">{law.description}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">법률 정보: {case_.lawType || '정보 없음'}</p>
            )}
          </div>
        </div>

        {case_.status === 'APPEAL_VERDICT_READY' && case_.appeal && (
          <div className="official-document rounded-2xl p-8 mb-8">
            <h2 className="text-2xl mb-6">항소심 주장 요약</h2>
            {case_.appeal.reason && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-purple-400 mb-2">항소 이유 ({case_.appeal.requester === 'plaintiff' ? '원고' : '피고'})</h3>
                <div className="p-4 bg-purple-900 bg-opacity-20 rounded-lg border-l-4 border-purple-600">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{case_.appeal.reason}</p>
                </div>
              </div>
            )}
            {case_.appeal.defenseContent && (
              <div>
                <h3 className="text-lg font-semibold text-orange-400 mb-2">반론 ({case_.appeal.requester === 'plaintiff' ? '피고' : '원고'})</h3>
                <div className="p-4 bg-orange-900 bg-opacity-20 rounded-lg border-l-4 border-orange-600">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{case_.appeal.defenseContent}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 과실 비율 */}
        <div className="official-document rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="w-8 h-8 text-[var(--color-gold-accent)]" />
            <h2 className="text-2xl">과실 비율 판정</h2>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-purple-400">
                  원고: {case_.plaintiff}
                </span>
                <span className="text-3xl font-bold text-purple-400">
                  {verdict.plaintiffFault}%
                </span>
              </div>

              {/* ✅ 색상 안 뜨는 문제 방지: 인라인 linear-gradient */}
              <div className="relative h-12 bg-[var(--color-court-dark)] rounded-lg overflow-hidden">
                <div
                  className="h-full transition-all duration-1000"
                  style={{
                    width: `${verdict.plaintiffFault}%`,
                    background:
                      "linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)",
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-orange-400">
                  피고: {case_.defendant}
                </span>
                <span className="text-3xl font-bold text-orange-400">
                  {verdict.defendantFault}%
                </span>
              </div>

              {/* ✅ 색상 안 뜨는 문제 방지: 인라인 linear-gradient */}
              <div className="relative h-12 bg-[var(--color-court-dark)] rounded-lg overflow-hidden">
                <div
                  className="h-full transition-all duration-1000"
                  style={{
                    width: `${verdict.defendantFault}%`,
                    background:
                      "linear-gradient(90deg, #ea580c 0%, #fb923c 100%)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* 판결 요지 */}
          <div className="mt-8 p-6 bg-[var(--color-court-dark)] bg-opacity-50 border-2 border-[var(--color-gold-dark)] rounded-lg">
            <h3 className="text-lg font-bold text-[var(--color-gold-accent)] mb-4">
              판결 요지
            </h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {verdict.reasoning}
            </p>
          </div>
        </div>

        {/* AI vs 배심원 */}
        {case_.juryEnabled && (
          <div className="official-document rounded-2xl p-8 mb-8">
            <h2 className="text-2xl mb-6">AI 판사 vs 배심원 여론</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-gradient-to-br from-[var(--color-gold-dark)] from-opacity-20 to-transparent rounded-lg border-2 border-[var(--color-gold-dark)]">
                <div className="flex items-center gap-3 mb-4">
                  <Gavel className="w-6 h-6 text-[var(--color-gold-accent)]" />
                  <h3 className="text-lg font-bold text-[var(--color-gold-accent)]">
                    AI 판사의 판결
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">원고 과실</span>
                    <span className="text-xl font-bold text-purple-400">
                      {verdict.plaintiffFault}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">피고 과실</span>
                    <span className="text-xl font-bold text-orange-400">
                      {verdict.defendantFault}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 pt-3 border-t border-[var(--color-court-border)]">
                    논리적 분석과 증거 기반 판결
                  </p>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-purple-900 from-opacity-20 to-transparent rounded-lg border-2 border-purple-700">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">👥</span>
                  <div>
                    <h3 className="text-lg font-bold text-purple-400">
                      배심원 여론
                    </h3>
                    <p className="text-xs text-purple-300">
                      {case_.juryMode === "invite"
                        ? "초대된 배심원"
                        : "랜덤 배심원"}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">원고 승</span>
                    <span className="text-lg font-bold text-purple-400">
                      {juryVotes.plaintiffWins}표
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">피고 승</span>
                    <span className="text-lg font-bold text-orange-400">
                      {juryVotes.defendantWins}표
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">쌍방 과실</span>
                    <span className="text-lg font-bold text-purple-400">
                      {juryVotes.bothGuilty}표
                    </span>
                  </div>
                  <p className="text-sm text-purple-300 pt-3 border-t border-purple-800">
                    👑 여론: <strong>{juryMajority}</strong> ({totalJuryVotes}명
                    참여)
                  </p>
                </div>
              </div>
            </div>

            {verdict.plaintiffFault !== verdict.defendantFault &&
              totalJuryVotes > 0 && (
                <div className="mt-6 p-4 bg-yellow-900 bg-opacity-20 border border-yellow-700 rounded-lg">
                  <p className="text-sm text-yellow-200 text-center">
                    {Math.abs(
                      ((verdict.defendantFault > verdict.plaintiffFault
                        ? juryVotes.defendantWins
                        : juryVotes.plaintiffWins) /
                        totalJuryVotes) *
                        100 -
                        Math.max(
                          verdict.defendantFault,
                          verdict.plaintiffFault,
                        ),
                    ) < 20
                      ? "✅ AI 판결과 배심원 여론이 일치합니다!"
                      : "⚠️ AI 판결과 배심원 여론에 차이가 있습니다. 항소를 고려해보세요."}
                  </p>
                </div>
              )}
          </div>
        )}

        {/* 벌칙 선택 */}
        <div className="official-document rounded-2xl p-8 mb-8">
          <h2 className="text-2xl mb-6">벌칙 선택</h2>
          <p className="text-gray-400 mb-6">
            과실이 더 큰{" "}
            <strong className="text-orange-400">{case_.defendant}</strong>는
            아래 벌칙 중 하나를 선택하여 이행해야 합니다.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <PenaltyButton
              type="serious"
              title="진지한 벌칙"
              icon={<Scale className="w-8 h-8" />}
              penaltyText={getSeriousPenalty()}
              penaltyTypeSelected={penaltyTypeSelected}
              confirmedPenalty={confirmedPenalty}
              onSelectType={setPenaltyTypeSelected}
              onConfirm={handleConfirmPenalty}
            />
            <PenaltyButton
              type="funny"
              title="재미있는 벌칙"
              icon={<span className="text-3xl">😄</span>}
              penaltyText={getFunnyPenalty()}
              penaltyTypeSelected={penaltyTypeSelected}
              confirmedPenalty={confirmedPenalty}
              onSelectType={setPenaltyTypeSelected}
              onConfirm={handleConfirmPenalty}
            />
          </div>
        </div>

        {/* 액션 버튼 (캡처 중엔 숨김) */}
        {!isCapturing && (
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={handleShare}
              className="px-8 py-4 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold-primary)] text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-3"
            >
              <Share2 className="w-6 h-6" />
              이미지로 저장
            </button>
            <button
              onClick={shareKakao}
              className="px-8 py-4 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              카카오톡 공유
            </button>
            {/* 항소 중이거나 완료된 상태가 아닐 때만 항소 버튼 표시 (VERDICT_COMPLETED 상태일 때만 표시) */}
            {/* 항소 중이거나 완료된 상태가 아닐 때만 항소 버튼 표시 (VERDICT_COMPLETED 상태이고 항소 이력이 없을 때만 표시) */}
            {!case_.status.includes('APPEAL') && (!case_.appealStatus || case_.appealStatus === 'NONE') && (
              <button
                onClick={() => setShowAppealForm(true)}
                className="px-8 py-4 border-2 border-orange-600 text-orange-400 font-bold rounded-xl hover:bg-orange-900 hover:bg-opacity-20 transition-all flex items-center justify-center gap-3"
              >
                <AlertTriangle className="w-6 h-6" />
                항소하기 (1회 가능)
              </button>
            )}
          </div>
        )}

        {/* 공식 인장 */}
        <div className="mt-12 text-center">
          <div className="inline-flex w-32 h-32 rounded-full border-4 border-[var(--color-gold-dark)] bg-gradient-to-br from-[var(--color-gold-dark)] to-[var(--color-gold-primary)] items-center justify-center mb-4 court-seal">
            <Scale className="w-16 h-16 text-white" />
          </div>
          <p className="text-sm text-gray-500">고소미 대법원 공식 판결</p>
          <p className="text-xs text-gray-600 mt-1">
            AI JUSTICE | {new Date().toLocaleDateString("ko-KR")}
          </p>
        </div>

        {/* 항소 폼 모달 */}
        {showAppealForm && (
          <AppealModal
            onClose={() => setShowAppealForm(false)}
            onSubmit={() => onAppeal?.(appellant)}
          />
        )}
      </div>
    </div>
  );
}

interface PenaltyButtonProps {
  type: "serious" | "funny";
  title: string;
  icon: React.ReactNode;
  penaltyText: string;
  penaltyTypeSelected: "serious" | "funny" | null;
  confirmedPenalty: "serious" | "funny" | null;
  onSelectType: (type: "serious" | "funny") => void;
  onConfirm: (type: "serious" | "funny") => void;
}

function PenaltyButton({
  type,
  title,
  icon,
  penaltyText,
  penaltyTypeSelected,
  confirmedPenalty,
  onSelectType,
  onConfirm,
}: PenaltyButtonProps) {
  const isSelected = penaltyTypeSelected === type;
  const isConfirmed = confirmedPenalty === type;
  const isDisabled = confirmedPenalty !== null && !isConfirmed;

  const color = type === 'serious' ? 'orange' : 'purple';
  const selectedClass = `border-${color}-500 bg-${color}-900 bg-opacity-30 scale-105`;
  const defaultClass = `border-${color}-700 border-opacity-30 bg-${color}-900 bg-opacity-10 hover:bg-opacity-20`;

  return (
    <div
      className={`p-6 rounded-xl border-2 transition-all text-left ${
        isSelected || isConfirmed ? selectedClass : defaultClass
      } ${isDisabled ? "opacity-50" : ""}`}
    >
      <button
        onClick={() => onSelectType(type)}
        disabled={confirmedPenalty !== null}
        className="w-full"
      >
        <div className="flex items-center gap-3 mb-4">
          {icon}
          <h3 className={`text-xl font-bold text-${color}-400`}>{title}</h3>
        </div>
      </button>

      {(isSelected || isConfirmed) && (
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed mb-4">{penaltyText}</p>
          <div className="pt-4 border-t border-gray-700">
            {isConfirmed ? (
              <p className={`text-sm text-${color}-300`}>
                ✓ 이 벌칙으로 확정되었습니다
              </p>
            ) : (
              <button
                onClick={() => onConfirm(type)}
                className={`w-full px-4 py-2 rounded-lg bg-${color}-600 text-white font-bold hover:bg-${color}-500 transition-colors`}
              >
                확정 짓기
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface AppealModalProps {
  onClose: () => void;
  onSubmit: () => void;
}

function AppealModal({ onClose, onSubmit }: AppealModalProps) {
  const [reason, setReason] = useState("");
  const [newEvidence, setNewEvidence] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachedFiles(e.target.files);
  };

  const handleSubmit = () => {
    if (reason.trim() && newEvidence.trim()) {
      onSubmit();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="official-document rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 bg-[#1a1a2e] border-b-2 border-[var(--color-gold-dark)] p-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-orange-400" />
              <h2 className="text-2xl">항소장 작성</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--color-court-border)] rounded-lg transition-colors"
            >
              <span className="text-2xl text-gray-400">×</span>
            </button>
          </div>
        
        <div className="p-8 space-y-6">
          <div className="p-4 bg-orange-900 bg-opacity-20 border border-orange-700 rounded-lg">
            <p className="text-sm text-orange-200">
              ⚠️ <strong>항소는 1회만 가능합니다.</strong> 추가 증거가 반드시
              필요하며, 정당한 사유 없이는 기각될 수 있습니다.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-gold-primary)] mb-2">
              항소 사유 *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="판결이 부당하다고 생각하는 이유를 상세히 작성하세요"
              rows={5}
              className="w-full px-4 py-3 bg-[var(--color-court-dark)] border-2 border-[var(--color-court-border)] rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-gold-primary)] mb-2">
              추가 증거 *
            </label>
            <textarea
              value={newEvidence}
              onChange={(e) => setNewEvidence(e.target.value)}
              placeholder="1심에서 제출하지 못한 새로운 증거를 제출하세요"
              rows={5}
              className="w-full px-4 py-3 bg-[var(--color-court-dark)] border-2 border-[var(--color-court-border)] rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-gold-primary)] mb-2">
              증거 파일 첨부
            </label>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-court-dark)] border-2 border-dashed border-[var(--color-court-border)] rounded-lg text-gray-400 hover:border-orange-500 hover:text-orange-400 transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span>파일 선택</span>
            </button>

            {attachedFiles && attachedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-semibold text-gray-300">
                  첨부된 파일:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                  {Array.from(attachedFiles).map((file, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-gray-500" />
                      <span>
                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-[var(--color-court-border)] rounded-lg text-gray-300 hover:border-[var(--color-gold-dark)] transition-all"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!reason.trim() || !newEvidence.trim()}
              className={`flex-1 px-6 py-3 rounded-lg font-bold transition-all ${
                reason.trim() && newEvidence.trim()
                  ? "bg-gradient-to-r from-orange-700 to-orange-600 text-white hover:shadow-lg"
                  : "bg-gray-700 text-gray-500 cursor-not-allowed"
              }`}
            >
              항소 접수
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
