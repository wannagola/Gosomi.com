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

  const law = LAWS.find(l => l.id === case_.lawType);
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
                  <span className="text-3xl">{law?.icon}</span>
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
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--color-gold-primary)] mb-2">
                변론 내용 *
              </label>
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="원고의 주장에 대한 반박을 작성하세요. 사실 관계를 명확히 하고, 정당한 사유가 있었다면 설명해 주세요."
                rows={12}
                className="w-full px-4 py-3 bg-[var(--color-court-dark)] border-2 border-[var(--color-court-border)] rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                {statement.length}자 작성됨 (최소 50자 권장)
              </p>
            </div>

            {/* 증거 추가 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--color-gold-primary)] mb-2">
                반박 증거 추가 (선택)
              </label>
              <div className="flex gap-2 mb-3">
                <textarea
                  value={textEvidence}
                  onChange={(e) => setTextEvidence(e.target.value)}
                  placeholder="반박 증거를 작성하세요"
                  rows={2}
                  className="flex-1 px-4 py-3 bg-[var(--color-court-dark)] border-2 border-[var(--color-court-border)] rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                />
                <button
                  onClick={addTextEvidence}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                </button>
              </div>

              {/* Image Upload */}
              <div className="mb-3">
                <input
                  type="file"
                  id="defense-image-input"
                  accept="image/*"
                  onChange={addImageEvidence}
                  className="hidden"
                />
                <label
                  htmlFor="defense-image-input"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-court-gray)] border-2 border-[var(--color-court-border)] rounded-lg text-gray-300 hover:border-purple-500 hover:text-white transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-5 h-5" />
                  이미지 증거 첨부
                </label>
                <span className="ml-3 text-xs text-gray-500">최대 2MB, JPG/PNG/GIF</span>
              </div>

              {evidences.length > 0 && (
                <div className="space-y-2">
                  {evidences.map((evidence) => (
                    <div
                      key={evidence.id}
                      className={`p-3 rounded-lg border-2 ${
                        evidence.isKeyEvidence
                          ? 'border-purple-500 bg-purple-900 bg-opacity-10'
                          : 'border-[var(--color-court-border)] bg-[var(--color-court-dark)] bg-opacity-30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {evidence.isKeyEvidence && (
                            <span className="inline-block px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded mb-1">
                              핵심 증거
                            </span>
                          )}
                          {evidence.type === 'image' ? (
                            <img 
                              src={evidence.content} 
                              alt="증거 이미지" 
                              className="max-w-md rounded-lg border border-[var(--color-court-border)]"
                            />
                          ) : (
                            <p className="text-sm text-gray-300">{evidence.content}</p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => toggleKeyEvidence(evidence.id)}
                            className="px-2 py-1 text-xs border border-purple-600 rounded hover:bg-purple-900 hover:bg-opacity-20 transition-colors"
                          >
                            {evidence.isKeyEvidence ? '일반' : '핵심'}
                          </button>
                          <button
                            onClick={() => removeEvidence(evidence.id)}
                            className="px-2 py-1 text-xs border border-red-700 text-red-400 rounded hover:bg-red-900 hover:bg-opacity-20 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--color-gold-primary)] mb-2">
                증거 파일 첨부 (선택)
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
                <span>컴퓨터에서 파일 선택</span>
              </button>
              {attachedFiles && attachedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-semibold text-gray-300">첨부된 파일:</p>
                  <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                    {Array.from(attachedFiles).map((file, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-gray-500" />
                        <span>{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 안내 */}
            <div className="p-4 bg-purple-900 bg-opacity-20 border border-purple-700 border-opacity-30 rounded-lg mb-6">
              <p className="text-sm text-purple-200">
                <span className="font-bold">💡 변론 팁:</span> 감정적인 반응보다 객관적인 사실과 증거를 제시하세요.
                AI 판사는 논리적 일관성과 증거의 신빙성을 중요하게 평가합니다.
              </p>
            </div>

            {/* 제출 버튼 */}
            <button
              onClick={handleSubmit}
              disabled={statement.trim().length === 0}
              className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                statement.trim().length > 0
                  ? 'bg-gradient-to-r from-orange-700 to-orange-600 text-white hover:shadow-lg hover:scale-105'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
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
