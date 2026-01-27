import { useState, useEffect, useRef } from 'react';
import courtBg from '../assets/법원 입구.jpg';

interface LoginPageProps {
  onLogin: (user: any) => void;
}

declare global {
  interface Window {
    Kakao: any;
  }
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [loading, setLoading] = useState(false);

  const handleKakaoLogin = () => {
      const key = import.meta.env.VITE_KAKAO_JS_KEY;
      
      if (!window.Kakao) {
          alert('Kakao SDK not loaded');
          return;
      }

      if (!window.Kakao.isInitialized() && key) {
        window.Kakao.init(key);
      }
      
      setLoading(true);

      // 1. Popup Login (Get Access Token)
      window.Kakao.Auth.login({
        success: function(authObj: any) {
            // 2. Fetch User Profile from Kakao (Frontend Side)
            window.Kakao.API.request({
                url: '/v2/user/me',
                success: function(res: any) {
                    const kakaoId = String(res.id);
                    const properties = res.properties || {};
                    const nickname = properties.nickname;
                    const profileImage = properties.profile_image;

                    // 3. Send Profile Data to Backend (No Kakao calls on Backend)
                    import('@/api/authService').then(({ authService }) => {
                        authService.login({ kakaoId, nickname, profileImage })
                            .then(data => {
                                onLogin(data.user);
                                localStorage.setItem('token', data.token);
                            })
                            .catch(err => {
                                console.error('Backend Login failed', err);
                                alert('로그인 서버 처리 실패');
                            })
                            .finally(() => setLoading(false));
                    });
                },
                fail: function(error: any) {
                    console.error('User Info Req Failed', error);
                    setLoading(false);
                    alert('사용자 정보 가져오기 실패');
                }
            });
        },
        fail: function(err: any) {
            console.error(err);
            setLoading(false);
            alert('카카오 로그인 실패');
        },
      });
  };

  // Removed useEffect for code param handling since we use Popup

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center overflow-y-auto bg-[#050505] py-10">
      
      {/* Background Image with Radial Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transform scale-105"
        style={{
            backgroundImage: `url(${courtBg})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] opacity-80" />
      </div>
      
      {/* Content Container */}
      <div className="relative z-10 w-full max-w-[480px] px-6 flex flex-col items-center animate-in fade-in zoom-in duration-700">
        
        {/* Header Section */}
        <div className="text-center mb-12 group cursor-default">
            <h1 className="text-6xl md:text-8xl font-serif text-[#C5A572] mb-8 tracking-[0.2em] font-bold drop-shadow-2xl">
                GOSOMI.COM
            </h1>
            <div className="w-32 h-[2px] bg-[#C5A572] mx-auto mb-10" />
            <h2 className="text-3xl md:text-4xl text-[#E5D5B7] font-serif tracking-wide font-medium">
                고소미 대법원
            </h2>
        </div>

        {/* Separator Line */}
        <div className="w-full h-[2px] bg-[#C5A572] mb-12" />

        {/* Login Card - No Border */}
        <div className="w-full bg-transparent py-4 text-center space-y-8">
            <div className="space-y-4">
                <h3 className="text-4xl font-serif text-[#C5A572] font-bold">
                    법정 입장
                </h3>
                <p className="text-white/60 text-lg font-normal">
                    소셜 계정으로 간편하게 시작하세요
                </p>
            </div>

            <div className="space-y-6">
                <button
                    onClick={handleKakaoLogin}
                    disabled={loading}
                    className="group w-full h-14 bg-[#FEE500] hover:bg-[#FDD835] text-[#391B1B] text-base font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-[#FEE500]/20 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-[#391B1B]/30 border-t-[#391B1B] rounded-full animate-spin" />
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 3C5.373 3 0 6.663 0 11.18c0 2.822 2.112 5.308 5.4 6.74l-.903 3.424c-.067.253.226.467.452.33l4.03-2.67c.983.1 1.996.16 3.02.16 6.627 0 12-3.663 12-8.18C24 6.663 18.627 3 12 3z"/>
                            </svg>
                            <span>카카오톡으로 시작하기</span>
                        </>
                    )}
                </button>
            </div>
        </div>

        {/* Separator Line */}
        <div className="w-full h-[2px] bg-[#C5A572] mt-12 mb-8" />



      </div>

      {/* Footer Credit */}
      <div className="relative z-20 w-full text-center mt-8 shrink-0">
            <p className="text-xs text-white/40 font-light tracking-widest">
            © 2026 GOSOMI COURT. ALL RIGHTS RESERVED.
        </p>
      </div>
    </div>
  );
}
