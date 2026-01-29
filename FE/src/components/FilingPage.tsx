import { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  AlertCircle,
  Share2,
  CheckCircle,
  ImageIcon,
  Copy,
  Gavel,
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

import { useNavigate } from "react-router-dom";

export function FilingPage({ currentUser, onSubmit, onCancel, friends = [] }: FilingPageProps) {
  const navigate = useNavigate();

  // Load from localStorage on mount
  // ✅ Fix: If saved step is 3 (Completed), reset to 1 (New Filing) to prevent getting stuck on Summons page
  const [step, setStep] = useState<1 | 2 | 3>(() => {
    const saved = localStorage.getItem('filingStep');
    const parsed = saved ? (parseInt(saved) as 1 | 2 | 3) : 1;
    return parsed === 3 ? 1 : parsed;
  });

  const [formData, setFormData] = useState<FormData>(() => {
    // If we are resetting from step 3 (detected via localStorage check above, but we can't access 'step' variable here yet), 
    // strictly speaking we should clear data. 
    // But for simplicity/robustness: if we are starting fresh, we might want to allow data recovery.
    // However, user likely wants a blank slate if they finished.
    // Let's check localStorage directly again.
    const savedStep = localStorage.getItem('filingStep');
    if (savedStep === '3') return {
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
                    defendantId: formData.defendantId,
                    evidences
                  });
                  if (caseId) {
                    generateShareLink(String(caseId));
                    // Do NOT clear cache yet, we need it for Step 3? 
                    // Actually we should clear basic info but maybe keep formData for Display in Step 3
                    // Let's keep it until they leave Step 3.
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
              onBack={() => {
                clearFilingCache(); // Clear State!
                const caseId = shareLink.split('/').pop();
                if (caseId) {
                  navigate(`/case/${caseId}`);
                } else {
                  navigate('/');
                }
              }}
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
              const selectedFriend = friends.find(f => String(f.id) === String(selectedId));
              const defendantName = selectedFriend?.nickname || (selectedFriend as any)?.name || '';
              setFormData({
                ...formData,
                defendantId: selectedId,
                defendant: defendantName,
                // Reset jurors if defendant changes to avoid conflicts (optional but safer)
                invitedJurors: [],
                juryInvitedUserIds: []
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
  const [showToast, setShowToast] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  const shareKakao = () => {
    if (!window.Kakao) {
      alert("Kakao SDK가 로드되지 않았습니다.");
      return;
    }

    if (!window.Kakao.isInitialized()) {
      const key = import.meta.env.VITE_KAKAO_JS_KEY;
      if (!key) {
        alert("VITE_KAKAO_JS_KEY가 없습니다.");
        return;
      }
      window.Kakao.init(key);
    }

    const description = formData.juryEnabled
      ? `${formData.plaintiff}님이 제기한 사건입니다. 배심원 투표와 변론이 진행됩니다.`
      : `${formData.plaintiff}님이 제기한 사건에 대한 변론을 진행해주세요. (24시간 내)`;

    window.Kakao.Link.sendDefault({
      objectType: "feed",
      content: {
        title: `⚖️ [고소미] ${formData.title}`,
        description: description,
        imageUrl: `${window.location.origin}/gosomidotcom.png`,
        link: {
          mobileWebUrl: shareLink,
          webUrl: shareLink,
        },
      },
      buttons: [
        {
          title: "사건 확인하기",
          link: {
            mobileWebUrl: shareLink,
            webUrl: shareLink,
          },
        },
      ],
    });
  };

  return (
    <div className="space-y-8 flex flex-col items-center animate-fade-in-up w-full">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4">
          <div className="bg-[#1a1a24] text-white px-6 py-3 rounded-full shadow-2xl border border-[var(--color-gold-primary)] flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="font-bold">링크가 복사되었습니다!</span>
          </div>
        </div>
      )}

      {/* 소환장 카드 (Summons Writ) - Dark Theme */}
      <div className="w-full max-w-lg bg-[#0a0a0f] border-2 border-[var(--color-gold-primary)] text-white p-8 rounded-lg shadow-[0_0_50px_rgba(212,175,55,0.15)] relative overflow-hidden font-serif">
        {/* 워터마크/배경 장식 */}
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Gavel className="w-40 h-40 text-[var(--color-gold-primary)]" />
        </div>
        
        {/* 헤더 */}
        <div className="text-center border-b border-[var(--color-gold-dark)] pb-6 mb-8 mt-2">
          <h2 className="text-4xl font-bold mb-3 tracking-[0.2em] text-[var(--color-gold-primary)]">소 환 장</h2>
          <p className="text-xs font-bold text-gray-500 tracking-[0.3em] uppercase">Digital Supreme Court</p>
        </div>

        {/* 본문 */}
        <div className="space-y-6 text-left px-2">
          <div className="flex items-center border-b border-gray-800 pb-3">
            <span className="font-bold w-24 text-gray-400">사 건</span>
            <span className="flex-1 font-bold text-xl text-white">{formData.title}</span>
          </div>
          <div className="flex items-center border-b border-gray-800 pb-3">
            <span className="font-bold w-24 text-gray-400">원 고</span>
            <span className="flex-1 font-semibold text-lg text-blue-300">{formData.plaintiff}</span>
          </div>
          <div className="flex items-center border-b border-gray-800 pb-3">
            <span className="font-bold w-24 text-gray-400">피 고</span>
            <span className="flex-1 font-semibold text-lg text-red-300">{formData.defendant}</span>
          </div>

          <div className="mt-10 text-center text-sm leading-8 text-gray-300 font-light">
            <p>위 사건에 관하여 귀하를 피고로 소환하오니,</p>
            <p className="text-white font-medium">본 소환장을 확인하는 즉시 변론기일에 출석하여</p>
            <p>답변서 및 증거를 제출하시기 바랍니다.</p>
            <p className="text-red-400 mt-4 text-xs">
              ※ 정당한 사유 없이 불출석할 경우 원고의 청구 취지대로 판결될 수 있습니다.
            </p>
          </div>
        </div>

        {/* 날짜 및 서명 */}
        <div className="mt-12 text-center pb-4">
          <p className="text-lg font-bold mb-6 text-gray-400">
            {new Date().getFullYear()}년 {new Date().getMonth() + 1}월 {new Date().getDate()}일
          </p>
          <div className="relative inline-block mt-2">
            <span className="text-2xl font-bold border-2 border-white px-8 py-3 tracking-widest">
              고 소 미 닷 컴
            </span>
            {/* 도장 효과 */}
            <div className="absolute -right-8 -top-6 transform rotate-12 opacity-90 mix-blend-screen">
              <div className="w-20 h-20 rounded-full border-4 border-red-600 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)] bg-red-900/10">
                <span className="text-[10px] text-red-500 font-bold tracking-tighter">OFFICIAL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 안내 메시지 */}
      <p className="text-gray-400 text-sm text-center animate-pulse">
        상대방에게 소환장을 보내 재판을 시작하세요.
      </p>

      {/* 공유 버튼 영역 */}
      <div className="w-full max-w-lg space-y-4">
        <button
          onClick={shareKakao}
          className="w-full py-4 bg-[#FEE500] text-[#000000] rounded-xl font-bold text-lg hover:shadow-[0_0_20px_#FEE50066] hover:scale-[1.01] transition-all flex items-center justify-center gap-3"
        >
          <span className="text-2xl">💬</span>
          카카오톡으로 소환장 보내기
        </button>

        <button
          onClick={copyLink}
          className="w-full py-4 bg-[#1a1a24] border border-gray-700 text-white rounded-xl font-bold text-lg hover:bg-[#2a2a35] hover:border-gray-500 hover:text-white transition-all flex items-center justify-center gap-3 group"
        >
          <Share2 className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          다른 방법으로 공유하기
        </button>
      </div>

      {/* 대기화면 이동 (하단 고정 느낌) */}
      <div className="pt-6 w-full max-w-lg border-t border-gray-800 mt-4 space-y-3">
        <button
          onClick={onBack}
          className="w-full py-4 bg-transparent border border-[var(--color-gold-dark)] text-[var(--color-gold-primary)] rounded-xl font-bold hover:bg-[var(--color-gold-dark)] hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          대기 화면으로 이동
        </button>
        
        <button
          onClick={() => {
            // Force reset to Step 1
            localStorage.removeItem('filingStep');
            localStorage.removeItem('filingFormData');
            localStorage.removeItem('filingEvidences');
            window.location.reload(); 
          }}
          className="w-full py-3 text-sm text-gray-500 hover:text-white transition-colors underline"
        >
          새로운 사건 접수하기
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
