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
    evidences: Evidence[],
    files: FileList | null
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
      onSubmitAppeal(case_.id, 'plaintiff', plaintiffAppeal, [], plaintiffFiles);
    } else if (litigant === 'defendant' && defendantAppeal.trim()) {
      onSubmitAppeal(case_.id, 'defendant', defendantAppeal, [], defendantFiles);
    }
  };

  // Determine if I am the one who needs to wait
  // If appeal is requested, and I am the appellant, I wait.
  // If appeal is requested, and I am the appellee (the other side), I need to submit defense.

  // Actually, we need to know who initiated the appeal. 
  // case_.appealStatus === 'REQUESTED' means someone appealed.
  // We need to know WHO appealed. 
  // Current API might not explicitly say 'appellant_id' in case object, but usually 'appeal_status' implies flow.
  // If litigant matches who *should* be acting, we show form. 
  // If litigant matches who *already* acting, we show wait.

  // Simplification for now:
  // If I am submitting, I submit.
  // If I already submitted (how to track?), I wait.
  // We can assume if 'REQUESTED' and I am 'appellant' (who started it), I am waiting for 'appellee'.
  // We need 'appellant' field in Case or infer from status.

  // Let's assume for now:
  // If I visit this page and I am the 'litigant' in URL, I want to submit.
  // BUT if the status says 'REQUESTED', it might mean I ALREADY submitted.
  // We need to know if *I* submitted.

  // Check if I already submitted appeal/defense?
  // Frontend doesn't have 'myAppealSubmission' in props.
  // We can rely on case_.appealStatus. 
  // If appealStatus is 'REQUESTED', and I am the Appellant (initiator), then I am waiting.
  // If appealStatus is 'REQUESTED', and I am the Appellee (responder), then I see form.

  // Missing 'appellant' info in Case type? 
  // Let's assume the user who clicks "Appeal" becomes the initiator.
  // The backend should store who appealed.

  // For now, let's fix the "litigant=undefined" issue first by ensuring App.tsx passes it.
  // And fix the "No defense" display.

  if (case_.appealStatus === 'REQUESTED') {
    // Need to know if I am the one who needs to respond.
    // If I am the defendant, and plaintiff appealed, I need to respond.
    // If I am the plaintiff, and I appealed, I wait.

    // We need 'appellant_id' or similar from backend to be sure.
    // Assuming we don't have it easily, we can check if 'defendantResponse' (for appeal) exists?
    // Or 'appealContent'.
  }

  const isSubmitDisabled = () => {
    if (litigant === 'plaintiff') {
      return !plaintiffAppeal.trim();
    }
    if (litigant === 'defendant') {
      return !defendantAppeal.trim();
    }
    return true;
  };

  // Check if current user is the appellant (initiator) or appellee (responder)
  // Since we don't have explicit 'appellantId' in Case type yet, we infer from url/role + status.
  // If status is 'REQUESTED', it means an appeal has been filed.

  // Logic: 
  // If status is 'REQUESTED':
  // - If I am the requester (Initiator), I wait.
  // - If I am not the requester (Responder), I see the form.
  const isInitiator = case_.appeal?.requester === litigant;
  const isWaiting = case_.appealStatus === 'REQUESTED' && isInitiator;

  if (isWaiting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--color-court-dark)] to-[#05050a] flex flex-col items-center justify-center p-4 relative z-10 pt-52">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-[100px] opacity-20 rounded-full animate-pulse"></div>
            <Shield className="w-24 h-24 mx-auto text-blue-400 relative z-10" />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              상대방의 답변을 기다리는 중입니다
            </h1>
            <p className="text-gray-400 text-lg">
              항소장이 성공적으로 접수되었습니다.<br />
              상대방이 답변서를 제출하면<br />
              AI 판사의 재심 판결이 시작됩니다.
            </p>
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--color-court-dark)] to-[#05050a] pt-52 pb-12 px-6 relative z-10">
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
                  {case_.content || case_.description}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-orange-400 mb-2">피고측 변론</h3>
              <div className="p-4 bg-orange-900 bg-opacity-20 rounded-lg border-l-4 border-orange-600">
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {case_.defenseContent || case_.defendantResponse?.statement || '1심 변론 내용이 없습니다.'}
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
              <div className="space-y-6">
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
              <div className="space-y-6">
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
              <div className="pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitDisabled()}
                  className="w-full px-6 py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-3 bg-gradient-to-r from-green-700 to-green-600 text-white hover:shadow-lg hover:scale-105 disabled:bg-gray-700 disabled:cursor-not-allowed"
                >
                  <Send className="w-6 h-6" />
                  항소심 변론 제출하기
                </button>
              </div>
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

function FileUploadButton({ fileInputRef, handleFileChange, attachedFiles, color }: FileUploadButtonProps) {
  return (
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
