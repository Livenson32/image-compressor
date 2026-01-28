import React, {useState, useRef, useEffect} from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize,
  Sun,
  Moon,
  RotateCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import {clsx} from 'clsx';

interface ComparisonModalProps {
  originalUrl: string;
  optimizedUrl: string;
  isOpen: boolean;
  onClose: () => void;
  filename: string;
}

const getBgSvg = (isLight: boolean) => {
  return `data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23${isLight ? '000000' : 'ffffff'}' fill-opacity='${isLight ? '0.1' : '0.2'}' fill-rule='evenodd'%3E%3Cpath d='M0 0h10v10H0V0zm10 10h10v10H10V10z'/%3E%3C/g%3E%3C/svg%3E`;
};

export const ComparisonModal = ({
  originalUrl,
  optimizedUrl,
  isOpen,
  onClose,
}: ComparisonModalProps) => {
  const [transform, setTransform] = useState({x: 0, y: 0, scale: 1});
  const [sliderPos, setSliderPos] = useState(50);
  const [rotation, setRotation] = useState(0);
  const [showSlider, setShowSlider] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef(transform);
  const interactionMode = useRef<'pan' | 'slide' | 'none'>('none');
  const lastPoint = useRef({x: 0, y: 0});
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartScale = useRef<number>(1);

  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTransform({x: 0, y: 0, scale: 1});
      setSliderPos(50);
      setRotation(0);
      setShowSlider(true);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const applyZoom = (
    newScale: number,
    centerScreenX: number,
    centerScreenY: number,
  ) => {
    const current = transformRef.current;
    const contentX =
      (centerScreenX - (window.innerWidth / 2 + current.x)) / current.scale;
    const contentY =
      (centerScreenY - (window.innerHeight / 2 + current.y)) / current.scale;
    const safeScale = Math.max(0.01, newScale);
    const newX = centerScreenX - window.innerWidth / 2 - contentX * safeScale;
    const newY = centerScreenY - window.innerHeight / 2 - contentY * safeScale;
    setTransform({x: newX, y: newY, scale: safeScale});
  };

  const handleZoomBtn = (factor: number) => {
    applyZoom(
      transform.scale * factor,
      window.innerWidth / 2,
      window.innerHeight / 2,
    );
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = Math.pow(0.999, e.deltaY);
    applyZoom(transformRef.current.scale * factor, e.clientX, e.clientY);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const target = e.target as HTMLElement;
    const isSliderHandle = target.closest('.slider-interactive-area');

    if (showSlider && isSliderHandle) {
      interactionMode.current = 'slide';
    } else {
      interactionMode.current = 'pan';
    }

    lastPoint.current = {x: e.clientX, y: e.clientY};
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const dx = e.clientX - lastPoint.current.x;
    const dy = e.clientY - lastPoint.current.y;
    lastPoint.current = {x: e.clientX, y: e.clientY};

    if (interactionMode.current === 'pan') {
      setTransform(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
    } else if (interactionMode.current === 'slide') {
      const screenWidth = window.innerWidth;
      const deltaPct = (dx / screenWidth) * 100;
      setSliderPos(prev => Math.max(0, Math.min(100, prev + deltaPct)));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    interactionMode.current = 'none';
    pinchStartDist.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        pinchStartDist.current = d;
        pinchStartScale.current = transformRef.current.scale;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartDist.current) {
        e.preventDefault();
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        const scaleFactor = d / pinchStartDist.current;
        const newScale = pinchStartScale.current * scaleFactor;
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        applyZoom(newScale, cx, cy);
      }
    };

    el.addEventListener('touchstart', handleTouchStart, {passive: false});
    el.addEventListener('touchmove', handleTouchMove, {passive: false});
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  if (!isOpen) return null;

  const sharedTransformStyle: React.CSSProperties = {
    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${rotation}deg)`,
    transition: isDragging
      ? 'none'
      : 'transform 0.1s cubic-bezier(0.2, 0, 0, 1)',
    maxHeight: '85vh',
    maxWidth: '85vw',
    transformOrigin: 'center center',
    willChange: 'transform',
  };

  return (
    <div
      className={clsx(
        'fixed inset-0 z-[100] overflow-hidden font-sans select-none',
        isLightMode ? 'bg-gray-100' : 'bg-[#111]',
      )}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{backgroundImage: `url("${getBgSvg(isLightMode)}")`}}
      />

      {/* Main container for interaction */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none relative"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* Optimized image (always visible) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div style={sharedTransformStyle}>
            <img
              src={optimizedUrl}
              alt="Optimized"
              draggable={false}
              className="block max-h-[85vh] max-w-[85vw] object-contain select-none"
              decoding="async"
            />
          </div>
        </div>

        {/* Original image with slider */}
        {showSlider && (
          <>
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{clipPath: `inset(0 ${100 - sliderPos}% 0 0)`}}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div style={sharedTransformStyle}>
                  <img
                    src={originalUrl}
                    alt="Original"
                    draggable={false}
                    className="block max-h-[85vh] max-w-[85vw] object-contain select-none"
                    decoding="async"
                  />
                </div>
              </div>
            </div>

            {/* Slider handle */}
            <div
              className="absolute inset-y-0 slider-interactive-area flex flex-col items-center group cursor-ew-resize touch-manipulation z-50"
              style={{left: `${sliderPos}%`}}
            >
              <div className="h-full w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center">
                <div
                  className={clsx(
                    'w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-transform duration-150 border-4 border-white',
                    isDragging && interactionMode.current === 'slide'
                      ? 'scale-90'
                      : 'group-hover:scale-110',
                    isLightMode ? 'bg-white' : 'bg-black',
                  )}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                  >
                    <g>
                      <path d="M6 8L2 12L6 16" stroke="#06b6d4" />
                      <path d="M18 8L22 12L18 16" stroke="#ec4899" />
                    </g>
                  </svg>
                </div>
              </div>

              <div className="absolute inset-y-0 -left-6 w-12"></div>
            </div>
          </>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-[110] bg-black/50 hover:bg-black/70 backdrop-blur-md text-white p-3 rounded-full transition-colors border border-white/10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Controls toolbar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2 md:gap-3 bg-black/70 backdrop-blur-xl px-4 md:px-5 py-3 rounded-full border border-white/10 shadow-2xl">
        <button
          onClick={() => setIsLightMode(!isLightMode)}
          className="p-2 hover:bg-white/10 rounded-xl text-white transition-colors"
          title={isLightMode ? 'Dark Mode' : 'Light Mode'}
        >
          {isLightMode ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={() => setShowSlider(!showSlider)}
          className={clsx(
            'p-2 rounded-xl transition-colors',
            showSlider
              ? 'text-white hover:bg-white/10'
              : 'text-gleam-pink bg-white/10',
          )}
          title={
            showSlider ? 'Hide Comparison Slider' : 'Show Comparison Slider'
          }
        >
          {showSlider ? (
            <Eye className="w-5 h-5" />
          ) : (
            <EyeOff className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={() => setRotation(r => r + 90)}
          className="p-2 hover:bg-white/10 rounded-xl text-white transition-colors"
          title="Rotate Image"
        >
          <RotateCw className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-white/20 mx-1"></div>

        <button
          onClick={() => handleZoomBtn(0.5)}
          className="p-2 hover:text-pink-400 text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>

        <span className="font-bold text-sm min-w-[3.5rem] text-center tabular-nums text-white select-none">
          {Math.round(transform.scale * 100)}%
        </span>

        <button
          onClick={() => handleZoomBtn(2.0)}
          className="p-2 hover:text-pink-400 text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-white/20 mx-1"></div>

        <button
          onClick={() => {
            setTransform({x: 0, y: 0, scale: 1});
            setSliderPos(50);
            setRotation(0);
          }}
          className="p-2 hover:text-pink-400 text-white transition-colors"
          title="Reset View"
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
