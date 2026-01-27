import { Scale, BookOpen, Gavel, Bell, User as UserIcon, Users, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { NotificationModal } from './NotificationModal';
import { Notification, User } from '@/types/user';

interface CourtHeaderProps {
  notifications?: Notification[];
  user: User;
  onMarkNotificationsAsRead: (id: string) => void;
  onLogout: () => void;
}

export function CourtHeader({ notifications = [], user, onMarkNotificationsAsRead, onLogout }: CourtHeaderProps) {
  const location = useLocation();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const getNavButtonClass = (path: string) => {
    return `px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
      location.pathname === path
        ? 'bg-[var(--color-gold-dark)] border-[var(--color-gold-accent)] text-white'
        : 'border-[var(--color-court-border)] text-gray-300 hover:border-[var(--color-gold-primary)]'
    }`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="border-b-2 border-[var(--color-gold-dark)] bg-[var(--color-court-gray)]/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img src="/gosomidotcom.png" alt="Gosomi Logo" className="w-10 h-10 object-contain" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--color-gold-accent)] rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl">고소미닷컴</h1>
              <p className="text-xs text-[var(--color-gold-primary)] tracking-wider">
                DIGITAL SUPREME COURT
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <Link to="/" className={getNavButtonClass('/')}>
              <Gavel className="w-5 h-5" />
              <span className="text-sm font-medium">법원 로비</span>
            </Link>
            <Link to="/law-book" className={getNavButtonClass('/law-book')}>
              <BookOpen className="w-5 h-5" />
              <span className="text-sm font-medium">법전</span>
            </Link>
            <Link to="/jury" className={getNavButtonClass('/jury')}>
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">배심원</span>
            </Link>
            
            {/* Notification Bell */}
            <div className="relative">
                <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`relative px-4 py-2 rounded-lg border transition-all flex items-center ${
                    isNotifOpen 
                        ? 'border-[var(--color-gold-primary)] text-white' 
                        : 'border-[var(--color-court-border)] text-gray-300 hover:border-[var(--color-gold-primary)]'
                }`}
                >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-verdict-guilty)] text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                    </span>
                )}
                </button>
                {isNotifOpen && (
                    <NotificationModal 
                        notifications={notifications} 
                        onClose={() => setIsNotifOpen(false)}
                        onMarkAsRead={onMarkNotificationsAsRead}
                    />
                )}
            </div>

            {/* Profile */}
            <Link to="/mypage" className={getNavButtonClass('/mypage')}>
                <div className="w-6 h-6 rounded-full bg-gray-600 overflow-hidden flex items-center justify-center border border-gray-400">
                    {user.profileImage ? <img src={user.profileImage} className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4" />}
                </div>
                <span className="text-sm font-medium">{user.nickname}</span>
            </Link>

            <button 
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                title="로그아웃"
            >
                <LogOut className="w-5 h-5" />
            </button>

          </nav>
        </div>
      </div>
    </header>
  );
}