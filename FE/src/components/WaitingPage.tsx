import { Case, LAWS } from '@/types/court';
import { Scale, Clock, Send } from 'lucide-react';

interface WaitingPageProps {
  case_: Case;
}

export function WaitingPage({ case_ }: WaitingPageProps) {
  const law = LAWS.find(l => l.id === case_.lawType);
  
  return (
    <div className="min-h-screen bg-[#05050a] text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 blur-[100px] opacity-20 rounded-full animate-pulse"></div>
          <Scale className="w-24 h-24 mx-auto text-[var(--color-gold-primary)] relative z-10" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            피고인의 답변을 기다리는 중입니다
          </h1>
          <p className="text-gray-400 text-lg">
            사건이 성공적으로 접수되었습니다.<br/>
            피고인 <strong>{case_.defendant}</strong>님이 변론서를 제출하면<br/>
            AI 판사의 판결이 시작됩니다.
          </p>
        </div>

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
                <span>답변 대기 중</span>
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
