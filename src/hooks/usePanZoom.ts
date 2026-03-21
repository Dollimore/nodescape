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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (containerElRef.current) {
        containerElRef.current.removeEventListener('wheel', handleWheel as any);
      }
    };
  }, [handleWheel]);

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
    setFitView,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}
