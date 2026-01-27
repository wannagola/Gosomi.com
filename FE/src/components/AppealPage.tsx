import { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield, Upload, Paperclip, Send } from 'lucide-react';
import { Case, Evidence } from '@/types/court';

interface AppealPageProps {
  case_: Case;
  onSubmitAppeal: (
    caseId: string,
    litigant: 'plaintiff' | 'defendant',
    statement: string,
    evidences: Evidence[]
  ) => void;
}

export function AppealPage({ case_, onSubmitAppeal }: AppealPageProps) {
  const [searchParams] = useSearchParams();
  const litigant = searchParams.get('litigant');

  const [plaintiffAppeal, setPlaintiffAppeal] = useState('');
  const [defendantAppeal, setDefendantAppeal] = useState('');
  const [plaintiffFiles, setPlaintiffFiles] = useState<FileList | null>(null);
  const [defendantFiles, setDefendantFiles] = useState<FileList | null>(null);

  const plaintiffFileInputRef = useRef<HTMLInputElement>(null);
  const defendantFileInputRef = useRef<HTMLInputElement>(null);

  const handlePlaintiffFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaintiffFiles(e.target.files);
  };

  const handleDefendantFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDefendantFiles(e.target.files);
  };

  const handleSubmit = () => {
    if (litigant === 'plaintiff' && plaintiffAppeal.trim()) {
      onSubmitAppeal(case_.id, 'plaintiff', plaintiffAppeal, []); // Placeholder for file evidence
    } else if (litigant === 'defendant' && defendantAppeal.trim()) {
      onSubmitAppeal(case_.id, 'defendant', defendantAppeal, []); // Placeholder for file evidence
    }
  };

  const isSubmitDisabled = () => {
    if (litigant === 'plaintiff') {
      return !plaintiffAppeal.trim();
    }
    if (litigant === 'defendant') {
      return !defendantAppeal.trim();
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--color-court-dark)] to-[#05050a] pb-12 px-6 relative z-10" style={{ paddingTop: '150px' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-red-400" />
            <h1 className="text-4xl">항소심 재판</h1>
          </div>
          <p className="text-gray-400 mb-4">
            1심 판결에 불복하여 항소심이 제기되었습니다.
            <br />
            아래 1심 주장을 확인하고, 추가적인 주장과 증거를 제출하여 주시기 바랍니다.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 왼쪽: 1심 주장 내용 */}
          <div className="official-document rounded-2xl p-8 space-y-6">
            <h2 className="text-2xl">1심 주장 요약</h2>
            <div>
              <h3 className="text-lg font-semibold text-purple-400 mb-2">원고측 주장</h3>
              <div className="p-4 bg-purple-900 bg-opacity-20 rounded-lg border-l-4 border-purple-600">
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {case_.description}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-orange-400 mb-2">피고측 변론</h3>
              <div className="p-4 bg-orange-900 bg-opacity-20 rounded-lg border-l-4 border-orange-600">
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {case_.defendantResponse?.statement || '피고는 1심에서 변론하지 않았습니다.'}
                </p>
              </div>
            </div>
          </div>

          {/* 오른쪽: 항소심 변론 입력 */}
          <div className="official-document rounded-2xl p-8 space-y-8">
            <h2 className="text-2xl">항소심 변론</h2>

            {!litigant && (
                <div className="text-center py-16 text-gray-500">
                    <p className="text-lg">잘못된 접근입니다.</p>
                    <p className="text-sm mt-2">유효한 항소 링크를 통해 접속해주세요.</p>
                </div>
            )}
            
            {litigant === 'plaintiff' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-purple-400">원고측 추가 변론</h3>
                <textarea
                  value={plaintiffAppeal}
                  onChange={(e) => setPlaintiffAppeal(e.target.value)}
                  placeholder="1심 판결에 대한 불복 사유와 추가 주장을 작성하세요."
                  rows={6}
                  className="w-full px-4 py-3 bg-[var(--color-court-dark)] border-2 border-[var(--color-court-border)] rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                />
                <FileUploadButton
                  fileInputRef={plaintiffFileInputRef}
                  handleFileChange={handlePlaintiffFileChange}
                  attachedFiles={plaintiffFiles}
                  color="purple"
                />
              </div>
            )}
            
            {litigant === 'defendant' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-orange-400">피고측 추가 변론</h3>
                <textarea
                  value={defendantAppeal}
                  onChange={(e) => setDefendantAppeal(e.target.value)}
                  placeholder="1심 판결에 대한 불복 사유와 추가 주장을 작성하세요."
                  rows={6}
                  className="w-full px-4 py-3 bg-[var(--color-court-dark)] border-2 border-[var(--color-court-border)] rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none resize-none"
                />
                <FileUploadButton
                  fileInputRef={defendantFileInputRef}
                  handleFileChange={handleDefendantFileChange}
                  attachedFiles={defendantFiles}
                  color="orange"
                />
              </div>
            )}
            
            {litigant && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitDisabled()}
                className="w-full px-6 py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-3 bg-gradient-to-r from-green-700 to-green-600 text-white hover:shadow-lg hover:scale-105 disabled:bg-gray-700 disabled:cursor-not-allowed"
              >
                <Send className="w-6 h-6" />
                항소심 변론 제출하기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// FileUploadButton
interface FileUploadButtonProps {
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    attachedFiles: FileList | null;
    color: 'purple' | 'orange';
}

function FileUploadButton({fileInputRef, handleFileChange, attachedFiles, color}: FileUploadButtonProps) {
    return (
        <div>
            <input
                type="file"
                ref={fileInputRef}
                multiple
                onChange={handleFileChange}
                className="hidden"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-transparent border-2 border-dashed border-[var(--color-court-border)] rounded-lg text-gray-400 hover:border-${color}-500 hover:text-${color}-400 transition-colors`}
            >
                <Upload className="w-5 h-5" />
                <span>증거 파일 첨부</span>
            </button>
            {attachedFiles && attachedFiles.length > 0 && (
            <div className="mt-3 space-y-2 text-sm">
                <p className="font-semibold text-gray-300">첨부된 파일:</p>
                <ul className="list-disc list-inside text-gray-400 space-y-1">
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
    )
}
