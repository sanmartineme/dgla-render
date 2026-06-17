/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { SpaceType, StyleType, MaterialsConfig, ErgonomicsConfig, Dimensions, KitchenEquipment, LayoutType } from '../../types';
import { STYLES, FURNITURE_MATERIALS, COUNTERTOP_MATERIALS, BACKSPLASH_MATERIALS } from '../../utils/constants';
import { STEP2_SPACE_EQUIPMENT } from '../../utils/spaceConfig';
import { Check, Cpu, Star, Zap, Sparkles } from 'lucide-react';

interface Step2FormProps {
  spaceType: SpaceType;
  selectedStyle: StyleType;
  setSelectedStyle: (val: StyleType) => void;
  materials: MaterialsConfig;
  setMaterials: (val: MaterialsConfig) => void;
  newLayout: LayoutType;
  setNewLayout: (val: LayoutType) => void;
  ergonomics: ErgonomicsConfig;
  setErgonomics: (val: ErgonomicsConfig) => void;
  dimensions: Dimensions;
  kitchenEquipment: KitchenEquipment;
  setKitchenEquipment: (val: KitchenEquipment) => void;
}

// ── Shared style tokens ────────────────────────────────────────────────────────
const SECTION_LABEL = 'text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3';

// Chip: material type selector
const chip = (active: boolean) =>
  `px-3 py-1.5 rounded-full text-[11px] font-semibold border-2 transition-all cursor-pointer focus:outline-none whitespace-nowrap ${
    active
      ? 'border-slate-900 bg-slate-900 text-white'
      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-800'
  }`;

export default function Step2Form({
  spaceType,
  selectedStyle, setSelectedStyle,
  materials, setMaterials,
  newLayout, setNewLayout,
  ergonomics, setErgonomics,
  dimensions,
  kitchenEquipment, setKitchenEquipment,
}: Step2FormProps) {
  const isKitchen = spaceType === 'cocina';
  const [activeTab, setActiveTab] = useState<'style' | 'materials' | 'appliances'>('style');

  return (
    <div className="space-y-5 animate-in fade-in duration-300">

      {/* ── TABS ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 bg-slate-100 rounded-xl p-1 gap-1">
        {([
          { id: 'style',      label: '1. Estilo' },
          { id: 'materials',  label: '2. Materialidad' },
          { id: 'appliances', label: '3. Equipamiento' },
        ] as const).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`py-2 text-center text-[11px] font-semibold rounded-lg transition-all ${
              activeTab === id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            id={`tab_${id}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
           TAB 1 · ESTILO
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'style' && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-1 duration-200">
          <p className={SECTION_LABEL}>Estilo estético predefinido</p>

          <div className="grid grid-cols-2 gap-2.5">
            {STYLES.map((style) => {
              const on = selectedStyle === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`text-left rounded-xl border-2 transition-all cursor-pointer focus:outline-none overflow-hidden ${
                    on
                      ? 'border-blue-600 bg-blue-50/30 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50/60'
                  }`}
                  id={`style_opt_${style.id}`}
                >
                  {/* Palette strip at top */}
                  <div className="flex h-7">
                    {style.colors.map((col, i) => (
                      <span key={i} className="flex-1" style={{ backgroundColor: col }} />
                    ))}
                  </div>

                  {/* Card body */}
                  <div className="p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-1">
                      <span className={`text-[9px] font-bold font-mono tracking-widest uppercase px-1.5 py-0.5 rounded border ${
                        on
                          ? 'text-blue-700 bg-blue-50 border-blue-200'
                          : 'text-slate-500 bg-slate-50 border-slate-200'
                      }`}>
                        {style.tag}
                      </span>
                      {on && (
                        <span className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-800 leading-tight">{style.name}</p>
                    <p className="text-[10px] text-slate-400 leading-snug">{style.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
           TAB 2 · MATERIALIDAD
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'materials' && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-1 duration-200">

          {/* ── A) MUEBLES / GABINETERÍA ─────────────────────────── */}
          <section className="space-y-3">
            <div>
              <p className={SECTION_LABEL}>Muebles · Gabinetería</p>
              <p className="text-[10px] text-slate-400 -mt-2 mb-3">Soporte estructural y frente del mueble</p>
            </div>

            {/* Material chips */}
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(FURNITURE_MATERIALS) as Array<keyof typeof FURNITURE_MATERIALS>).map((fKey) => (
                <button
                  key={fKey}
                  type="button"
                  onClick={() => setMaterials({
                    ...materials,
                    furniture: fKey,
                    furnitureColor: FURNITURE_MATERIALS[fKey].options[0].hex,
                  })}
                  className={chip(materials.furniture === fKey)}
                  id={`furn_type_${fKey}`}
                >
                  {FURNITURE_MATERIALS[fKey].name.replace(' (3D)', '').replace(' Lacado', ' Lac.')}
                </button>
              ))}
            </div>

            {/* Color cards */}
            <div className="grid grid-cols-3 gap-2">
              {FURNITURE_MATERIALS[materials.furniture].options.map((opt) => {
                const on = materials.furnitureColor.toLowerCase() === opt.hex.toLowerCase();
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMaterials({ ...materials, furnitureColor: opt.hex })}
                    className={`rounded-xl border-2 overflow-hidden transition-all focus:outline-none ${
                      on ? 'border-blue-600 shadow-md ring-2 ring-blue-600/20' : 'border-slate-200 hover:border-slate-300'
                    }`}
                    id={`furn_col_${opt.id}`}
                  >
                    <div className="h-10 relative" style={{ backgroundColor: opt.hex }}>
                      {on && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                          <Check className="w-4 h-4 text-white drop-shadow" />
                        </div>
                      )}
                    </div>
                    <div className="px-1.5 py-1.5 bg-white">
                      <span className="text-[9.5px] font-semibold text-slate-700 leading-tight block truncate">{opt.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="border-t border-slate-100" />

          {/* ── B) SUPERFICIE DE ENCIMERA ─────────────────────────── */}
          <section className="space-y-3">
            <div>
              <p className={SECTION_LABEL}>Superficie · Encimera</p>
              <p className="text-[10px] text-slate-400 -mt-2 mb-3">Plano horizontal de trabajo gastronómico</p>
            </div>

            {/* Material chips */}
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(COUNTERTOP_MATERIALS) as Array<keyof typeof COUNTERTOP_MATERIALS>).map((cKey) => (
                <button
                  key={cKey}
                  type="button"
                  onClick={() => setMaterials({
                    ...materials,
                    countertop: cKey,
                    countertopColor: COUNTERTOP_MATERIALS[cKey].options[0].hex,
                  })}
                  className={chip(materials.countertop === cKey)}
                  id={`countertop_type_${cKey}`}
                >
                  {COUNTERTOP_MATERIALS[cKey].name.split(' (')[0]}
                </button>
              ))}
            </div>

            {/* Color cards */}
            <div className="grid grid-cols-3 gap-2">
              {COUNTERTOP_MATERIALS[materials.countertop].options.map((opt) => {
                const on = materials.countertopColor.toLowerCase() === opt.hex.toLowerCase();
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMaterials({ ...materials, countertopColor: opt.hex })}
                    className={`rounded-xl border-2 overflow-hidden transition-all focus:outline-none ${
                      on ? 'border-blue-600 shadow-md ring-2 ring-blue-600/20' : 'border-slate-200 hover:border-slate-300'
                    }`}
                    id={`counter_col_${opt.id}`}
                  >
                    <div className="h-10 relative" style={{ backgroundColor: opt.hex }}>
                      {on && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                          <Check className="w-4 h-4 text-white drop-shadow" />
                        </div>
                      )}
                    </div>
                    <div className="px-1.5 py-1.5 bg-white">
                      <span className="text-[9.5px] font-semibold text-slate-700 leading-tight block truncate">{opt.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="border-t border-slate-100" />

          {/* ── C) REVESTIMIENTO SALPICADERO ─────────────────────── */}
          <section className="space-y-3">
            <div>
              <p className={SECTION_LABEL}>Revestimiento · Salpicadero</p>
              <p className="text-[10px] text-slate-400 -mt-2 mb-3">Alzada mural entre encimera y alacenas</p>
            </div>

            {/* Material chips */}
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(BACKSPLASH_MATERIALS) as Array<keyof typeof BACKSPLASH_MATERIALS>).map((bKey) => (
                <button
                  key={bKey}
                  type="button"
                  onClick={() => setMaterials({
                    ...materials,
                    backsplash: bKey,
                    backsplashColor: BACKSPLASH_MATERIALS[bKey].options[0].hex,
                  })}
                  className={chip(materials.backsplash === bKey)}
                  id={`back_type_${bKey}`}
                >
                  {BACKSPLASH_MATERIALS[bKey].name}
                </button>
              ))}
            </div>

            {/* Color cards */}
            <div className="grid grid-cols-3 gap-2">
              {BACKSPLASH_MATERIALS[materials.backsplash].options.map((opt) => {
                const on = materials.backsplashColor.toLowerCase() === opt.hex.toLowerCase();
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMaterials({ ...materials, backsplashColor: opt.hex })}
                    className={`rounded-xl border-2 overflow-hidden transition-all focus:outline-none ${
                      on ? 'border-blue-600 shadow-md ring-2 ring-blue-600/20' : 'border-slate-200 hover:border-slate-300'
                    }`}
                    id={`back_col_${opt.id}`}
                  >
                    <div className="h-10 relative" style={{ backgroundColor: opt.hex }}>
                      {on && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                          <Check className="w-4 h-4 text-white drop-shadow" />
                        </div>
                      )}
                    </div>
                    <div className="px-1.5 py-1.5 bg-white">
                      <span className="text-[9.5px] font-semibold text-slate-700 leading-tight block truncate">{opt.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
           TAB 3 · EQUIPAMIENTO — dinámico por espacio
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'appliances' && (
        <div className="space-y-5 animate-in fade-in duration-200">

          {/* ── COCINA: content completo ─────────────────────────── */}
          {isKitchen && (
            <>
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={SECTION_LABEL}>Encimera de cocción</p>
                    <p className="text-[10px] text-slate-400 -mt-2">Placa de inducción y quemadores</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[10px] text-slate-500 font-medium">Activar</span>
                    <input type="checkbox" checked={!!kitchenEquipment.includeStove}
                      onChange={e => setKitchenEquipment({ ...kitchenEquipment, includeStove: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" id="chk_equip_stove" />
                  </label>
                </div>
                {kitchenEquipment.includeStove && (
                  <div className="space-y-2 animate-in fade-in duration-150">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Número de platos</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[2, 3, 4, 5].map(n => (
                        <button key={n} type="button" onClick={() => setKitchenEquipment({ ...kitchenEquipment, stovePlates: n })}
                          className={chip((kitchenEquipment.stovePlates || 4) === n)} id={`btn_stove_plates_${n}`}>
                          {n} platos
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <div className="border-t border-slate-100" />

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={SECTION_LABEL}>Lavaplatos · Fregadero</p>
                    <p className="text-[10px] text-slate-400 -mt-2">Zona de lavado y grifería</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[10px] text-slate-500 font-medium">Activar</span>
                    <input type="checkbox" checked={!!kitchenEquipment.includeSink}
                      onChange={e => setKitchenEquipment({ ...kitchenEquipment, includeSink: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" id="chk_equip_sink" />
                  </label>
                </div>
                {kitchenEquipment.includeSink && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Cubetas</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[{ id:'simple',label:'Simple',sub:'1 cubeta',dgla:false},{id:'double',label:'Doble',sub:'2 cubetas · DGLA',dgla:true}].map(({id,label,sub,dgla})=>{
                          const on=(kitchenEquipment.sinkType||'simple')===id;
                          return(<button key={id} type="button" onClick={()=>setKitchenEquipment({...kitchenEquipment,sinkType:id as any})}
                            className={`p-3 rounded-xl border-2 text-left transition-all relative focus:outline-none ${on?'border-blue-600 bg-blue-50/30 shadow-sm':'border-slate-200 bg-white hover:border-slate-300'}`} id={`sink_type_${id}`}>
                            {dgla&&<span className="absolute top-2 right-2 text-[8px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">DGLA</span>}
                            <span className="block text-xs font-bold text-slate-800 pr-8">{label}</span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">{sub}</span>
                          </button>);
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Acabado</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          {id:'stainless',name:'Acero Inox.',col:'#cbd5e1',sub:'Satinado'},
                          {id:'black_granite',name:'Granito Negro',col:'#1e293b',sub:'Cuarzo mate'},
                          {id:'white_ceramic',name:'Cerámica Blanca',col:'#f8fafc',sub:'Vitrificado'},
                          {id:'copper',name:'Cobre Cepillado',col:'#c2410c',sub:'Artesanal'},
                        ].map(item=>{
                          const on=(kitchenEquipment.sinkColorAndMaterial||'stainless')===item.id;
                          return(<button key={item.id} type="button" onClick={()=>setKitchenEquipment({...kitchenEquipment,sinkColorAndMaterial:item.id as any})}
                            className={`rounded-xl border-2 overflow-hidden transition-all focus:outline-none ${on?'border-blue-600 shadow-md ring-2 ring-blue-600/20':'border-slate-200 hover:border-slate-300'}`} id={`sink_material_${item.id}`}>
                            <div className="h-8 relative" style={{backgroundColor:item.col}}>
                              {on&&<div className="absolute inset-0 flex items-center justify-center bg-black/15"><Check className="w-3.5 h-3.5 text-white drop-shadow"/></div>}
                            </div>
                            <div className="px-2 py-1.5 bg-white">
                              <span className="text-[10px] font-bold text-slate-800 block truncate">{item.name}</span>
                              <span className="text-[9px] text-slate-400 block">{item.sub}</span>
                            </div>
                          </button>);
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <div className="border-t border-slate-100" />

              {/* ── Tipo de mueble en altura ─────────────────────── */}
              <section className="space-y-3">
                <div>
                  <p className={SECTION_LABEL}>Tipo de mueble en altura</p>
                  <p className="text-[10px] text-slate-400 -mt-2 mb-3">Estilo de alacena superior</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: 'lift_door',   name: 'Puerta elevable',   sub: 'Sistema DGLA balanced lift' },
                    { id: 'closed_door', name: 'Puerta estándar',   sub: 'Batiente con tirador' },
                    { id: 'glass_door',  name: 'Puerta con vidrio', sub: 'Panel de vidrio templado' },
                    { id: 'open_shelf',  name: 'Estante abierto',   sub: 'Sin puerta, acceso directo' },
                  ] as const).map(({ id, name, sub }) => {
                    const on = (kitchenEquipment.wallCabinetType ?? 'lift_door') === id;
                    return (
                      <button key={id} type="button"
                        onClick={() => setKitchenEquipment({ ...kitchenEquipment, wallCabinetType: id })}
                        className={`p-3 rounded-xl border-2 text-left transition-all relative focus:outline-none cursor-pointer ${on ? 'border-blue-600 bg-blue-50/30 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50/40'}`}
                        id={`wall_cab_${id}`}>
                        {on && <span className="absolute top-2 right-2 w-3.5 h-3.5 bg-blue-600 rounded-full flex items-center justify-center"><Check className="w-2 h-2 text-white" /></span>}
                        <span className="block text-xs font-bold text-slate-800 leading-tight pr-4">{name}</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5 leading-snug">{sub}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <div className="border-t border-slate-100" />

              {/* ── Tipo de cierre de puerta ─────────────────────── */}
              <section className="space-y-3">
                <div>
                  <p className={SECTION_LABEL}>Cierre de puerta · gaveta</p>
                  <p className="text-[10px] text-slate-400 -mt-2 mb-3">Sistema de apertura del frente de mueble</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: 'soft_close',  name: 'Amortiguado',      sub: 'Cierre suave automático' },
                    { id: 'push_open',   name: 'Push-to-open',     sub: 'Sin tirador, apertura a presión' },
                    { id: 'rail_handle', name: 'Perfil integrado', sub: 'Fresado en la puerta' },
                    { id: 'handle',      name: 'Tirador',          sub: 'Tirador metálico clásico' },
                  ] as const).map(({ id, name, sub }) => {
                    const on = (kitchenEquipment.doorCloseType ?? 'soft_close') === id;
                    return (
                      <button key={id} type="button"
                        onClick={() => setKitchenEquipment({ ...kitchenEquipment, doorCloseType: id })}
                        className={`p-3 rounded-xl border-2 text-left transition-all relative focus:outline-none cursor-pointer ${on ? 'border-blue-600 bg-blue-50/30 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50/40'}`}
                        id={`door_close_${id}`}>
                        {on && <span className="absolute top-2 right-2 w-3.5 h-3.5 bg-blue-600 rounded-full flex items-center justify-center"><Check className="w-2 h-2 text-white" /></span>}
                        <span className="block text-xs font-bold text-slate-800 leading-tight pr-4">{name}</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5 leading-snug">{sub}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

            </>
          )}

          {/* ── OTROS ESPACIOS: selection cards por tipo ─────────── */}
          {!isKitchen && (() => {
            const spaceCfg = STEP2_SPACE_EQUIPMENT[spaceType];
            if (!spaceCfg) return (
              <div className="text-center py-8 text-slate-400 text-xs">
                <p>Configura el espacio desde el paso 1 para ver opciones específicas.</p>
              </div>
            );
            const activeKey = spaceCfg.items[0]?.valueKey;
            return (
              <section className="space-y-4">
                <div>
                  <p className={SECTION_LABEL}>{spaceCfg.primaryLabel}</p>
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  {spaceCfg.items.map(item => {
                    const on = !!(kitchenEquipment as any)?.[item.valueKey];
                    return (
                      <button
                        key={item.id} type="button"
                        onClick={() => {
                          const update: any = {};
                          spaceCfg.items.forEach(i => { update[i.valueKey] = i.id === item.id; });
                          setKitchenEquipment({ ...kitchenEquipment, ...update });
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border-2 transition-all focus:outline-none cursor-pointer ${
                          on ? 'border-blue-600 bg-blue-50/30 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50/40'
                        }`}
                        id={`space_opt_${item.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">{item.label}</span>
                          {on && <span className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white"/></span>}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{item.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })()}

        </div>
      )}

    </div>
  );
}
