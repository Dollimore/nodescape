import { useState, useCallback, useRef, useEffect } from 'react';
import type { MouseEvent } from 'react';

interface PanZoomState {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 0.05;
const MAX_SCALE = 5;
const ZOOM_SENSITIVITY = 0.005;

export function usePanZoom(fitViewTransform?: PanZoomState) {
  const [transform, setTransform] = useState<PanZoomState>(
    fitViewTransform || { x: 0, y: 0, scale: 1 }
  );
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const containerElRef = useRef<HTMLElement | null>(null);

  // Touch state
  const touchStartRef = useRef<{ touches: Touch[]; scale: number; x: number; y: number } | null>(null);

  const onMouseDown = useCallback(
    (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-node-draggable]')) return;
      isPanning.current = true;
      panStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    },
    [transform.x, transform.y]
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isPanning.current) return;
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      }));
    },
    []
  );

  const onMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  // Attach a native wheel listener with { passive: false } so preventDefault works.
  // React's onWheel is passive and ignores preventDefault, which lets the browser
  // zoom the page on pinch instead of zooming the canvas.
  const attachWheelListener = useCallback((el: HTMLElement | null) => {
    // Detach from previous element
    if (containerElRef.current) {
      containerElRef.current.removeEventListener('wheel', handleWheel as any);
    }
    containerElRef.current = el;
    if (el) {
      el.addEventListener('wheel', handleWheel as any, { passive: false });
    }
  }, []);

  // Use a ref-based handler so we always read the latest setTransform
  const handleWheel = useCallback((e: globalThis.WheelEvent) => {
    e.preventDefault();

    // Figma-style controls:
    // - Two-finger scroll (trackpad) = pan (no ctrlKey)
    // - Pinch (trackpad) = zoom (ctrlKey is true during pinch on Mac)
    // - Ctrl/Cmd + scroll wheel = zoom
    const isZoom = e.ctrlKey || e.metaKey;

    if (!isZoom) {
      // Pan
      setTransform((prev) => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
      return;
    }

    // Zoom toward cursor
    const delta = -e.deltaY * ZOOM_SENSITIVITY;
    const target = e.currentTarget as HTMLElement || containerElRef.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    setTransform((prev) => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale + delta * prev.scale));
      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;
      const scaleChange = newScale / prev.scale;
      return {
        x: mouseX - (mouseX - prev.x) * scaleChange,
        y: mouseY - (mouseY - prev.y) * scaleChange,
        scale: newScale,
      };
    });
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      // Single finger — prepare for pan
      const touch = e.touches[0];
      touchStartRef.current = {
        touches: [touch],
        scale: 0, // not used for pan
        x: touch.clientX,
        y: touch.clientY,
      };
    } else if (e.touches.length === 2) {
      // Two fingers — prepare for pinch zoom
      e.preventDefault();
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStartRef.current = {
        touches: [t1, t2],
        scale: dist,
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;

    if (e.touches.length === 1 && touchStartRef.current.touches.length === 1) {
      // Pan
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      setTransform(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      touchStartRef.current.x = touch.clientX;
      touchStartRef.current.y = touch.clientY;
    } else if (e.touches.length === 2 && touchStartRef.current.touches.length >= 2) {
      // Pinch zoom
      e.preventDefault();
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const scaleDelta = dist / touchStartRef.current.scale;

      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      setTransform(prev => {
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * scaleDelta));
        return {
          x: midX - (midX - prev.x) * (newScale / prev.scale),
          y: midY - (midY - prev.y) * (newScale / prev.scale),
          scale: newScale,
        };
      });

      touchStartRef.current.scale = dist;
      touchStartRef.current.x = midX;
      touchStartRef.current.y = midY;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
  }, []);

  const attachTouchListeners = useCallback((el: HTMLElement | null) => {
    if (containerElRef.current) {
      containerElRef.current.removeEventListener('touchstart', handleTouchStart);
      containerElRef.current.removeEventListener('touchmove', handleTouchMove as any);
      containerElRef.current.removeEventListener('touchend', handleTouchEnd);
    }
    if (el) {
      el.addEventListener('touchstart', handleTouchStart, { passive: false });
      el.addEventListener('touchmove', handleTouchMove as any, { passive: false });
      el.addEventListener('touchend', handleTouchEnd);
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (containerElRef.current) {
        containerElRef.current.removeEventListener('wheel', handleWheel as any);
        containerElRef.current.removeEventListener('touchstart', handleTouchStart);
        containerElRef.current.removeEventListener('touchmove', handleTouchMove as any);
        containerElRef.current.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const setFitView = useCallback((newTransform: PanZoomState) => {
    setTransform(newTransform);
  }, []);

  const zoomIn = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(MAX_SCALE, prev.scale * 1.2),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(MIN_SCALE, prev.scale / 1.2),
    }));
  }, []);

  const resetZoom = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      scale: 1,
    }));
  }, []);

  return {
    transform,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    attachWheelListener,
    attachTouchListeners,
    setFitView,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}
