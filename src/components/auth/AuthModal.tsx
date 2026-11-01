import React, { useState } from 'react';
import { MessageSquare, Sparkles, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const AuthModal: React.FC = () => {
  const { login, register } = useAuthStore();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegisterMode) {
        if (!username || !email || !password) {
          throw new Error('Please fill in all required fields');
        }
        await register(username, email, password, displayName || username);
      } else {
        if (!email || !password) {
          throw new Error('Please enter your email/username and password');
        }
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (emailOrUsername: string) => {
    setError('');
    setIsLoading(true);
    try {
      await login(emailOrUsername, 'password123');
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/80 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#313338] rounded-xl overflow-hidden shadow-2xl border border-[#232428] p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#5865F2] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#5865F2]/30">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {isRegisterMode ? 'Create an account' : 'Welcome back!'}
          </h2>
          <p className="text-sm text-[#949ba4]">
            {isRegisterMode
              ? 'Join Discord clone with real-time text & voice'
              : "We're so excited to see you again!"}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 text-xs text-[#f23f43] bg-[#f23f43]/10 border border-[#f23f43]/30 rounded-md">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo Fast Login Pills */}
        <div className="mb-5 p-3 bg-[#2b2d31] rounded-lg border border-[#232428]">
          <p className="text-[11px] font-bold uppercase text-[#949ba4] mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#f0b232]" />
            Quick Demo Accounts (1-Click Login):
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('alex')}
              className="text-xs py-1.5 px-2 rounded bg-[#1e1f22] hover:bg-[#383a40] text-[#dbdee1] font-medium text-left transition-colors"
            >
              👑 Alex Rivera (Lead)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('elena')}
              className="text-xs py-1.5 px-2 rounded bg-[#1e1f22] hover:bg-[#383a40] text-[#dbdee1] font-medium text-left transition-colors"
            >
              🎨 Elena (Designer)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('marcus')}
              className="text-xs py-1.5 px-2 rounded bg-[#1e1f22] hover:bg-[#383a40] text-[#dbdee1] font-medium text-left transition-colors"
            >
              🚀 Marcus (DevOps)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('sophia')}
              className="text-xs py-1.5 px-2 rounded bg-[#1e1f22] hover:bg-[#383a40] text-[#dbdee1] font-medium text-left transition-colors"
            >
              🎮 Sophia (Gamer)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <>
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#b5bac1] mb-1.5">
                  Username <span className="text-[#f23f43]">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="e.g. cyber_samurai"
                  className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded-md border border-[#232428] text-sm focus:outline-hidden focus:border-[#5865F2]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#b5bac1] mb-1.5">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="What should we call you?"
                  className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded-md border border-[#232428] text-sm focus:outline-hidden focus:border-[#5865F2]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase text-[#b5bac1] mb-1.5">
              {isRegisterMode ? 'Email' : 'Email or Username'}{' '}
              <span className="text-[#f23f43]">*</span>
            </label>
            <input
              type={isRegisterMode ? 'email' : 'text'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={isRegisterMode ? 'you@domain.com' : 'alex or alex@accord.chat'}
              className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded-md border border-[#232428] text-sm focus:outline-hidden focus:border-[#5865F2]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-[#b5bac1] mb-1.5">
              Password <span className="text-[#f23f43]">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded-md border border-[#232428] text-sm focus:outline-hidden focus:border-[#5865F2]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-md bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-semibold transition-colors disabled:opacity-50 mt-2"
          >
            {isLoading
              ? 'Loading...'
              : isRegisterMode
              ? 'Continue'
              : 'Log In'}
          </button>

          <div className="text-xs text-[#949ba4] pt-2">
            {isRegisterMode ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(false)}
                  className="text-[#00a8fc] hover:underline"
                >
                  Log In
                </button>
              </span>
            ) : (
              <span>
                Need an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(true)}
                  className="text-[#00a8fc] hover:underline"
                >
                  Register
                </button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
