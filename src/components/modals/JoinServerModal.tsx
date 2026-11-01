import React, { useState } from 'react';
import { X, Compass } from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';

export const JoinServerModal: React.FC = () => {
  const { isJoinServerOpen, closeJoinServer, joinServer } = useServerStore();
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isJoinServerOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsSubmitting(true);
    setError('');
    try {
      // Strip domain if pasted as full link
      const code = inviteCode.trim().split('/').pop() || inviteCode.trim();
      await joinServer(code);
      setInviteCode('');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired invite code');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#313338] rounded-xl overflow-hidden shadow-2xl border border-[#232428]">
        {/* Header */}
        <div className="p-6 text-center relative">
          <button
            onClick={closeJoinServer}
            className="absolute top-4 right-4 text-[#949ba4] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-full bg-[#5865F2]/10 text-[#5865F2] flex items-center justify-center mx-auto mb-3">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Join a Server</h2>
          <p className="text-sm text-[#949ba4]">
            Enter an invite below to join an existing server.
          </p>
        </div>

        {error && (
          <div className="mx-6 p-3 text-xs text-[#f23f43] bg-[#f23f43]/10 border border-[#f23f43]/30 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-2">
              Invite Link or Code <span className="text-[#f23f43]">*</span>
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="e.g. accord-hq or https://accord.chat/accord-hq"
              required
              className="w-full bg-[#1e1f22] text-white px-3 py-2.5 rounded-md border border-[#232428] text-sm focus:outline-hidden focus:border-[#5865F2]"
            />
            <p className="text-[11px] text-[#949ba4] mt-2">
              Tip: Try using <strong className="text-white">accord-hq</strong> to join the community server!
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 bg-[#2b2d31] -mx-6 -mb-6 p-4">
            <button
              type="button"
              onClick={closeJoinServer}
              className="text-sm font-medium text-white hover:underline px-2 py-1"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !inviteCode.trim()}
              className="px-6 py-2 rounded bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Joining...' : 'Join Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
