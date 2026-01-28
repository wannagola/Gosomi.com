import { useState } from "react";
import { LAWS, Law } from "@/types/court";
import { BookOpen, Scale, X, AlertCircle, Smile } from "lucide-react";
import logoImg from "@/assets/gosomidotcom.png";

export function LawBook() {
  const [selectedLaw, setSelectedLaw] = useState<Law | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--color-court-dark)] to-[#05050a] py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <BookOpen className="w-12 h-12 text-[var(--color-gold-accent)]" />
            <h1 className="text-5xl">고소미 법전</h1>
          </div>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            일상을 지배하는 8가지 신성한 법률. <br />
            모든 판결은 이 법전에 근거하여 이루어집니다.
          </p>
          <div className="mt-6 inline-block px-6 py-3 bg-[var(--color-court-gray)] border-2 border-[var(--color-gold-dark)] rounded-lg">
            <p className="text-sm text-[var(--color-gold-primary)]">
              ⚖️ 제정일: 2026년 1월 1일 | 대법원장: 판결하면 해
            </p>
          </div>
        </div>

        {/* 법률 그리드 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {LAWS.map((law, index) => (
            <LawCard
              key={law.id}
              law={law}
              index={index}
              onClick={() => setSelectedLaw(law)}
            />
          ))}
        </div>

        {/* 법전 설명 */}
        <div className="official-document rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="w-8 h-8 text-[var(--color-gold-accent)]" />
            <h2 className="text-3xl">이중 벌칙 선택 시스템</h2>
          </div>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              <span className="text-[var(--color-gold-accent)] font-bold">
                제1조 (이중 벌칙 제시의 원칙)
              </span>
              <br />
              모든 판결은 진지한 벌칙안과 재미있는 벌칙안을 동시에 제시하며,
              처벌 대상자는 두 안 중 하나를 선택하여 이행할 수 있습니다.
            </p>
            <p>
              <span className="text-[var(--color-gold-accent)] font-bold">
                제2조 (벌칙 강도의 결정)
              </span>
              <br />
              벌칙 강도는 하/중/상으로 구분하며, AI 판사가 사건의 심각성을
              판단하여 결정합니다.
            </p>
            <p>
              <span className="text-[var(--color-gold-accent)] font-bold">
                제3조 (벌칙 이행의 증명)
              </span>
              <br />
              벌칙 이행은 캡처 이미지, 음성 녹음, 영상 업로드 등으로 증명할 수
              있으며, 판결문과 함께 공유될 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 법률 상세 모달 */}
      {selectedLaw && (
        <LawDetailModal
          law={selectedLaw}
          onClose={() => setSelectedLaw(null)}
        />
      )}
    </div>
  );
}

interface LawCardProps {
  law: Law;
  index: number;
  onClick: () => void;
}

function LawCard({ law, index, onClick }: LawCardProps) {
  return (
    <button
      onClick={onClick}
      className="group official-document rounded-xl p-6 text-left hover:scale-105 transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,165,116,0.2)]"
    >
      {/* 법조문 번호 */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-20 h-20 opacity-80 group-hover:scale-110 transition-transform">
          <img src={law.icon} alt={law.title} className="w-full h-full object-contain" />
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">제{index + 1}조</div>
          <div className="px-3 py-1 bg-[var(--color-gold-dark)] bg-opacity-20 rounded-full border border-[var(--color-gold-dark)]">
            <span className="text-xs text-[var(--color-gold-accent)] font-bold">
              LAW
            </span>
          </div>
        </div>
      </div>

      {/* 제목 */}
      <h3 className="text-2xl font-bold mb-3 text-[var(--color-gold-accent)] group-hover:text-[var(--color-gold-primary)] transition-colors">
        {law.title}
      </h3>

      {/* 설명 */}
      <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
        {law.description}
      </p>

      {/* 상세보기 버튼 */}
      <div className="mt-4 pt-4 border-t border-[var(--color-court-border)]">
        <span className="text-xs text-[var(--color-gold-primary)] group-hover:underline">
          조문 및 벌칙 보기 →
        </span>
      </div>
    </button>
  );
}

interface LawDetailModalProps {
  law: Law;
  onClose: () => void;
}

function LawDetailModal({ law, onClose }: LawDetailModalProps) {
  // Removed selectedSeverity state as buttons are no longer interactive

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-6">
      <div className="official-document rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-[var(--color-court-gray)] border-b-2 border-[var(--color-gold-dark)] p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16">
              <img src={law.icon} alt={law.title} className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-3xl">{law.title}</h2>
              <p className="text-sm text-[var(--color-gold-primary)]">
                생활분쟁 통합법전
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-court-border)] rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-8 space-y-8">
          {/* 설명 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-[var(--color-gold-accent)]" />
              <h3 className="text-xl font-bold text-[var(--color-gold-accent)]">
                법 개요
              </h3>
            </div>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{law.content || law.description}</p>
          </section>

          {/* 강도 선택 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-[var(--color-gold-accent)]" />
              <h3 className="text-xl font-bold text-[var(--color-gold-accent)]">
                판결 강도 기준
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div
                className="p-4 rounded-lg border-2 transition-all border-[var(--color-court-border)]"
              >
                <h4 className="font-bold text-green-400 mb-2">하 (경미)</h4>
                <p className="text-xs text-gray-400">
                  {law.severityCriteria.low}
                </p>
              </div>
              <div
                className="p-4 rounded-lg border-2 transition-all border-[var(--color-court-border)]"
              >
                <h4 className="font-bold text-yellow-400 mb-2">중 (보통)</h4>
                <p className="text-xs text-gray-400">
                  {law.severityCriteria.medium}
                </p>
              </div>
              <div
                className="p-4 rounded-lg border-2 transition-all border-[var(--color-court-border)]"
              >
                <h4 className="font-bold text-red-400 mb-2">상 (중대)</h4>
                <p className="text-xs text-gray-400">
                  {law.severityCriteria.high}
                </p>
              </div>
            </div>
          </section>

          {/* 벌칙 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-[var(--color-gold-accent)]" />
              <h3 className="text-xl font-bold text-[var(--color-gold-accent)]">
                선택 가능한 벌칙
              </h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {/* 진지한 벌칙 */}
              <div className="p-6 bg-gradient-to-br from-blue-900 from-opacity-20 to-transparent rounded-lg border-2 border-blue-800 border-opacity-30">
                <div className="flex items-center gap-2 mb-3">
                  <Scale className="w-5 h-5 text-blue-400" />
                  <h4 className="font-bold text-blue-400">엄중한 처벌</h4>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  상황에 맞는 진지한 반성을 위한 벌칙이 AI에 의해 생성됩니다.
                </p>
              </div>

              {/* 재미있는 벌칙 */}
              <div className="p-6 bg-gradient-to-br from-purple-900 from-opacity-20 to-transparent rounded-lg border-2 border-purple-800 border-opacity-30">
                <div className="flex items-center gap-2 mb-3">
                  <Smile className="w-5 h-5 text-purple-400" />
                  <h4 className="font-bold text-purple-400">유쾌한 처벌</h4>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  분위기를 풀고 화해할 수 있는 유쾌한 벌칙이 AI에 의해 생성됩니다.
                </p>
              </div>
            </div>
          </section>

          {/* 주의사항 */}
          <section>
            <div className="p-4 bg-orange-900 bg-opacity-20 border border-orange-700 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-200">
                <p className="font-semibold mb-1">벌칙 선택 안내</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>
                    판결 후 24시간 내에 진지한/재미있는 벌칙 중 하나를 선택해야
                    합니다.
                  </li>
                  <li>선택하지 않을 경우 자동으로 진지한 벌칙이 적용됩니다.</li>
                  <li>
                    벌칙 이행은 캡처, 녹음, 영상 등으로 증명할 수 있습니다.
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* 공식 인장 */}
        <div className="p-6 border-t-2 border-[var(--color-gold-dark)] text-center">
          <div className="inline-block mb-3">
            <div className="w-32 h-32 mx-auto flex items-center justify-center overflow-hidden">
              <img src={logoImg} alt="고소미닷컴" className="w-full h-full object-cover" />
            </div>
          </div>
          <p className="text-sm text-gray-500">
            고소미 대법원 공식 법전 | 판사: AI JUSTICE
          </p>
        </div>
      </div>
    </div>
  );
}
