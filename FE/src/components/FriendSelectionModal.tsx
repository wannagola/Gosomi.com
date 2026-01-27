import { useState } from 'react';
import { User, Friend } from '@/types/user'; // Using User type for friends
import { X, Search, Check, User as UserIcon } from 'lucide-react';

interface FriendSelectionModalProps {
  friends: Friend[];
  onClose: () => void;
  onConfirm: (selectedFriends: Friend[]) => void;
  maxSelection?: number;
}

export function FriendSelectionModal({ friends, onClose, onConfirm, maxSelection = 5 }: FriendSelectionModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSelection = (friendId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      if (newSelected.size >= maxSelection) {
        alert(`최대 ${maxSelection}명까지만 선택할 수 있습니다.`);
        return;
      }
      newSelected.add(friendId);
    }
    setSelectedIds(newSelected);
  };

  const handleConfirm = () => {
    const selected = friends.filter(f => selectedIds.has(f.id));
    onConfirm(selected);
  };

  const filteredFriends = friends.filter(friend => 
    friend.nickname.toLowerCase().includes(searchQuery.toLowerCase()) &&
    friend.status === 'friend' // Only show accepted friends
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#1a1b26] border border-[var(--color-court-border)] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-court-border)] flex justify-between items-center bg-[#13141f]">
          <h3 className="font-bold text-white text-lg">배심원 초대하기</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[var(--color-court-border)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="친구 검색..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--color-court-dark)] border border-[var(--color-court-border)] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-gold-primary)]"
            />
          </div>
          <div className="mt-2 text-xs text-right text-[var(--color-gold-primary)]">
            {selectedIds.size} / {maxSelection}명 선택됨
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredFriends.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                    {friends.length === 0 ? "친구가 없습니다." : "검색 결과가 없습니다."}
                </div>
            ) : (
                filteredFriends.map(friend => (
                    <div 
                        key={friend.id}
                        onClick={() => toggleSelection(friend.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                            selectedIds.has(friend.id) 
                                ? 'bg-[var(--color-gold-dark)]/20 border border-[var(--color-gold-dark)]' 
                                : 'hover:bg-[var(--color-court-dark)] border border-transparent'
                        }`}
                    >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            selectedIds.has(friend.id)
                                ? 'bg-[var(--color-gold-primary)] border-[var(--color-gold-primary)]'
                                : 'border-gray-500'
                        }`}>
                            {selectedIds.has(friend.id) && <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />}
                        </div>
                        
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                            {friend.profileImage ? (
                                <img src={friend.profileImage} alt={friend.nickname} className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-4 h-4 text-gray-400" />
                            )}
                        </div>
                        
                        <span className="text-white font-medium">{friend.nickname}</span>
                    </div>
                ))
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-court-border)] bg-[#13141f]">
            <button
                onClick={handleConfirm}
                className="w-full py-3 bg-[var(--color-gold-dark)] hover:bg-[var(--color-gold-primary)] text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selectedIds.size === 0}
            >
                선택 완료
            </button>
        </div>
      </div>
    </div>
  );
}
