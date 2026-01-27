import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#05050a] text-white flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full official-document rounded-2xl p-8 border-2 border-red-500/50">
                <h1 className="text-2xl font-bold text-red-500 mb-4">오류가 발생했습니다</h1>
                <p className="text-gray-400 mb-6">
                    앱을 실행하는 도중 문제가 발생했습니다. <br/>
                    페이지를 새로고침하거나 관리자에게 문의해주세요.
                </p>
                <div className="bg-black/50 p-4 rounded text-left overflow-auto max-h-48 mb-6 border border-gray-800">
                    <code className="text-xs text-red-400">
                        {this.state.error?.toString()}
                    </code>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-[var(--color-gold-dark)] text-black font-bold rounded hover:bg-[var(--color-gold-primary)] transition-colors"
                >
                    새로고침
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}
