import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Sparkles, ArrowRight } from 'lucide-react';

interface OnboardingTourProps {
  currentStep: number;
  setStep: (step: number) => void;
  onClose?: () => void;
}

interface TourStep {
  title: string;
  targetId: string;
  description: string;
  triggerAppStep: 1 | 2 | 3;
  badge: string;
}

interface HighlightRect {
  x: number; y: number; width: number; height: number;
}

const STEPS: TourStep[] = [
  {
    title: 'Contexto Espacial y Medidas',
    targetId: 'tour-section-1',
    description:
      'Define el tipo de habitación, las medidas reales del espacio (largo, ancho, altura de techo) y el mobiliario a integrar. Puedes subir una fotografía existente o elegir una demo DGLA como referencia visual.',
    triggerAppStep: 1,
    badge: 'Paso 1 · Dimensionamiento',
  },
  {
    title: 'Diseño, Materiales y Equipamiento',
    targetId: 'tour-section-2',
    description:
      'Elige el estilo estético predefinido, selecciona materiales para muebles, encimera y revestimientos con chips y paletas de color. Configura el equipamiento según el tipo de espacio.',
    triggerAppStep: 2,
    badge: 'Paso 2 · Materialidad',
  },
  {
    title: 'Controles de Render 3D',
    targetId: 'tour-section-3',
    description:
      'Controla las vistas de cámara (perspectiva, alzado, planta aérea), ajusta la iluminación ambiental y activa el mapa de calor ergonómico. Haz clic en "Generar Render" para producir la visualización 3D.',
    triggerAppStep: 3,
    badge: 'Paso 3 · Render Virtual',
  },
];

const PAD = 6;

export default function OnboardingTour({ currentStep, setStep, onClose }: OnboardingTourProps) {
  const [isActive, setIsActive]         = useState(false);
  const [tourIndex, setTourIndex]       = useState(-1);
  const [highlight, setHighlight]       = useState<HighlightRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [isMobile, setIsMobile]         = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    const onTrigger = () => { setIsActive(true); setTourIndex(-1); setHighlight(null); };
    window.addEventListener('start-dgla-tour', onTrigger);
    return () => window.removeEventListener('start-dgla-tour', onTrigger);
  }, []);

  useEffect(() => {
    if (!isActive || tourIndex < 0) return;

    const step = STEPS[tourIndex];
    setStep(step.triggerAppStep);

    const measure = () => {
      // On mobile, skip spotlight and use bottom sheet positioning
      if (isMobile) {
        setHighlight(null);
        setTooltipStyle({});
        return;
      }

      const el = document.getElementById(step.targetId);
      if (!el) {
        setHighlight(null);
        setTooltipStyle({ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' });
        return;
      }

      const rect = el.getBoundingClientRect();
      setHighlight({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });

      const TOOLTIP_W = 360;
      const TOOLTIP_MARGIN = 20;
      const availableRight = window.innerWidth - rect.right - TOOLTIP_MARGIN;

      let left: number;
      if (availableRight >= TOOLTIP_W + TOOLTIP_MARGIN) {
        left = rect.right + TOOLTIP_MARGIN;
      } else {
        left = Math.max(16, (window.innerWidth - TOOLTIP_W) / 2);
      }

      const verticalCenter = rect.top + rect.height / 2;
      let top = verticalCenter - 120;
      top = Math.max(16, Math.min(top, window.innerHeight - 300));

      setTooltipStyle({ position: 'fixed', top, left, width: TOOLTIP_W, zIndex: 60 });
    };

    const t = setTimeout(measure, 280);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); };
  }, [tourIndex, isActive, isMobile]);

  const handleNext = () => {
    if (tourIndex < STEPS.length - 1) setTourIndex(t => t + 1);
    else handleComplete();
  };

  const handlePrev = () => {
    if (tourIndex > 0) setTourIndex(t => t - 1);
    else setTourIndex(-1);
  };

  const handleComplete = () => {
    localStorage.setItem('dgla_onboarding_completed_v1', 'true');
    setIsActive(false);
    setHighlight(null);
    onClose?.();
  };

  if (!isActive) return null;

  const step = tourIndex >= 0 ? STEPS[tourIndex] : null;

  // Mobile bottom-sheet style for step tooltips
  const mobileTooltipStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 60,
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">

      {/* Spotlight backdrop — desktop only */}
      {!isMobile && highlight ? (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-auto"
          xmlns="http://www.w3.org/2000/svg"
          onClick={handleComplete}
        >
          <defs>
            <mask id="dgla-tour-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={highlight.x - PAD} y={highlight.y - PAD}
                width={highlight.width + PAD * 2} height={highlight.height + PAD * 2}
                rx="14" fill="black"
              />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(15,23,42,0.78)" mask="url(#dgla-tour-mask)" />
          <rect
            x={highlight.x - PAD} y={highlight.y - PAD}
            width={highlight.width + PAD * 2} height={highlight.height + PAD * 2}
            rx="14" fill="none"
            stroke="#3b82f6" strokeWidth="2"
          />
        </svg>
      ) : (
        <div
          className="absolute inset-0 bg-slate-950/78 backdrop-blur-[2px] pointer-events-auto"
          onClick={tourIndex === -1 ? undefined : handleComplete}
        />
      )}

      <AnimatePresence mode="wait">

        {/* ── Welcome modal ── */}
        {tourIndex === -1 && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ type: 'spring', damping: 22, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 sm:absolute sm:bottom-auto sm:top-[14vh] sm:left-1/2 sm:-translate-x-1/2 sm:w-[90%] sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden pointer-events-auto"
            style={{ zIndex: 60 }}
          >
            {/* Drag handle — mobile only */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>

            <div className="bg-slate-900 p-6 text-white text-center relative">
              <span className="inline-block px-3 py-1 bg-blue-600 text-[10px] font-bold rounded-full uppercase tracking-wider mb-2">
                Metodología Ergonométrica DGLA
              </span>
              <h3 className="font-bold text-lg tracking-tight">Bienvenido al Motor Ergonómico</h3>
              <p className="text-slate-400 text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">
                Te guiaremos en 3 pasos para configurar, diseñar y renderizar tu espacio con rigor científico.
              </p>
              <button onClick={handleComplete} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-slate-600 text-xs leading-relaxed">
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { n: 1, label: 'Espacio', sub: 'Contexto y planos', color: 'text-blue-600' },
                  { n: 2, label: 'Diseño', sub: 'Materiales y estilo', color: 'text-amber-600' },
                  { n: 3, label: 'Render', sub: 'Simulación 3D', color: 'text-emerald-600' },
                ].map(({ n, label, sub, color }) => (
                  <div key={n} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className={`text-[10px] font-bold block ${color}`}>{n}. {label}</span>
                    <span className="text-[9px] text-slate-400">{sub}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
                <button onClick={handleComplete} className="px-4 py-2 hover:bg-slate-100 rounded-lg text-slate-500 font-semibold transition-all text-xs">
                  Omitir tour
                </button>
                <button
                  onClick={() => setTourIndex(0)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm flex items-center gap-1.5 transition-all text-xs"
                >
                  Comenzar Tour <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step tooltips ── */}
        {tourIndex >= 0 && step && (
          <motion.div
            key={tourIndex}
            initial={isMobile ? { opacity: 0, y: 40 } : { opacity: 0, x: -8, scale: 0.97 }}
            animate={isMobile ? { opacity: 1, y: 0 }  : { opacity: 1, x: 0, scale: 1 }}
            exit={isMobile   ? { opacity: 0, y: 40 }  : { opacity: 0, x: 8, scale: 0.97 }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
            className={`bg-white shadow-2xl border border-blue-100 p-5 pointer-events-auto flex flex-col gap-3 ${
              isMobile ? 'rounded-t-2xl' : 'rounded-xl'
            }`}
            style={isMobile ? mobileTooltipStyle : tooltipStyle}
          >
            {/* Drag handle — mobile only */}
            {isMobile && (
              <div className="flex justify-center -mt-1">
                <div className="w-10 h-1 bg-slate-200 rounded-full" />
              </div>
            )}

            {/* Left arrow — desktop only */}
            {!isMobile && (
              <div className="absolute -left-[9px] top-[calc(50%-8px)] w-4 h-4 bg-white border-l border-b border-blue-100 -rotate-45 rounded-[1px]" />
            )}

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider leading-tight">
                {step.badge}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono">{tourIndex + 1} / {STEPS.length}</span>
                <button onClick={handleComplete} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-1.5 overflow-y-auto max-h-[30vh] sm:max-h-none">
              <h4 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                {step.title}
              </h4>
              <p className="text-[11.5px] text-slate-600 leading-relaxed">{step.description}</p>
            </div>

            {/* Progress + navigation */}
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === tourIndex ? 'w-4 bg-blue-600' : 'w-1.5 bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={handlePrev}
                  className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-0.5 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Atrás
                </button>
                <button
                  onClick={handleNext}
                  className="px-4 py-1.5 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all flex items-center gap-0.5 cursor-pointer"
                >
                  {tourIndex === STEPS.length - 1 ? 'Entendido ✓' : 'Siguiente'}
                  {tourIndex < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
