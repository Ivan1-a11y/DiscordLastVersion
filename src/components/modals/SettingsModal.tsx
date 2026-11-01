import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User as UserIcon,
  Mic,
  Shield,
  LogOut,
  Volume2,
  Sliders,
  Check,
  AlertCircle,
  Radio,
  Sparkles,
  RotateCw,
  CheckCircle2,
  Info,
  Download,
  ExternalLink,
  Laptop,
  Smartphone,
  Apple,
  Copy,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Avatar } from '../common/Avatar';
import { StatusBadge } from '../common/StatusBadge';
import { UserStatus } from '../../types';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  AudioDevice,
  requestAndLoadAudioDevices,
  enumerateAudioDevicesQuick,
  playTestSound,
  MicTester,
} from '../../lib/audioUtils';

type SettingsTab = 'profile' | 'voice' | 'security' | 'app';

export const SettingsModal: React.FC = () => {
  const {
    user,
    isSettingsOpen,
    closeSettings,
    updateProfile,
    changePassword,
    logout,
    audioSettings,
    updateAudioSettings,
  } = useAuthStore() as any;

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile Form state
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState<UserStatus>('ONLINE');
  const [customStatus, setCustomStatus] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  // Voice & Video Devices & Test state
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micVolumeLevel, setMicVolumeLevel] = useState(0);
  const micTesterRef = useRef<MicTester | null>(null);
  const isRequestingDevicesRef = useRef(false);

  // PWA & Installation state
  const { isInstallable, isInstalled, isIOS, isInIframe, install } = usePWAInstall();
  const [copiedLink, setCopiedLink] = useState(false);
  const [activePwaPlatform, setActivePwaPlatform] = useState<'desktop' | 'android' | 'ios'>('desktop');
  const [isInstallingPwa, setIsInstallingPwa] = useState(false);

  // Populate user data when modal opens
  useEffect(() => {
    if (user && isSettingsOpen) {
      setDisplayName(user.displayName || '');
      setAvatarUrl(user.avatarUrl || '');
      setBio(user.bio || '');
      setStatus(user.status || 'ONLINE');
      setCustomStatus(user.customStatus || '');
    }
  }, [user, isSettingsOpen]);

  const [deviceError, setDeviceError] = useState('');
  const [deviceSuccess, setDeviceSuccess] = useState('');

  const loadDevices = async (requestPermission = false) => {
    if (isRequestingDevicesRef.current) return;
    isRequestingDevicesRef.current = true;
    setIsLoadingDevices(true);
    setDeviceError('');
    if (requestPermission) {
      setDeviceSuccess('');
    }

    try {
      const result = requestPermission
        ? await requestAndLoadAudioDevices()
        : await enumerateAudioDevicesQuick();

      setInputDevices(result.inputs);
      setOutputDevices(result.outputs);

      if (result.permissionGranted) {
        setPermissionGranted(true);
        setDeviceError('');
        if (requestPermission) {
          const micCount = result.inputs.filter((i) => i.isRealLabel).length || result.inputs.length;
          const outCount = result.outputs.filter((o) => o.isRealLabel).length || result.outputs.length;
          setDeviceSuccess(`Доступ разрешен! Найдено устройств: ${micCount} микрофонов, ${outCount} динамиков.`);
          setTimeout(() => setDeviceSuccess(''), 5000);
        }
      } else {
        if (requestPermission && result.error) {
          setDeviceError(result.error);
        }
      }
    } catch (err: any) {
      if (requestPermission) {
        setDeviceError(err.message || 'Ошибка при запросе доступа к микрофону.');
      }
    } finally {
      setIsLoadingDevices(false);
      // Brief delay before allowing devicechange listeners to trigger again
      setTimeout(() => {
        isRequestingDevicesRef.current = false;
      }, 500);
    }
  };

  // Load audio devices when Voice tab is opened
  useEffect(() => {
    if (activeTab === 'voice' && isSettingsOpen) {
      loadDevices(false);
    }
  }, [activeTab, isSettingsOpen]);

  // Listen to device connect/disconnect, ignoring while actively requesting
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.addEventListener === 'function') {
      const handleDeviceChange = () => {
        if (!isRequestingDevicesRef.current && isSettingsOpen && activeTab === 'voice') {
          loadDevices(false);
        }
      };
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
  }, [isSettingsOpen, activeTab]);

  // Clean up mic tester on close or tab change
  useEffect(() => {
    return () => {
      if (micTesterRef.current) {
        micTesterRef.current.stop();
        micTesterRef.current = null;
      }
    };
  }, [isSettingsOpen, activeTab]);

  if (!isSettingsOpen || !user) return null;

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setIsSavingProfile(true);

    try {
      await updateProfile({
        displayName,
        avatarUrl,
        bio,
        status,
        customStatus,
      });
      setProfileSuccess('Profile changes saved successfully!');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    if (newPassword.length < 6) {
      setSecurityError('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityError('Passwords do not match');
      return;
    }

    setIsSavingSecurity(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSecuritySuccess('Password successfully changed!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSecuritySuccess(''), 3000);
    } catch (err: any) {
      setSecurityError(err.message || 'Failed to change password');
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const toggleMicTest = async () => {
    if (isTestingMic) {
      micTesterRef.current?.stop();
      micTesterRef.current = null;
      setIsTestingMic(false);
      setMicVolumeLevel(0);
    } else {
      micTesterRef.current = new MicTester();
      setIsTestingMic(true);
      const success = await micTesterRef.current.start(
        audioSettings.inputDeviceId === 'default' ? undefined : audioSettings.inputDeviceId,
        audioSettings.echoCancellation,
        audioSettings.noiseSuppression,
        (level) => setMicVolumeLevel(level)
      );
      if (!success) {
        setIsTestingMic(false);
        setMicVolumeLevel(0);
      }
    }
  };

  const avatarSeeds = ['Felix', 'Luna', 'Milo', 'Bandit', 'Jasper', 'Shadow'];

  return (
    <div className="fixed inset-0 z-50 flex bg-[#000000]/70 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Settings Modal Container */}
      <div className="flex w-full h-full max-w-5xl mx-auto my-auto bg-[#313338] md:rounded-lg overflow-hidden shadow-2xl border border-[#232428]">
        {/* Left Sidebar Menu */}
        <div className="w-60 bg-[#2b2d31] p-6 flex flex-col justify-between shrink-0 border-r border-[#1f2023]">
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] px-3 mb-2">
                User Settings
              </p>
              <nav className="space-y-0.5">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-[#383a40] text-white'
                      : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  My Profile
                </button>
                <button
                  onClick={() => setActiveTab('voice')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'voice'
                      ? 'bg-[#383a40] text-white'
                      : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  Voice & Video
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'security'
                      ? 'bg-[#383a40] text-white'
                      : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Security
                </button>
                <button
                  onClick={() => setActiveTab('app')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'app'
                      ? 'bg-[#383a40] text-white'
                      : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'
                  }`}
                >
                  <Download className="w-4 h-4 text-[#23a55a]" />
                  Установить (PWA)
                </button>
              </nav>
            </div>
          </div>

          <div className="pt-4 border-t border-[#35373c]">
            <button
              onClick={() => {
                closeSettings();
                logout();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-[#f23f43] hover:bg-[#f23f43]/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto p-8 relative">
          {/* Close button with ESC indicator */}
          <div className="absolute top-6 right-6 flex items-center gap-2">
            <button
              onClick={closeSettings}
              className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-[#b5bac1] text-[#b5bac1] hover:text-white hover:border-white transition-colors"
              title="Close Settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">User Profile</h2>
                <p className="text-sm text-[#949ba4]">
                  Customize how you appear to others on Accord.
                </p>
              </div>

              {profileSuccess && (
                <div className="flex items-center gap-2 p-3 text-sm text-[#23a55a] bg-[#23a55a]/10 border border-[#23a55a]/30 rounded-md">
                  <Check className="w-4 h-4" />
                  {profileSuccess}
                </div>
              )}
              {profileError && (
                <div className="flex items-center gap-2 p-3 text-sm text-[#f23f43] bg-[#f23f43]/10 border border-[#f23f43]/30 rounded-md">
                  <AlertCircle className="w-4 h-4" />
                  {profileError}
                </div>
              )}

              {/* Profile Card Preview */}
              <div className="bg-[#1e1f22] rounded-lg overflow-hidden border border-[#2b2d31]">
                <div className="h-20 bg-linear-to-r from-[#5865F2] to-[#eb459e] p-3 flex justify-end" />
                <div className="px-5 pb-5 relative">
                  <div className="absolute -top-10 left-5">
                    <Avatar
                      src={avatarUrl}
                      name={displayName || user.username}
                      size="lg"
                      status={status}
                      className="border-4 border-[#1e1f22]"
                    />
                  </div>
                  <div className="pt-8">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {displayName || user.username}
                      <span className="text-xs font-normal text-[#949ba4]">
                        #{user.tag}
                      </span>
                    </h3>
                    <p className="text-xs text-[#949ba4]">{user.email}</p>
                    {customStatus && (
                      <p className="mt-2 text-xs text-[#dbdee1] bg-[#2b2d31] inline-block px-2.5 py-1 rounded-md">
                        {customStatus}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-5">
                {/* Display Name */}
                <div>
                  <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded-md border border-[#232428] focus:border-[#5865F2] focus:outline-hidden text-sm"
                    placeholder={user.username}
                  />
                </div>

                {/* Avatar URL or Preset generator */}
                <div>
                  <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-2">
                    Avatar URL
                  </label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded-md border border-[#232428] focus:border-[#5865F2] focus:outline-hidden text-sm mb-2"
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-[#949ba4] flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#5865F2]" /> Presets:
                    </span>
                    {avatarSeeds.map((seed) => (
                      <button
                        key={seed}
                        type="button"
                        onClick={() =>
                          setAvatarUrl(`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`)
                        }
                        className="text-xs px-2 py-0.5 rounded bg-[#2b2d31] hover:bg-[#383a40] text-[#dbdee1] transition-colors"
                      >
                        {seed}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Dropdown */}
                <div>
                  <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-2">
                    Online Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'ONLINE', label: 'Online', desc: 'Active and available' },
                      { key: 'IDLE', label: 'Idle', desc: 'Away from keyboard' },
                      { key: 'DND', label: 'Do Not Disturb', desc: 'Mutes notifications' },
                      { key: 'OFFLINE', label: 'Invisible', desc: 'Appear offline to friends' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setStatus(item.key as UserStatus)}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                          status === item.key
                            ? 'bg-[#2b2d31] border-[#5865F2]'
                            : 'bg-[#1e1f22] border-transparent hover:bg-[#2b2d31]/50'
                        }`}
                      >
                        <StatusBadge status={item.key as UserStatus} size="md" />
                        <div>
                          <p className="text-sm font-medium text-white">{item.label}</p>
                          <p className="text-xs text-[#949ba4]">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Status */}
                <div>
                  <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-2">
                    Custom Status Message
                  </label>
                  <input
                    type="text"
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                    className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded-md border border-[#232428] focus:border-[#5865F2] focus:outline-hidden text-sm"
                    placeholder="e.g. 🎧 Listening to Synthwave"
                  />
                </div>

                {/* About Me / Bio */}
                <div>
                  <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-2">
                    About Me
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded-md border border-[#232428] focus:border-[#5865F2] focus:outline-hidden text-sm"
                    placeholder="Tell everyone a little bit about yourself..."
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2.5 rounded bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isSavingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: VOICE & VIDEO */}
          {activeTab === 'voice' && (
            <div className="max-w-xl space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Voice & Video Settings</h2>
                  <p className="text-sm text-[#949ba4]">
                    Configure your hardware devices, audio levels, and DSP filters.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => loadDevices(true)}
                    disabled={isLoadingDevices}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#2b2d31] hover:bg-[#383a40] text-xs font-semibold text-white transition-colors"
                    title="Запросить разрешение и обновить список устройств"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isLoadingDevices ? 'animate-spin' : ''}`} />
                    <span>{isLoadingDevices ? 'Поиск...' : 'Обновить'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => playTestSound(audioSettings.outputDeviceId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#5865F2] hover:bg-[#4752C4] text-xs font-semibold text-white transition-colors"
                    title="Воспроизвести тестовый звук через выбранный динамик"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Тест звука</span>
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {deviceError && (
                <div className="p-3.5 bg-[#f23f43]/15 border border-[#f23f43]/40 rounded-lg text-xs text-[#f23f43] flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <p className="font-medium text-white">{deviceError}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => loadDevices(true)}
                        disabled={isLoadingDevices}
                        className="px-3 py-1 rounded bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium transition-colors"
                      >
                        {isLoadingDevices ? 'Запрос...' : 'Повторить попытку'}
                      </button>
                      <a
                        href={window.location.href}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded bg-[#2b2d31] hover:bg-[#383a40] text-white font-medium transition-colors border border-[#3f4147]"
                      >
                        Открыть Accord в новой вкладке ↗
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Alert */}
              {deviceSuccess && (
                <div className="p-3 bg-[#23a55a]/15 border border-[#23a55a]/40 rounded-lg text-xs text-[#23a55a] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{deviceSuccess}</span>
                </div>
              )}

              {/* Permission Banner if browser labels are restricted */}
              {!permissionGranted && (
                <div className="p-3.5 bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#dbdee1]">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <Info className="w-4 h-4 text-[#5865F2] shrink-0 mt-0.5 sm:mt-0" />
                    <span>
                      Браузер скрывает реальные названия микрофонов до выдачи разрешения. Нажмите «Разрешить доступ» или откройте сайт в отдельной вкладке.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => loadDevices(true)}
                      disabled={isLoadingDevices}
                      className="px-3 py-1.5 rounded bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isLoadingDevices ? 'Запрос...' : 'Разрешить доступ'}
                    </button>
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded bg-[#2b2d31] hover:bg-[#383a40] text-white text-xs font-medium border border-[#3f4147] transition-colors"
                      title="Открыть в отдельной вкладке без iframe"
                    >
                      Вкладка ↗
                    </a>
                  </div>
                </div>
              )}

              {permissionGranted && (
                <div className="px-3 py-2 bg-[#23a55a]/10 border border-[#23a55a]/30 rounded-md text-xs text-[#23a55a] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Доступ к микрофону активен. Обнаружено: {inputDevices.length} микрофонов, {outputDevices.length} динамиков.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadDevices(true)}
                    className="text-[11px] underline text-[#23a55a] hover:text-white"
                  >
                    Пересканировать
                  </button>
                </div>
              )}

              {/* Devices Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold uppercase text-[#b5bac1]">
                      Микрофон (Ввод)
                    </label>
                    <span className="text-[10px] text-[#949ba4] font-mono">
                      {inputDevices.length} на карте
                    </span>
                  </div>
                  <select
                    value={audioSettings.inputDeviceId}
                    onChange={(e) => updateAudioSettings({ inputDeviceId: e.target.value })}
                    className="w-full bg-[#1e1f22] text-white px-3 py-2.5 rounded-md border border-[#232428] text-sm focus:outline-hidden focus:border-[#5865F2]"
                  >
                    <option value="default">Default — Системный микрофон по умолчанию</option>
                    {inputDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Микрофон (${d.deviceId.slice(0, 8)})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold uppercase text-[#b5bac1]">
                      Динамик / Наушники (Вывод)
                    </label>
                    <span className="text-[10px] text-[#949ba4] font-mono">
                      {outputDevices.length} на карте
                    </span>
                  </div>
                  <select
                    value={audioSettings.outputDeviceId}
                    onChange={(e) => updateAudioSettings({ outputDeviceId: e.target.value })}
                    className="w-full bg-[#1e1f22] text-white px-3 py-2.5 rounded-md border border-[#232428] text-sm focus:outline-hidden focus:border-[#5865F2]"
                  >
                    <option value="default">Default — Системные динамики по умолчанию</option>
                    {outputDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Динамик (${d.deviceId.slice(0, 8)})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Volume Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase text-[#b5bac1] mb-2">
                    <span>Input Volume</span>
                    <span className="font-mono">{audioSettings.inputVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={audioSettings.inputVolume}
                    onChange={(e) => updateAudioSettings({ inputVolume: Number(e.target.value) })}
                    className="w-full accent-[#5865F2] h-2 bg-[#1e1f22] rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold uppercase text-[#b5bac1] mb-2">
                    <span>Output Volume</span>
                    <span className="font-mono">{audioSettings.outputVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={audioSettings.outputVolume}
                    onChange={(e) => updateAudioSettings({ outputVolume: Number(e.target.value) })}
                    className="w-full accent-[#5865F2] h-2 bg-[#1e1f22] rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Live Mic Test Panel with Web Audio Analyser */}
              <div className="p-4 bg-[#2b2d31] rounded-lg border border-[#1f2023] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Radio className="w-4 h-4 text-[#23a55a]" />
                      Mic Test
                    </h3>
                    <p className="text-xs text-[#949ba4]">
                      Speak into your microphone to verify audio signal.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleMicTest}
                    className={`px-4 py-2 rounded text-xs font-semibold transition-colors ${
                      isTestingMic
                        ? 'bg-[#f23f43] hover:bg-[#da373b] text-white'
                        : 'bg-[#5865F2] hover:bg-[#4752C4] text-white'
                    }`}
                  >
                    {isTestingMic ? 'Stop Test' : "Let's Check"}
                  </button>
                </div>

                {/* Level Meter */}
                <div className="space-y-1">
                  <div className="h-3 w-full bg-[#1e1f22] rounded-full overflow-hidden p-0.5 flex">
                    <div
                      className="h-full rounded-full transition-all duration-75 bg-linear-to-r from-[#23a55a] via-[#f0b232] to-[#f23f43]"
                      style={{ width: `${isTestingMic ? micVolumeLevel : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#949ba4] font-mono">
                    <span>Silent</span>
                    <span>Speaking</span>
                    <span>Peak</span>
                  </div>
                </div>
              </div>

              {/* Voice Processing Switches */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase text-[#b5bac1]">
                  Voice Processing (DSP)
                </h3>

                <div className="flex items-center justify-between p-3 bg-[#1e1f22] rounded-lg border border-[#232428]">
                  <div>
                    <p className="text-sm font-medium text-white">Echo Cancellation</p>
                    <p className="text-xs text-[#949ba4]">
                      Reduces audio feedback loop between mic and speakers
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateAudioSettings({ echoCancellation: !audioSettings.echoCancellation })
                    }
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      audioSettings.echoCancellation ? 'bg-[#23a55a]' : 'bg-[#4e5058]'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        audioSettings.echoCancellation ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#1e1f22] rounded-lg border border-[#232428]">
                  <div>
                    <p className="text-sm font-medium text-white">Noise Suppression</p>
                    <p className="text-xs text-[#949ba4]">
                      Filters out background hums, fan noise, and keyboard clicks
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateAudioSettings({ noiseSuppression: !audioSettings.noiseSuppression })
                    }
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      audioSettings.noiseSuppression ? 'bg-[#23a55a]' : 'bg-[#4e5058]'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        audioSettings.noiseSuppression ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === 'security' && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Security & Password</h2>
                <p className="text-sm text-[#949ba4]">
                  Manage your credentials and account authentication.
                </p>
              </div>

              {securitySuccess && (
                <div className="flex items-center gap-2 p-3 text-sm text-[#23a55a] bg-[#23a55a]/10 border border-[#23a55a]/30 rounded-md">
                  <Check className="w-4 h-4" />
                  {securitySuccess}
                </div>
              )}
              {securityError && (
                <div className="flex items-center gap-2 p-3 text-sm text-[#f23f43] bg-[#f23f43]/10 border border-[#f23f43]/30 rounded-md">
                  <AlertCircle className="w-4 h-4" />
                  {securityError}
                </div>
              )}

              <form onSubmit={handlePasswordSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded-md border border-[#232428] focus:border-[#5865F2] focus:outline-hidden text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded-md border border-[#232428] focus:border-[#5865F2] focus:outline-hidden text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[#b5bac1] mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded-md border border-[#232428] focus:border-[#5865F2] focus:outline-hidden text-sm"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingSecurity}
                    className="px-5 py-2.5 rounded bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isSavingSecurity ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* APP INSTALLATION / PWA TAB */}
          {activeTab === 'app' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  Установка приложения Accord (PWA)
                </h3>
                <p className="text-xs text-[#949ba4]">
                  Запускайте Accord прямо с рабочего стола Windows, macOS или домашнего экрана смартфона без рамок браузера.
                </p>
              </div>

              {/* Status & Architecture Overview */}
              <div className="bg-[#2b2d31] border border-[#232428] rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#23a55a]/20 text-[#23a55a] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Приложение готово к установке и работе</h4>
                    <p className="text-xs text-[#949ba4]">
                      {isInstalled
                        ? 'Accord уже работает в режиме отдельного приложения (Standalone)!'
                        : 'Вы можете установить Accord в 1 клик через PWA-манифест браузера.'}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-[#dbdee1] leading-relaxed pt-1">
                  Accord работает на стеке <span className="text-[#5865F2] font-semibold">React + Vite + Express + WebSockets + WebRTC</span>.
                  Звонки, микрофон, демонстрация экрана и сообщения функционируют нативно без сторонних сервисов.
                </div>
              </div>

              {/* Quick Action Button */}
              {isInIframe ? (
                <div className="bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-xl p-5 space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#5865F2]" />
                    Для установки откройте Accord в отдельной вкладке:
                  </h4>
                  <p className="text-xs text-[#dbdee1]">
                    Встроенный экран (iframe) блокирует системный диалог установки и может ограничивать микрофон. Откройте приложение напрямую:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => window.open(window.location.href, '_blank', 'noopener,noreferrer')}
                      className="px-4 py-2.5 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition shadow-md"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Открыть в отдельной вкладке ↗
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="px-3.5 py-2.5 bg-[#35373c] hover:bg-[#3f4147] text-[#dbdee1] text-xs font-medium rounded-lg flex items-center gap-2 transition"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-[#23a55a]" /> : <Copy className="w-4 h-4" />}
                      {copiedLink ? 'Ссылка скопирована!' : 'Скопировать прямую ссылку'}
                    </button>
                  </div>
                </div>
              ) : isInstallable ? (
                <div className="bg-[#23a55a]/10 border border-[#23a55a]/30 rounded-xl p-5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">Браузер поддерживает быструю установку</h4>
                    <p className="text-xs text-[#949ba4]">
                      Нажмите кнопку, чтобы добавить Accord в список программ вашего компьютера или телефона.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      setIsInstallingPwa(true);
                      try {
                        await install();
                      } finally {
                        setIsInstallingPwa(false);
                      }
                    }}
                    disabled={isInstallingPwa}
                    className="px-5 py-2.5 bg-[#23a55a] hover:bg-[#1f934f] text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-lg transition shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    {isInstallingPwa ? 'Установка...' : 'Установить Accord'}
                  </button>
                </div>
              ) : null}

              {/* Instructions per platform */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase text-[#b5bac1]">Инструкции для вашей платформы</p>

                <div className="flex border-b border-[#232428] gap-2">
                  <button
                    onClick={() => setActivePwaPlatform('desktop')}
                    className={`flex items-center gap-2 pb-2 text-xs font-semibold border-b-2 transition ${
                      activePwaPlatform === 'desktop'
                        ? 'border-[#5865F2] text-white'
                        : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
                    }`}
                  >
                    <Laptop className="w-4 h-4" />
                    Windows / macOS / Linux
                  </button>
                  <button
                    onClick={() => setActivePwaPlatform('android')}
                    className={`flex items-center gap-2 pb-2 text-xs font-semibold border-b-2 transition ${
                      activePwaPlatform === 'android'
                        ? 'border-[#5865F2] text-white'
                        : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    Android
                  </button>
                  <button
                    onClick={() => setActivePwaPlatform('ios')}
                    className={`flex items-center gap-2 pb-2 text-xs font-semibold border-b-2 transition ${
                      activePwaPlatform === 'ios'
                        ? 'border-[#5865F2] text-white'
                        : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
                    }`}
                  >
                    <Apple className="w-4 h-4" />
                    iPhone / iPad
                  </button>
                </div>

                {activePwaPlatform === 'desktop' && (
                  <div className="bg-[#2b2d31] p-4 rounded-xl space-y-2 text-xs text-[#dbdee1]">
                    <p className="font-semibold text-white">В Chrome, Edge, Brave, Opera, Яндекс:</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-[#b5bac1]">
                      <li>Откройте сайт приложения во весь экран (не во фрейме).</li>
                      <li>В правой части строки поиска нажмите на иконку <strong>💻 Установить приложение Accord</strong>.</li>
                      <li>Либо нажмите <strong>Меню браузера (⋮) → «Установить Accord»</strong>.</li>
                      <li>Приложение закрепится на панели задач или в Launchpad.</li>
                    </ol>
                  </div>
                )}

                {activePwaPlatform === 'android' && (
                  <div className="bg-[#2b2d31] p-4 rounded-xl space-y-2 text-xs text-[#dbdee1]">
                    <p className="font-semibold text-white">В мобильном браузере Chrome:</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-[#b5bac1]">
                      <li>Откройте ссылку на телефоне.</li>
                      <li>Нажмите меню <strong>(⋮)</strong> в верхнем правом углу.</li>
                      <li>Выберите <strong>«Установить приложение»</strong> или <strong>«Добавить на главный экран»</strong>.</li>
                    </ol>
                  </div>
                )}

                {activePwaPlatform === 'ios' && (
                  <div className="bg-[#2b2d31] p-4 rounded-xl space-y-2 text-xs text-[#dbdee1]">
                    <p className="font-semibold text-white">В браузере Safari на iPhone/iPad:</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-[#b5bac1]">
                      <li>Откройте сайт в Safari.</li>
                      <li>Нажмите иконку <strong>«Поделиться» (Share ⬆)</strong> внизу экрана.</li>
                      <li>Выберите <strong>«На экран „Домой“» (Add to Home Screen)</strong>.</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
