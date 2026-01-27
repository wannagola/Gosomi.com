import { useState, useEffect, ReactNode } from 'react';
import { User, Friend } from '@/types/user';
import { Case, CaseStatus, LAWS } from '@/types/court';
import { User as UserIcon, Check, X, UserPlus, Search, FileText, Clock, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { userService } from '@/api/userService';

// Helper function to format win rate
// Shows integer if .00 (e.g., 50), otherwise shows up to 2 decimal places (e.g., 50.5 or 50.56)
const formatWinRate = (rate: number | undefined): string => {
    if (rate === undefined || rate === null) return '50';
    const num = Number(rate);
    return num % 1 === 0 ? num.toString() : num.toFixed(2);
};

interface MyPageProps {
  user: User;
  friends: Friend[];
  friendRequests: Friend[];
  cases: Case[];
  onAcceptFriend: (id: string) => void;
  onRejectFriend: (id: string) => void;
  onAddFriend: (id: string) => void;
  onUnfollow: (id: string) => void; // Unfollow means remove friend
  onViewCase: (caseId: string) => void;
}

export function MyPage({ 
    user, 
    friends = [], 
    friendRequests = [], 
    cases = [],
    onAcceptFriend, 
    onRejectFriend, 
    onAddFriend,
    onUnfollow,
    onViewCase
}: MyPageProps) {
    const [caseFilter, setCaseFilter] = useState<'all' | CaseStatus>('all');
    const [caseSearchQuery, setCaseSearchQuery] = useState('');
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [currentUserWithStats, setCurrentUserWithStats] = useState<User>(user);

    // Fetch latest user stats when component mounts
    useEffect(() => {
        const fetchUserStats = async () => {
            try {
                const stats = await userService.getUserStats(user.id);
                setCurrentUserWithStats({
                    ...user,
                    winRate: stats.winningRate
                });
            } catch (error) {
                console.error('Failed to fetch user stats:', error);
                // Keep original user data if fetch fails
                setCurrentUserWithStats(user);
            }
        };

        fetchUserStats();
    }, [user.id]);

    // --- Friend Logic ---
    // (Visuals handled in render)

    // --- Case Logic (Copied/Adapted from MyCasesPage) ---
    const filteredCases = (cases || []).filter(case_ => {
        const matchesFilter = caseFilter === 'all' || case_.status === caseFilter;
        const matchesSearch = 
            case_.title.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
            case_.caseNumber.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
            case_.plaintiff.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
            case_.defendant.toLowerCase().includes(caseSearchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const statusStats = {
        all: cases.length,
        'SUMMONED': cases.filter(c => c.status === 'SUMMONED').length,
        'DEFENSE_SUBMITTED': cases.filter(c => c.status === 'DEFENSE_SUBMITTED').length,
        'VERDICT_READY': cases.filter(c => c.status === 'VERDICT_READY').length,
        'COMPLETED': cases.filter(c => c.status === 'COMPLETED').length,
        'UNDER_APPEAL': cases.filter(c => c.status === 'UNDER_APPEAL').length,
        'APPEAL_VERDICT_READY': cases.filter(c => c.status === 'APPEAL_VERDICT_READY').length,
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[var(--color-court-dark)] to-[#05050a] pt-32 pb-12">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                
                {/* Spacer for sticky header */}
                <div className="h-32 w-full" /> 

                {/* Profile Header */}
                <div className="flex items-center gap-6 mb-12">
                     <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-[var(--color-gold-dark)]">
                        {currentUserWithStats.profileImage ? (
                            <img src={currentUserWithStats.profileImage} alt={currentUserWithStats.nickname} className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-12 h-12 text-gray-400" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">{currentUserWithStats.nickname}</h1>
                        <p className="text-[var(--color-gold-primary)] font-bold text-lg">
                            승소율 {formatWinRate(currentUserWithStats.winRate)}%
                        </p>
                    </div>
                </div>

                {/* Friend Requests Section */}
                {friendRequests.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-xl font-bold text-[var(--color-gold-primary)] mb-4 flex items-center gap-2">
                            <UserPlus className="w-5 h-5" />
                            팔로우 신청 ({friendRequests.length})
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {friendRequests.map(req => (
                                <div key={req.id} className="bg-[var(--color-court-gray)] border border-[var(--color-court-border)] rounded-lg p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                            {req.profileImage ? <img src={req.profileImage} /> : <UserIcon className="w-6 h-6 text-gray-400" />}
                                        </div>
                                        <span className="font-bold text-white">{req.nickname}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => onAcceptFriend(req.id)}
                                            className="p-2 bg-blue-600 hover:bg-blue-500 rounded text-content text-white transition-colors"
                                            title="수락"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => onRejectFriend(req.id)}
                                            className="p-2 bg-red-600 hover:bg-red-500 rounded text-content text-white transition-colors"
                                            title="거절"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Friend List Section */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-[var(--color-gold-primary)] flex items-center gap-2">
                            <UserIcon className="w-6 h-6" />
                            내 친구 ({friends.length})
                        </h2>
                        <button 
                            onClick={() => setIsSearchModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-court-gray)] border border-[var(--color-court-border)] rounded-lg text-white hover:border-[var(--color-gold-primary)] transition-colors"
                        >
                            <UserPlus className="w-4 h-4" />
                            친구 찾기
                        </button>
                    </div>
                    
                    {friends.length === 0 ? (
                        <div className="p-12 bg-[var(--color-court-gray)]/30 border-2 border-dashed border-[var(--color-court-border)] rounded-2xl text-center">
                            <UserIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                            <p className="text-xl text-gray-500">아직 친구가 없습니다.</p>
                            <p className="text-sm text-gray-600 mt-2">친구를 추가하여 배심원으로 초대해보세요!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {friends.map(friend => (
                                <div key={friend.id} className="relative group bg-[#13141f] bg-opacity-80 backdrop-blur-md border border-[var(--color-court-border)] rounded-2xl p-6 flex items-center gap-6 transition-all hover:scale-[1.02] hover:border-[var(--color-gold-dark)] hover:shadow-2xl hover:shadow-[var(--color-gold-dark)]/10">
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center overflow-hidden border-4 border-[#1a1b26] ring-2 ring-[var(--color-court-border)] group-hover:ring-[var(--color-gold-primary)] transition-all shadow-xl">
                                            {friend.profileImage ? (
                                                <img src={friend.profileImage} alt={friend.nickname} className="w-full h-full object-cover" />
                                            ) : (
                                                <UserIcon className="w-10 h-10 text-gray-400 group-hover:text-white transition-colors" />
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="text-xl font-bold text-white group-hover:text-[var(--color-gold-primary)] transition-colors">
                                                {friend.nickname}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2 text-[var(--color-gold-primary)] font-medium">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>승소율 {formatWinRate(friend.winRate)}%</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2">

                                        <button 
                                            onClick={() => onUnfollow(friend.id)}
                                            className="p-3 rounded-xl bg-[var(--color-court-gray)] hover:bg-red-500/20 hover:text-red-400 text-gray-400 transition-colors"
                                            title="친구 끊기"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Hover Shine Effect */}
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shine pointer-events-none" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <hr className="border-[var(--color-court-border)] my-12" />

                {/* Case List Section (Current Progress) */}
                <div>
                     <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <FileText className="w-8 h-8 text-[var(--color-gold-accent)]" />
                            <h2 className="text-2xl font-bold">내 사건 진행상황</h2>
                        </div>
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        <StatCard label="전체" count={statusStats.all} color="gray" active={caseFilter === 'all'} onClick={() => setCaseFilter('all')} />
                        <StatCard label="소환됨" count={statusStats['SUMMONED']} color="purple" active={caseFilter === 'SUMMONED'} onClick={() => setCaseFilter('SUMMONED')} />
                        <StatCard label="변론 중" count={statusStats['DEFENSE_SUBMITTED']} color="yellow" active={caseFilter === 'DEFENSE_SUBMITTED'} onClick={() => setCaseFilter('DEFENSE_SUBMITTED')} />
                        <StatCard label="판결 대기" count={statusStats['VERDICT_READY']} color="orange" active={caseFilter === 'VERDICT_READY'} onClick={() => setCaseFilter('VERDICT_READY')} />
                        <StatCard label="종료됨" count={statusStats['COMPLETED']} color="green" active={caseFilter === 'COMPLETED'} onClick={() => setCaseFilter('COMPLETED')} />
                        <StatCard label="항소 중" count={statusStats['UNDER_APPEAL']} color="red" active={caseFilter === 'UNDER_APPEAL'} onClick={() => setCaseFilter('UNDER_APPEAL')} />
                    </div>

                    {/* Search */}
                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                            type="text"
                            value={caseSearchQuery}
                            onChange={(e) => setCaseSearchQuery(e.target.value)}
                            placeholder="사건 번호, 제목, 당사자명으로 검색..."
                            className="w-full pl-12 pr-4 py-3 bg-[var(--color-court-gray)] border-2 border-[var(--color-court-border)] rounded-lg text-white placeholder-gray-500 focus:border-[var(--color-gold-primary)] focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Case List */}
                     <div className="space-y-4">
                        {filteredCases.length === 0 ? (
                            <div className="official-document rounded-2xl p-12 text-center">
                            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                            <p className="text-xl text-gray-500 mb-2">사건이 없습니다</p>
                            <p className="text-sm text-gray-600">
                                {caseSearchQuery ? '검색 조건에 맞는 사건이 없습니다.' : '새로운 사건을 접수해보세요.'}
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

             {/* Search Modal */}
             {isSearchModalOpen && (
                <FriendSearchModal 
                    currentUser={user}
                    onClose={() => setIsSearchModalOpen(false)}
                    onAddFriend={onAddFriend}
                />
            )}
        </div>
    );
}

// --- Subcomponents (Copied/Extracted from MyCasesPage) ---

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
  
  const statusConfig: Record<string, { label: string; color: string; icon: ReactNode; textColor: string }> = {
    'SUMMONED': { 
      label: '소환 완료', 
      color: 'bg-purple-500',
      icon: <AlertCircle className="w-5 h-5" />,
      textColor: 'text-purple-400'
    },
    'DEFENSE_SUBMITTED': { 
      label: '변론 제출됨', 
      color: 'bg-yellow-500',
      icon: <Clock className="w-5 h-5" />,
      textColor: 'text-yellow-400'
    },
    'VERDICT_READY': { 
      label: '판결 대기(벌칙)', 
      color: 'bg-orange-500',
      icon: <Clock className="w-5 h-5" />,
      textColor: 'text-orange-400'
    },
    'COMPLETED': { 
      label: '종료됨', 
      color: 'bg-green-500',
      icon: <CheckCircle className="w-5 h-5" />,
      textColor: 'text-green-400'
    },
    'UNDER_APPEAL': { 
      label: '항소 진행 중', 
      color: 'bg-red-500',
      icon: <AlertCircle className="w-5 h-5" />,
      textColor: 'text-red-400'
    },
    'APPEAL_VERDICT_READY': {
      label: '항소심 선고',
      color: 'bg-green-600',
      icon: <CheckCircle className="w-5 h-5" />,
      textColor: 'text-green-300'
    }
  };

  const status = statusConfig[case_.status] || statusConfig['SUMMONED'];
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
            {case_.evidences?.length > 0 && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>증거 {case_.evidences?.length}건</span>
              </div>
            )}
          </div>

          {/* 진행률 표시 - Using faultRatio */}
          {case_.faultRatio && (
            <div className="mt-4 pt-4 border-t border-[var(--color-court-border)]">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>과실 비율</span>
                    <span>원고 {case_.faultRatio.plaintiff}% : 피고 {case_.faultRatio.defendant}%</span>
                  </div>
                  <div className="h-2 bg-[var(--color-court-dark)] rounded-full overflow-hidden flex">
                    <div 
                      className="bg-blue-500" 
                      style={{ width: `${case_.faultRatio.plaintiff}%` }}
                    />
                    <div 
                      className="bg-red-500" 
                      style={{ width: `${case_.faultRatio.defendant}%` }}
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

function FriendSearchModal({ currentUser, onClose, onAddFriend }: { currentUser: User, onClose: () => void, onAddFriend: (id: string) => void }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const users = await userService.searchUsers(query, currentUser.id);
            setResults(users);
        } catch (error) {
            console.error(error);
            alert('검색 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
            <div className="official-document rounded-2xl w-full max-w-lg p-6">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <UserPlus className="w-6 h-6 text-[var(--color-gold-accent)]" />
                        친구 찾기
                    </h2>
                    <button onClick={onClose}><X className="text-gray-400" /></button>
                </div>

                <div className="flex gap-2 mb-6">
                    <input 
                        className="flex-1 bg-[var(--color-court-gray)] border border-[var(--color-court-border)] rounded-lg px-4 py-2 text-white"
                        placeholder="닉네임으로 검색"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button 
                        disabled={loading}
                        onClick={handleSearch}
                        className="px-4 py-2 bg-[var(--color-gold-dark)] text-black font-bold rounded-lg hover:bg-[var(--color-gold-primary)]"
                    >
                        {loading ? '검색...' : '검색'}
                    </button>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                    {results.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-[var(--color-court-gray)] rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                                    {user.profileImage ? <img src={user.profileImage} className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 m-2 text-gray-400" />}
                                </div>
                                <span className="text-white font-medium">{user.nickname}</span>
                            </div>
                            <button 
                                onClick={() => onAddFriend(user.id)}
                                className="p-2 text-[var(--color-gold-primary)] hover:bg-[var(--color-court-border)] rounded-full"
                                title="친구 추가"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                    {results.length === 0 && !loading && <div className="text-center text-gray-500 py-4">검색 결과가 없습니다.</div>}
                </div>
            </div>
        </div>
    );
}
