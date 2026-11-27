"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

export interface SignatureCanvasHandle {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: (type?: string, encoderOptions?: number) => string;
  getCanvas: () => HTMLCanvasElement;
  getTrimmedCanvas: () => HTMLCanvasElement;
}

export interface SignatureCanvasProps {
  penColor?: string;
  minWidth?: number;
  maxWidth?: number;
  velocityFilterWeight?: number;
  canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
  onBegin?: () => void;
  onEnd?: () => void;
}

/**
 * Strictly typed, zero-dependency HTML5 <canvas> signature pad replacing
 * the alpha react-signature-canvas package.
 */
export const SignatureCanvas = forwardRef<
  SignatureCanvasHandle,
  SignatureCanvasProps
>(function SignatureCanvas(
  {
    penColor = "#09090b",
    minWidth = 1.4,
    maxWidth = 2.6,
    canvasProps,
    onBegin,
    onEnd,
  },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const hasInkRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    const targetWidth = Math.round(rect.width * dpr);
    const targetHeight = Math.round(rect.height * dpr);

    if (canvas.width === targetWidth && canvas.height === targetHeight) return;

    // Preserve existing drawing on resize if non-empty
    let snapshot: HTMLCanvasElement | null = null;
    if (hasInkRef.current && canvas.width > 0 && canvas.height > 0) {
      snapshot = document.createElement("canvas");
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      const snapCtx = snapshot.getContext("2d");
      snapCtx?.drawImage(canvas, 0, 0);
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (snapshot) {
        ctx.drawImage(snapshot, 0, 0, rect.width, rect.height);
      }
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => resizeCanvas());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [resizeCanvas]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    hasInkRef.current = false;
    lastPointRef.current = null;
  }, []);

  const getTrimmedCanvas = useCallback((): HTMLCanvasElement => {
    const canvas = canvasRef.current;
    if (!canvas) {
      throw new Error("Signature canvas is not mounted");
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx || canvas.width === 0 || canvas.height === 0) return canvas;

    const { width, height } = canvas;
    const pixels = ctx.getImageData(0, 0, width, height).data;

    let top = height;
    let bottom = -1;
    let left = width;
    let right = -1;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = pixels[(y * width + x) * 4 + 3];
        if (alpha > 0) {
          if (y < top) top = y;
          if (y > bottom) bottom = y;
          if (x < left) left = x;
          if (x > right) right = x;
        }
      }
    }

    if (bottom < top || right < left) {
      return canvas;
    }

    const pad = 4;
    const trimX = Math.max(0, left - pad);
    const trimY = Math.max(0, top - pad);
    const trimW = Math.min(width - trimX, right - left + 1 + pad * 2);
    const trimH = Math.min(height - trimY, bottom - top + 1 + pad * 2);

    const trimmed = document.createElement("canvas");
    trimmed.width = trimW;
    trimmed.height = trimH;
    const trimCtx = trimmed.getContext("2d");
    trimCtx?.drawImage(canvas, trimX, trimY, trimW, trimH, 0, 0, trimW, trimH);
    return trimmed;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      clear,
      isEmpty: () => !hasInkRef.current,
      toDataURL: (type = "image/png", encoderOptions?: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return "";
        return canvas.toDataURL(type, encoderOptions);
      },
      getCanvas: () => {
        if (!canvasRef.current) {
          throw new Error("Signature canvas is not mounted");
        }
        return canvasRef.current;
      },
      getTrimmedCanvas,
    }),
    [clear, getTrimmedCanvas]
  );

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeCanvas();
    isDrawingRef.current = true;
    const pt = getPoint(e);
    lastPointRef.current = pt;

    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.fillStyle = penColor;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, minWidth * 0.65, 0, Math.PI * 2);
      ctx.fill();
    }

    hasInkRef.current = true;
    onBegin?.();
    canvasProps?.onPointerDown?.(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const pt = getPoint(e);
    const prev = lastPointRef.current;
    const dist = Math.hypot(pt.x - prev.x, pt.y - prev.y);
    const strokeWidth = Math.max(
      minWidth,
      Math.min(maxWidth, maxWidth - dist * 0.04)
    );

    ctx.strokeStyle = penColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();

    lastPointRef.current = pt;
    hasInkRef.current = true;
    canvasProps?.onPointerMove?.(e);
  };

  const finishStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    onEnd?.();
  };

  const { className, ...restCanvasProps } = canvasProps || {};

  return (
    <canvas
      ref={canvasRef}
      {...restCanvasProps}
      className={className ? `touch-none ${className}` : "touch-none"}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishStroke}
      onPointerCancel={finishStroke}
    />
  );
});

export default SignatureCanvas;
