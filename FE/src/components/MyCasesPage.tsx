import { useState } from 'react';
import { FileText, Clock, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { Case, CaseStatus, LAWS } from '@/types/court';

interface MyCasesPageProps {
  cases: Case[];
  onViewCase: (caseId: string) => void;
}

export function MyCasesPage({ cases, onViewCase }: MyCasesPageProps) {
  const [filter, setFilter] = useState<'all' | CaseStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCases = cases.filter(case_ => {
    const matchesFilter = filter === 'all' || case_.status === filter;
    const matchesSearch = 
      case_.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.plaintiff.toLowerCase().includes(searchQuery.toLowerCase()) ||
      case_.defendant.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusStats = {
    all: cases.length,
    summoned: cases.filter(c => c.status === 'summoned').length,
    'in-defense': cases.filter(c => c.status === 'in-defense').length,
    'awaiting-verdict': cases.filter(c => c.status === 'awaiting-verdict').length,
    sentenced: cases.filter(c => c.status === 'sentenced').length,
    appealed: cases.filter(c => c.status === 'appealed').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--color-court-dark)] to-[#05050a] py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-10 h-10 text-[var(--color-gold-accent)]" />
            <h1 className="text-4xl">내 사건 목록</h1>
          </div>
          <p className="text-gray-400">
            참여 중인 모든 사건을 확인하고 관리할 수 있습니다.
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            label="전체"
            count={statusStats.all}
            color="gray"
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <StatCard
            label="소환됨"
            count={statusStats.summoned}
            color="purple"
            active={filter === 'summoned'}
            onClick={() => setFilter('summoned')}
          />
          <StatCard
            label="변론 중"
            count={statusStats['in-defense']}
            color="yellow"
            active={filter === 'in-defense'}
            onClick={() => setFilter('in-defense')}
          />
          <StatCard
            label="판결 대기"
            count={statusStats['awaiting-verdict']}
            color="orange"
            active={filter === 'awaiting-verdict'}
            onClick={() => setFilter('awaiting-verdict')}
          />
          <StatCard
            label="선고 완료"
            count={statusStats.sentenced}
            color="green"
            active={filter === 'sentenced'}
            onClick={() => setFilter('sentenced')}
          />
          <StatCard
            label="항소됨"
            count={statusStats.appealed}
            color="red"
            active={filter === 'appealed'}
            onClick={() => setFilter('appealed')}
          />
        </div>

        {/* 검색 */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="사건 번호, 제목, 당사자명으로 검색..."
              className="w-full pl-12 pr-4 py-3 bg-[var(--color-court-gray)] border-2 border-[var(--color-court-border)] rounded-lg text-white placeholder-gray-500 focus:border-[var(--color-gold-primary)] focus:outline-none"
            />
          </div>
        </div>

        {/* 사건 목록 */}
        <div className="space-y-4">
          {filteredCases.length === 0 ? (
            <div className="official-document rounded-2xl p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-xl text-gray-500 mb-2">사건이 없습니다</p>
              <p className="text-sm text-gray-600">
                {searchQuery ? '검색 조건에 맞는 사건이 없습니다.' : '새로운 사건을 접수해보세요.'}
              </p>
            </div>
          ) : (
            filteredCases.map((case_) => (
              <CaseListItem key={case_.id} case_={case_} onView={onViewCase} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  count: number;
  color: 'gray' | 'purple' | 'yellow' | 'orange' | 'green' | 'red';
  active: boolean;
  onClick: () => void;
}

function StatCard({ label, count, color, active, onClick }: StatCardProps) {
  const colorClasses = {
    gray: 'border-gray-600 bg-gray-900',
    purple: 'border-purple-600 bg-purple-900',
    yellow: 'border-yellow-600 bg-yellow-900',
    orange: 'border-orange-600 bg-orange-900',
    green: 'border-green-600 bg-green-900',
    red: 'border-red-600 bg-red-900',
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 transition-all ${
        active
          ? `${colorClasses[color]} bg-opacity-30 scale-105`
          : 'border-[var(--color-court-border)] bg-[var(--color-court-gray)] hover:border-[var(--color-gold-dark)]'
      }`}
    >
      <p className="text-2xl font-bold text-white mb-1">{count}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </button>
  );
}

interface CaseListItemProps {
  case_: Case;
  onView: (caseId: string) => void;
}

function CaseListItem({ case_, onView }: CaseListItemProps) {
  const law = LAWS.find(l => l.id === case_.lawType);
  
  const statusConfig = {
    'FILED': { 
      label: '접수 완료', 
      color: 'bg-blue-500',
      icon: <FileText className="w-5 h-5" />,
      textColor: 'text-blue-400'
    },
    'SUMMONED': { 
      label: '소환 완료', 
      color: 'bg-purple-500',
      icon: <AlertCircle className="w-5 h-5" />,
      textColor: 'text-purple-400'
    },
    'DEFENSE_SUBMITTED': { 
      label: '변론 중', 
      color: 'bg-yellow-500',
      icon: <Clock className="w-5 h-5" />,
      textColor: 'text-yellow-400'
    },
    'VERDICT_READY': { 
      label: '판결 대기', 
      color: 'bg-orange-500',
      icon: <Clock className="w-5 h-5" />,
      textColor: 'text-orange-400'
    },
    'COMPLETED': { 
      label: '선고 완료', 
      color: 'bg-green-500',
      icon: <CheckCircle className="w-5 h-5" />,
      textColor: 'text-green-400'
    },
    'EXPIRED': { 
      label: '기한 만료', 
      color: 'bg-gray-500',
      icon: <AlertCircle className="w-5 h-5" />,
      textColor: 'text-gray-400'
    },
    'UNDER_APPEAL': { 
      label: '항소 접수', 
      color: 'bg-red-500',
      icon: <AlertCircle className="w-5 h-5" />,
      textColor: 'text-red-400'
    },
  };

  const status = statusConfig[case_.status] || statusConfig['FILED'];
  const timeSince = getTimeSince(case_.createdAt);

  return (
    <button
      onClick={() => onView(case_.id)}
      className="w-full official-document rounded-xl p-6 hover:scale-[1.02] transition-all group"
    >
      <div className="flex items-start gap-6">
        {/* 아이콘 */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-[var(--color-gold-dark)] bg-opacity-20 rounded-lg flex items-center justify-center text-4xl">
            {law?.icon}
          </div>
        </div>

        {/* 메인 정보 */}
        <div className="flex-1 text-left">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-mono text-[var(--color-gold-primary)] mb-1">
                {case_.caseNumber}
              </p>
              <h3 className="text-xl font-bold text-white group-hover:text-[var(--color-gold-accent)] transition-colors">
                {case_.title}
              </h3>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 ${status.color} bg-opacity-20 rounded-lg border border-current`}>
              <span className={status.textColor}>{status.icon}</span>
              <span className={`${status.textColor} font-bold text-sm`}>{status.label}</span>
            </div>
          </div>

          {/* 당사자 정보 */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">원고:</span>
              <span className="text-sm font-medium text-blue-400">{case_.plaintiff}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">피고:</span>
              <span className="text-sm font-medium text-red-400">{case_.defendant}</span>
            </div>
          </div>

          {/* 법률 및 시간 */}
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <span>{law?.icon}</span>
              <span>{law?.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{timeSince}</span>
            </div>
            {case_.evidences.length > 0 && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>증거 {case_.evidences.length}건</span>
              </div>
            )}
          </div>

          {/* 진행률 표시 */}
          {case_.verdict && (
            <div className="mt-4 pt-4 border-t border-[var(--color-court-border)]">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>과실 비율</span>
                    <span>원고 {case_.verdict.plaintiffFault}% : 피고 {case_.verdict.defendantFault}%</span>
                  </div>
                  <div className="h-2 bg-[var(--color-court-dark)] rounded-full overflow-hidden flex">
                    <div 
                      className="bg-blue-500" 
                      style={{ width: `${case_.verdict.plaintiffFault}%` }}
                    />
                    <div 
                      className="bg-red-500" 
                      style={{ width: `${case_.verdict.defendantFault}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function getTimeSince(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}일 전`;
  if (diffHours > 0) return `${diffHours}시간 전`;
  if (diffMins > 0) return `${diffMins}분 전`;
  return '방금 전';
}
