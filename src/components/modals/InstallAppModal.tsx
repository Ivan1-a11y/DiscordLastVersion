import React, { useState } from 'react';
import {
  Download,
  X,
  ExternalLink,
  Laptop,
  Smartphone,
  Apple,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Radio,
  Wifi,
  Sparkles,
  Share2,
  Package,
  Server,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isInIframe, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'desktop' | 'android' | 'ios' | 'native'>('desktop');
  const [copied, setCopied] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  // Use clean origin URL (or public shared URL) for sending to friends
  const cleanUrl = window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(cleanUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Accord',
          text: 'Присоединяйся ко мне в Accord — общайся в голосовых каналах и чатах!',
          url: cleanUrl,
        });
      } catch (_) {}
    } else {
      handleCopyLink();
    }
  };

  const handleOpenStandalone = () => {
    window.open(cleanUrl, '_blank', 'noopener,noreferrer');
  };

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      await install();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#313338] text-[#dbdee1] rounded-2xl shadow-2xl overflow-hidden border border-[#232428] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#2b2d31] px-6 py-5 border-b border-[#232428] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5865F2] flex items-center justify-center text-white shadow-md">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Установить Accord как приложение
                {isInstalled && (
                  <span className="text-xs bg-[#23a55a]/20 text-[#23a55a] border border-[#23a55a]/40 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Установлено
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#949ba4]">
                Полноценное настольное или мобильное приложение (PWA)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#949ba4] hover:text-white p-2 rounded-lg hover:bg-[#35373c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Working Status Banner */}
          <div className="bg-[#232428] rounded-xl p-4 border border-[#3f4147] flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#23a55a]/20 text-[#23a55a] flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">
                Будет ли приложение полноценно работать?
              </h3>
              <p className="text-xs text-[#b5bac1] leading-relaxed">
                <span className="text-[#23a55a] font-medium">Да, полностью!</span> Accord построен на архитектуре
                <strong className="text-white"> Progressive Web App (PWA)</strong>:
                работает локальный бэкенд Express, мгновенные вебсокеты Socket.IO, реальные звонки WebRTC (голос и видео)
                и доступ к вашему микрофону и динамикам без ограничений iframe.
              </p>
            </div>
          </div>

          {/* Quick Install Action / In-Iframe notice */}
          {isInIframe ? (
            <div className="bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Sparkles className="w-4 h-4 text-[#5865F2]" />
                Как установить прямо сейчас в 1 клик:
              </div>
              <p className="text-xs text-[#dbdee1] leading-relaxed">
                Вы сейчас находитесь внутри встроенного окна предварительного просмотра (iframe). Чтобы браузер разрешил установку приложения на рабочий стол и дал прямой доступ к микрофону, откройте Accord в отдельной вкладке:
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={cleanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition shadow-md cursor-pointer decoration-0"
                >
                  <ExternalLink className="w-4 h-4" />
                  Открыть в отдельной вкладке
                </a>
                <button
                  onClick={handleShare}
                  className="px-3.5 py-2.5 bg-[#35373c] hover:bg-[#3f4147] text-[#dbdee1] hover:text-white text-xs font-medium rounded-lg flex items-center gap-2 transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-[#5865F2]" />
                  Поделиться с друзьями
                </button>
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2.5 bg-[#35373c] hover:bg-[#3f4147] text-[#dbdee1] hover:text-white text-xs font-medium rounded-lg flex items-center gap-2 transition cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-[#23a55a]" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Ссылка скопирована!' : 'Скопировать ссылку'}
                </button>
              </div>
              <div className="text-[11px] font-mono text-[#949ba4] bg-[#1e1f22] px-3 py-1.5 rounded-md break-all select-all border border-[#2b2d31]">
                {cleanUrl}
              </div>
            </div>
          ) : isInstallable ? (
            <div className="bg-[#23a55a]/10 border border-[#23a55a]/30 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-white">Браузер готов к установке!</h4>
                <p className="text-xs text-[#949ba4]">
                  Нажмите кнопку ниже, чтобы установить Accord как отдельное приложение с иконкой на рабочем столе.
                </p>
              </div>
              <button
                onClick={handleInstallClick}
                disabled={installing}
                className="px-5 py-2.5 bg-[#23a55a] hover:bg-[#1f934f] text-white text-sm font-semibold rounded-lg flex items-center gap-2 shadow-lg transition shrink-0"
              >
                <Download className="w-4 h-4" />
                {installing ? 'Установка...' : 'Установить Accord'}
              </button>
            </div>
          ) : isInstalled ? (
            <div className="bg-[#23a55a]/15 border border-[#23a55a]/40 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#23a55a] shrink-0" />
              <p className="text-xs text-[#dbdee1]">
                Приложение Accord уже запущено в автономном режиме (<strong className="text-white">Standalone App</strong>). Вы можете пользоваться им как обычной программой!
              </p>
            </div>
          ) : null}

          {/* OS-specific Guides */}
          <div>
            <h4 className="text-xs font-semibold text-[#949ba4] uppercase tracking-wider mb-3">
              Пошаговые инструкции по платформам
            </h4>
            <div className="flex border-b border-[#232428] gap-2 mb-4">
              <button
                onClick={() => setActiveTab('desktop')}
                className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
                  activeTab === 'desktop'
                    ? 'border-[#5865F2] text-white'
                    : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
                }`}
              >
                <Laptop className="w-4 h-4" />
                Windows / Mac / Linux (ПК)
              </button>
              <button
                onClick={() => setActiveTab('android')}
                className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
                  activeTab === 'android'
                    ? 'border-[#5865F2] text-white'
                    : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Android
              </button>
              <button
                onClick={() => setActiveTab('ios')}
                className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'ios'
                    ? 'border-[#5865F2] text-white'
                    : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
                }`}
              >
                <Apple className="w-4 h-4" />
                iPhone / iPad (iOS)
              </button>
              <button
                onClick={() => setActiveTab('native')}
                className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'native'
                    ? 'border-[#5865F2] text-white'
                    : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
                }`}
              >
                <Package className="w-4 h-4 text-[#5865F2]" />
                Нативный .EXE/.APK & Без AI Studio
              </button>
            </div>

            {/* Desktop Instruction */}
            {activeTab === 'desktop' && (
              <div className="bg-[#2b2d31] p-4 rounded-xl space-y-3 text-xs">
                <p className="font-semibold text-white">В Google Chrome, Microsoft Edge, Brave или Яндекс.Браузере:</p>
                <ol className="list-decimal list-inside space-y-2 text-[#dbdee1]">
                  <li>
                    Откройте приложение в браузере (не внутри фрейма).
                  </li>
                  <li>
                    Посмотрите в правую часть адресной строки: там появится иконка
                    <span className="inline-flex items-center gap-1 mx-1.5 px-2 py-0.5 rounded bg-[#35373c] text-white font-mono">
                      💻 [Установить Accord]
                    </span>
                    или значок монитора со стрелочкой.
                  </li>
                  <li>
                    Либо нажмите <strong>Меню браузера (три точки)</strong> → <strong>«Установить приложение Accord»</strong> (или <strong>«Сохранить и поделиться» → «Установить приложение»</strong>).
                  </li>
                  <li>
                    Готово! На рабочем столе и в меню Пуск / Launchpad появится ярлык Accord, а само окно откроется без рамок браузера.
                  </li>
                </ol>
              </div>
            )}

            {/* Android Instruction */}
            {activeTab === 'android' && (
              <div className="bg-[#2b2d31] p-4 rounded-xl space-y-3 text-xs">
                <p className="font-semibold text-white">В Chrome на смартфоне / планшете:</p>
                <ol className="list-decimal list-inside space-y-2 text-[#dbdee1]">
                  <li>Откройте ссылку на Accord в Google Chrome на телефоне.</li>
                  <li>Нажмите на <strong>три точки ⋮</strong> в правом верхнем углу браузера.</li>
                  <li>Выберите пункт <strong>«Установить приложение»</strong> или <strong>«Добавить на главный экран»</strong>.</li>
                  <li>Подтвердите установку — Accord добавится в меню всех ваших приложений как обычное APK-приложение с собственной иконкой.</li>
                </ol>
              </div>
            )}

            {/* iOS Instruction */}
            {activeTab === 'ios' && (
              <div className="bg-[#2b2d31] p-4 rounded-xl space-y-3 text-xs">
                <p className="font-semibold text-white">В браузере Safari на iPhone или iPad:</p>
                <ol className="list-decimal list-inside space-y-2 text-[#dbdee1]">
                  <li>Откройте Accord в Safari.</li>
                  <li>
                    Нажмите нижнюю системную кнопку <strong>«Поделиться»</strong> (квадрат со стрелкой вверх <span className="font-mono">⬆</span>).
                  </li>
                  <li>Пролистайте вниз список действий и нажмите <strong>«На экран „Домой“» (Add to Home Screen)</strong>.</li>
                  <li>Нажмите <strong>«Добавить»</strong> в правом верхнем углу.</li>
                  <li>Приложение запустится в полноэкранном режиме с плавными жестами и без строки Safari.</li>
                </ol>
              </div>
            )}

            {/* Native & Self-Hosting Instruction */}
            {activeTab === 'native' && (
              <div className="bg-[#2b2d31] p-4 rounded-xl space-y-4 text-xs">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Sparkles className="w-4 h-4 text-[#5865F2]" />
                    1. Запуск без открытия Google AI Studio (самый простой способ)
                  </div>
                  <p className="text-[#dbdee1] leading-relaxed">
                    Вам и вашим друзьям <strong>вовсе не нужно открывать интерфейс Google AI Studio</strong>! Приложение опубликовано на отдельном высокоскоростном сервере и доступно напрямую:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="bg-[#1e1f22] text-[#23a55a] px-2.5 py-1.5 rounded font-mono text-[11px] select-all flex-1 border border-[#3f4147]">
                      {cleanUrl}
                    </code>
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded font-medium transition cursor-pointer"
                    >
                      {copied ? 'Скопировано!' : 'Копировать'}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#949ba4]">
                    Просто откройте эту ссылку в обычном браузере — она работает быстро, не грузит редактор AI Studio и позволяет установить ярлык в 1 клик.
                  </p>
                </div>

                <div className="border-t border-[#3f4147] pt-3 space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Package className="w-4 h-4 text-[#23a55a]" />
                    2. Как сделать установочный .EXE (Windows) или .APK (Android)
                  </div>
                  <p className="text-[#dbdee1] leading-relaxed">
                    Вы можете превратить приложение в настоящий файл установщика:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-[#dbdee1]">
                    <li>
                      <strong>PWABuilder (без кода):</strong> откройте сайт{' '}
                      <a
                        href="https://www.pwabuilder.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#5865F2] hover:underline"
                      >
                        pwabuilder.com
                      </a>
                      , вставьте ссылку на Accord — сервис сгенерирует готовый установщик для Windows Store / Windows (MSIX/EXE) и Android (APK/AAB).
                    </li>
                    <li>
                      <strong>Electron (настоящий настольный клиент Discord):</strong> скачайте исходный код проекта и оберните его в <span className="font-mono text-white">Electron</span> (<span className="font-mono text-[#949ba4]">npm i -D electron electron-builder</span>) — получите полноценный .exe для Windows или .dmg для macOS.
                    </li>
                    <li>
                      <strong>Capacitor (нативный мобильный проект):</strong> команда <span className="font-mono text-white">npx cap add android</span> генерирует проект Android Studio для компиляции любого APK.
                    </li>
                  </ul>
                </div>

                <div className="border-t border-[#3f4147] pt-3 space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Server className="w-4 h-4 text-[#f0b232]" />
                    3. Автономный сервер (Self-Hosting на своём ПК или VPS)
                  </div>
                  <p className="text-[#dbdee1] leading-relaxed">
                    Accord — это полностью самостоятельное full-stack приложение на Node.js + Express + React. Вы можете запустить его на своём сервере (VPS, Render, Railway, домашнем компьютере):
                  </p>
                  <div className="bg-[#1e1f22] p-2.5 rounded-lg border border-[#3f4147] font-mono text-[11px] text-[#dbdee1] space-y-1">
                    <p className="text-[#949ba4]"># 1. Склонируйте или выгрузите проект</p>
                    <p>npm install</p>
                    <p className="text-[#949ba4]"># 2. Соберите и запустите 24/7</p>
                    <p>npm run build</p>
                    <p>npm start</p>
                  </div>
                  <p className="text-[11px] text-[#949ba4]">
                    После этого сервер будет работать на порту 3000 полностью автономно без участия Google AI Studio.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Features Highlight */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-[#2b2d31] p-3 rounded-lg flex items-center gap-2.5">
              <Radio className="w-5 h-5 text-[#23a55a] shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">WebRTC & Голос</p>
                <p className="text-[11px] text-[#949ba4]">Прямой P2P звук без задержек</p>
              </div>
            </div>
            <div className="bg-[#2b2d31] p-3 rounded-lg flex items-center gap-2.5">
              <Wifi className="w-5 h-5 text-[#5865F2] shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Real-time сокеты</p>
                <p className="text-[11px] text-[#949ba4]">Мгновенный обмен сообщениями</p>
              </div>
            </div>
            <div className="bg-[#2b2d31] p-3 rounded-lg flex items-center gap-2.5">
              <Laptop className="w-5 h-5 text-[#f0b232] shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Standalone-окно</p>
                <p className="text-[11px] text-[#949ba4]">Чистый интерфейс без вкладок</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#2b2d31] px-6 py-4 border-t border-[#232428] flex items-center justify-between">
          <button
            onClick={handleOpenStandalone}
            className="text-xs text-[#5865F2] hover:text-[#4752c4] hover:underline flex items-center gap-1 font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Открыть на весь экран
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#4e5058] hover:bg-[#6d6f78] text-white text-xs font-semibold rounded-md transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
