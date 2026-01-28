import { useState, useEffect } from "react";
import { FileText, Search, TrendingUp, Clock } from "lucide-react";
import { Case } from "@/types/court";
import backgroundImage from "@/assets/court.jpg";
import { LegalModal } from './LegalModal';
import { TERMS_AND_CONDITIONS, PRIVACY_POLICY, THIRD_PARTY_CONSENT, MARKETING_CONSENT } from '@/data/legalText';
import apiClient from '@/api/client';

import { User } from '@/types/user';

interface CourtLobbyProps {
  onNewCase: () => void;
  onViewCase: (caseId: string) => void;
  recentCases: Case[];
  currentUser?: User | null;
}

interface Stats {
  total: number;
  todayVerdict: number;
  ongoing: number;
}

export function CourtLobby({
  onNewCase,
  onViewCase,
  recentCases,
  currentUser
}: CourtLobbyProps) {

  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState<Stats>({ total: 0, todayVerdict: 0, ongoing: 0 });
  const [modalState, setModalState] = useState<{ isOpen: boolean; title: string; content: string }>({
    isOpen: false,
    title: '',
    content: ''
  });

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get<{ ok: boolean; stats: Stats }>('/api/cases/stats');
        if (response.data.ok) {
          setStats(response.data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    fetchStats();
  }, []);

  const openModal = (title: string, content: string) => {
    setModalState({ isOpen: true, title, content });
  };

  const filteredCases = recentCases.filter(
    (case_) => {
      // Basic Filters
      const matchesSearch = case_.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.plaintiff.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.defendant.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isNotCompleted = case_.status !== 'COMPLETED';

      // User Filter: Only show cases where current user is Plaintiff or Defendant
      // If no current user, show nothing? Or show all? User demanded "leave only cases where user exists..."
      // Assuming if not logged in, show nothing or standard (but user is usually logging in).
      // Given the request context: "Here, leave only cases where the user exists..."
      // If currentUser is present, filter. If not, maybe show empty?
      // Let's assume if currentUser is present, apply filter.
      const isParticipant = currentUser 
          ? (String(case_.plaintiffId) === String(currentUser.id) || String(case_.defendantId) === String(currentUser.id))
          : true; // Or false if we want strict privacy? Original behavior was "recentCases" (all). 
                  // But user request implies a personalized view. 
                  // If logged out, "Real-time Trial Status" should probably remain public? 
                  // But user is "The User". They are likely logged in.
                  // I will apply filter if currentUser is provided.

       return isNotCompleted && matchesSearch && isParticipant;
    }
  );

  return (
    <div className="min-h-screen relative">
      {/* 배경 이미지 */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          imageRendering: "crisp-edges",
        }}
      />

      {/* 어두운 오버레이 */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />

      {/* 콘텐츠 */}
      <div className="relative z-10">
        {/* 히어로 섹션 */}
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <div className="mb-6 px-6 py-2 official-document rounded-full inline-block">
            <p className="text-[var(--color-gold-accent)] tracking-widest text-sm font-semibold">
              억울하면 고발하라, 판결은 AI가 한다 !
            </p>
          </div>

          <h1 className="text-6xl mb-4">고소미 대법원</h1>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            일상의 분쟁을 AI 판사가 공정하게 심판합니다. <br />
            배심원의 여론과 함께 진실을 밝혀보세요.
          </p>

          <button
            onClick={onNewCase}
            className="group relative px-12 py-6 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold-primary)] rounded-xl text-white font-bold text-xl shadow-2xl hover:shadow-[0_0_40px_rgba(212,165,116,0.3)] transition-all duration-300 hover:scale-105"
          >
            <FileText className="inline-block w-8 h-8 mr-3" />
            새로운 사건 접수하기
          </button>
        </div>

        {/* 검색 섹션 */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="relative max-w-2xl mx-auto mb-16">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="사건 번호 또는 당사자명으로 검색 (예: 2026-GOSOMI-001)"
              className="w-full pl-16 pr-6 py-5 official-document rounded-xl text-white placeholder-gray-500 focus:border-[var(--color-gold-primary)] focus:outline-none transition-colors border-2 border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* 통계 대시보드 */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <StatCard icon={<FileText className="w-8 h-8" />} label="총 접수 사건" value={stats.total.toLocaleString()} subtext="건" />
            <StatCard icon={<TrendingUp className="w-8 h-8" />} label="오늘의 판결" value={stats.todayVerdict.toLocaleString()} subtext="건" />
            <StatCard icon={<Clock className="w-8 h-8" />} label="진행 중인 사건" value={stats.ongoing.toLocaleString()} subtext="건" />
          </div>

          {/* 실시간 재판 현황판 */}
          <div className="official-document rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <h2 className="text-3xl">실시간 재판 현황</h2>
            </div>

            {recentCases.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-6xl mb-4 opacity-30">⚖️</div>
                <p className="text-lg">아직 접수된 사건이 없습니다.</p>
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Search className="mx-auto w-12 h-12 mb-4 opacity-30" />
                <p className="text-lg">'{searchTerm}'에 대한 검색 결과가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCases.map((case_) => (
                  <CaseCard key={case_.id} case_={case_} onView={onViewCase} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Credit & Legal - 간격을 강제로 벌린 버전 */}
        <div className="w-full text-center pb-12 mt-20">
          <div className="flex flex-wrap justify-center items-center text-[11px] text-white/30 font-light px-4 mb-4">
            <button
              onClick={() => openModal('이용약관 및 면책 조항 동의', TERMS_AND_CONDITIONS)}
              className="hover:text-white transition-colors"
            >
              이용약관 및 면책 조항 동의
            </button>
            
            <span className="px-8 opacity-20 select-none">|</span>
            
            <button
              onClick={() => openModal('개인정보 수집 및 이용 동의', PRIVACY_POLICY)}
              className="hover:text-white transition-colors"
            >
              개인정보 수집 및 이용 동의
            </button>
            
            <span className="px-8 opacity-20 select-none">|</span>
            
            <button
              onClick={() => openModal('제3자 정보 제공 동의', THIRD_PARTY_CONSENT)}
              className="hover:text-white transition-colors"
            >
              제3자 정보 제공 동의
            </button>
            
            <span className="px-8 opacity-20 select-none">|</span>
            
            <button
              onClick={() => openModal('마케팅 정보 수신 동의', MARKETING_CONSENT)}
              className="hover:text-white transition-colors"
            >
              마케팅 정보 수신 동의
            </button>
          </div>

          <p className="text-[10px] text-white/10 font-light tracking-widest uppercase">
            © 2026 GOSOMI COURT. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>

      <LegalModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        title={modalState.title}
        content={modalState.content}
      />
    </div>
  );
}

// 하단 서브 컴포넌트들
function StatCard({ icon, label, value, subtext }: any) {
  return (
    <div className="official-document rounded-xl p-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-[var(--color-gold-dark)] bg-opacity-20 rounded-lg text-[var(--color-gold-accent)]">{icon}</div>
        <div>
          <p className="text-sm text-gray-400 mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-[var(--color-gold-accent)]">{value}</span>
            <span className="text-sm text-gray-500">{subtext}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CaseCard({ case_, onView }: any) {
  const statusConfig: any = {
    SUMMONED: { label: "소환 완료", color: "bg-purple-500" },
    DEFENSE_SUBMITTED: { label: "변론 제출", color: "bg-yellow-500" },
    VERDICT_READY: { label: "판결 대기", color: "bg-orange-500" },
    APPEAL_VERDICT_READY: { label: "항소 판결 대기", color: "bg-orange-600" },
    COMPLETED: { label: "판결 완료", color: "bg-green-500" },
    UNDER_APPEAL: { label: "항소 중", color: "bg-red-500" },
  };

  const status = statusConfig[case_.status] || statusConfig.SUMMONED;
  const isAppeal = case_.status.includes('APPEAL') || (case_.appealStatus && case_.appealStatus !== 'NONE');
  const trialStage = isAppeal ? "항소심" : "1심";
  const trialColor = isAppeal ? "bg-red-900 text-red-200 border-red-700" : "bg-blue-900 text-blue-200 border-blue-700";

  return (
    <button
      onClick={() => onView(case_.id)}
      className="w-full p-6 bg-[var(--color-court-dark)] bg-opacity-50 border border-[var(--color-court-border)] rounded-lg hover:border-[var(--color-gold-primary)] transition-all group backdrop-blur-sm"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 text-left">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-mono text-[var(--color-gold-primary)]">{case_.caseNumber}</span>
            <div className="flex gap-2">
               <span className={`px-2 py-0.5 text-xs font-bold rounded border ${trialColor} bg-opacity-40`}>
                {trialStage}
              </span>
              <span className={`px-3 py-1 ${status.color} bg-opacity-20 text-white text-xs rounded-full border border-current`}>
                {status.label}
              </span>
            </div>
          </div>
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[var(--color-gold-accent)] transition-colors">{case_.title}</h3>
          <p className="text-sm text-gray-400">원고: {case_.plaintiff} vs 피고: {case_.defendant}</p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <Clock className="w-4 h-4 inline-block mr-1" />
          {new Date(case_.createdAt).toLocaleDateString("ko-KR")}
        </div>
      </div>
    </button>
  );
}