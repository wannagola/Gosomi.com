import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export function LegalModal({ isOpen, onClose, title, content }: LegalModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className="relative w-full max-w-4xl border border-[#C5A572]/30 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200"
        style={{ backgroundColor: '#1a1a24' }}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <h3 className="text-xl font-serif text-[#C5A572] font-medium">{title}</h3>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
            aria-label="닫기"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 text-white/80 text-sm leading-relaxed custom-scrollbar">
          <div className="prose prose-invert prose-sm md:prose-base max-w-none prose-headings:text-[#E5D5B7] prose-a:text-[#C5A572] prose-strong:text-white">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>


      </div>
    </div>
  );
}
