import { Users, Gavel } from 'lucide-react';
import { Case } from '@/types/court';
import { useNavigate } from 'react-router-dom';

interface JuryDashboardProps {
  cases: Case[];
}

export function JuryDashboard({ cases }: JuryDashboardProps) {
  const navigate = useNavigate();
  
  // Filter cases that have jury enabled and are active
  // Active means not COMPLETED or APPEAL_VERDICT_READY (if we consider appeal done as done)
  const activeJuryCases = cases.filter(c => c.juryEnabled && c.status !== 'COMPLETED' && c.status !== 'APPEAL_VERDICT_READY');

  return (
    <div className="min-h-screen bg-[var(--color-court-dark)] px-8 pb-8 relative z-10" style={{ paddingTop: '150px' }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-10 h-10 text-[var(--color-gold-accent)]" />
          <h1 className="text-3xl font-bold text-white">배심원 대기실</h1>
        </div>
        
        <p className="text-gray-400 mb-8">
          공정한 판결을 위해 배심원으로서 참여해주세요. 여러분의 의견이 판결에 중요한 영향을 미칩니다.
        </p>

        {activeJuryCases.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-[var(--color-court-border)] rounded-xl">
            <Gavel className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">현재 참여 가능한 배심원 사건이 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {activeJuryCases.map(case_ => (
              <div key={case_.id} className="bg-[var(--color-court-gray)] border border-[var(--color-court-border)] p-6 rounded-xl hover:border-[var(--color-gold-primary)] transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-block px-3 py-1 bg-[var(--color-gold-dark)]/20 text-[var(--color-gold-accent)] text-xs rounded-full mb-2">
                        {case_.caseNumber}
                    </span>
                    <h3 className="text-xl font-bold text-white mb-2">{case_.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">{case_.description}</p>
                    <div className="flex gap-4 text-xs text-slate-500">
                        <span>원고: {case_.plaintiff}</span>
                        <span>피고: {case_.defendant}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/case/${case_.id}/jury`)}
                    className="px-6 py-2 bg-[var(--color-gold-primary)] hover:bg-[var(--color-gold-dark)] text-black font-bold rounded-lg transition-colors"
                  >
                    참여하기
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
