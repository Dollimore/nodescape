import { useState, useCallback, useRef } from 'react';
import type { MouseEvent, WheelEvent } from 'react';

interface PanZoomState {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 3;
const ZOOM_SENSITIVITY = 0.001;

export function usePanZoom(fitViewTransform?: PanZoomState) {
  const [transform, setTransform] = useState<PanZoomState>(
    fitViewTransform || { x: 0, y: 0, scale: 1 }
  );
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

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

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * ZOOM_SENSITIVITY;
    // Capture rect before entering state updater (synthetic event gets nullified)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
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
    onWheel,
    setFitView,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}
