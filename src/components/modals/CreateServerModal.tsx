import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';

export const CreateServerModal: React.FC = () => {
  const { isCreateServerOpen, closeCreateServer, createServer } = useServerStore();
  const [name, setName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isCreateServerOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError('');
    try {
      await createServer(
        name.trim(),
        iconUrl.trim() || `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`,
        description.trim() || undefined
      );
      setName('');
      setIconUrl('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Failed to create server');
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
            onClick={closeCreateServer}
            className="absolute top-4 right-4 text-[#949ba4] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-white mb-2">Create Your Server</h2>
          <p className="text-sm text-[#949ba4]">
            Your server is where you and your friends hang out. Make yours and start talking.
          </p>
        </div>

        {error && (
          <div className="mx-6 p-3 text-xs text-[#f23f43] bg-[#f23f43]/10 border border-[#f23f43]/30 rounded-md">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-2">
              Server Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cyberpunk Gamers, Synthwave Lounge"
              required
              className="w-full bg-[#1e1f22] text-white px-3 py-2.5 rounded-md border border-[#232428] text-sm focus:outline-hidden focus:border-[#5865F2]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-2">
              Server Icon URL (Optional)
            </label>
            <input
              type="text"
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              placeholder="https://example.com/icon.png"
              className="w-full bg-[#1e1f22] text-white px-3 py-2.5 rounded-md border border-[#232428] text-sm focus:outline-hidden focus:border-[#5865F2]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What is this server about?"
              className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded-md border border-[#232428] text-sm focus:outline-hidden focus:border-[#5865F2]"
            />
          </div>

          <div className="flex items-center justify-between pt-4 bg-[#2b2d31] -mx-6 -mb-6 p-4">
            <button
              type="button"
              onClick={closeCreateServer}
              className="text-sm font-medium text-white hover:underline px-2 py-1"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-6 py-2 rounded bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
