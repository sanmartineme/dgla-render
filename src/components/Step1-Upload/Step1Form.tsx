/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SpaceType, LayoutType, Dimensions, FurnitureDimensions, KitchenEquipment } from '../../types';
import { SPACE_TYPES, LAYOUTS } from '../../utils/constants';
import { Check, Ruler } from 'lucide-react';
import { SPACE_EQUIPMENT } from '../../utils/spaceConfig';

interface Step1FormProps {
  spaceType: SpaceType;
  setSpaceType: (val: SpaceType) => void;
  dimensions: Dimensions;
  setDimensions: (val: Dimensions) => void;
  furnitureDimensions: FurnitureDimensions;
  setFurnitureDimensions: (val: FurnitureDimensions) => void;
  kitchenEquipment: KitchenEquipment;
  setKitchenEquipment: (val: KitchenEquipment) => void;
  currentLayout: LayoutType;
  setCurrentLayout: (val: LayoutType) => void;
}

// ── Shared style tokens ────────────────────────────────────────────────────────
const INPUT = [
  'w-full py-2.5 px-3 text-sm font-mono text-slate-800',
  'bg-white border border-slate-200 rounded-lg',
  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  'transition-all placeholder:text-slate-300',
].join(' ');

const CARD_BASE = 'w-full text-left p-3.5 rounded-xl border-2 transition-all relative focus:outline-none cursor-pointer';
const CARD_ON   = 'border-blue-600 bg-blue-50/30 shadow-sm';
const CARD_OFF  = 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50/40';

const CHECK_LABEL = [
  'flex items-center gap-3 p-3 rounded-xl border-2 border-slate-200',
  'bg-white hover:border-blue-200 hover:bg-blue-50/20 transition-all cursor-pointer',
].join(' ');

const SECTION_LABEL = 'text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3';
const FIELD_LABEL   = 'block text-xs font-semibold text-slate-600 mb-1.5';
const HINT          = 'text-[10px] text-slate-400 font-mono mt-1.5';

export default function Step1Form({
  spaceType, setSpaceType,
  dimensions, setDimensions,
  furnitureDimensions, setFurnitureDimensions,
  kitchenEquipment, setKitchenEquipment,
  currentLayout, setCurrentLayout,
}: Step1FormProps) {

  const updateDimension = (key: keyof Dimensions, val: string) =>
    setDimensions({ ...dimensions, [key]: parseInt(val) || 0 });

  const updateFurnitureDimension = (key: keyof FurnitureDimensions, val: string) =>
    setFurnitureDimensions({ ...furnitureDimensions, [key]: parseInt(val) || 0 });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* ── 1. TIPO DE ESPACIO ─────────────────────────────────────── */}
      <section className="space-y-3">
        <p className={SECTION_LABEL}>1 · Tipo de habitación</p>
        <div className="grid grid-cols-2 gap-2.5">
          {SPACE_TYPES.map(type => {
            const isAvailable = type.id === 'cocina';
            const on = spaceType === type.id;
            if (!isAvailable) {
              return (
                <div
                  key={type.id}
                  className={`${CARD_BASE} border-slate-100 bg-slate-50/60 opacity-60 cursor-not-allowed`}
                >
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-slate-200 text-slate-500 text-[9px] font-bold rounded-full uppercase tracking-wider leading-none">Soon</span>
                  <span className="block text-xs font-bold text-slate-400 leading-tight pr-10">{type.name}</span>
                  <span className="block text-[10px] text-slate-300 mt-1 leading-snug">{type.description}</span>
                </div>
              );
            }
            return (
              <button
                key={type.id}
                onClick={() => setSpaceType(type.id)}
                className={`${CARD_BASE} ${on ? CARD_ON : CARD_OFF}`}
                id={`space_type_${type.id}`}
              >
                {on && (
                  <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </span>
                )}
                <span className="block text-xs font-bold text-slate-800 leading-tight pr-5">{type.name}</span>
                <span className="block text-[10px] text-slate-400 mt-1 leading-snug">{type.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 1b. EQUIPAMIENTO — dinámico según espacio ─────────────── */}
      {(() => {
        const cfg = SPACE_EQUIPMENT[spaceType];
        return (
          <section className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div>
              <p className={SECTION_LABEL}>{cfg.sectionTitle}</p>
              <p className="text-[10px] text-slate-400 -mt-2 mb-3">{cfg.sectionDesc}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {cfg.fields.map(({ key, label, hint, invert, blue }) => {
                const val = (kitchenEquipment as any)?.[key];
                const isChecked = invert ? !!val : val !== false;
                return (
                  <label
                    key={key}
                    className={`${CHECK_LABEL} ${blue ? 'border-blue-200 bg-blue-50/20 hover:border-blue-400' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={e => setKitchenEquipment({ ...kitchenEquipment, [key]: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
                      id={`chk_${key}`}
                    />
                    <div className="min-w-0">
                      <span className={`block text-xs font-semibold leading-tight ${blue ? 'text-blue-900' : 'text-slate-800'}`}>{label}</span>
                      <span className={`block text-[10px] leading-none mt-0.5 ${blue ? 'text-blue-500' : 'text-slate-400'}`}>{hint}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* ── 2. MEDIDAS DEL ESPACIO ────────────────────────────────── */}
      <section className="space-y-3">
        <p className={SECTION_LABEL}>2 · Medidas del espacio (cm)</p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {[
            { key: 'length', label: 'Largo',  placeholder: '420', min: 100, max: 500 },
            { key: 'width',  label: 'Ancho',  placeholder: '350', min: 100, max: 500 },
            { key: 'height', label: 'Techo',  placeholder: '280', min: 200, max: 400 },
          ].map(({ key, label, placeholder, min, max }) => (
            <div key={key}>
              <label className={FIELD_LABEL}>
                <Ruler className="w-3 h-3 inline mr-1 text-slate-400" />{label}
              </label>
              <input
                type="number" min={min} max={max}
                value={(dimensions as any)[key] || ''}
                onChange={e => updateDimension(key as keyof Dimensions, e.target.value)}
                placeholder={placeholder}
                className={INPUT}
                id={`input_dim_${key}`}
              />
              <p className={HINT}>{min}–{max} cm</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 2b. MEDIDAS DEL MUEBLE ───────────────────────────────── */}
      <section className="space-y-3">
        <p className={SECTION_LABEL}>2b · Medidas del mueble (cm)</p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {[
            { key: 'length', label: 'Largo',        placeholder: '320', min: 50,  max: 500 },
            { key: 'height', label: 'Alto',         placeholder: '90',  min: 50,  max: 250 },
            { key: 'depth',  label: 'Profundidad',  placeholder: '60',  min: 30,  max: 120 },
          ].map(({ key, label, placeholder, min, max }) => (
            <div key={key}>
              <label className={FIELD_LABEL}>
                <Ruler className="w-3 h-3 inline mr-1 text-blue-400" />{label}
              </label>
              <input
                type="number" min={min} max={max}
                value={(furnitureDimensions as any)?.[key] || ''}
                onChange={e => updateFurnitureDimension(key as keyof FurnitureDimensions, e.target.value)}
                placeholder={placeholder}
                className={INPUT}
                id={`input_furn_${key}`}
              />
              <p className={HINT}>{min}–{max} cm</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. DISTRIBUCIÓN ACTUAL ───────────────────────────────── */}
      <section className="space-y-3">
        <p className={SECTION_LABEL}>3 · Distribución actual</p>
        <div className="grid grid-cols-3 gap-2">
          {LAYOUTS.map(layout => {
            const on = currentLayout === layout.id;
            return (
              <button
                key={layout.id} type="button"
                onClick={() => setCurrentLayout(layout.id)}
                className={`${CARD_BASE} py-3 ${on ? CARD_ON : CARD_OFF}`}
                id={`layout_${layout.id}`}
              >
                {on && (
                  <span className="absolute top-2 right-2 w-3.5 h-3.5 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="w-2 h-2 text-white" />
                  </span>
                )}
                <span className="block text-[10.5px] font-semibold text-slate-800 leading-tight pr-4">{layout.name}</span>
              </button>
            );
          })}
        </div>
      </section>

    </div>
  );
}
