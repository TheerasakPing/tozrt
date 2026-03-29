import React, { useEffect, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { UnlistenFn } from '@tauri-apps/api/event';

interface QuitConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function QuitConfirmModal({ isOpen, onConfirm, onCancel }: QuitConfirmModalProps): React.JSX.Element | null {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Focus confirm button when modal opens + keyboard shortcut
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => confirmBtnRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="quit-overlay" onClick={onCancel}>
      <div className="quit-modal" onClick={(e) => e.stopPropagation()}>
        {/* Decorative corner accents */}
        <span className="quit-corner tl" />
        <span className="quit-corner tr" />
        <span className="quit-corner bl" />
        <span className="quit-corner br" />

        <div className="quit-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
              stroke="var(--neon-red)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="16 17 21 12 16 7"
              stroke="var(--neon-red)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="21" y1="12" x2="9" y2="12"
              stroke="var(--neon-red)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 className="quit-title">TERMINATE SESSION?</h2>
        <p className="quit-subtitle">
          All active downloads will be paused.<br />
          Session state will be saved automatically.
        </p>

        <div className="quit-actions">
          <button className="btn btn-ghost quit-btn" onClick={onCancel} id="quit-cancel-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            CANCEL
          </button>
          <button
            ref={confirmBtnRef}
            className="btn btn-danger quit-btn"
            onClick={onConfirm}
            id="quit-confirm-btn"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            EXIT NOW
          </button>
        </div>

        <p className="quit-hint">Press <kbd>Enter</kbd> to exit · <kbd>Esc</kbd> to stay</p>
      </div>
    </div>
  );
}

/**
 * Hook ที่ intercept Tauri CloseRequested event แล้ว
 * แสดง quit confirmation ก่อนให้ปิดจริง
 */
export function useQuitConfirm(): { isQuitOpen: boolean; confirmQuit: () => void; cancelQuit: () => void } {
  const [isQuitOpen, setIsQuitOpen] = React.useState(false);

  useEffect(() => {
    let unlisten: UnlistenFn | null = null;
    const win = getCurrentWindow();

    win.onCloseRequested((event) => {
      event.preventDefault();
      setIsQuitOpen(true);
    }).then((fn: UnlistenFn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, []);

  const confirmQuit = React.useCallback(() => {
    setIsQuitOpen(false);
    // Destroy the window — bypasses CloseRequested
    getCurrentWindow().destroy();
  }, []);

  const cancelQuit = React.useCallback(() => {
    setIsQuitOpen(false);
  }, []);

  return { isQuitOpen, confirmQuit, cancelQuit };
}
