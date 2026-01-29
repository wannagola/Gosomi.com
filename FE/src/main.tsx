import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "@/App";
import "@/index.css";

declare global {
  interface Window {
    Kakao: any;
  }
}

const kakaoKey = import.meta.env.VITE_KAKAO_JS_KEY;

// Kakao SDK가 로드된 경우에만 초기화
if (typeof window !== "undefined" && window.Kakao) {
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(kakaoKey);
    console.log("Kakao initialized:", window.Kakao.isInitialized());
  }
} else {
  // SDK 스크립트가 index.html에 없으면 여기 찍힘
  console.warn("Kakao SDK not loaded. Check index.html script tag.");
}

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ScrollToTop } from "@/components/ScrollToTop";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <ScrollToTop />
      <App />
    </BrowserRouter>
  </ErrorBoundary>
);
