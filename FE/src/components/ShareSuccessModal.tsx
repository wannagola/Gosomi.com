import { CheckCircle, X } from "lucide-react";

interface ShareSuccessModalProps {
    onClose: () => void;
}

export function ShareSuccessModal({ onClose }: ShareSuccessModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
            <div className="bg-[#1a1a24] border border-[var(--color-court-border)] rounded-xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-green-900/30 flex items-center justify-center mb-4">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">
                        링크 복사 완료
                    </h3>

                    <p className="text-gray-400 mb-6">
                        클립보드에 링크가 복사되었습니다.<br />
                        원하는 곳에 붙여넣기 하여 공유하세요.
                    </p>

                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-[var(--color-gold-primary)] hover:bg-[var(--color-gold-dark)] text-black font-bold rounded-lg transition-colors"
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
}
