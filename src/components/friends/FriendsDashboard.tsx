import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  Clock,
  Ban,
  UserPlus,
  MessageSquare,
  Phone,
  MoreVertical,
  Check,
  X,
  AlertCircle,
  Search,
} from 'lucide-react';
import { useFriendStore, FriendTab } from '../../store/useFriendStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useVoiceStore } from '../../store/useVoiceStore';
import { Avatar } from '../common/Avatar';
import { ConfirmModal } from '../common/ConfirmModal';
import { Friend, User } from '../../types';

export const FriendsDashboard: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    blockedUsers,
    activeTab,
    setActiveTab,
    setActiveDMUser,
    sendFriendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    blockUser,
    unblockUser,
  } = useFriendStore();

  const { startDirectCall } = useVoiceStore();

  const [addFriendInput, setAddFriendInput] = useState('');
  const [addSuccessMessage, setAddSuccessMessage] = useState('');
  const [addErrorMessage, setAddErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Custom in-app confirmation modal (replaces window.confirm)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'remove' | 'block';
    user: User;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setActionToast(message);
    setTimeout(() => {
      setActionToast((prev) => (prev === message ? null : prev));
    }, 3000);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.type === 'remove') {
        await removeFriend(confirmAction.user.id);
        showToast(`Пользователь @${confirmAction.user.username} удален из друзей`);
      } else if (confirmAction.type === 'block') {
        await blockUser(confirmAction.user.id);
        showToast(`Пользователь @${confirmAction.user.username} заблокирован`);
      }
      setConfirmAction(null);
    } catch (err: any) {
      console.error('Action failed', err);
      showToast(err.message || 'Не удалось выполнить действие');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtering friends
  const onlineFriends = friends.filter((f) => f.user.status !== 'OFFLINE');
  const filteredFriends = (activeTab === 'online' ? onlineFriends : friends).filter((f) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.user.username.toLowerCase().includes(q) ||
      (f.user.displayName && f.user.displayName.toLowerCase().includes(q))
    );
  });

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFriendInput.trim()) return;

    setAddSuccessMessage('');
    setAddErrorMessage('');
    setIsSubmitting(true);

    try {
      const msg = await sendFriendRequest(addFriendInput.trim());
      setAddSuccessMessage(msg);
      setAddFriendInput('');
    } catch (err: any) {
      setAddErrorMessage(err.message || 'Failed to send friend request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#313338] select-none overflow-hidden">
      {/* Top Header Navigation Tabs */}
      <div className="h-12 px-4 border-b border-[#1f2023] flex items-center justify-between shadow-xs bg-[#313338] shrink-0">
        <div className="flex items-center gap-4 overflow-x-auto">
          {/* Header Label */}
          <div className="flex items-center gap-2 text-white font-bold text-sm border-r border-[#3f4147] pr-4">
            <Users className="w-5 h-5 text-[#80848e]" />
            <span>Friends</span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 text-sm font-medium">
            <button
              onClick={() => setActiveTab('online')}
              className={`px-2 py-1 rounded-md transition-colors ${
                activeTab === 'online'
                  ? 'bg-[#3f4147] text-white'
                  : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
              }`}
            >
              Online
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-2 py-1 rounded-md transition-colors ${
                activeTab === 'all'
                  ? 'bg-[#3f4147] text-white'
                  : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
              }`}
            >
              All
            </button>

            <button
              onClick={() => setActiveTab('pending')}
              className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-[#3f4147] text-white'
                  : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
              }`}
            >
              Pending
              {incomingRequests.length > 0 && (
                <span className="bg-[#f23f43] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {incomingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('blocked')}
              className={`px-2 py-1 rounded-md transition-colors ${
                activeTab === 'blocked'
                  ? 'bg-[#3f4147] text-white'
                  : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
              }`}
            >
              Blocked
            </button>

            <button
              onClick={() => setActiveTab('add')}
              className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                activeTab === 'add'
                  ? 'bg-[#23a55a]/20 text-[#23a55a]'
                  : 'bg-[#23a55a] text-white hover:bg-[#1f9250]'
              }`}
            >
              Add Friend
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* ========================================== */}
        {/* TAB: ADD FRIEND */}
        {/* ========================================== */}
        {activeTab === 'add' && (
          <div className="max-w-xl space-y-6">
            <div>
              <h2 className="text-xl font-bold uppercase text-white tracking-wide mb-1">
                Add Friend
              </h2>
              <p className="text-xs text-[#949ba4]">
                You can add friends with their Accord username and tag (e.g. username#1234).
              </p>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div className="bg-[#1e1f22] p-3 rounded-lg border border-[#232428] flex items-center gap-3 focus-within:border-[#5865F2]">
                <input
                  type="text"
                  value={addFriendInput}
                  onChange={(e) => setAddFriendInput(e.target.value)}
                  placeholder="You can add friends with their Accord username#tag"
                  className="flex-1 bg-transparent text-sm text-white placeholder-[#80848e] focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !addFriendInput.trim()}
                  className="px-4 py-2 rounded bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold transition-colors disabled:opacity-50 shrink-0"
                >
                  {isSubmitting ? 'Sending...' : 'Send Friend Request'}
                </button>
              </div>

              {addSuccessMessage && (
                <div className="flex items-center gap-2 p-3 text-sm text-[#23a55a] bg-[#23a55a]/10 border border-[#23a55a]/30 rounded-md">
                  <Check className="w-4 h-4" />
                  {addSuccessMessage}
                </div>
              )}
              {addErrorMessage && (
                <div className="flex items-center gap-2 p-3 text-sm text-[#f23f43] bg-[#f23f43]/10 border border-[#f23f43]/30 rounded-md">
                  <AlertCircle className="w-4 h-4" />
                  {addErrorMessage}
                </div>
              )}
            </form>

            <div className="pt-4 border-t border-[#35373c] space-y-2">
              <p className="text-xs font-semibold text-[#b5bac1] uppercase tracking-wider">
                Quick Add Suggested Users:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { tag: 'alex#1001', name: 'Alex Rivera' },
                  { tag: 'elena#2048', name: 'Elena Rostova' },
                  { tag: 'marcus#9900', name: 'Marcus Chen' },
                  { tag: 'sophia#4512', name: 'Sophia Martin' },
                ].map((sug) => (
                  <button
                    key={sug.tag}
                    type="button"
                    onClick={() => setAddFriendInput(sug.tag)}
                    className="p-2 rounded bg-[#2b2d31] hover:bg-[#383a40] text-left text-xs text-[#dbdee1] flex items-center justify-between group transition-colors"
                  >
                    <span>{sug.name}</span>
                    <span className="text-[#949ba4] font-mono group-hover:text-white">
                      {sug.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB: ONLINE & ALL FRIENDS */}
        {/* ========================================== */}
        {(activeTab === 'online' || activeTab === 'all') && (
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-[#949ba4] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friends..."
                className="w-full bg-[#1e1f22] text-sm text-white pl-9 pr-3 py-2 rounded-md border border-[#232428] focus:outline-hidden focus:border-[#5865F2]"
              />
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-[#949ba4]">
              {activeTab === 'online' ? 'Online' : 'All Friends'} — {filteredFriends.length}
            </p>

            <div className="divide-y divide-[#35373c]">
              {filteredFriends.map((f) => (
                <div
                  key={f.user.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[#35373c]/50 group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={f.user.avatarUrl}
                      name={f.user.displayName || f.user.username}
                      size="md"
                      status={f.user.status}
                    />
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-semibold text-sm text-white">
                          {f.user.displayName || f.user.username}
                        </span>
                        <span className="text-xs text-[#949ba4]">
                          #{f.user.tag}
                        </span>
                      </div>
                      <p className="text-xs text-[#949ba4]">
                        {f.user.customStatus ? f.user.customStatus : f.user.status.toLowerCase()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveDMUser(f.user);
                        startDirectCall(f.user, false);
                      }}
                      className="p-2 rounded-full bg-[#2b2d31] hover:bg-[#23a55a]/20 text-[#b5bac1] hover:text-[#23a55a] transition-colors"
                      title="Позвонить (Voice Call)"
                    >
                      <Phone className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setActiveDMUser(f.user)}
                      className="p-2 rounded-full bg-[#2b2d31] hover:bg-[#1e1f22] text-[#b5bac1] hover:text-white transition-colors"
                      title="Direct Message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setConfirmAction({ type: 'remove', user: f.user })}
                      className="p-2 rounded-full bg-[#2b2d31] hover:bg-[#f23f43]/20 text-[#b5bac1] hover:text-[#f23f43] transition-colors"
                      title="Удалить из друзей (Remove Friend)"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setConfirmAction({ type: 'block', user: f.user })}
                      className="p-2 rounded-full bg-[#2b2d31] hover:bg-[#f23f43]/20 text-[#b5bac1] hover:text-[#f23f43] transition-colors"
                      title="Заблокировать (Block User)"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredFriends.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-[#949ba4]">
                    {activeTab === 'online'
                      ? 'No one is online right now.'
                      : 'You do not have any friends added yet.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB: PENDING REQUESTS */}
        {/* ========================================== */}
        {activeTab === 'pending' && (
          <div className="space-y-6">
            {/* Incoming */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#949ba4] mb-3">
                Incoming Friend Requests — {incomingRequests.length}
              </p>
              <div className="divide-y divide-[#35373c]">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[#35373c]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={req.sender?.avatarUrl}
                        name={req.sender?.displayName || req.sender?.username || 'User'}
                        size="md"
                      />
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-semibold text-sm text-white">
                            {req.sender?.displayName || req.sender?.username}
                          </span>
                          <span className="text-xs text-[#949ba4]">
                            #{req.sender?.tag}
                          </span>
                        </div>
                        <p className="text-xs text-[#949ba4]">Incoming Friend Request</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => acceptRequest(req.id)}
                        className="p-2 rounded-full bg-[#2b2d31] hover:bg-[#23a55a]/20 text-[#b5bac1] hover:text-[#23a55a] transition-colors"
                        title="Accept Request"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => declineRequest(req.id)}
                        className="p-2 rounded-full bg-[#2b2d31] hover:bg-[#f23f43]/20 text-[#b5bac1] hover:text-[#f23f43] transition-colors"
                        title="Decline Request"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {incomingRequests.length === 0 && (
                  <p className="text-xs text-[#949ba4] py-2">There are no incoming requests.</p>
                )}
              </div>
            </div>

            {/* Outgoing */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#949ba4] mb-3">
                Outgoing Friend Requests — {outgoingRequests.length}
              </p>
              <div className="divide-y divide-[#35373c]">
                {outgoingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[#35373c]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={req.receiver?.avatarUrl}
                        name={req.receiver?.displayName || req.receiver?.username || 'User'}
                        size="md"
                      />
                      <div>
                        <span className="font-semibold text-sm text-white">
                          {req.receiver?.displayName || req.receiver?.username}
                        </span>
                        <p className="text-xs text-[#949ba4]">Outgoing Friend Request</p>
                      </div>
                    </div>

                    <button
                      onClick={() => declineRequest(req.id)}
                      className="p-2 rounded-full bg-[#2b2d31] hover:bg-[#f23f43]/20 text-[#b5bac1] hover:text-[#f23f43] transition-colors"
                      title="Cancel Request"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {outgoingRequests.length === 0 && (
                  <p className="text-xs text-[#949ba4] py-2">There are no outgoing requests.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB: BLOCKED USERS */}
        {/* ========================================== */}
        {activeTab === 'blocked' && (
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[#949ba4]">
              Blocked Users — {blockedUsers.length}
            </p>
            <div className="divide-y divide-[#35373c]">
              {blockedUsers.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[#35373c]/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={b.blockedUser?.avatarUrl}
                      name={b.blockedUser?.displayName || b.blockedUser?.username || 'User'}
                      size="md"
                    />
                    <div>
                      <span className="font-semibold text-sm text-white">
                        {b.blockedUser?.displayName || b.blockedUser?.username}
                      </span>
                      <p className="text-xs text-[#f23f43]">Blocked</p>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      const uid = b.blockedUser?.id || b.id;
                      try {
                        const res = await unblockUser(uid);
                        if (res && res.restoredFriendship) {
                          showToast(`Пользователь разблокирован и возвращен в список друзей`);
                        } else {
                          showToast(`Пользователь разблокирован`);
                        }
                      } catch (err: any) {
                        showToast(err.message || 'Ошибка разблокировки');
                      }
                    }}
                    className="px-3 py-1.5 rounded bg-[#2b2d31] hover:bg-[#383a40] text-xs font-medium text-white transition-colors"
                  >
                    Разблокировать
                  </button>
                </div>
              ))}

              {blockedUsers.length === 0 && (
                <p className="text-sm text-[#949ba4] py-8 text-center">
                  You haven't blocked anyone yet.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Remove Friend & Block User */}
      <ConfirmModal
        isOpen={Boolean(confirmAction)}
        title={
          confirmAction?.type === 'remove'
            ? `Удалить "${confirmAction.user.displayName || confirmAction.user.username}" из друзей?`
            : `Заблокировать "${confirmAction?.user.displayName || confirmAction?.user.username}"?`
        }
        description={
          confirmAction?.type === 'remove' ? (
            <span>
              Вы уверены, что хотите удалить пользователя{' '}
              <strong className="text-white">
                @{confirmAction.user.username}#{confirmAction.user.tag}
              </strong>{' '}
              из списка друзей?
            </span>
          ) : (
            <span>
              Вы уверены, что хотите заблокировать{' '}
              <strong className="text-white">
                @{confirmAction?.user.username}#{confirmAction?.user.tag}
              </strong>
              ? Пользователь будет удален из друзей и больше не сможет отправлять вам сообщения или заявки в друзья.
            </span>
          )
        }
        confirmLabel={confirmAction?.type === 'remove' ? 'Удалить из друзей' : 'Заблокировать'}
        cancelLabel="Отмена"
        variant="danger"
        isLoading={actionLoading}
        onConfirm={handleConfirmAction}
        onClose={() => !actionLoading && setConfirmAction(null)}
      />

      {/* Toast Notification */}
      {actionToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e1f22] text-white text-xs px-4 py-2.5 rounded-lg shadow-2xl border border-[#35373c] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-[#23a55a] shrink-0" />
          <span>{actionToast}</span>
        </div>
      )}
    </div>
  );
};
