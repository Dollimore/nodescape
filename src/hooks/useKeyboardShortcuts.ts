import { useEffect, useCallback } from 'react';

interface KeyboardShortcutHandlers {
  onFitView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
}

export function useKeyboardShortcuts(
  containerRef: React.RefObject<HTMLElement | null>,
  handlers: KeyboardShortcutHandlers
) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only handle if focus is within the canvas or on the body
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    const isMod = e.metaKey || e.ctrlKey;

    if (isMod && e.key === '0') {
      e.preventDefault();
      handlers.onFitView();
    } else if (isMod && (e.key === '=' || e.key === '+')) {
      e.preventDefault();
      handlers.onZoomIn();
    } else if (isMod && e.key === '-') {
      e.preventDefault();
      handlers.onZoomOut();
    } else if (isMod && e.key === '1') {
      e.preventDefault();
      handlers.onResetZoom();
    } else if (isMod && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      handlers.onUndo?.();
    } else if (isMod && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      handlers.onRedo?.();
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      handlers.onDelete?.();
    } else if (isMod && e.key === 'c') {
      e.preventDefault();
      handlers.onCopy?.();
    } else if (isMod && e.key === 'v') {
      e.preventDefault();
      handlers.onPaste?.();
    }
  }, [handlers]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Listen on the container element
    el.addEventListener('keydown', handleKeyDown);
    // Make the container focusable
    if (!el.getAttribute('tabindex')) {
      el.setAttribute('tabindex', '0');
      el.style.outline = 'none';
    }

    return () => {
      el.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, handleKeyDown]);
}
