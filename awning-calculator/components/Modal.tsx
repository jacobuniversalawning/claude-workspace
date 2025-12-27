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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        className={`bg-white dark:bg-brand-surface-black rounded-modal ${sizeClasses[size]} w-full shadow-xl border border-gray-200 dark:border-brand-border-subtle animate-scale-in`}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-brand-border-subtle">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-brand-text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
      <p className="text-gray-600 dark:text-brand-text-secondary mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-5 py-2.5 text-gray-700 dark:text-brand-text-primary bg-gray-100 dark:bg-brand-surface-grey-light hover:bg-gray-200 dark:hover:brightness-110 rounded-button font-medium transition-all duration-200"
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          className={`px-5 py-2.5 text-white rounded-button font-medium transition-all duration-200 ${
            variant === 'danger'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 dark:bg-brand-google-blue hover:bg-blue-700 dark:hover:bg-brand-google-blue-hover'
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}
        <input
          ref={inputRef}
          type={inputType}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="w-full border border-gray-300 dark:border-transparent rounded-input px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-brand-mint bg-white dark:bg-brand-surface-grey-dark text-gray-900 dark:text-brand-text-primary placeholder-gray-400 dark:placeholder-brand-text-muted transition-all duration-200"
        />
        <div className="flex justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 dark:text-brand-text-primary bg-gray-100 dark:bg-brand-surface-grey-light hover:bg-gray-200 dark:hover:brightness-110 rounded-button font-medium transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 dark:bg-brand-google-blue text-white rounded-button hover:bg-blue-700 dark:hover:bg-brand-google-blue-hover font-medium transition-all duration-200"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {label1}
            </label>
            <input
              ref={input1Ref}
              type={inputType1}
              defaultValue={defaultValue1}
              placeholder={placeholder1}
              className="w-full border border-gray-300 dark:border-transparent rounded-input px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-brand-mint bg-white dark:bg-brand-surface-grey-dark text-gray-900 dark:text-brand-text-primary placeholder-gray-400 dark:placeholder-brand-text-muted transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {label2}
            </label>
            <div className="flex items-center gap-2">
              {prefix2 && <span className="text-gray-500 dark:text-gray-400">{prefix2}</span>}
              <input
                ref={input2Ref}
                type={inputType2}
                step={inputType2 === 'number' ? '0.01' : undefined}
                defaultValue={defaultValue2}
                placeholder={placeholder2}
                className="flex-1 border border-gray-300 dark:border-transparent rounded-input px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-brand-mint bg-white dark:bg-brand-surface-grey-dark text-gray-900 dark:text-brand-text-primary placeholder-gray-400 dark:placeholder-brand-text-muted transition-all duration-200"
              />
              {suffix2 && <span className="text-gray-500 dark:text-gray-400">{suffix2}</span>}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 dark:text-brand-text-primary bg-gray-100 dark:bg-brand-surface-grey-light hover:bg-gray-200 dark:hover:brightness-110 rounded-button font-medium transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 dark:bg-brand-google-blue text-white rounded-button hover:bg-blue-700 dark:hover:bg-brand-google-blue-hover font-medium transition-all duration-200"
          >
            {submitText}
          </button>
        </div>
      </form>
    </Modal>
  );
}
