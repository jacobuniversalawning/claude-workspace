'use client';

import { useEffect, useRef, ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        className={`bg-[#0A0A0A] rounded-xl ${sizeClasses[size]} w-full border border-[#1F1F1F] animate-scale-in shadow-2xl shadow-black/50`}
      >
        <div className="flex justify-between items-center p-5 border-b border-[#1F1F1F]">
          <h3 className="text-lg font-semibold text-[#EDEDED] tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 text-[#666666] hover:text-[#EDEDED] hover:bg-[#1F1F1F] rounded-lg transition-all duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

// Confirm Modal
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default'
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-[#A1A1A1] text-sm mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-[#A1A1A1] bg-[#111111] border border-[#333333] rounded-full text-sm font-medium hover:bg-[#1A1A1A] hover:text-[#EDEDED] transition-all duration-150"
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
            variant === 'danger'
              ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
              : 'bg-white text-black hover:bg-[#E5E5E5]'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

// Input Modal
interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  submitText?: string;
  inputType?: 'text' | 'number' | 'email';
}

export function InputModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  label,
  placeholder = '',
  defaultValue = '',
  submitText = 'Submit',
  inputType = 'text'
}: InputModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef.current?.value.trim();
    if (value) {
      onSubmit(value);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <form onSubmit={handleSubmit}>
        {label && (
          <label className="block text-sm font-medium text-[#A1A1A1] mb-2">
            {label}
          </label>
        )}
        <input
          ref={inputRef}
          type={inputType}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="w-full bg-[#111111] border border-[#333333] rounded-lg px-4 py-2.5 text-sm text-[#EDEDED] placeholder-[#666666] focus:outline-none focus:border-[#0070F3] focus:ring-1 focus:ring-[#0070F3]/20 transition-all duration-150"
        />
        <div className="flex justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[#A1A1A1] bg-[#111111] border border-[#333333] rounded-full text-sm font-medium hover:bg-[#1A1A1A] hover:text-[#EDEDED] transition-all duration-150"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-[#E5E5E5] transition-all duration-150"
          >
            {submitText}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Dual Input Modal (for name + value pairs)
interface DualInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value1: string, value2: string) => void;
  title: string;
  label1: string;
  label2: string;
  placeholder1?: string;
  placeholder2?: string;
  defaultValue1?: string;
  defaultValue2?: string;
  submitText?: string;
  inputType1?: 'text' | 'number';
  inputType2?: 'text' | 'number';
  prefix2?: string;
  suffix2?: string;
}

export function DualInputModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  label1,
  label2,
  placeholder1 = '',
  placeholder2 = '',
  defaultValue1 = '',
  defaultValue2 = '',
  submitText = 'Submit',
  inputType1 = 'text',
  inputType2 = 'text',
  prefix2,
  suffix2
}: DualInputModalProps) {
  const input1Ref = useRef<HTMLInputElement>(null);
  const input2Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && input1Ref.current) {
      input1Ref.current.focus();
      input1Ref.current.select();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value1 = input1Ref.current?.value.trim();
    const value2 = input2Ref.current?.value.trim();
    if (value1 && value2) {
      onSubmit(value1, value2);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#A1A1A1] mb-2">
              {label1}
            </label>
            <input
              ref={input1Ref}
              type={inputType1}
              defaultValue={defaultValue1}
              placeholder={placeholder1}
              className="w-full bg-[#111111] border border-[#333333] rounded-lg px-4 py-2.5 text-sm text-[#EDEDED] placeholder-[#666666] focus:outline-none focus:border-[#0070F3] focus:ring-1 focus:ring-[#0070F3]/20 transition-all duration-150"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#A1A1A1] mb-2">
              {label2}
            </label>
            <div className="flex items-center gap-2">
              {prefix2 && <span className="text-[#666666] text-sm">{prefix2}</span>}
              <input
                ref={input2Ref}
                type={inputType2}
                step={inputType2 === 'number' ? '0.01' : undefined}
                defaultValue={defaultValue2}
                placeholder={placeholder2}
                className="flex-1 bg-[#111111] border border-[#333333] rounded-lg px-4 py-2.5 text-sm text-[#EDEDED] placeholder-[#666666] focus:outline-none focus:border-[#0070F3] focus:ring-1 focus:ring-[#0070F3]/20 transition-all duration-150"
              />
              {suffix2 && <span className="text-[#666666] text-sm">{suffix2}</span>}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[#A1A1A1] bg-[#111111] border border-[#333333] rounded-full text-sm font-medium hover:bg-[#1A1A1A] hover:text-[#EDEDED] transition-all duration-150"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-[#E5E5E5] transition-all duration-150"
          >
            {submitText}
          </button>
        </div>
      </form>
    </Modal>
  );
}
