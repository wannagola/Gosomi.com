import { useState, useRef } from 'react';
import { Shield, Upload, AlertTriangle, Send, Eye, Paperclip, ImageIcon } from 'lucide-react';
import { Case, Evidence, LAWS } from '@/types/court';

interface DefensePageProps {
  case_: Case;
  onSubmitDefense: (response: { statement: string; evidences: Evidence[] }) => void;
}

export function DefensePage({ case_, onSubmitDefense }: DefensePageProps) {
  const [statement, setStatement] = useState('');
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [textEvidence, setTextEvidence] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachedFiles(e.target.files);
  };

  const addTextEvidence = () => {
    if (textEvidence.trim()) {
      setEvidences([
        ...evidences,
        {
          id: Date.now().toString(),
          type: 'text',
          content: textEvidence,
          isKeyEvidence: false,
        },
      ]);
      setTextEvidence('');
    }
  };

  const addImageEvidence = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('이미지 크기는 2MB 이하여야 합니다.');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setEvidences([
        ...evidences,
        {
          id: Date.now().toString(),
          type: "image",
          content: base64,
          isKeyEvidence: false,
        },
      ]);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = '';
  };

  const toggleKeyEvidence = (id: string) => {
    setEvidences(
      evidences.map((e) =>
        e.id === id ? { ...e, isKeyEvidence: !e.isKeyEvidence } : e
      )
    );
  };

  const removeEvidence = (id: string) => {
    setEvidences(evidences.filter((e) => e.id !== id));
  };

  const handleSubmit = () => {
    if (statement.trim()) {
      onSubmitDefense({ statement, evidences });
    }
  };

  const law = LAWS.find(l => l.id === case_.lawType) || {
    id: 'general',
    title: '생활소송법',
    description: '일상 생활에서 발생하는 일반적인 분쟁을 다룹니다.',
    icon: 'placeholder', // Sentinel value to be handled in render
    severityCriteria: { low: '', medium: '', high: '' },
    penalties: { low: { serious: '', funny: '' }, medium: { serious: '', funny: '' }, high: { serious: '', funny: '' } }
  };
  const timeRemaining = 24; // 실제로는 계산 필요

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--color-court-dark)] to-[#05050a] pb-12 px-6 relative z-10" style={{ paddingTop: '150px' }}>
      <div className="max-w-6xl mx-auto px-6">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl">변론실</h1>
          </div>
          <p className="text-gray-400 mb-4">
            원고의 주장에 대해 반박할 기회입니다. 정확한 사실을 바탕으로 변론하세요.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-900 bg-opacity-30 border border-orange-700 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <span className="text-orange-400 font-bold">남은 시간: {timeRemaining}시간</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 왼쪽: 원고의 고소장 */}
          <div className="official-document rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl">고소장</h2>
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className="flex items-center gap-2 px-4 py-2 border border-[var(--color-gold-dark)] rounded-lg hover:bg-[var(--color-gold-dark)] hover:bg-opacity-20 transition-all"
              >
                <Eye className="w-4 h-4" />
                <span className="text-sm">{showOriginal ? '요약 보기' : '전체 보기'}</span>
              </button>
            </div>

            {/* 사건 정보 */}
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-[var(--color-court-dark)] bg-opacity-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">사건번호</p>
                <p className="font-mono text-[var(--color-gold-accent)]">{case_.caseNumber}</p>
              </div>

              <div className="p-4 bg-[var(--color-court-dark)] bg-opacity-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">사건명</p>
                <p className="text-lg font-bold text-white">{case_.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-purple-900 bg-opacity-20 border border-purple-700 border-opacity-30 rounded-lg">
                  <p className="text-sm text-purple-400 mb-1">원고</p>
                  <p className="font-bold text-white">{case_.plaintiff}</p>
                </div>
                <div className="p-4 bg-orange-900 bg-opacity-20 border border-orange-700 border-opacity-30 rounded-lg">
                  <p className="text-sm text-orange-400 mb-1">피고</p>
                  <p className="font-bold text-white">{case_.defendant}</p>
                </div>
              </div>

              <div className="p-4 bg-[var(--color-court-dark)] bg-opacity-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">적용 법률</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex-shrink-0 bg-gray-800 rounded-lg flex items-center justify-center">
                    {law?.icon && law.icon !== 'placeholder' ? (
                      <img src={law.icon} alt={law.title} className="w-full h-full object-contain" />
                    ) : (
                      <Shield className="w-8 h-8 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-[var(--color-gold-accent)]">{law?.title}</p>
                    <p className="text-xs text-gray-400">{law?.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 고소 내용 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[var(--color-gold-primary)] mb-3">고소 내용</h3>
              <div className="p-4 bg-[var(--color-court-dark)] bg-opacity-30 rounded-lg border-l-4 border-purple-600">
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {showOriginal 
                    ? (case_.content || '소송 내용이 없습니다.') 
                    : ((case_.content || '').slice(0, 200) + ((case_.content?.length ?? 0) > 200 ? '...' : ''))
                  }
                </p>
              </div>
            </div>

            {/* 원고 증거 */}
            {case_.evidences?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-gold-primary)] mb-3">
                  원고 측 증거 ({case_.evidences?.length || 0}건)
                </h3>
                <div className="space-y-2">
                  {case_.evidences?.map((evidence) => (
                    <div
                      key={evidence.id}
                      className={`p-3 rounded-lg border ${
                        evidence.isKeyEvidence
                          ? 'border-yellow-600 bg-yellow-900 bg-opacity-20'
                          : 'border-[var(--color-court-border)] bg-[var(--color-court-dark)] bg-opacity-30'
                      }`}
                    >
                      {evidence.isKeyEvidence && (
                        <span className="inline-block px-2 py-0.5 bg-yellow-600 text-black text-xs font-bold rounded mb-1">
                          핵심 증거
                        </span>
                      )}
                      {evidence.type === 'image' ? (
                        <img 
                          src={evidence.content} 
                          alt="원고 증거 이미지" 
                          className="max-w-sm rounded-lg border border-[var(--color-court-border)]"
                        />
                      ) : (
                        <p className="text-sm text-gray-300">{evidence.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽: 변론서 작성 */}
          <div className="official-document rounded-2xl p-8">
            <h2 className="text-2xl mb-6">변론서 작성</h2>

            {/* 변론 내용 */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-[var(--color-gold-primary)] mb-3">
                변론 내용 *
              </label>
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="원고의 주장에 대한 반박을 작성하세요. 사실 관계를 명확히 하고, 정당한 사유가 있었다면 설명해 주세요."
                rows={12}
                className="w-full px-4 py-3 bg-[var(--color-court-dark)] border-2 border-[var(--color-court-border)] rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none mb-2"
              />
              <p className="text-xs text-gray-500 mt-2">
                {statement.length}자 작성됨 (최소 50자 권장)
              </p>
            </div>

            {/* 증거 자료 제출 */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-[var(--color-gold-primary)] mb-4">
                증거 자료 제출
              </label>
              
              {/* 텍스트 증거 입력 */}
              <div className="flex gap-3 mb-6">
                <textarea
                  value={textEvidence}
                  onChange={(e) => setTextEvidence(e.target.value)}
                  placeholder="텍스트로 된 증거/참료 자료를 입력하세요"
                  rows={1}
                  className="flex-1 px-4 py-3 bg-[var(--color-court-dark)] border-2 border-[var(--color-court-border)] rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                />
                <button
                  onClick={addTextEvidence}
                  className="px-6 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors whitespace-nowrap text-sm font-bold"
                >
                  텍스트 추가
                </button>
              </div>

              {/* 파일 업로드 버튼 그룹 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* 1. 이미지 업로드 (미리보기 및 AI 분석용) */}
                <div>
                  <input
                    type="file"
                    id="defense-image-input"
                    accept="image/*"
                    onChange={addImageEvidence}
                    className="hidden"
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="defense-image-input"
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[var(--color-court-border)] rounded-lg hover:border-purple-500 hover:bg-purple-900 hover:bg-opacity-10 cursor-pointer transition-all h-full"
                  >
                    <ImageIcon className="w-8 h-8 text-purple-400 mb-3" />
                    <span className="text-base font-bold text-gray-300">이미지 증거 업로드</span>
                    <span className="text-xs text-gray-500 mt-2 text-center">판결에 직접 반영됨<br/>(Max 2MB)</span>
                  </label>
                </div>

                {/* 2. 일반 파일 첨부 (참고자료) */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-[var(--color-court-border)] rounded-lg hover:border-orange-500 hover:bg-orange-900 hover:bg-opacity-10 cursor-pointer transition-all"
                  >
                    <Paperclip className="w-8 h-8 text-orange-400 mb-3" />
                    <span className="text-base font-bold text-gray-300">기타 파일 첨부</span>
                    <span className="text-xs text-gray-500 mt-2 text-center">문서, PDF 등<br/>참고자료</span>
                  </button>
                </div>
              </div>

              {/* 업로드된 항목 표시 목록 */}
              <div className="space-y-4">
                 {/* 이미지/텍스트 증거 목록 */}
                 {evidences.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-400 mb-2">등록된 증거 ({evidences.length})</p>
                    {evidences.map((evidence) => (
                      <div
                        key={evidence.id}
                        className={`p-4 rounded-lg border-2 ${
                          evidence.isKeyEvidence
                            ? 'border-purple-500 bg-purple-900 bg-opacity-10'
                            : 'border-[var(--color-court-border)] bg-[var(--color-court-dark)] bg-opacity-30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {evidence.isKeyEvidence && (
                              <span className="inline-block px-2 py-1 bg-purple-500 text-white text-xs font-bold rounded mb-2">
                                핵심 증거
                              </span>
                            )}
                            {evidence.type === 'image' ? (
                              <div className="relative group mt-1">
                                <img 
                                  src={evidence.content} 
                                  alt="증거 이미지" 
                                  className="h-24 w-auto rounded border border-[var(--color-court-border)] object-cover"
                                />
                              </div>
                            ) : (
                              <p className="text-base text-gray-300 break-words leading-relaxed">{evidence.content}</p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                           <button
                              onClick={() => toggleKeyEvidence(evidence.id)}
                              className={`px-3 py-1.5 text-xs border rounded transition-colors whitespace-nowrap ${evidence.isKeyEvidence ? 'border-purple-500 text-purple-400' : 'border-gray-600 text-gray-500 hover:border-purple-500'}`}
                            >
                              {evidence.isKeyEvidence ? '★ 핵심' : '☆ 중요 표시'}
                            </button>
                            <button
                              onClick={() => removeEvidence(evidence.id)}
                              className="px-3 py-1.5 text-xs border border-red-900 text-red-500 rounded hover:bg-red-900 hover:bg-opacity-20 transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 기타 첨부 파일 목록 */}
                {attachedFiles && attachedFiles.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-400 mb-2">첨부된 파일 ({attachedFiles.length})</p>
                    <ul className="grid grid-cols-1 gap-3">
                      {Array.from(attachedFiles).map((file, index) => (
                        <li key={index} className="flex items-center justify-between p-3 bg-[var(--color-court-dark)] border border-[var(--color-court-border)] rounded-lg text-sm text-gray-300 hover:border-gray-600 transition-colors">
                          <div className="flex items-center gap-3 truncate">
                            <Paperclip className="w-5 h-5 text-gray-500 flex-shrink-0" />
                            <span className="truncate">{file.name}</span>
                            <span className="text-xs text-gray-500 flex-shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* 💡 변론 팁 (심플 버전 - 테두리 제거 & 간격 추가) */}
            <div className="mt-8 mb-12 p-5 bg-purple-900 bg-opacity-20 rounded-xl flex gap-4 items-start">
               <div className="p-2 bg-purple-500/20 rounded-lg shrink-0">
                  <Shield className="w-6 h-6 text-purple-300" />
               </div>
               <div>
                  <h3 className="font-bold text-purple-200 mb-1">변론 팁</h3>
                  <p className="text-sm text-purple-300/80 leading-relaxed">
                     감정적인 호소보다는 객관적인 사실과 증거를 제시하세요.<br/>
                     AI 판사는 논리적 일관성과 증거의 신빙성을 중요하게 평가합니다.
                  </p>
               </div>
            </div>

            {/* 제출 버튼 */}
            <button
              onClick={handleSubmit}
              disabled={statement.trim().length === 0}
              className={`w-full px-6 py-5 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg ${
                statement.trim().length > 0
                  ? 'bg-gradient-to-r from-orange-700 to-orange-600 text-white hover:shadow-xl hover:scale-[1.02]'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
              }`}
            >
              <Send className="w-6 h-6" />
              변론서 제출하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
