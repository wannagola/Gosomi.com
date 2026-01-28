import { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  AlertCircle,
  Share2,
  CheckCircle,
  ImageIcon,
} from "lucide-react";
import { LAWS, LawType, Evidence } from "@/types/court";
import { Friend } from "@/types/user";
import { FriendSelectionModal } from "./FriendSelectionModal";
import { ShareSuccessModal } from "./ShareSuccessModal";

declare global {
  interface Window {
    Kakao: any;
  }
}

type FormData = {
  title: string;
  plaintiff: string;
  plaintiffId: string;
  defendant: string;
  defendantId: string;
  lawType: LawType;
  content: string;
  juryEnabled: boolean;
  juryMode: "INVITE" | "RANDOM";
  invitedJurors?: string[]; // IDs
  juryInvitedUserIds?: string[]; // API field
};

interface FilingPageProps {
  currentUser?: any; // Add currentUser prop
  onSubmit: (caseData: FormData & { evidences: Evidence[] }) => Promise<string | void>;
  onCancel: () => void;
  friends?: Friend[];
}

export function FilingPage({ currentUser, onSubmit, onCancel, friends = [] }: FilingPageProps) {
  // Load from localStorage on mount
  const [step, setStep] = useState<1 | 2 | 3>(() => {
    const saved = localStorage.getItem('filingStep');
    return saved ? (parseInt(saved) as 1 | 2 | 3) : 1;
  });

  const [formData, setFormData] = useState<FormData>(() => {
    const saved = localStorage.getItem('filingFormData');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved form data', e);
      }
    }
    return {
      title: "",
      plaintiff: currentUser?.nickname || "",
      plaintiffId: currentUser?.id || "",
      defendant: "",
      defendantId: "",
      lawType: "" as LawType,
      content: "",
      juryEnabled: false,
      juryMode: "INVITE",
      invitedJurors: [],
      juryInvitedUserIds: []
    };
  });

  // Sync plaintiff data with currentUser
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        plaintiff: currentUser.nickname || (currentUser as any).name || "",
        plaintiffId: currentUser.id
      }));
    }
  }, [currentUser]);

  const [evidences, setEvidences] = useState<Evidence[]>(() => {
    const saved = localStorage.getItem('filingEvidences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved evidences', e);
      }
    }
    return [];
  });
  const [shareLink, setShareLink] = useState("");

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('filingStep', String(step));
  }, [step]);

  useEffect(() => {
    localStorage.setItem('filingFormData', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem('filingEvidences', JSON.stringify(evidences));
  }, [evidences]);

  // Clear localStorage on unmount or completion
  const clearFilingCache = () => {
    localStorage.removeItem('filingStep');
    localStorage.removeItem('filingFormData');
    localStorage.removeItem('filingEvidences');
  };

  const handleSubmit = () => {
    if (step !== 3) return;
    clearFilingCache();
    onSubmit({
      ...formData,
      evidences,
    });
  };

  const handleCancel = () => {
    clearFilingCache();
    onCancel();
  };

  // ✅ 링크를 "현재 도메인(origin)" 기준으로 생성 (Real ID from submit)
  const generateShareLink = (realCaseId: string) => {
    const origin = window.location.origin; // 예: http://localhost:5173
    const link = `${origin}/defense/${realCaseId}`;
    setShareLink(link);
    return link;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--color-court-dark)] to-[#05050a] py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* 진행 단계 표시 */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4 mb-8">
            <StepIndicator
              number={1}
              label="사건 정보"
              active={step === 1}
              completed={step > 1}
            />
            <div className="w-16 h-0.5 bg-[var(--color-court-border)]" />
            <StepIndicator
              number={2}
              label="증거 제출"
              active={step === 2}
              completed={step > 2}
            />
            <div className="w-16 h-0.5 bg-[var(--color-court-border)]" />
            <StepIndicator
              number={3}
              label="접수 완료"
              active={step === 3}
              completed={false}
            />
          </div>
        </div>

        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <FileText className="w-10 h-10 text-[var(--color-gold-accent)]" />
            <h1 className="text-4xl">사건 접수</h1>
          </div>
          <p className="text-gray-400">
            정확한 정보와 증거를 제출해 주세요. AI 판사가 공정하게 심판합니다.
          </p>
        </div>

        {/* 메인 폼 */}
        <div className="official-document rounded-2xl p-8">
          {step === 1 && (
            <Step1BasicInfo
              formData={formData}
              setFormData={setFormData}
              onNext={() => setStep(2)}
              onCancel={handleCancel}
              friends={friends}
            />
          )}

          {step === 2 && (
            <Step2Evidence
              evidences={evidences}
              setEvidences={setEvidences}
              onNext={async () => {
                // Submit here!
                try {
                  const caseId = await onSubmit({
                    ...formData,
                    evidences
                  });
                  if (caseId) {
                    generateShareLink(String(caseId));
                    clearFilingCache();
                    setStep(3);
                  }
                } catch (e) {
                  console.error("Submission error", e);
                  // Alert handled in App.tsx but we can ensure here too if needed
                }
              }}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && (
            <Step3Summon
              formData={formData}
              shareLink={shareLink}
              onSubmit={handleSubmit} // Unused now basically
              onBack={() => window.location.href = `/case/${shareLink.split('/').pop()}`} // Go to Waiting
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface StepIndicatorProps {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}

function StepIndicator({
  number,
  label,
  active,
  completed,
}: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold border-2 transition-all ${completed
          ? "bg-[var(--color-gold-primary)] border-[var(--color-gold-primary)] text-white"
          : active
            ? "bg-[var(--color-gold-dark)] border-[var(--color-gold-accent)] text-white"
            : "bg-transparent border-[var(--color-court-border)] text-gray-500"
          }`}
      >
        {completed ? <CheckCircle className="w-6 h-6" /> : number}
      </div>
      <span
        className={`text-sm mt-2 ${active ? "text-[var(--color-gold-accent)]" : "text-gray-500"
          }`}
      >
        {label}
      </span>
    </div>
  );
}

interface Step1Props {
  formData: FormData;
  setFormData: (data: FormData) => void;
  onNext: () => void;
  onCancel: () => void;
  friends: Friend[];
}

function Step1BasicInfo({
  formData,
  setFormData,
  onNext,
  onCancel,
  friends,
}: Step1Props) {
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);

  const isValid =
    formData.title &&
    formData.plaintiffId &&
    formData.defendantId &&
    formData.lawType &&
    formData.content;

  const handleInviteFriends = () => {
    setIsFriendModalOpen(true);
  };

  const handleFriendSelection = (selectedFriends: Friend[]) => {
    setFormData({
      ...formData,
      invitedJurors: selectedFriends.map(f => f.id),
      juryInvitedUserIds: selectedFriends.map(f => f.id)
    });
    setIsFriendModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl mb-6">기본 정보 입력</h2>

      {/* 사건명 */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-gold-primary)] mb-2">
          사건명 *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="예: 김철수의 약속 위반 사건"
          className="w-full px-4 py-3 bg-[var(--color-court-dark)] border-2 border-[var(--color-court-border)] rounded-lg text-white placeholder-gray-500 focus:border-[var(--color-gold-primary)] focus:outline-none"
        />
      </div>

      {/* 원고/피고 */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-gold-primary)] mb-2">
            원고 (고소인) *
          </label>
          <input
            type="text"
            value={formData.plaintiff}
            readOnly
            className="w-full px-4 py-3 bg-[var(--color-court-dark)] border-2 border-[var(--color-court-border)] rounded-lg text-gray-400 cursor-not-allowed focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-gold-primary)] mb-2">
            피고 (피소인 - 친구 선택) *
          </label>
          <select
            value={formData.defendantId}
            onChange={(e) => {
              const selectedId = e.target.value;
              console.log('Selected ID:', selectedId);
              console.log('Friends:', friends);
              const selectedFriend = friends.find(f => String(f.id) === String(selectedId));
              console.log('Selected Friend:', selectedFriend);
              const defendantName = selectedFriend?.nickname || (selectedFriend as any)?.name || '';
              console.log('Defendant Name:', defendantName);
              setFormData({
                ...formData,
                defendantId: selectedId,
                defendant: defendantName
              });
            }}
            className="w-full px-4 py-3 bg-[var(--color-court-dark)] border-2 border-[var(--color-court-border)] rounded-lg text-white focus:border-[var(--color-gold-primary)] focus:outline-none appearance-none"
          >
            <option value="">친구를 선택하세요</option>
            {friends.map(friend => (
              <option key={friend.id} value={friend.id}>
                {friend.nickname || (friend as any).name || '이름 없음'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 법률 선택 */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-gold-primary)] mb-2">
          적용 법률 *
        </label>
        <div className="grid md:grid-cols-4 gap-3">
          {LAWS.map((law) => (
            <button
              key={law.id}
              type="button"
              onClick={() => setFormData({ ...formData, lawType: law.id })}
              className={`p-4 rounded-lg border-2 transition-all ${formData.lawType === law.id
                ? "border-[var(--color-gold-accent)] bg-[var(--color-gold-dark)] bg-opacity-20"
                : "border-[var(--color-court-border)] hover:border-[var(--color-gold-dark)]"
                }`}
            >
              <div className="mb-2">
                <img src={law.icon} alt={law.title} className="w-12 h-12 mx-auto object-contain" />
              </div>
              <div className="text-sm font-medium">{law.title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 사건 상세 */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-gold-primary)] mb-2">
          사건 상세 내용 *
        </label>
        <textarea
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          placeholder="무슨 일이 있었는지 상세히 작성해 주세요. 육하원칙에 따라 작성하면 좋습니다."
          rows={8}
          className="w-full px-4 py-3 bg-[var(--color-court-dark)] border-2 border-[var(--color-court-border)] rounded-lg text-white placeholder-gray-500 focus:border-[var(--color-gold-primary)] focus:outline-none resize-none"
        />
      </div>

      {/* 배심원 투표 옵션 */}
      <div className="p-6 bg-purple-900 bg-opacity-20 border-2 border-purple-700 border-opacity-30 rounded-lg">
        <div className="flex items-start gap-3 mb-4">
          <input
            type="checkbox"
            id="juryEnabled"
            checked={formData.juryEnabled}
            onChange={(e) =>
              setFormData({ ...formData, juryEnabled: e.target.checked })
            }
            className="w-5 h-5 mt-0.5 rounded border-purple-500 bg-[var(--color-court-dark)] text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
          />
          <div className="flex-1">
            <label
              htmlFor="juryEnabled"
              className="text-lg font-bold text-purple-300 cursor-pointer"
            >
              👥 배심원 투표 활성화
            </label>
            <p className="text-sm text-gray-400 mt-1">
              친구들에게 의견을 물어보고 여론을 확인할 수 있습니다. AI 판결과
              비교해보세요!
            </p>
          </div>
        </div>

        {formData.juryEnabled && (
          <div className="mt-4 pt-4 border-t border-purple-800">
            <label className="block text-sm font-medium text-purple-300 mb-3">
              배심원 선택 방식
            </label>
            <div className="grid md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, juryMode: "INVITE" })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${formData.juryMode === "INVITE"
                  ? "border-purple-500 bg-purple-900 bg-opacity-30"
                  : "border-purple-800 border-opacity-30 hover:border-purple-700"
                  }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📨</span>
                  <span className="font-bold text-purple-300">초대하기</span>
                </div>
                <p className="text-xs text-gray-400">
                  특정 친구들에게 배심원 링크를 공유하여 투표를 받습니다
                </p>
                {formData.juryMode === 'INVITE' && (
                  <div className="mt-3">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInviteFriends();
                      }}
                      className="w-full py-2 bg-purple-700 hover:bg-purple-600 rounded text-center text-sm font-bold text-white transition-colors cursor-pointer"
                    >
                      친구 초대하기 {formData.invitedJurors && formData.invitedJurors.length > 0 ? `(${formData.invitedJurors.length}명 선택됨)` : ''}
                    </div>
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, juryMode: "RANDOM" })}
                className={`p-4 rounded-lg border-2 transition-all text-left ${formData.juryMode === "RANDOM"
                  ? "border-purple-500 bg-purple-900 bg-opacity-30"
                  : "border-purple-800 border-opacity-30 hover:border-purple-700"
                  }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎲</span>
                  <span className="font-bold text-purple-300">랜덤 배정</span>
                </div>
                <p className="text-xs text-gray-400">
                  고소미닷컴의 랜덤 배심원단이 자동으로 배정됩니다 (최대 5명)
                </p>
              </button>
            </div>
          </div>
        )}
      </div>

      {isFriendModalOpen && (
        <FriendSelectionModal
          friends={friends.filter(f => String(f.id) !== String(formData.defendantId) && String(f.id) !== String(formData.plaintiffId))}
          onClose={() => setIsFriendModalOpen(false)}
          onConfirm={handleFriendSelection}
          maxSelection={5}
          initialSelectedIds={formData.invitedJurors}
        />
      )}

      {/* 주의사항 */}
      <div className="p-4 bg-blue-900 bg-opacity-20 border border-blue-700 border-opacity-30 rounded-lg flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-200">
          <p className="font-semibold mb-1">작성 시 유의사항</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>
              허위 사실을 기재하지 마세요. AI 판사는 논리적 일관성을 검토합니다.
            </li>
            <li>감정적인 표현보다 객관적인 사실을 위주로 작성하세요.</li>
            <li>피고에게 변론 기회가 24시간 주어집니다.</li>
          </ul>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-4 pt-4">
        <button
          onClick={onCancel}
          className="flex-1 px-6 py-3 border-2 border-[var(--color-court-border)] rounded-lg text-gray-300 hover:border-[var(--color-gold-dark)] transition-all"
        >
          취소
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className={`flex-1 px-6 py-3 rounded-lg font-bold transition-all ${isValid
            ? "bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold-primary)] text-white hover:shadow-lg"
            : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
        >
          다음 단계: 증거 제출
        </button>
      </div>
    </div>
  );
}

interface Step2Props {
  evidences: Evidence[];
  setEvidences: (evidences: Evidence[]) => void;
  onNext: () => void;
  onBack: () => void;
}

function Step2Evidence({
  evidences,
  setEvidences,
  onNext,
  onBack,
}: Step2Props) {
  const [textEvidence, setTextEvidence] = useState("");

  const addTextEvidence = () => {
    if (!textEvidence.trim()) return;

    setEvidences([
      ...evidences,
      {
        id: Date.now().toString(),
        type: "text",
        content: textEvidence,
        isKeyEvidence: false,
      },
    ]);
    setTextEvidence("");
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
        e.id === id ? { ...e, isKeyEvidence: !e.isKeyEvidence } : e,
      ),
    );
  };

  const removeEvidence = (id: string) => {
    setEvidences(evidences.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl mb-6">증거 제출</h2>

      {/* 증거 추가 */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-gold-primary)] mb-2">
          증거 추가 (선택사항)
        </label>
        <div className="flex gap-2">
          <textarea
            value={textEvidence}
            onChange={(e) => setTextEvidence(e.target.value)}
            placeholder="카톡 대화 내용, 약속 내용, 목격 증언 등을 작성하세요"
            rows={3}
            className="flex-1 px-4 py-3 bg-[var(--color-court-dark)] border-2 border-[var(--color-court-border)] rounded-lg text-white placeholder-gray-500 focus:border-[var(--color-gold-primary)] focus:outline-none resize-none"
          />
          <button
            type="button"
            onClick={addTextEvidence}
            className="px-6 py-3 bg-[var(--color-gold-dark)] text-white rounded-lg hover:bg-[var(--color-gold-primary)] transition-colors"
          >
            <Upload className="w-5 h-5" />
          </button>
        </div>

        {/* Image Upload */}
        <div className="mt-3">
          <input
            type="file"
            id="image-evidence-input"
            accept="image/*"
            onChange={addImageEvidence}
            className="hidden"
            style={{ display: 'none' }}
          />
          <label
            htmlFor="image-evidence-input"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-court-gray)] border-2 border-[var(--color-court-border)] rounded-lg text-gray-300 hover:border-[var(--color-gold-primary)] hover:text-white transition-colors cursor-pointer"
          >
            <ImageIcon className="w-5 h-5" />
            이미지 증거 첨부
          </label>
          <span className="ml-3 text-xs text-gray-500">최대 2MB, JPG/PNG/GIF</span>
        </div>
      </div>

      {/* 증거 목록 */}
      {evidences.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-gold-primary)] mb-3">
            제출된 증거 ({evidences.length}건)
          </h3>
          <div className="space-y-3">
            {evidences.map((evidence) => (
              <div
                key={evidence.id}
                className={`p-4 rounded-lg border-2 ${evidence.isKeyEvidence
                  ? "border-[var(--color-gold-accent)] bg-[var(--color-gold-dark)] bg-opacity-10"
                  : "border-[var(--color-court-border)] bg-[var(--color-court-dark)] bg-opacity-30"
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {evidence.isKeyEvidence && (
                      <span className="inline-block px-2 py-1 bg-[var(--color-gold-accent)] text-black text-xs font-bold rounded mb-2">
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
                      type="button"
                      onClick={() => toggleKeyEvidence(evidence.id)}
                      className="px-3 py-1 text-xs border border-[var(--color-gold-dark)] rounded hover:bg-[var(--color-gold-dark)] transition-colors"
                    >
                      {evidence.isKeyEvidence ? "일반" : "핵심"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeEvidence(evidence.id)}
                      className="px-3 py-1 text-xs border border-red-700 text-red-400 rounded hover:bg-red-900 hover:bg-opacity-20 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 안내 */}
      <div className="p-4 bg-purple-900 bg-opacity-20 border border-purple-700 border-opacity-30 rounded-lg flex gap-3">
        <AlertCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-purple-200">
          <p className="font-semibold mb-1">증거 채택 안내</p>
          <p className="text-xs">
            '핵심 증거'로 표시된 항목은 AI 판사가 판결 시 우선적으로 참조합니다.
            증거가 없어도 접수는 가능하나, 판결의 정확도가 낮아질 수 있습니다.
          </p>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-4 pt-4">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 border-2 border-[var(--color-court-border)] rounded-lg text-gray-300 hover:border-[var(--color-gold-dark)] transition-all"
        >
          이전
        </button>
        <button
          onClick={onNext}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold-primary)] text-white rounded-lg font-bold hover:shadow-lg transition-all"
        >
          사건 접수 완료하기
        </button>
      </div>
    </div>
  );
}

interface Step3Props {
  formData: FormData;
  shareLink: string;
  onSubmit: () => void;
  onBack: () => void;
}

function Step3Summon({ formData, shareLink, onSubmit, onBack }: Step3Props) {
  const [copied, setCopied] = useState(false);

  // 배심원 링크 생성
  const juryLink =
    formData.juryEnabled && formData.juryMode === "INVITE"
      ? shareLink.replace("/defense/", "/jury/")
      : "";

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const shareKakao = () => {
    if (!window.Kakao) {
      alert("Kakao SDK가 로드되지 않았습니다. index.html script 태그 확인!");
      return;
    }

    if (!window.Kakao.isInitialized()) {
      const key = import.meta.env.VITE_KAKAO_JS_KEY;
      if (!key) {
        alert("VITE_KAKAO_JS_KEY가 없습니다. .env.local 확인!");
        return;
      }
      window.Kakao.init(key);
    }

    if (!shareLink) {
      alert("공유할 링크가 아직 생성되지 않았습니다.");
      return;
    }

    window.Kakao.Link.sendDefault({
      objectType: "feed",
      content: {
        title: `📩 [고소미] ${formData.title}`,
        description: `${formData.plaintiff}님이 제기한 사건에 대한 변론을 진행해주세요. (24시간 내)`,
        imageUrl: `${window.location.origin}/gosomidotcom.png`,
        link: {
          mobileWebUrl: shareLink,
          webUrl: shareLink,
        },
      },
      buttons: [
        {
          title: "지금 변론하러 가기",
          link: {
            mobileWebUrl: shareLink,
            webUrl: shareLink,
          },
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl mb-6">접수 완료</h2>

      {/* 배심원 안내 (조건부) */}
      {formData.juryEnabled && (
        <div className="p-6 bg-purple-900 bg-opacity-30 border-2 border-purple-600 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">👥</span>
            <h3 className="text-lg font-bold text-purple-300">배심원 투표 활성화됨</h3>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            {formData.juryMode === 'INVITE'
              ? `선택한 친구 ${formData.invitedJurors?.length || 0}명에게 배심원 링크를 공유하여 투표를 받을 수 있습니다.`
              : '고소미닷컴의 랜덤 배심원 5명이 자동으로 배정되었습니다.'
            }
          </p>
        </div>
      )}

      {/* 경고 안내 */}
      <div className="p-4 bg-red-900 bg-opacity-30 border-2 border-red-700 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-200">
            <p className="font-semibold mb-1">⚠️ 중요 안내</p>
            <p className="text-xs leading-relaxed">
              소환장 수령 후 24시간 내에 변론하지 않을 경우, 패소 기본값이 적용됩니다.
              반드시 기한을 준수해 주시기 바랍니다.
            </p>
          </div>
        </div>
      </div>

      {/* 링크 복사 */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-gold-primary)] mb-2">
          피고 변론 링크
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={shareLink}
            readOnly
            className="flex-1 px-4 py-3 bg-[var(--color-court-dark)] border-2 border-[var(--color-court-border)] rounded-lg text-white text-sm font-mono focus:outline-none"
          />
          <button
            onClick={copyLink}
            className="px-6 py-3 bg-[var(--color-gold-dark)] hover:bg-[var(--color-gold-primary)] text-white font-bold rounded-lg transition-colors whitespace-nowrap"
          >
            {copied ? '복사됨!' : '복사'}
          </button>
        </div>
      </div>

      {/* 변론 배심원 안내 */}
      {formData.juryEnabled && formData.juryMode === 'INVITE' && (
        <div className="p-6 bg-purple-900 bg-opacity-20 border-2 border-purple-700 border-opacity-30 rounded-xl">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-3xl">⚖️</span>
            <div>
              <h3 className="text-lg font-bold text-purple-300 mb-2">변론 배심원 안내</h3>
              <p className="text-sm text-gray-300 leading-relaxed mb-3">
                한쪽 시점의 고소미닷컴이 아닌 배심원 15~30명의 자유로운 투표를 반영하여 투표를 진행합니다.
              </p>
              <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                <li>배심원들은 사건 내용을 확인 후 투표합니다</li>
                <li>배심 결과는 AI 판결과 함께 비교됩니다</li>
                <li>투표 결과는 AI 판결에 참고 자료로 활용됩니다</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 공유 버튼 */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={shareKakao}
          className="py-3 bg-[#FEE500] text-[#000000] rounded-lg font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <span className="text-lg">💬</span>
          카카오톡으로 전송
        </button>
        <button
          onClick={copyLink}
          className="py-3 bg-[var(--color-court-gray)] border-2 border-[var(--color-court-border)] text-white rounded-lg font-bold hover:border-[var(--color-gold-primary)] transition-all flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          다른 방법으로 공유
        </button>
      </div>

      {/* 버튼 */}
      <div className="flex gap-4 pt-4">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 border-2 border-[var(--color-court-border)] rounded-lg text-gray-300 hover:border-[var(--color-gold-dark)] transition-all"
        >
          이전
        </button>
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-green-700 to-green-600 text-white rounded-lg font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          사건 접수 완료
        </button>
      </div>
    </div>
  );
}

// Hamster Modal Component
function HamsterModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
      <div className="bg-[#1a1a24] border-2 border-orange-500 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 flex flex-col items-center text-center">
          <div className="w-full mb-4 rounded-xl overflow-hidden bg-gradient-to-b from-orange-100 to-orange-50">
            <img
              src="/hamster.png"
              alt="고구마 먹는 햄스터"
              className="w-full h-auto"
            />
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">
            🐹 잠시만요!
          </h3>

          <p className="text-gray-300 mb-6 leading-relaxed">
            피고가 답변을 준비하는 동안<br />
            귀여운 햄스터가 고구마를 먹고 있어요!<br />
            <span className="text-orange-400 font-bold">조금만 기다려주세요 💕</span>
          </p>

          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold rounded-lg transition-all"
          >
            대기실로 이동하기
          </button>
        </div>
      </div>
    </div>
  );
}
