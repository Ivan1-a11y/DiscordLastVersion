import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[#313338] text-[#dbdee1] rounded-lg shadow-2xl border border-[#232428] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {variant === 'danger' && (
              <div className="w-8 h-8 rounded-full bg-[#f23f43]/15 flex items-center justify-center text-[#f23f43] shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
            )}
            <h3 className="font-bold text-white text-base leading-snug">{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-[#949ba4] hover:text-white p-1 rounded transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3 text-sm text-[#949ba4] leading-relaxed">
          {description}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#2b2d31] border-t border-[#232428] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded text-xs font-semibold text-white hover:underline transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2 rounded text-xs font-semibold text-white shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 ${
              variant === 'danger'
                ? 'bg-[#da373c] hover:bg-[#a1282c]'
                : 'bg-[#5865F2] hover:bg-[#4752C4]'
            }`}
          >
            {isLoading && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
