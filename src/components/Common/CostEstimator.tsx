import React, { useState, useMemo } from 'react';
import { ProjectState } from '../../types';
import { 
  Info, 
  Sliders, 
  TrendingUp, 
  Wrench, 
  Sparkles,
  Layers,
  ShoppingBag,
  ExternalLink,
  CheckCircle,
  Building,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface CostEstimatorProps {
  project: ProjectState;
}

export default function CostEstimator({ project }: CostEstimatorProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(true);
  const [preferredStore, setPreferredStore] = useState<'both' | 'sodimac' | 'construmart'>('both');

  // Realistic CLP Pricing Logic (CLP $)
  const costData = useMemo(() => {
    const lenMeters = (project.furnitureDimensions?.length || 320) / 100;
    
    // --- 1. MUEBLES (Gabinete y Mueblería) ---
    // Construmart specializes in standard melamine boards, white/classic wood boards (DIY/Formica). 
    // Sodimac has ready-made luxury modules, lacquered finishes, and premium damp-proof (RH) boards.
    let mFurnitureConstrumart = 185000; // CLP per linear meter
    let mFurnitureSodimac = 295000;      // CLP per linear meter
    
    if (project.materials.furniture === 'wood') {
      mFurnitureConstrumart = 350000;
      mFurnitureSodimac = 490000;
    } else if (project.materials.furniture === 'lacquered_3d') {
      mFurnitureConstrumart = 280000;
      mFurnitureSodimac = 395000;
    }

    let furnitureMinBase = mFurnitureConstrumart * lenMeters;
    let furnitureMaxBase = mFurnitureSodimac * lenMeters;

    // High cabinets (muebles en altura)
    if (project.kitchenEquipment?.includeHighCabinets !== false) {
      furnitureMinBase += (mFurnitureConstrumart * 0.60) * lenMeters;
      furnitureMaxBase += (mFurnitureSodimac * 0.65) * lenMeters;
    }

    // --- 2. ENCIMERA (Mesón de Labor) ---
    // Construmart: Postformed laminates, standard granite. 
    // Sodimac: Quartz (Silestone), premium marble, high-pressure slate, solid surfaces.
    let mCountertopConstrumart = 65000; // standard laminate
    let mCountertopSodimac = 120000;     // quality block

    if (project.materials.countertop === 'quartz') {
      mCountertopConstrumart = 280000; // low range quartz
      mCountertopSodimac = 420000;     // prime quartz
    } else if (project.materials.countertop === 'granite') {
      mCountertopConstrumart = 220000;
      mCountertopSodimac = 320000;
    } else if (project.materials.countertop === 'marble') {
      mCountertopConstrumart = 350000;
      mCountertopSodimac = 490000;
    } else if (project.materials.countertop === 'stainless_steel') {
      mCountertopConstrumart = 180000;
      mCountertopSodimac = 260000;
    }

    // DGLA 80cm extra depth modifier (standard is 60cm, 80cm increases raw slab surface and cutting layout)
    const depthFactor = (project.ergonomics?.counterDepth || 80) > 70 ? 1.25 : 1.0;
    const countertopMinBase = (mCountertopConstrumart * lenMeters) * depthFactor;
    const countertopMaxBase = (mCountertopSodimac * lenMeters) * depthFactor;

    // --- 3. SALPICADERO (Backsplash / Muro de agua) ---
    // Construmart: Basic subway tile or ceramic plates.
    // Sodimac: Tempered glass backsplashes, microcement kits, advanced geometric mosaics.
    let mBacksplashConstrumart = 45000;
    let mBacksplashSodimac = 75000;

    if (project.materials.backsplash === 'tempered_glass') {
      mBacksplashConstrumart = 140000;
      mBacksplashSodimac = 220000;
    } else if (project.materials.backsplash === 'stainless_steel') {
      mBacksplashConstrumart = 110000;
      mBacksplashSodimac = 180000;
    } else if (project.materials.backsplash === 'mirror') {
      mBacksplashConstrumart = 85000;
      mBacksplashSodimac = 135000;
    }

    const backsplashMinBase = mBacksplashConstrumart * lenMeters;
    const backsplashMaxBase = mBacksplashSodimac * lenMeters;

    // --- 4. EQUIPAMIENTO Y APARATOS ---
    let equipCostConstrumart = 0;
    let equipCostSodimac = 0;

    // Fregadero (Sink)
    if (project.kitchenEquipment?.includeSink !== false) {
      let sinkCM = 75050; // Simple steel basin
      let sinkSD = 135000; // Premium color basin

      const sinkMat = project.kitchenEquipment?.sinkColorAndMaterial || 'stainless';
      if (sinkMat === 'black_granite') {
        sinkCM += 110000;
        sinkSD += 180000;
      } else if (sinkMat === 'white_ceramic') {
        sinkCM += 95000;
        sinkSD += 145000;
      } else if (sinkMat === 'copper') {
        sinkCM += 160000;
        sinkSD += 260000;
      }

      if (project.kitchenEquipment?.sinkType === 'double') {
        sinkCM += 65000;
        sinkSD += 110000;
      }

      equipCostConstrumart += sinkCM;
      equipCostSodimac += sinkSD;
    }

    // --- Dynamic Appliance Brand & Efficiency Factor ---
    const brand = project.kitchenEquipment?.applianceBrand || 'teka';
    const efficiency = project.kitchenEquipment?.energyEfficiency || 'A_plus';

    const brandMultiplier = brand === 'midea' ? 0.85 : brand === 'bosch' ? 1.25 : brand === 'miele' ? 1.60 : 1.0;
    const efficiencyMultiplier = efficiency === 'A' ? 0.90 : efficiency === 'A_plus' ? 1.0 : efficiency === 'A_triple_plus' ? 1.22 : 1.0;
    const appMultiplier = brandMultiplier * efficiencyMultiplier;

    // Cooktop / Encimera eléctrica o gas (subject to brand and efficiency)
    if (project.kitchenEquipment?.includeStove !== false) {
      const plates = project.kitchenEquipment?.stovePlates || 4;
      // 2 plates vs 4 vs 5 plates costs
      equipCostConstrumart += (95000 + (plates * 18000)) * appMultiplier;
      equipCostSodimac += (149000 + (plates * 32000)) * appMultiplier;
    }

    // Built-in Oven (subject to brand and efficiency)
    if (project.kitchenEquipment?.includeBuiltInOven) {
      equipCostConstrumart += 199990 * appMultiplier; // basic Mademsa/Midea at Construmart
      equipCostSodimac += 349990 * appMultiplier;     // built-in TEKA/FDV at Sodimac
    }

    // High Dishwasher column (subject to brand and efficiency)
    if (project.ergonomics?.dishwasherColumn) {
      equipCostConstrumart += 289990 * appMultiplier;
      equipCostSodimac += 419990 * appMultiplier;
    }

    // Kitchen Island (Isla)
    if (project.ergonomics?.includeIsland) {
      equipCostConstrumart += 350000; // custom structural build
      equipCostSodimac += 620000;     // premium finish kit
    }

    // --- 5. COMPLEJIDAD DE DISTRIBUCIÓN ---
    const activeLayout = project.newLayout !== 'none' ? project.newLayout : project.currentLayout;
    let complexityFactor = 1.0;
    if (activeLayout === 'L_shaped') {
      complexityFactor = 1.12; 
    } else if (activeLayout === 'U_shaped') {
      complexityFactor = 1.25; 
    } else if (activeLayout === 'with_island') {
      complexityFactor = 1.18;
    } else if (activeLayout === 'parallel') {
      complexityFactor = 1.08;
    }

    // Final subtotal multi
    const subtotalCM = (furnitureMinBase + countertopMinBase + backsplashMinBase + equipCostConstrumart) * complexityFactor;
    const subtotalSD = (furnitureMaxBase + countertopMaxBase + backsplashMaxBase + equipCostSodimac) * complexityFactor;

    // --- 6. INSTALACIÓN & LOGÍSTICA ---
    const installCM = subtotalCM * 0.18; // Construmart contractor rate
    const installSD = subtotalSD * 0.22; // Sodimac Homecenter official installation service

    return {
      furnitureCM: furnitureMinBase * complexityFactor,
      furnitureSD: furnitureMaxBase * complexityFactor,
      countertopCM: countertopMinBase * complexityFactor,
      countertopSD: countertopMaxBase * complexityFactor,
      backsplashCM: backsplashMinBase * complexityFactor,
      backsplashSD: backsplashMaxBase * complexityFactor,
      equipCM: equipCostConstrumart * complexityFactor,
      equipSD: equipCostSodimac * complexityFactor,
      installCM,
      installSD,
      totalCM: subtotalCM + installCM,
      totalSD: subtotalSD + installSD
    };

  }, [
    project.furnitureDimensions, 
    project.materials, 
    project.kitchenEquipment, 
    project.ergonomics, 
    project.newLayout, 
    project.currentLayout
  ]);

  const formatCLP = (clpAmount: number) => {
    return `CLP $${Math.round(clpAmount).toLocaleString('es-CL')}`;
  };

  // Determine displayed total based on filter toggle
  const displayMin = preferredStore === 'construmart' ? costData.totalCM : costData.totalCM;
  const displayMax = preferredStore === 'sodimac' ? costData.totalSD : costData.totalSD;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5" id="cost_estimator_widget">
      
      {/* HEADER SECTION - CLICK TO TOGGLE EXPAND/COLLAPSE */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer select-none gap-2"
        id="cost_estimator_header_toggle"
        title="Clic para expandir/colapsar presupuesto"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-sans font-extrabold text-[#1e293b] text-[11px] sm:text-xs tracking-tight uppercase leading-none flex flex-wrap items-center gap-1.5">
              <span>Presupuesto en Tiempo Real</span>
              <span className="text-[8px] bg-red-100 text-red-700 px-1 py-0.5 rounded font-black uppercase font-mono tracking-wider">CL</span>
              {!isExpanded && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 font-mono tracking-tight shrink-0 animate-in fade-in duration-300">
                  {formatCLP(costData.totalCM)} - {formatCLP(costData.totalSD)}
                </span>
              )}
            </h3>
            <span className="text-[9px] text-slate-400 font-mono block mt-1 uppercase leading-none">
              VALORACIÓN DE MERCADO: CONSTRUMART & SODIMAC
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            className="p-1 hover:bg-slate-100 rounded-md transition-colors"
            title={isExpanded ? "Contraer" : "Expandir"}
            id="btn_toggle_cost_widget_expand"
          >
            {isExpanded ? (
              <ChevronUp className="w-4.5 h-4.5 text-slate-500" />
            ) : (
              <ChevronDown className="w-4.5 h-4.5 text-slate-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-slate-100 mt-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
          
          {/* Store selector Tab Pill inside the expanded area to keep header clean */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200/80">
            <span className="text-[9px] text-slate-500 font-bold font-mono uppercase">TIENDA PREFERIDA:</span>
            <div className="flex bg-slate-200/60 p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto shrink-0 select-none">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreferredStore('both');
                }}
                className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${
                  preferredStore === 'both' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Ambos
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreferredStore('construmart');
                }}
                className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${
                  preferredStore === 'construmart' ? 'bg-red-650 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Construmart
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreferredStore('sodimac');
                }}
                className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${
                  preferredStore === 'sodimac' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sodimac
              </button>
            </div>
          </div>

          {/* RANGER DISPLAY CARD IN CHILEAN PESOS */}
          <div className="bg-slate-900 text-white rounded-xl p-4 relative overflow-hidden shadow-md">
            
            {/* Colorful Store Accent Badges */}
            <div className="absolute right-3 top-3 flex gap-1.5">
              <span className="text-[8px] bg-red-600/90 text-white font-black px-1.5 py-0.5 rounded font-mono uppercase">
                Construmart
              </span>
              <span className="text-[8px] bg-blue-650 text-white font-black px-1.5 py-0.5 rounded font-mono uppercase">
                Sodimac
              </span>
            </div>

            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest font-mono">
                RANGO ESTIMATIVO DE INVERSIÓN OBRA CHILE
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-1 flex-wrap pt-2.5 pb-1">
              {/* Construmart Range (Min) */}
              <div className="flex flex-col">
                <span className="text-[9px] text-[#ef4444] font-bold font-mono uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Construmart (Cota Obra)
                </span>
                <span className="text-lg md:text-xl font-black tracking-tight text-white font-mono leading-none mt-1">
                  {formatCLP(costData.totalCM)}
                </span>
                <span className="text-[8.5px] text-slate-400 mt-0.5 font-sans leading-none">Mueblería y herrajes estándar</span>
              </div>
              
              <div className="text-slate-500 font-extrabold text-sm self-center px-1 select-none">a</div>
              
              {/* Sodimac Range (Max) */}
              <div className="flex flex-col items-end text-right">
                <span className="text-[9px] text-sky-400 font-bold font-mono uppercase flex items-center gap-1 justify-end">
                  Sodimac Homecenter (Premium)
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                </span>
                <span className="text-lg md:text-xl font-black tracking-tight text-amber-400 font-mono leading-none mt-1">
                  {formatCLP(costData.totalSD)}
                </span>
                <span className="text-[8.5px] text-slate-400 mt-0.5 font-sans leading-none">RH de alta gama y cubiertas premium</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-350 mt-3 border-t border-white/10 pt-2.5 leading-normal text-justify">
              Estrecha correlación con el diseño 3D activo de <strong>{((project.furnitureDimensions?.length || 320)/100).toFixed(2)} ml</strong>. Construmart es óptimo para herramental, tableros y melamina base. Sodimac Homecenter provee griferías de diseño, cuarzo, y electrodomésticos empotrados.
            </p>
          </div>

          {/* METRIC ITEMIZATION CORRESPONDING */}
          <div className="space-y-2">
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200/85 text-slate-700 text-[10.5px] font-bold flex items-center justify-center gap-1.5 transition-all outline-none"
              id="btn_toggle_clp_breakdown"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              {showBreakdown ? 'Ocultar Desglose por Multitienda' : 'Mostrar Desglose con Sodimac / Construmart'}
            </button>

            {showBreakdown && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3.5 text-xs text-slate-600 font-mono animate-in fade-in slide-in-from-top-2 duration-300">
                
                {/* Category 1: Cabinetry */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-600" title="Construmart preferencial" />
                      Gabinete y Muebles
                    </span>
                    <p className="text-[9px] text-slate-400 italic">
                      Estructuración en Melamina ({project.materials.furniture.replace('_', ' ')})
                    </p>
                    <span className="text-[8px] bg-red-50 text-red-700 px-1 py-0.2 rounded border border-red-200">
                      Construmart: Líder en tableros Masisa
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-semibold text-slate-800 block text-[11px]">
                      {formatCLP(costData.furnitureCM)} <span className="text-[9px] text-slate-400 font-normal">CM</span>
                    </span>
                    <span className="font-bold text-slate-900 block text-[11px] mt-0.5">
                      {formatCLP(costData.furnitureSD)} <span className="text-[9px] text-blue-500 font-bold">SD</span>
                    </span>
                  </div>
                </div>

                {/* Category 2: Countertop */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600" title="Sodimac preferencial" />
                      Cubierta y Encimera
                    </span>
                    <p className="text-[9px] text-slate-400 italic">
                      {project.materials.countertop.replace('_', ' ')} (Ancho Ergonómico {project.ergonomics.counterDepth}cm)
                    </p>
                    <span className="text-[8px] bg-blue-50 text-blue-700 px-1 py-0.2 rounded border border-blue-200">
                      Sodimac: Granito y Cuarzo Silestone
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-semibold text-slate-800 block text-[11px]">
                      {formatCLP(costData.countertopCM)} <span className="text-[9px] text-slate-400 font-normal">CM</span>
                    </span>
                    <span className="font-bold text-slate-900 block text-[11px] mt-0.5">
                      {formatCLP(costData.countertopSD)} <span className="text-[9px] text-blue-500 font-bold">SD</span>
                    </span>
                  </div>
                </div>

                {/* Category 3: Backsplash */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      Salpicadero / Revestir
                    </span>
                    <p className="text-[9px] text-slate-400 italic">
                      Revestimiento frontal {project.materials.backsplash.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-semibold text-slate-800 block text-[11px]">
                      {formatCLP(costData.backsplashCM)} <span className="text-[9px] text-slate-400 font-normal">CM</span>
                    </span>
                    <span className="font-bold text-slate-900 block text-[11px] mt-0.5">
                      {formatCLP(costData.backsplashSD)} <span className="text-[9px] text-blue-500 font-bold">SD</span>
                    </span>
                  </div>
                </div>

                {/* Category 4: Equip */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-655" />
                      Equipamiento y Grifos
                    </span>
                    <p className="text-[9px] text-slate-400 italic max-w-[180px] leading-tight">
                      {[
                        project.kitchenEquipment?.includeSink ? `Lavaplatos (${project.kitchenEquipment?.sinkType === 'double' ? 'Doble' : 'Simple'})` : null,
                        project.kitchenEquipment?.includeStove ? `Anafe (${project.kitchenEquipment?.stovePlates || 4} platos)` : null,
                        project.kitchenEquipment?.includeBuiltInOven ? 'Horno Eléctrico' : null,
                        project.ergonomics?.dishwasherColumn ? 'Columna-Lavavajillas' : null,
                        project.ergonomics?.includeIsland ? 'Isla central' : null
                      ].filter(Boolean).join(', ') || 'Monobloque básico'}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="text-[8px] bg-emerald-50 text-emerald-700 px-1 py-0.2 rounded border border-emerald-150 font-mono font-bold uppercase">
                        MARCA: {(project.kitchenEquipment?.applianceBrand || 'teka').toUpperCase()}
                      </span>
                      <span className="text-[8px] bg-blue-50 text-blue-700 px-1 py-0.2 rounded border border-blue-150 font-mono font-bold uppercase">
                        SELLO: {(project.kitchenEquipment?.energyEfficiency || 'A_plus').replace('_plus', '+').replace('_triple_plus', '+++').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-semibold text-slate-800 block text-[11px]">
                      {formatCLP(costData.equipCM)} <span className="text-[9px] text-slate-400 font-normal">CM</span>
                    </span>
                    <span className="font-bold text-slate-900 block text-[11px] mt-0.5">
                      {formatCLP(costData.equipSD)} <span className="text-[9px] text-blue-500 font-bold">SD</span>
                    </span>
                  </div>
                </div>

                {/* Category 5: Installation */}
                <div className="flex justify-between items-start gap-4 border-t border-slate-205 pt-2.5">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5 text-indigo-650" />
                      Instalación y Despachos
                    </span>
                    <p className="text-[9px] text-slate-400 italic leading-tight">Instalador externo certificado o Servicio Técnico Sodimac Hogar</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-red-650 block text-[11px]">
                      {formatCLP(costData.installCM)} <span className="text-[9px] text-red-400 font-normal">CM</span>
                    </span>
                    <span className="font-black text-blue-700 block text-[11px] mt-0.5">
                      {formatCLP(costData.installSD)} <span className="text-[9px] text-indigo-400 font-normal">SD</span>
                    </span>
                  </div>
                </div>

                {/* Note disclaimer info */}
                <div className="bg-blue-50/55 p-3 rounded-lg border border-blue-105 flex gap-2 text-[9.5px] text-blue-900 font-medium leading-relaxed font-sans mt-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-blue-900">Guía de Compra Inteligente DGLA:</p>
                    <p className="text-slate-600 leading-normal">
                      Sugerimos cotizar el tableraje de soporte y melamina estructural de MDF en <strong>Construmart</strong> (menor costo por plancha Masisa de 15/18mm) y adquirir las cubiertas de resina/cuarzo y la grifería de tiro alto en <strong>Sodimac Homecenter</strong> (mayor stock de marcas premium y garantías de fábrica).
                    </p>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
