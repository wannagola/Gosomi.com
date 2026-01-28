import { Case, LAWS } from '@/types/court';
import { User } from '@/types/user';
import { Clock, Gavel, Loader } from 'lucide-react';
import { useState } from 'react';
import dapDapGif from '@/assets/답답해.gif';

interface WaitingPageProps {
  case_: Case;
  currentUser: User | null;
  onRequestVerdict?: () => void;
  hasVerdict?: boolean;
}

export function WaitingPage({ case_, currentUser, onRequestVerdict, hasVerdict }: WaitingPageProps) {
  const [requesting, setRequesting] = useState(false);
  const law = LAWS.find(l => l.id === case_.lawType);

  const isPlaintiff = currentUser?.id === case_.plaintiffId;
  const isDefendant = currentUser?.id === case_.defendantId;
  const isLitigant = isPlaintiff || isDefendant;

  const handleRequestVerdict = async () => {
    if (!onRequestVerdict) return;

    // Check if jury voting is enabled and if all jurors have voted
    if (case_.juryEnabled) {
      const juryVotes = case_.juryVotes || { plaintiffWins: 0, defendantWins: 0, bothGuilty: 0, totalJurors: 0 };
      const totalVotes = juryVotes.plaintiffWins + juryVotes.defendantWins + juryVotes.bothGuilty;
      const totalJurors = juryVotes.totalJurors || 0;

      if (totalJurors > 0 && totalVotes < totalJurors) {
        alert(`아직 모든 배심원이 투표하지 않았습니다. (${totalVotes}/${totalJurors}명 투표 완료)`);
        return;
      }

      if (!window.confirm("판결을 요청하시겠습니까? 배심원 투표가 완료되었습니다.")) return;
    } else {
      if (!window.confirm("판결을 요청하시겠습니까?")) return;
    }

    setRequesting(true);
    await onRequestVerdict();
    setRequesting(false);
  };

  const isDefenseSubmitted = case_.status === 'DEFENSE_SUBMITTED' || !!case_.defendantResponse;

  return (
    <div className="min-h-screen bg-[#05050a] text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="w-40 h-40 mx-auto flex items-center justify-center">
          <img src={dapDapGif} alt="답답해" className="w-full h-full object-contain" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {hasVerdict
              ? "판결 완료 (처벌 선택 대기 중)"
              : isDefenseSubmitted
                ? (case_.juryEnabled ? "재판 진행 중 (배심원 투표)" : "재판 진행 중")
                : "피고인의 답변을 기다리는 중입니다"}
          </h1>
          <p className="text-gray-400 text-lg">
            {hasVerdict ? (
              <>
                AI 판사의 판결이 완료되었습니다.<br />
                피고인이 <strong className="text-white">최종 처벌을 선택</strong>하고 있습니다.<br />
                선택이 완료되면 판결문이 공개됩니다.
              </>
            ) : isDefenseSubmitted ? (
              case_.juryEnabled ? (
                <>
                  피고인이 답변을 제출하여 재판이 진행 중입니다.<br />
                  배심원들이 투표를 진행하고 있습니다.
                </>
              ) : (
                <>
                  피고인이 답변을 제출하여 재판이 진행 중입니다.<br />
                  원하는 시점에 AI 판사의 판결을 요청할 수 있습니다.
                </>
              )
            ) : (
              <>
                사건이 성공적으로 접수되었습니다.<br />
                피고인 <strong>{case_.defendant}</strong>님이 변론서를 제출하면<br />
                AI 판사의 판결이 시작됩니다.
              </>
            )}
          </p>
        </div>

        {/* Action Button for Litigants when Defense Submitted (Only if no verdict yet) */}
        {!hasVerdict && isDefenseSubmitted && isLitigant && (
          <div className="bg-[var(--color-court-dark)] border border-[var(--color-gold-dark)] rounded-xl p-8 max-w-lg mx-auto animate-fade-in-up">
            <h3 className="text-xl font-bold text-[var(--color-gold-accent)] mb-4">판결 요청</h3>
            <p className="text-gray-400 mb-6 text-sm">
              피고인의 답변서가 제출되었습니다.<br />
              {case_.juryEnabled ? (
                <>
                  배심원 투표가 진행 중이며, 모든 배심원이 투표하면<br />
                </>
              ) : (
                <>
                  원하는 시점에<br />
                </>
              )}
              <strong className="text-white">AI 판사의 최종 판결</strong>을 요청할 수 있습니다.
            </p>

            <button
              onClick={handleRequestVerdict}
              disabled={requesting}
              className="w-full px-6 py-4 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold-primary)] 
                             text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] 
                             transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {requesting ? <Loader className="w-6 h-6 animate-spin" /> : <Gavel className="w-6 h-6" />}
              {requesting ? "판결 생성 중..." : "판결 요청하기"}
            </button>
          </div>
        )}

        {/* 적용 법률 */}
        {law && (
          <div className="bg-[var(--color-court-dark)] border border-[var(--color-gold-dark)] border-opacity-30 rounded-xl p-6 max-w-lg mx-auto">
            <h3 className="text-lg font-semibold text-[var(--color-gold-primary)] mb-4">적용 법률</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 flex-shrink-0">
                <img src={law.icon} alt={law.title} className="w-full h-full object-contain" />
              </div>
              <div className="text-left">
                <p className="font-bold text-xl text-[var(--color-gold-accent)]">{law.title}</p>
                <p className="text-sm text-gray-400 mt-1">{law.description}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-[var(--color-court-dark)] border border-[var(--color-court-border)] rounded-xl p-6 max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-4">
            <span className="text-gray-400">사건 번호</span>
            <span className="font-mono text-[var(--color-gold-accent)]">{case_.caseNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-500">
              <Clock className="w-5 h-5" />
              <span>{isDefenseSubmitted ? "진행 중" : "답변 대기 중"}</span>
            </div>
            {/* Optional: Add a nudge button if we had API for it */}
          </div>
        </div>

        <div className="pt-8">
          <button
            className="px-6 py-3 bg-[var(--color-court-light)] border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            onClick={() => window.location.href = '/'}
          >
            로비로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
