import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, ThumbsUp, ThumbsDown, Scale, TrendingUp } from 'lucide-react';
import { Case, LAWS } from '@/types/court';

interface JuryVotingPageProps {
  case_: Case;
  onVote?: (vote: 'plaintiff' | 'defendant' | 'both') => void;
}

export function JuryVotingPage({ case_, onVote }: JuryVotingPageProps) {
  const [selectedVote, setSelectedVote] = useState<'plaintiff' | 'defendant' | 'both' | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [showLawModal, setShowLawModal] = useState(false);

  useEffect(() => {
    // Check for server-provided vote status
    // @ts-ignore - userVote added to backend response but maybe not in Case type yet
    const userVote = case_.userVote;
    if (userVote && userVote.hasVoted) {
      setHasVoted(true);
      if (userVote.vote === 'PLAINTIFF') setSelectedVote('plaintiff');
      else if (userVote.vote === 'DEFENDANT') setSelectedVote('defendant');
      else if (userVote.vote === 'BOTH') setSelectedVote('both');
    }
  }, [case_]);

  const law = LAWS.find(l => l.id === case_.lawType);

  // Check if both parties have submitted their statements
  const bothPartiesSubmitted = case_.content && case_.defendantResponse;

  // 투표 데이터 (실제로는 서버에서)
  const votes = case_.juryVotes || {
    plaintiffWins: 0,
    defendantWins: 0,
    bothGuilty: 0,
    totalJurors: 0,
  };

  const totalVotes = votes.plaintiffWins + votes.defendantWins + votes.bothGuilty;

  const handleVote = (vote: 'plaintiff' | 'defendant' | 'both') => {
    setSelectedVote(vote);
    setHasVoted(true);
    if (onVote) {
      onVote(vote);
    }
  };

  // 배심원 투표가 비활성화된 경우
  if (!case_.juryEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--color-court-dark)] to-[#05050a] py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="official-document rounded-2xl p-12 text-center">
            <div className="text-6xl mb-6 opacity-30">👥</div>
            <h2 className="text-3xl mb-4">배심원 투표 미진행</h2>
            <p className="text-gray-400">
              이 사건은 배심원 투표 없이 AI 판사의 판결만으로 진행됩니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 양측 모두 입장을 제출하지 않은 경우
  if (!bothPartiesSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--color-court-dark)] to-[#05050a] pb-12 px-6 relative z-10" style={{ paddingTop: '150px' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <Users className="w-10 h-10 text-purple-400" />
              <h1 className="text-4xl">배심원 광장</h1>
            </div>
          </div>

          <div className="official-document rounded-2xl p-12 text-center">
            <div className="text-6xl mb-6 opacity-30">⏳</div>
            <h2 className="text-3xl mb-4">양측 입장 작성 대기 중</h2>
            <p className="text-gray-400 mb-6">
              원고와 피고가 모두 입장을 작성해야 배심원 투표가 시작됩니다.
            </p>
            <div className="flex justify-center gap-8 mt-8">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${case_.content ? 'bg-green-500' : 'bg-gray-600'}`} />
                <span className="text-sm text-gray-400">원고 입장 {case_.content ? '✓' : '대기 중'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${case_.defendantResponse ? 'bg-green-500' : 'bg-gray-600'}`} />
                <span className="text-sm text-gray-400">피고 입장 {case_.defendantResponse ? '✓' : '대기 중'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 투표 완료 화면
  if (hasVoted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--color-court-dark)] to-[#05050a] pb-12 px-6 relative z-10 flex items-center justify-center" style={{ paddingTop: '150px' }}>
        <div className="max-w-2xl w-full text-center">
          <div className="official-document rounded-2xl p-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center animate-bounce">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
              투표 완료!
            </h1>

            <p className="text-xl text-gray-300 mb-6">
              배심원 참여가 성공적으로 완료되었습니다.
            </p>

            <div className="bg-[var(--color-court-dark)] bg-opacity-50 rounded-xl p-6 mb-8">
              <p className="text-lg font-semibold text-green-400 mb-3">
                당신의 선택: {selectedVote === 'plaintiff' ? '원고 승' : selectedVote === 'defendant' ? '피고 승' : '쌍방 과실'}
              </p>
              <p className="text-sm text-gray-400">
                당신의 의견이 최종 판결에 반영됩니다.<br />
                AI 판사가 모든 증거와 배심원 의견을 종합하여 판결을 내릴 것입니다.
              </p>
            </div>

            <div className="bg-purple-900 bg-opacity-20 border border-purple-700 rounded-xl p-6 mb-6">
              <p className="text-purple-200 text-sm">
                💡 <strong>다음 단계</strong><br />
                원고 또는 피고가 "판결 요청" 버튼을 누르면<br />
                AI 판사의 최종 판결이 선고됩니다.
              </p>
            </div>

            <button
              onClick={() => window.location.href = '/'}
              className="px-8 py-4 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold-primary)] text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              로비로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--color-court-dark)] to-[#05050a] pb-12 px-6 relative z-10" style={{ paddingTop: '150px' }}>
      <div className="max-w-5xl mx-auto px-6">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Users className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl">배심원 광장</h1>
          </div>
          <p className="text-xl text-gray-400">
            여러분의 판단을 들려주세요. 누가 더 잘못했을까요?
          </p>
          <div className="mt-4 inline-block px-6 py-3 bg-purple-900 bg-opacity-30 border-2 border-purple-700 rounded-lg">
            <p className="text-sm text-purple-300">
              {votes.totalJurors > 0 ? (
                totalVotes >= votes.totalJurors ? (
                  <>✅ 모든 배심원이 투표를 완료했습니다! ({totalVotes}/{votes.totalJurors}명)</>
                ) : (
                  <>👥 현재 {totalVotes}/{votes.totalJurors}명의 배심원이 투표했습니다</>
                )
              ) : (
                <>👥 현재 {totalVotes}명의 배심원이 투표했습니다</>
              )}
            </p>
          </div>
        </div>

        {/* 사건 요약 */}
        <div className="official-document rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="w-8 h-8 text-[var(--color-gold-accent)]" />
            <div>
              <h2 className="text-2xl">{case_.title}</h2>
              <p className="text-sm text-gray-400 font-mono">{case_.caseNumber}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* 원고 주장 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-purple-500 rounded-full" />
                <h3 className="text-lg font-bold text-purple-400">원고: {case_.plaintiff}</h3>
              </div>
              <div className="p-4 bg-purple-900 bg-opacity-20 border-l-4 border-purple-600 rounded-r-lg">
                <p className="text-sm text-gray-300 leading-relaxed line-clamp-6">
                  {case_.content}
                </p>
              </div>
              {case_.evidences.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">제출 증거: {case_.evidences.length}건</p>
                  {case_.evidences.filter(e => e.isKeyEvidence).map((evidence) => (
                    <div key={evidence.id} className="p-2 bg-yellow-900 bg-opacity-20 border border-yellow-700 rounded text-xs text-gray-400 mb-1">
                      ⭐ {evidence.content.slice(0, 50)}...
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 피고 반박 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <h3 className="text-lg font-bold text-orange-400">피고: {case_.defendant}</h3>
              </div>
              {case_.defendantResponse ? (
                <>
                  <div className="p-4 bg-orange-900 bg-opacity-20 border-l-4 border-orange-600 rounded-r-lg">
                    <p className="text-sm text-gray-300 leading-relaxed line-clamp-6">
                      {case_.defendantResponse.statement}
                    </p>
                  </div>
                  {case_.defendantResponse.evidences.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">반박 증거: {case_.defendantResponse.evidences.length}건</p>
                      {case_.defendantResponse.evidences.filter(e => e.isKeyEvidence).map((evidence) => (
                        <div key={evidence.id} className="p-2 bg-yellow-900 bg-opacity-20 border border-yellow-700 rounded text-xs text-gray-400 mb-1">
                          ⭐ {evidence.content.slice(0, 50)}...
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 bg-gray-800 bg-opacity-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">변론 대기 중...</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[var(--color-court-border)]">
            <button
              onClick={() => setShowLawModal(true)}
              className="flex items-center gap-3 w-full hover:bg-[var(--color-court-gray)] p-3 rounded-lg transition-colors cursor-pointer"
            >
              {law?.icon && (
                <img src={law.icon} alt={law.title} className="w-12 h-12 object-contain" />
              )}
              <div className="text-left">
                <p className="text-sm text-gray-500">적용 법률 (클릭하여 조항 보기)</p>
                <p className="font-bold text-[var(--color-gold-accent)]">{law?.title}</p>
                <p className="text-xs text-gray-400 mt-1">{law?.description}</p>
              </div>
            </button>
          </div>
        </div>

        {/* 투표 섹션 */}
        {!hasVoted ? (
          <div className="official-document rounded-2xl p-8">
            <h2 className="text-2xl mb-6 text-center">여러분의 판단은?</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <VoteButton
                icon={<ThumbsUp className="w-8 h-8" />}
                label="원고 승"
                description="원고가 옳다"
                color="purple"
                selected={selectedVote === 'plaintiff'}
                onClick={() => handleVote('plaintiff')}
              />
              <VoteButton
                icon={<ThumbsDown className="w-8 h-8" />}
                label="피고 승"
                description="피고가 옳다"
                color="orange"
                selected={selectedVote === 'defendant'}
                onClick={() => handleVote('defendant')}
              />

            </div>
          </div>
        ) : (
          <div className="official-document rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="inline-block w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
                <ThumbsUp className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl mb-2">투표가 완료되었습니다!</h2>
              <p className="text-gray-400">배심원 여론을 확인해보세요</p>
            </div>

            {/* 투표 결과 */}
            <VoteResults votes={votes} totalVotes={totalVotes} />
          </div>
        )}

        {/* 안내 */}
        <div className="mt-8 p-6 bg-purple-900 bg-opacity-20 border border-purple-700 border-opacity-30 rounded-lg">
          <div className="flex gap-3">
            <TrendingUp className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-purple-200">
              <p className="font-semibold mb-2">배심원 투표에 대하여</p>
              <ul className="space-y-1 text-xs">
                <li>• 배심원 투표는 <strong>참고용</strong>입니다. 최종 판결은 AI 판사가 내립니다.</li>
                <li>• 판결 화면에서 "AI 판사의 판결 vs 배심원 여론"을 비교할 수 있습니다.</li>
                <li>• 링크를 공유하여 더 많은 친구들의 의견을 들어보세요!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Law Details Modal */}
        {showLawModal && law && createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowLawModal(false)}
          >
            <div
              className="bg-[var(--color-court-gray)] border-2 border-[var(--color-gold-accent)] rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-8 relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-[var(--color-court-gray)] z-10 pb-4 border-b border-[var(--color-court-border)]">
                <div className="flex items-center gap-3">
                  {law.icon && (
                    <img src={law.icon} alt={law.title} className="w-16 h-16 object-contain" />
                  )}
                  <div>
                    <h2 className="text-3xl font-bold text-[var(--color-gold-accent)]">{law.title}</h2>
                    <p className="text-sm text-gray-400 mt-1">{law.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLawModal(false)}
                  className="text-gray-400 hover:text-white text-2xl font-bold p-2"
                >
                  ×
                </button>
              </div>

              <div className="pt-2">
                <h3 className="text-xl font-bold text-white mb-4">법률 조항</h3>
                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {law.content || '조항 정보가 없습니다.'}
                </div>
              </div>

              <div className="mt-8 flex justify-end sticky bottom-0 bg-[var(--color-court-gray)] pt-4 border-t border-[var(--color-court-border)]">
                <button
                  onClick={() => setShowLawModal(false)}
                  className="px-6 py-2 bg-[var(--color-gold-primary)] hover:bg-[var(--color-gold-dark)] text-black font-bold rounded-lg transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}

interface VoteButtonProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  color: 'purple' | 'orange' | 'gray';
  selected: boolean;
  onClick: () => void;
}

function VoteButton({ icon, label, description, color, selected, onClick }: VoteButtonProps) {
  const colorClasses = {
    purple: {
      border: 'border-purple-600',
      bg: 'bg-purple-900 bg-opacity-30',
      hover: 'hover:bg-purple-900 hover:bg-opacity-50',
      selected: 'bg-purple-700 border-purple-500',
    },
    orange: {
      border: 'border-orange-600',
      bg: 'bg-orange-900 bg-opacity-30',
      hover: 'hover:bg-orange-900 hover:bg-opacity-50',
      selected: 'bg-orange-700 border-orange-500',
    },
    // Keep a neutral one if needed, or re-purpose purple map if already exists.
    // But original code had "purple" as the third option for "both guilty". 
    // We should rename the keys to match what we pass in props.
    // Actually, "purple" was already there. Let's make "blue" -> "purple", "red" -> "orange".
    // And "purple" (both guilty) might conflict if we use "purple" for Plaintiff.
    // Let's check VoteButtonProps. It accepts 'blue' | 'red' | 'purple'.
    // We should change the allowed colors in props too.
    gray: {
      border: 'border-gray-600',
      bg: 'bg-gray-900 bg-opacity-30',
      hover: 'hover:bg-gray-900 hover:bg-opacity-50',
      selected: 'bg-gray-700 border-gray-500',
    }
  };

  const classes = colorClasses[color];

  return (
    <button
      onClick={onClick}
      className={`p-8 rounded-xl border-2 transition-all ${selected ? classes.selected : `${classes.border} ${classes.bg} ${classes.hover}`
        } ${selected ? 'scale-105' : 'hover:scale-105'}`}
    >
      <div className="text-white mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{label}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </button>
  );
}

interface VoteResultsProps {
  votes: {
    plaintiffWins: number;
    defendantWins: number;
    bothGuilty: number;
  };
  totalVotes: number;
}

function VoteResults({ votes, totalVotes }: VoteResultsProps) {
  const getPercentage = (count: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((count / totalVotes) * 100);
  };

  const results = [
    { label: '원고 승', count: votes.plaintiffWins, color: 'bg-purple-600', borderColor: 'border-purple-600' },
    { label: '피고 승', count: votes.defendantWins, color: 'bg-orange-600', borderColor: 'border-orange-600' },
    { label: '쌍방 과실', count: votes.bothGuilty, color: 'bg-gray-600', borderColor: 'border-gray-600' },
  ];

  const maxVotes = Math.max(votes.plaintiffWins, votes.defendantWins, votes.bothGuilty);

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-[var(--color-gold-accent)] mb-4">배심원 여론</h3>
      {results.map((result) => (
        <div key={result.label}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">{result.label}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">{result.count}표</span>
              <span className="text-lg font-bold text-white w-12 text-right">
                {getPercentage(result.count)}%
              </span>
            </div>
          </div>
          <div className="relative h-8 bg-[var(--color-court-dark)] rounded-lg overflow-hidden border-2 border-[var(--color-court-border)]">
            <div
              className={`h-full ${result.color} transition-all duration-500 flex items-center px-3`}
              style={{ width: `${getPercentage(result.count)}%` }}
            >
              {result.count === maxVotes && result.count > 0 && (
                <span className="text-xs font-bold text-white">👑 최다득표</span>
              )}
            </div>
          </div>
        </div>
      ))}
      <div className="pt-4 border-t border-[var(--color-court-border)] text-center">
        <p className="text-sm text-gray-500">
          총 <span className="text-[var(--color-gold-accent)] font-bold">{totalVotes}명</span>의 배심원이 투표했습니다
        </p>
      </div>
    </div>
  );
}