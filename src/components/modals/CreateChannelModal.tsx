import React, { useState } from 'react';
import { X, Hash, Volume2 } from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';

export const CreateChannelModal: React.FC = () => {
  const { servers, currentServerId, isCreateChannelOpen, closeCreateChannel, createChannel } = useServerStore();
  const [name, setName] = useState('');
  const [type, setType] = useState<'TEXT' | 'VOICE'>('TEXT');
  const [categoryId, setCategoryId] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isCreateChannelOpen || !currentServerId) return null;

  const currentServer = servers.find(s => s.id === currentServerId);
  if (!currentServer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError('');
    try {
      await createChannel(
        currentServerId,
        name.trim(),
        type,
        categoryId || undefined,
        topic.trim() || undefined
      );
      setName('');
      setTopic('');
    } catch (err: any) {
      setError(err.message || 'Failed to create channel');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#313338] rounded-xl overflow-hidden shadow-2xl border border-[#232428]">
        {/* Header */}
        <div className="p-6 relative">
          <button
            onClick={closeCreateChannel}
            className="absolute top-4 right-4 text-[#949ba4] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-white mb-1">Create Channel</h2>
          <p className="text-xs text-[#949ba4]">
            in {currentServer.name}
          </p>
        </div>

        {error && (
          <div className="mx-6 p-3 text-xs text-[#f23f43] bg-[#f23f43]/10 border border-[#f23f43]/30 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
          {/* Channel Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-2">
              Channel Type
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setType('TEXT')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                  type === 'TEXT'
                    ? 'bg-[#2b2d31] border-[#5865F2]'
                    : 'bg-[#1e1f22] border-transparent hover:bg-[#2b2d31]/50'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-[#383a40] flex items-center justify-center text-[#dbdee1]">
                  <Hash className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Text</p>
                  <p className="text-xs text-[#949ba4]">
                    Post images, stickers, opinions, and puns
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType('VOICE')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                  type === 'VOICE'
                    ? 'bg-[#2b2d31] border-[#5865F2]'
                    : 'bg-[#1e1f22] border-transparent hover:bg-[#2b2d31]/50'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-[#383a40] flex items-center justify-center text-[#dbdee1]">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Voice</p>
                  <p className="text-xs text-[#949ba4]">
                    Hang out together with voice, video, and screen share
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Channel Name */}
          <div>
            <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-2">
              Channel Name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-[#949ba4]">
                {type === 'TEXT' ? <Hash className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="new-channel"
                required
                className="w-full bg-[#1e1f22] text-white pl-9 pr-3 py-2 rounded-md border border-[#232428] text-sm focus:outline-hidden focus:border-[#5865F2]"
              />
            </div>
          </div>

          {/* Category Dropdown */}
          {currentServer.categories.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-2">
                Category (Optional)
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded-md border border-[#232428] text-sm focus:outline-hidden focus:border-[#5865F2]"
              >
                <option value="">No Category</option>
                {currentServer.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 bg-[#2b2d31] -mx-6 -mb-6 p-4">
            <button
              type="button"
              onClick={closeCreateChannel}
              className="text-sm font-medium text-white hover:underline px-2 py-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-6 py-2 rounded bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
