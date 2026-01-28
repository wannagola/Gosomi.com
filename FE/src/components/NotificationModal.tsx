import { Bell, X } from 'lucide-react';
import { Notification } from '@/types/user';
import { useNavigate } from 'react-router-dom';

interface NotificationModalProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
}

export function NotificationModal({ notifications, onClose, onMarkAsRead }: NotificationModalProps) {
  const navigate = useNavigate();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
        onMarkAsRead(notification.id);
    }
    if (notification.link) {
        navigate(notification.link);
        onClose();
    }
  };

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[500px] bg-[#1a1a24] border border-[var(--color-court-border)] rounded-xl shadow-2xl z-50 overflow-hidden text-white" style={{ backgroundColor: '#1a1a24', width: '500px', left: '50%', transform: 'translateX(-50%)' }}>
      <div className="px-8 py-4 border-b border-[var(--color-court-border)] flex justify-between items-center bg-[#1a1a24]" style={{ backgroundColor: '#1a1a24' }}>
        <div className="flex items-center gap-2 text-[var(--color-gold-primary)]">
          <Bell className="w-5 h-5" />
          <span className="font-bold text-base">알림 센터</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>새로운 알림이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 divide-y divide-[var(--color-court-border)]">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`group px-8 py-5 hover:bg-white/5 cursor-pointer transition-all border-l-4 ${
                  !notification.read 
                    ? 'bg-white/10 border-l-[var(--color-gold-accent)]' 
                    : 'border-l-transparent hover:border-l-[var(--color-gold-primary)]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1.5 p-2 rounded-full flex-shrink-0 ${
                     !notification.read ? 'bg-[var(--color-gold-primary)] text-black' : 'bg-slate-700 text-gray-400'
                  }`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <p className={`text-base ${!notification.read ? 'text-white font-bold' : 'text-gray-300'}`}>
                        {notification.message}
                      </p>
                    </div>

                    {notification.link && (
                      <p className={`text-sm mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${!notification.read ? 'text-[var(--color-gold-primary)]' : 'text-gray-500'}`}>
                        {!notification.read ? '클릭하여 확인하기 →' : '클릭하여 이동하기 →'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
