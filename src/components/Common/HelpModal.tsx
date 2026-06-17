/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X, BookOpen, Check, ShieldCheck } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-250 max-h-[92vh] sm:max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <h3 className="font-sans font-semibold text-base sm:text-lg tracking-tight">Manual de Ergonomía DGLA</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all focus:outline-none"
            id="btn_close_help_modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content — scrollable */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-6 text-slate-600 text-sm leading-relaxed">
          <p className="text-slate-500">
            Design Group Latinamerica (DGLA) aplica una metodología rigurosa científica para el remodelamiento de cocinas. Este visualizador le permite experimentar con nuestros parámetros constructivos para garantizar la salud lumbar, seguridad y belleza de su espacio.
          </p>

          <div className="space-y-2 border-l-2 border-emerald-500 pl-4">
            <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded">Pilar 1</span>
              La Profundidad de 80 cm
            </h4>
            <p className="text-slate-500 text-xs">
              Las cocinas tradicionales usan encimeras de 60 cm que obligan a trabajar con la cabeza inclinada bajo las alacenas. DGLA estandariza la profundidad en <strong>80 cm</strong>. Esto libera un 33% adicional de plano de trabajo, permitiendo colocar la <strong>Sección Posterior Equipada de 20 cm</strong> para organizar embutidos (cuchillos, condimentos, plantas aromáticas) y facilita una visibilidad total de las tareas de corte.
            </p>
          </div>

          <div className="space-y-2 border-l-2 border-teal-500 pl-4">
            <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
              <span className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded">Pilar 2</span>
              Alacenas de Puertas Elevables Equilibradas
            </h4>
            <p className="text-slate-500 text-xs text-justify">
              Las alacenas clásicas abren hacia el usuario, constituyendo el mayor peligro de golpes en la cocción. Las alacenas diseñadas por DGLA cuentan con amortiguadores neumáticos de apertura vertical ascendente. La puerta suspendida permanece fuera de la zona de peligro mientras usted cocina, brindando un acceso transparente y confortable.
            </p>
          </div>

          <div className="space-y-2 border-l-2 border-amber-500 pl-4">
            <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded">Pilar 3</span>
              Lavavajillas en Columna Ergonómica
            </h4>
            <p className="text-slate-500 text-xs">
              Agacharse constantemente para vaciar platos en el lavavajillas a ras de suelo genera tensiones acumulativas severas en los discos lumbares. En las cocinas DGLA, el lavavajillas se integra sobre-elevado en un buffet térmico o columna técnica a +40 cm. Carga y descarga cómodamente de pie manteniendo la espalda perfectamente recta.
            </p>
          </div>

          <div className="space-y-2 border-l-2 border-purple-500 pl-4">
            <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded">Pilar 4</span>
              El Triángulo de Trabajo Social
            </h4>
            <p className="text-slate-500 text-xs">
              El flujo ideal recorre el triángulo: Almacén (Frío) → Preparación (Húmedo) → Cocinado (Fuego). Las cocinas modernas integran zonas de Isla Central social porque abren los flujos circulatorios para invitar a acompañantes y familiares a participar juntos en la gastronomía, con un ancho libre de paso obligado de al menos 100 cm.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <h5 className="font-semibold text-slate-800 flex items-center gap-2 mb-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Checklist Rápido de Validación
            </h5>
            <ul className="text-xs text-slate-500 space-y-1">
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Largo y ancho de habitación con espacios libres ≥ 100cm.</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Altura de encimera calculada ad-hoc según la estatura del usuario (Fórmula: Estatura / 2 + 5 cm).</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Profundidad aconsejada al 100% en frentes de labor activa (80 cm).</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-950 hover:bg-slate-800 rounded-lg transition-all focus:outline-none"
            id="btn_ack_help_modal"
          >
            Entendido, ¡Gracias!
          </button>
        </div>
      </div>
    </div>
  );
}
