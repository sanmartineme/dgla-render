/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SpaceType, LayoutType, StyleType, MaterialsConfig, ErgonomicsConfig, ProjectState } from './types';
import Step1Form from './components/Step1-Upload/Step1Form';
import Step2Form from './components/Step2-Design/Step2Form';
import Canvas3D, { LightConfig } from './components/Step3-Visualization/Canvas3D';
import HelpModal from './components/Common/HelpModal';
import OnboardingTour from './components/Common/OnboardingTour';
import SidebarSkeleton from './components/Common/SidebarSkeleton';
import { validateDGLAErgonomics } from './utils/ergonomics';
import {
  HelpCircle, ChevronDown, Download, FileText, RefreshCw,
  LayoutGrid, Eye, Box, Home, Video, Layers, MousePointer2,
  Trash2, ArrowLeft, ArrowRight, X, RotateCcw as RestoreIcon,
  User, Calendar, CheckCircle, AlertTriangle, ShieldAlert,
  Zap, Save, Copy, Sparkles, RotateCw, ArrowUp, ArrowDown, Lightbulb,
  Menu, ChevronLeft, ChevronRight,
} from 'lucide-react';

const INITIAL_PROJECT_STATE: ProjectState = {
  id: 'pro_initial',
  name: 'Propuesta Inicial',
  date: new Date().toLocaleDateString('es-ES'),
  spaceType: 'cocina',
  uploadedImage: null,
  dimensions: { length: 420, width: 350, height: 280 },
  furnitureDimensions: { length: 320, height: 90, depth: 60 },
  kitchenEquipment: {
    includeSink: true, includeAppliances: true, includeStove: true,
    includeBuiltInOven: true, includeHighCabinets: true, includeIsland: true,
    includeRefrigerator: true, includeDishwasher: true,
    wallCabinetType: 'lift_door', doorCloseType: 'soft_close',
    inverseDistribution: false, stovePlates: 4,
    sinkColorAndMaterial: 'stainless', sinkType: 'simple',
    applianceBrand: 'teka', energyEfficiency: 'A_plus',
  },
  currentLayout: 'L_shaped',
  selectedStyle: 'contemporary',
  materials: {
    furniture: 'lacquered_melamine', furnitureColor: '#fbfbfb',
    countertop: 'quartz', countertopColor: '#f8f8f8',
    backsplash: 'tempered_glass', backsplashColor: '#fafbfc',
  },
  newLayout: 'U_shaped',
  ergonomics: {
    counterDepth: 80, userHeight: 170, calculatedCounterHeight: 90,
    doorType: 'balanced_lift', dishwasherColumn: true, includeIsland: true,
  },
  lightingMode: 'natural',
};

function computeInitialHiddenModules(p: ProjectState): Set<string> {
  const s = new Set<string>();
  if (p.ergonomics.dishwasherColumn && p.kitchenEquipment?.includeAppliances !== false && p.spaceType === 'cocina') {
    const rLen = p.dimensions.length / 100;
    const cLen = p.furnitureDimensions ? p.furnitureDimensions.length / 100 : rLen - 0.05;
    const wC = Math.max(1, Math.min(Math.floor(cLen / 0.8), 6));
    const skip = !p.kitchenEquipment?.inverseDistribution ? 0 : (wC - 1);
    s.add(`wall_cabinet_${skip}`);
  }
  return s;
}

export default function App() {
  const [activeSection, setActiveSection] = useState<0 | 1 | 2 | 3>(1);
  const [step1Completed, setStep1Completed] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarTransitioning, setIsSidebarTransitioning] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectState>(INITIAL_PROJECT_STATE);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Download / report state
  const [clientName, setClientName] = useState('Cliente DGLA');
  const [saveName, setSaveName] = useState('Propuesta Principal');
  const [savedProjects, setSavedProjects] = useState<ProjectState[]>([]);
  const [recentSaved, setRecentSaved] = useState(false);
  const [showPrintReport, setShowPrintReport] = useState(false);

  // Render controls
  const [cameraView, setCameraView] = useState<'perspective' | 'front' | 'side' | 'top' | 'isometric'>('perspective');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showWalls, setShowWalls] = useState(true);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Module editing
  const [selectedModule, setSelectedModule] = useState<{ id: string; name: string } | null>(null);
  const [hiddenModules, setHiddenModules] = useState<Set<string>>(() => computeInitialHiddenModules(INITIAL_PROJECT_STATE));
  const [modulePositions, setModulePositions] = useState<Record<string, number>>({});
  const [moduleZOffsets, setModuleZOffsets] = useState<Record<string, number>>({});
  const [moduleYOffsets, setModuleYOffsets] = useState<Record<string, number>>({});
  const [moduleRotations, setModuleRotations] = useState<Record<string, number>>({});

  // Light configuration
  const [lightConfig, setLightConfig] = useState<LightConfig>({ pendant: true, spots: true, underCabinet: true });

  useEffect(() => {
    const list = localStorage.getItem('dgla_saved_proposals');
    if (list) { try { setSavedProjects(JSON.parse(list)); } catch {} }
  }, []);

  // Auto-tutorial on first visit
  useEffect(() => {
    if (!localStorage.getItem('dgla_tour_shown')) {
      const t = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('start-dgla-tour'));
        localStorage.setItem('dgla_tour_shown', '1');
      }, 1200);
      return () => clearTimeout(t);
    }
  }, []);

  // ── Step 1 validation + proceed ───────────────────────────────────────
  const handleStep1Next = () => {
    const { length, width, height } = project.dimensions;
    const fd = project.furnitureDimensions;
    if (!length || length < 100 || length > 500) { setStep1Error('Largo del espacio: entre 100 y 500 cm.'); return; }
    if (!width  || width  < 100 || width  > 500) { setStep1Error('Ancho del espacio: entre 100 y 500 cm.'); return; }
    if (!height || height < 200 || height > 400) { setStep1Error('Altura de techo: entre 200 y 400 cm.'); return; }
    if (fd) {
      if (!fd.length || fd.length < 50 || fd.length > 500) { setStep1Error('Largo del mueble: entre 50 y 500 cm.'); return; }
      if (!fd.height || fd.height < 50 || fd.height > 250) { setStep1Error('Alto del mueble: entre 50 y 250 cm.'); return; }
      if (!fd.depth  || fd.depth  < 30 || fd.depth  > 120) { setStep1Error('Profundidad: entre 30 y 120 cm.'); return; }
    }
    setStep1Error(null);
    setStep1Completed(true);
    setIsSidebarTransitioning(true);
    setActiveSection(2);
    setTimeout(() => setIsSidebarTransitioning(false), 500);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setHasGenerated(true);
      setIsSidebarTransitioning(true);
      setActiveSection(3);
      setTimeout(() => setIsSidebarTransitioning(false), 500);
      setIsSidebarOpen(false);
    }, 2600);
  };

  // ── Full reset — start over ────────────────────────────────────────────
  const handleResetFull = () => {
    setProject(INITIAL_PROJECT_STATE);
    setHiddenModules(computeInitialHiddenModules(INITIAL_PROJECT_STATE));
    setModulePositions({});
    setModuleZOffsets({});
    setModuleRotations({});
    setSelectedModule(null);
    setHasGenerated(false);
    setIsGenerating(false);
    setStep1Completed(false);
    setLightConfig({ pendant: true, spots: true, underCabinet: true });
    setStep1Error(null);
    setActiveSection(1);
  };

  // ── Project state setters ──────────────────────────────────────────────
  const setSpaceType      = (v: SpaceType)       => setProject(p => ({ ...p, spaceType: v }));
  const setUploadedImage  = (v: string | null)   => setProject(p => ({ ...p, uploadedImage: v }));
  const setDimensions     = (v: any)             => setProject(p => ({ ...p, dimensions: v }));
  const setFurnitureDimensions = (v: any)        => setProject(p => ({ ...p, furnitureDimensions: v }));
  const setKitchenEquipment = (v: any)           => setProject(p => ({ ...p, kitchenEquipment: v }));
  const setCurrentLayout  = (v: LayoutType)      => setProject(p => ({ ...p, currentLayout: v }));
  const setSelectedStyle  = (v: StyleType)       => setProject(p => ({ ...p, selectedStyle: v }));
  const setMaterials      = (v: MaterialsConfig) => setProject(p => ({ ...p, materials: v }));
  const setNewLayout      = (v: LayoutType)      => setProject(p => ({ ...p, newLayout: v }));
  const setErgonomics     = (v: ErgonomicsConfig)=> setProject(p => ({ ...p, ergonomics: v }));

  const handleReset = () => {
    if (confirm('¿Restablecer todos los parámetros?')) {
      setProject(INITIAL_PROJECT_STATE);
      setHiddenModules(computeInitialHiddenModules(INITIAL_PROJECT_STATE));
      setModulePositions({});
      setSelectedModule(null);
      setStep1Completed(false);
      setHasGenerated(false);
      setActiveSection(1);
    }
  };

  const handleLoadProject = (loaded: ProjectState) => {
    setProject(loaded);
    setHiddenModules(computeInitialHiddenModules(loaded));
    setModulePositions({});
    setSelectedModule(null);
  };

  // ── Module selection handlers ──────────────────────────────────────────
  const handleModuleClick = (id: string, name: string) => {
    if (!id) { setSelectedModule(null); return; }
    setSelectedModule(prev => prev?.id === id ? null : { id, name });
  };

  const handleDeleteModule = () => {
    if (!selectedModule) return;
    setHiddenModules(prev => new Set([...prev, selectedModule.id]));
    setSelectedModule(null);
  };

  const handleMoveModule = (dir: 'left' | 'right') => {
    if (!selectedModule) return;
    setModulePositions(prev => ({
      ...prev,
      [selectedModule.id]: (prev[selectedModule.id] ?? 0) + (dir === 'left' ? -0.4 : 0.4),
    }));
  };

  const handleMoveModuleZ = (dir: 'forward' | 'back') => {
    if (!selectedModule) return;
    setModuleZOffsets(prev => ({
      ...prev,
      [selectedModule.id]: (prev[selectedModule.id] ?? 0) + (dir === 'back' ? -0.4 : 0.4),
    }));
  };

  const handleMoveModuleY = (dir: 'up' | 'down') => {
    if (!selectedModule) return;
    setModuleYOffsets(prev => ({
      ...prev,
      [selectedModule.id]: (prev[selectedModule.id] ?? 0) + (dir === 'up' ? 0.2 : -0.2),
    }));
  };

  const handleRotateModule = () => {
    if (!selectedModule) return;
    setModuleRotations(prev => ({
      ...prev,
      [selectedModule.id]: ((prev[selectedModule.id] ?? 0) + Math.PI / 2) % (Math.PI * 2),
    }));
  };

  const handleAssignToModule = (
    applianceId: 'stove' | 'built_in_oven' | 'sink',
    moduleId: string
  ) => {
    const cLen    = (project.furnitureDimensions?.length ?? 320) / 100;
    const cDepth  = (project.furnitureDimensions?.depth  ?? 60)  / 100;
    const roomLen = project.dimensions.length / 100;
    const roomWid = project.dimensions.width  / 100;
    const offsetLen = -roomLen / 2;
    const offsetWid = -roomWid / 2;
    const inv     = project.kitchenEquipment?.inverseDistribution ? -1 : 1;
    const baseX   = applianceId === 'sink' ? -cLen / 4 * inv : cLen / 4 * inv;
    const defaultZ = offsetWid + cDepth / 2;

    // Enable the appliance if it was turned off
    const equip = { ...project.kitchenEquipment };
    if (applianceId === 'stove')       equip.includeStove      = true;
    if (applianceId === 'sink')        equip.includeSink        = true;
    if (applianceId === 'built_in_oven') equip.includeBuiltInOven = true;
    setKitchenEquipment(equip);

    // Un-hide if previously deleted
    if (hiddenModules.has(applianceId)) {
      setHiddenModules(prev => { const n = new Set(prev); n.delete(applianceId); return n; });
    }

    // ── Back-wall counter segment ──────────────────────────────────────
    if (moduleId.startsWith('back_counter_')) {
      const idx = parseInt(moduleId.replace('back_counter_', ''));
      const segW = 0.80;
      const cnt  = Math.max(1, Math.min(Math.floor(cLen / segW), 6));
      const startX = -((cnt - 1) * segW) / 2;
      const counterX = startX + idx * segW + (modulePositions[moduleId] ?? 0);
      setModulePositions(prev => ({ ...prev, [applianceId]: counterX - baseX }));
      setModuleZOffsets(prev => ({ ...prev, [applianceId]: 0 }));
      return;
    }

    // ── Left-wing counter segment ──────────────────────────────────────
    if (/^left_wing_\d+$/.test(moduleId)) {
      const i = parseInt(moduleId.replace('left_wing_', ''));
      const segWidth = 0.85;
      const moduleX  = offsetLen + cDepth / 2;
      const moduleZ  = offsetWid + cDepth + i * segWidth + segWidth / 2 + (moduleZOffsets[moduleId] ?? 0);
      setModulePositions(prev => ({ ...prev, [applianceId]: moduleX - baseX }));
      setModuleZOffsets(prev => ({ ...prev, [applianceId]: moduleZ - defaultZ }));
      return;
    }

    // ── Right-wing counter segment ─────────────────────────────────────
    if (/^right_wing_\d+$/.test(moduleId)) {
      const i = parseInt(moduleId.replace('right_wing_', ''));
      const segWidth = 0.85;
      const moduleX  = roomLen / 2 - cDepth / 2;
      const moduleZ  = offsetWid + cDepth + i * segWidth + segWidth / 2 + (moduleZOffsets[moduleId] ?? 0);
      setModulePositions(prev => ({ ...prev, [applianceId]: moduleX - baseX }));
      setModuleZOffsets(prev => ({ ...prev, [applianceId]: moduleZ - defaultZ }));
      return;
    }

    // ── Slab / countertop — center the appliance ───────────────────────
    setModulePositions(prev => ({ ...prev, [applianceId]: (modulePositions[moduleId] ?? 0) - baseX }));
    setModuleZOffsets(prev => ({ ...prev, [applianceId]: 0 }));
  };

  const handleRestoreAll = () => {
    setHiddenModules(computeInitialHiddenModules(project));
    setModulePositions({});
    setModuleZOffsets({});
    setModuleYOffsets({});
    setModuleRotations({});
    setSelectedModule(null);
  };

  const matchingWallCabId = (() => {
    const id = selectedModule?.id;
    if (!id) return null;
    if (id.startsWith('back_counter_'))      return `wall_cabinet_${id.replace('back_counter_', '')}`;
    if (/^left_wing_\d+$/.test(id))          return `left_wcab_${id.replace('left_wing_', '')}`;
    if (/^right_wing_\d+$/.test(id))         return `right_wcab_${id.replace('right_wing_', '')}`;
    return null;
  })();

  // Modules that can receive appliance assignment
  const isCounterModule = (id: string) =>
    id.startsWith('back_counter_') ||
    /^left_wing_\d+$/.test(id)    ||
    /^right_wing_\d+$/.test(id)   ||
    id === 'countertop_main'       ||
    id === 'left_wing_slab'        ||
    id === 'right_wing_slab';

  const handleToggleWallCabinet = () => {
    if (!matchingWallCabId) return;
    setHiddenModules(prev => {
      const next = new Set(prev);
      if (next.has(matchingWallCabId)) next.delete(matchingWallCabId);
      else next.add(matchingWallCabId);
      return next;
    });
  };

  // ── Download PNG ───────────────────────────────────────────────────────
  const handleDownloadPNG = () => {
    const canvas = document.getElementById('dgla_interactive_3d') as HTMLCanvasElement;
    if (!canvas) { alert('No se encontró el lienzo 3D.'); return; }
    try {
      const link = document.createElement('a');
      link.download = `DGLA_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch (e) { console.error(e); }
  };

  // ── Save project ───────────────────────────────────────────────────────
  const handleSaveProject = () => {
    const saved: ProjectState = {
      ...project,
      id: Math.random().toString(36).slice(2, 9),
      name: `${saveName} (${clientName})`,
      date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
    };
    const next = [saved, ...savedProjects];
    setSavedProjects(next);
    localStorage.setItem('dgla_saved_proposals', JSON.stringify(next));
    setRecentSaved(true);
    setTimeout(() => setRecentSaved(false), 3000);
  };

  const handleDeleteSavedProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = savedProjects.filter(p => p.id !== id);
    setSavedProjects(next);
    localStorage.setItem('dgla_saved_proposals', JSON.stringify(next));
  };

  const validations = validateDGLAErgonomics(
    project.dimensions,
    project.newLayout !== 'none' ? project.newLayout : project.currentLayout,
    project.ergonomics
  );

  const getStatusIcon = (s: 'success' | 'warning' | 'error') =>
    s === 'success' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
    : s === 'warning' ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
    : <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />;

  // ── Section accordion toggle ───────────────────────────────────────────
  const isSectionUnlocked = (n: 1 | 2 | 3) => {
    if (n === 1) return true;
    if (n === 2) return step1Completed;
    return hasGenerated;
  };

  const toggleSection = (n: 1 | 2 | 3) => {
    if (!isSectionUnlocked(n)) return;
    setActiveSection(prev => prev === n ? 0 : n);
  };

  const sectionBadge = (n: number) => {
    const unlocked = isSectionUnlocked(n as 1 | 2 | 3);
    return `w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 transition-all ${
      unlocked && activeSection >= n ? 'bg-blue-600 text-white shadow-sm'
      : unlocked ? 'bg-slate-300 text-slate-600'
      : 'bg-slate-100 text-slate-300'
    }`;
  };

  const sectionHeader = (n: 1 | 2 | 3) => {
    const unlocked = isSectionUnlocked(n);
    return `w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors group ${
      activeSection === n ? 'bg-blue-50/70'
      : unlocked ? 'hover:bg-slate-50/80'
      : 'cursor-not-allowed opacity-50'
    }`;
  };

  // ── Camera preset label ────────────────────────────────────────────────
  const cameraLabel: Record<string, string> = {
    perspective: 'Perspectiva Libre', front: 'Alzado Frontal',
    side: 'Corte Lateral', top: 'Planta Aérea', isometric: 'Axonométrica',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 font-sans antialiased text-slate-800">

      {/* Mobile/Tablet overlay backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════
           SIDEBAR
      ══════════════════════════════════════════════════════════════ */}
      <aside className={[
        'fixed inset-y-0 left-0 z-30 h-screen',
        'flex flex-col bg-white shadow-2xl border-r border-slate-200 overflow-hidden',
        'transition-all duration-300 ease-in-out',
        'w-[85vw] max-w-[400px] xl:max-w-[440px]',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:relative lg:z-20 lg:translate-x-0 lg:flex-shrink-0',
        isSidebarCollapsed ? 'lg:w-0 lg:max-w-none lg:border-r-0' : 'lg:w-[400px] xl:lg:w-[440px]',
      ].join(' ')}>

        {/* Sidebar header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3 shrink-0 bg-white">
          <div className="bg-blue-600 p-2 rounded-lg text-white font-mono text-xs font-bold shadow-sm leading-none">DGLA</div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm text-slate-900 leading-tight truncate">Design Group Latinamerica</h1>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Motor Ergonómico 3D</span>
          </div>
          <div className="ml-auto flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsHelpOpen(true)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
              title="Guía de Ergonomía"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
              title="Reiniciar proyecto"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {/* Collapse sidebar — desktop only */}
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
              title="Colapsar panel"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {/* Close drawer — mobile/tablet only */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
              title="Cerrar panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Accordion sections */}
        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100">

          {/* ── SECTION 1: Contexto Espacial ── */}
          <div id="tour-section-1">
            <button onClick={() => toggleSection(1)} className={sectionHeader(1)}>
              <span className={sectionBadge(1)}>1</span>
              <div className="min-w-0">
                <span className="font-semibold text-sm text-slate-800 block leading-tight">Contexto Espacial</span>
                <span className="text-[10px] text-slate-400 font-mono block">Dimensiones, tipo y layout</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 ml-auto shrink-0 transition-transform duration-200 ${activeSection === 1 ? 'rotate-180' : ''}`} />
            </button>
            {activeSection === 1 && (
              <div className="px-4 pb-4 pt-1">
                <Step1Form
                  spaceType={project.spaceType}   setSpaceType={setSpaceType}
                  dimensions={project.dimensions} setDimensions={setDimensions}
                  furnitureDimensions={project.furnitureDimensions} setFurnitureDimensions={setFurnitureDimensions}
                  kitchenEquipment={project.kitchenEquipment}       setKitchenEquipment={setKitchenEquipment}
                  currentLayout={project.currentLayout} setCurrentLayout={setCurrentLayout}
                />
              </div>
            )}
          </div>

          {/* ── SECTION 2: Diseño y Ergonomía ── */}
          <div id="tour-section-2">
            <button onClick={() => toggleSection(2)} className={sectionHeader(2)}>
              <span className={sectionBadge(2)}>2</span>
              <div className="min-w-0">
                <span className="font-semibold text-sm text-slate-800 block leading-tight">Diseño y Ergonomía</span>
                <span className="text-[10px] text-slate-400 font-mono block">Materiales, estilo y equipamiento</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 ml-auto shrink-0 transition-transform duration-200 ${activeSection === 2 ? 'rotate-180' : ''}`} />
            </button>
            {activeSection === 2 && (
              isSidebarTransitioning
                ? <SidebarSkeleton />
                : <div className="px-4 pb-4 pt-1">
                    <Step2Form
                      spaceType={project.spaceType}
                      selectedStyle={project.selectedStyle} setSelectedStyle={setSelectedStyle}
                      materials={project.materials}         setMaterials={setMaterials}
                      newLayout={project.newLayout}         setNewLayout={setNewLayout}
                      ergonomics={project.ergonomics}       setErgonomics={setErgonomics}
                      dimensions={project.dimensions}
                      kitchenEquipment={project.kitchenEquipment} setKitchenEquipment={setKitchenEquipment}
                    />
                  </div>
            )}
          </div>

          {/* ── SECTION 3: Controles de Render ── */}
          <div id="tour-section-3">
            <button onClick={() => toggleSection(3)} className={sectionHeader(3)}>
              <span className={sectionBadge(3)}>3</span>
              <div className="min-w-0">
                <span className="font-semibold text-sm text-slate-800 block leading-tight">Controles de Render</span>
                <span className="text-[10px] text-slate-400 font-mono block">Cámara, iluminación y análisis</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 ml-auto shrink-0 transition-transform duration-200 ${activeSection === 3 ? 'rotate-180' : ''}`} />
            </button>

            {activeSection === 3 && (isSidebarTransitioning
              ? <SidebarSkeleton />
              : <div className="px-4 pb-4 pt-2 space-y-4">

                {/* Camera presets */}
                {/* Camera views — tab pattern */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-bold flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-blue-600" /> Vistas de Cámara
                  </span>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 rounded-xl p-1">
                    {([
                      { id: 'perspective', icon: <Home className="w-3 h-3" />,      label: 'Perspectiva' },
                      { id: 'isometric',   icon: <Box className="w-3 h-3" />,       label: 'Axonométrica' },
                      { id: 'front',       icon: <Eye className="w-3 h-3" />,       label: 'Alzado' },
                      { id: 'side',        icon: <Eye className="w-3 h-3" />,       label: 'Lateral' },
                      { id: 'top',         icon: <LayoutGrid className="w-3 h-3" />,label: 'Planta' },
                    ] as const).map(({ id, icon, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setCameraView(id)}
                        className={`py-1.5 text-[10px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1 focus:outline-none ${
                          cameraView === id
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {icon} {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Invert distribution — chip pattern */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block">Inversión de Distribución</span>
                    <span className="text-[10px] text-slate-400">Cambia Lavaplatos ↔ Encimera</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setKitchenEquipment({ ...project.kitchenEquipment, inverseDistribution: !project.kitchenEquipment?.inverseDistribution })}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border-2 transition-all focus:outline-none cursor-pointer ${
                      project.kitchenEquipment?.inverseDistribution
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {project.kitchenEquipment?.inverseDistribution ? 'Invertida' : 'Estándar'}
                  </button>
                </div>

                {/* Lighting mode — tab pattern */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-bold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Iluminación Ambiental
                  </span>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 rounded-xl p-1">
                    {(['natural', 'cold', 'warm'] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setProject(p => ({ ...p, lightingMode: mode }))}
                        className={`py-2 text-[10px] font-semibold rounded-lg transition-all uppercase tracking-wide focus:outline-none ${
                          (project.lightingMode || 'natural') === mode
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {mode === 'natural' ? '☉ Natural' : mode === 'cold' ? '❄ Fría' : '🔥 Cálida'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Light controls */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-bold flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-yellow-500" /> Control de Luces
                  </span>
                  <div className="space-y-1.5">
                    {([
                      { key: 'pendant',      label: 'Colgante central',    icon: '💡' },
                      { key: 'spots',        label: 'Spots cenitales',     icon: '⬡' },
                      { key: 'underCabinet', label: 'LED bajo muebles',    icon: '—' },
                    ] as const).map(({ key, label, icon }) => {
                      const on = lightConfig[key];
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-600 flex items-center gap-1.5">
                            <span className="text-[10px]">{icon}</span> {label}
                          </span>
                          <button
                            type="button"
                            onClick={() => setLightConfig(c => ({ ...c, [key]: !c[key] }))}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border-2 transition-all focus:outline-none cursor-pointer ${
                              on
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-200 bg-white text-slate-400 hover:border-slate-400'
                            }`}
                          >
                            {on ? 'Encendida' : 'Apagada'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Save / Load proposals */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-bold flex items-center gap-1.5">
                    <Save className="w-3.5 h-3.5" /> Guardar Propuesta
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text" value={saveName} onChange={e => setSaveName(e.target.value)}
                      className="flex-1 min-w-0 text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                      placeholder="Nombre de variante"
                    />
                    <button
                      type="button" onClick={handleSaveProject}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shrink-0 flex items-center gap-1"
                    >
                      {recentSaved ? '✓' : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {savedProjects.length > 0 && (
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {savedProjects.map(p => (
                        <div
                          key={p.id} onClick={() => handleLoadProject(p)}
                          className="flex items-center justify-between p-2 bg-slate-50 hover:bg-blue-50/40 border border-slate-100 hover:border-blue-200 rounded-lg cursor-pointer transition-all group"
                        >
                          <div className="min-w-0">
                            <span className="text-[10.5px] font-semibold text-slate-800 group-hover:text-blue-700 block truncate">{p.name}</span>
                            <span className="text-[9px] text-slate-400">{p.date} · {p.selectedStyle}</span>
                          </div>
                          <button onClick={e => handleDeleteSavedProject(p.id, e)} className="p-1 text-slate-300 hover:text-red-500 transition-all shrink-0 ml-1">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

        </div>

        {/* ── Sidebar nav footer (sticky bottom) ── */}
        <div className="shrink-0 border-t border-slate-200 bg-white">
          {/* Validation error */}
          {step1Error && activeSection === 1 && (
            <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-start gap-2">
              <span className="text-red-400 shrink-0 mt-0.5">⚠</span>
              <p className="text-[11px] text-red-600 font-medium leading-tight">{step1Error}</p>
            </div>
          )}

          <div className="px-4 py-3 flex gap-2">
            {activeSection === 1 && (
              <button
                onClick={handleStep1Next}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all uppercase tracking-widest focus:outline-none cursor-pointer"
              >
                Configurar diseño →
              </button>
            )}
            {activeSection === 2 && (
              <>
                <button
                  onClick={() => { setActiveSection(1); setStep1Error(null); }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer focus:outline-none"
                >
                  ← Paso 1
                </button>
                <button
                  onClick={handleGenerate}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all uppercase tracking-widest focus:outline-none cursor-pointer"
                >
                  Generar Render →
                </button>
              </>
            )}
            {activeSection === 3 && (
              <button
                onClick={() => setActiveSection(2)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer focus:outline-none"
              >
                ← Volver al diseño
              </button>
            )}
          </div>

          <div className="px-4 pb-2.5">
            <p className="text-[9px] text-slate-300 font-mono">© 2026 DGLA</p>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════
           MAIN RENDER AREA
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 h-screen">

        {/* Top action bar */}
        <div className="h-11 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {/* Hamburger + DGLA brand — mobile/tablet */}
            <button
              onClick={() => setIsSidebarOpen(v => !v)}
              className="lg:hidden flex items-center gap-2 p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-all shrink-0"
              title={isSidebarOpen ? 'Cerrar panel' : 'Abrir panel'}
            >
              <div className="bg-blue-600 px-1.5 py-0.5 rounded text-white font-mono text-[10px] font-bold leading-none">DGLA</div>
              <Menu className="w-4 h-4" />
            </button>
            {/* Expand sidebar — desktop only, shown when collapsed */}
            {isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-all border border-slate-600 shrink-0"
                title="Expandir panel"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
              <User className="w-3 h-3 text-slate-400 shrink-0" />
              <input
                type="text" value={clientName} onChange={e => setClientName(e.target.value)}
                className="bg-transparent text-white text-[10px] font-mono w-32 focus:outline-none placeholder:text-slate-500"
                placeholder="Cliente"
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Tour + Reiniciar — desktop/tablet only */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('start-dgla-tour'))}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-all border border-slate-600"
              title="Iniciar tour guiado"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Tour</span>
            </button>
            <button
              onClick={handleResetFull}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-all border border-slate-600"
              title="Nuevo proyecto desde cero"
            >
              <RefreshCw className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden lg:inline">Reiniciar</span>
            </button>

            {/* Wall toggle — visible on all sizes when render exists */}
            {hasGenerated && (
              <button
                onClick={() => setShowWalls(v => !v)}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                  showWalls
                    ? 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600'
                    : 'bg-blue-700/80 hover:bg-blue-600 text-white border-blue-500'
                }`}
                title={showWalls ? 'Ocultar muros' : 'Mostrar muros'}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden lg:inline ml-1">{showWalls ? 'Muros' : 'Sin muros'}</span>
              </button>
            )}

            <div className="w-px h-5 bg-slate-600 mx-0.5" />

            <button
              onClick={handleDownloadPNG}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-all border border-slate-600"
              title="Descargar PNG"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden lg:inline ml-1">PNG</span>
            </button>
            <button
              onClick={() => setShowPrintReport(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-all border border-slate-600"
              title="Ver informe PDF"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden lg:inline ml-1">PDF</span>
            </button>
          </div>
        </div>

        {/* Canvas3D, loader, or empty state */}
        <div className="flex-1 min-h-0 relative overflow-hidden">
          {isGenerating ? (
            /* ── LOADER ── */
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center z-50 select-none">
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
                <div className="absolute inset-2 rounded-full border-2 border-blue-500/30 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
                <div className="absolute inset-4 rounded-full border-t-2 border-blue-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                    <Box className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
              </div>
              <h3 className="text-white font-bold text-lg mb-1.5 tracking-tight">Generando Render 3D</h3>
              <p className="text-slate-400 text-xs text-center max-w-xs leading-relaxed">
                Procesando geometría, iluminación arquitectónica y materiales DGLA…
              </p>
              <div className="mt-8 w-56 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', width: '80%', transition: 'width 2.4s ease-out' }} />
              </div>
              <p className="text-slate-600 text-[10px] font-mono mt-4 uppercase tracking-widest">Motor Ergonómico DGLA · v2.0</p>
            </div>
          ) : hasGenerated ? (
            <>
              <Canvas3D
                project={project}
                externalPreset={cameraView}
                onChangePreset={setCameraView}
                showHeatmap={showHeatmap}
                showWalls={showWalls}
                hiddenModules={hiddenModules}
                modulePositions={modulePositions}
                moduleZOffsets={moduleZOffsets}
                moduleYOffsets={moduleYOffsets}
                moduleRotations={moduleRotations}
                lightConfig={lightConfig}
                selectedModuleId={selectedModule?.id ?? null}
                onModuleClick={handleModuleClick}
              />

              {/* ── Floating Ergonomic Audit button ── */}
              {(() => {
                const errors   = validations.filter(v => v.status === 'error').length;
                const warnings = validations.filter(v => v.status === 'warning').length;
                const allOk    = errors === 0 && warnings === 0;
                const badgeColor = errors > 0 ? 'bg-red-500' : warnings > 0 ? 'bg-amber-400' : 'bg-emerald-500';
                const borderColor = errors > 0 ? 'border-red-500/40' : warnings > 0 ? 'border-amber-400/40' : 'border-emerald-500/40';
                const glowColor   = errors > 0 ? 'shadow-red-500/25' : warnings > 0 ? 'shadow-amber-400/25' : 'shadow-emerald-500/25';
                return (
                  <button
                    onClick={() => setShowAuditModal(true)}
                    className={`absolute top-4 right-4 z-20 flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-900/90 backdrop-blur-md border ${borderColor} rounded-xl shadow-lg ${glowColor} hover:bg-slate-800/95 transition-all group`}
                    title="Ver Auditoría Ergonómica DGLA"
                  >
                    <span className={`relative flex h-2.5 w-2.5 shrink-0`}>
                      {!allOk && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${badgeColor} opacity-60`} />}
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${badgeColor}`} />
                    </span>
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-white leading-none tracking-wide">Auditoría Ergonómica</p>
                      <p className="text-[9px] text-slate-400 mt-0.5 leading-none">
                        {allOk
                          ? 'Todo correcto · DGLA'
                          : `${errors > 0 ? `${errors} error${errors > 1 ? 'es' : ''}` : ''}${errors > 0 && warnings > 0 ? ' · ' : ''}${warnings > 0 ? `${warnings} aviso${warnings > 1 ? 's' : ''}` : ''}`
                        }
                      </p>
                    </div>
                    <ShieldAlert className={`w-3.5 h-3.5 shrink-0 ml-1 transition-colors ${errors > 0 ? 'text-red-400' : warnings > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
                  </button>
                );
              })()}
            </>
          ) : (
            <div className="absolute inset-0 overflow-y-auto bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 select-none">
              <div className="min-h-full flex flex-col items-center justify-center text-center px-8 py-10">
              {/* Logo */}
              <div className="w-20 h-20 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-6 shadow-xl">
                <Box className="w-9 h-9 text-blue-400" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Motor 3D DGLA</h2>
              <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-10">
                Completa el contexto espacial y el diseño en el panel izquierdo para generar la visualización tridimensional.
              </p>

              {/* Steps guide — all dimmed until the user starts */}
              <div className="flex items-start gap-0 w-full max-w-sm">
                {[
                  { n: 1, label: 'Contexto Espacial',  desc: 'Tipo, medidas y layout' },
                  { n: 2, label: 'Diseño y Ergonomía', desc: 'Estilo, materiales y equipamiento' },
                  { n: 3, label: 'Generar Render',     desc: 'Visualización 3D en tiempo real' },
                ].map((step, idx) => (
                  <React.Fragment key={step.n}>
                    <div className="flex flex-col items-center flex-1 gap-2">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 border-slate-700/60 bg-slate-800/60 text-slate-600">
                        {step.n}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-600">{step.label}</p>
                        <p className="text-[10px] text-slate-700 leading-snug">{step.desc}</p>
                      </div>
                    </div>
                    {idx < 2 && (
                      <div className="w-8 h-px bg-slate-800 mt-4 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Ambient subtle grid */}
              <div className="absolute inset-0 pointer-events-none opacity-5"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
              />
              </div>
            </div>
          )}
        </div>

        {/* Module selection panel */}
        {(selectedModule || hiddenModules.size > computeInitialHiddenModules(project).size) && (
          <div className="bg-slate-900 border-t border-slate-700 shrink-0 animate-in slide-in-from-bottom-1 duration-200">

            {/* ── Row 1: module info + primary actions (always visible) ── */}
            <div className="flex items-center justify-between gap-2 px-4 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="p-1.5 bg-blue-600 rounded-lg shrink-0">
                  <MousePointer2 className="w-3 h-3 text-white" />
                </span>
                <div className="min-w-0">
                  {selectedModule ? (
                    <>
                      <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider leading-none">Módulo seleccionado</p>
                      <p className="text-xs font-bold text-white truncate mt-0.5">{selectedModule.name}</p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-300 font-semibold">
                      {hiddenModules.size - computeInitialHiddenModules(project).size} módulo{hiddenModules.size - computeInitialHiddenModules(project).size !== 1 ? 's' : ''} eliminado{hiddenModules.size - computeInitialHiddenModules(project).size !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {hiddenModules.size > computeInitialHiddenModules(project).size && (
                  <button onClick={handleRestoreAll} className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all">
                    <RestoreIcon className="w-3 h-3" />
                    <span className="hidden sm:inline ml-0.5">Restaurar</span>
                  </button>
                )}
                {selectedModule && (
                  <>
                    <button onClick={handleDeleteModule} className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg transition-all" title="Eliminar módulo">
                      <Trash2 className="w-3 h-3" />
                      <span className="hidden sm:inline ml-0.5">Eliminar</span>
                    </button>
                    <button onClick={() => setSelectedModule(null)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-all" title="Deseleccionar">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ── Row 2: controls (desktop flat / mobile sectioned) ── */}
            {selectedModule && (
              <>
                {/* DESKTOP — flat row (lg+) */}
                <div className="hidden lg:flex items-center gap-1.5 px-4 pb-2.5 flex-wrap">
                  <button onClick={() => handleMoveModule('left')}  title="Izquierda" className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 transition-all"><ArrowLeft  className="w-3 h-3" /></button>
                  <button onClick={() => handleMoveModule('right')} title="Derecha"   className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 transition-all"><ArrowRight className="w-3 h-3" /></button>
                  <div className="w-px h-5 bg-slate-600 mx-0.5" />
                  <button onClick={() => handleMoveModuleZ('forward')} title="Al frente" className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 transition-all"><ArrowDown className="w-3 h-3" /></button>
                  <button onClick={() => handleMoveModuleZ('back')}    title="Al fondo"  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 transition-all"><ArrowUp   className="w-3 h-3" /></button>
                  <div className="w-px h-5 bg-slate-600 mx-0.5" />
                  <button onClick={() => handleMoveModuleY('up')}   title="Subir" className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg border border-slate-500 transition-all text-[9px] font-bold flex items-center gap-0.5"><ArrowUp   className="w-3 h-3" />Alt</button>
                  <button onClick={() => handleMoveModuleY('down')} title="Bajar" className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg border border-slate-500 transition-all text-[9px] font-bold flex items-center gap-0.5"><ArrowDown className="w-3 h-3" />Alt</button>
                  <div className="w-px h-5 bg-slate-600 mx-0.5" />
                  <button onClick={handleRotateModule} title="Rotar 90°" className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-[10px] font-semibold rounded-lg border border-indigo-500 transition-all">
                    <RotateCw className="w-3 h-3" /> 90°
                  </button>
                  {/* Assign appliances — desktop: shown for any counter module in cocina */}
                  {project.spaceType === 'cocina' && isCounterModule(selectedModule.id) && (
                    <>
                      <div className="w-px h-5 bg-slate-600 mx-0.5" />
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider font-mono">Equipamiento</span>
                      {([
                        { id: 'stove'        as const, label: 'Encimera', active: project.kitchenEquipment?.includeStove !== false },
                        { id: 'built_in_oven'as const, label: 'Horno',    active: project.kitchenEquipment?.includeBuiltInOven !== false },
                        { id: 'sink'         as const, label: 'Lavaplatos',active: project.kitchenEquipment?.includeSink !== false },
                      ]).map(({ id, label, active }) => (
                        <button
                          key={id}
                          onClick={() => handleAssignToModule(id, selectedModule.id)}
                          className={`px-2 py-1 text-[9px] font-bold rounded-md border transition-all ${
                            active
                              ? 'bg-slate-700 hover:bg-blue-600 text-white border-slate-500'
                              : 'bg-slate-800/60 hover:bg-emerald-700 text-slate-400 hover:text-white border-slate-600 border-dashed'
                          }`}
                          title={active ? `Mover ${label} aquí` : `Agregar ${label} aquí`}
                        >
                          {active ? label : `+ ${label}`}
                        </button>
                      ))}
                    </>
                  )}
                  {matchingWallCabId && (
                    <button onClick={handleToggleWallCabinet} className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${hiddenModules.has(matchingWallCabId) ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-500 text-white' : 'bg-slate-700 hover:bg-slate-600 border-slate-500 text-slate-200'}`}>
                      <Layers className="w-3 h-3" />
                      {hiddenModules.has(matchingWallCabId) ? 'Agregar Alacena' : 'Quitar Alacena'}
                    </button>
                  )}
                </div>

                {/* MOBILE / TABLET — sectioned layout (< lg) */}
                <div className="lg:hidden border-t border-slate-800 px-4 py-2.5 space-y-3">

                  {/* Sección: Posición */}
                  <div>
                    <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Posición</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button onClick={() => handleMoveModule('left')}  title="Izquierda" className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 transition-all"><ArrowLeft  className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleMoveModule('right')} title="Derecha"   className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 transition-all"><ArrowRight className="w-3.5 h-3.5" /></button>
                      <div className="w-px h-5 bg-slate-700" />
                      <button onClick={() => handleMoveModuleZ('forward')} title="Al frente" className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 transition-all"><ArrowDown className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleMoveModuleZ('back')}    title="Al fondo"  className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-600 transition-all"><ArrowUp   className="w-3.5 h-3.5" /></button>
                      <div className="w-px h-5 bg-slate-700" />
                      <button onClick={() => handleMoveModuleY('up')}   title="Subir altura" className="flex items-center gap-1 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg border border-slate-500 transition-all text-[9px] font-bold"><ArrowUp className="w-3.5 h-3.5" />Alt</button>
                      <button onClick={() => handleMoveModuleY('down')} title="Bajar altura" className="flex items-center gap-1 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg border border-slate-500 transition-all text-[9px] font-bold"><ArrowDown className="w-3.5 h-3.5" />Alt</button>
                      <div className="w-px h-5 bg-slate-700" />
                      <button onClick={handleRotateModule} title="Rotar 90°" className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-[10px] font-semibold rounded-lg border border-indigo-500 transition-all">
                        <RotateCw className="w-3.5 h-3.5" /> 90°
                      </button>
                    </div>
                  </div>

                  {/* Sección: Equipamiento (cualquier módulo contador en cocina) */}
                  {project.spaceType === 'cocina' && isCounterModule(selectedModule.id) && (
                    <div>
                      <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Equipamiento asociado</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {([
                          { id: 'stove'         as const, label: 'Encimera',   active: project.kitchenEquipment?.includeStove !== false },
                          { id: 'built_in_oven' as const, label: 'Horno emp.', active: project.kitchenEquipment?.includeBuiltInOven !== false },
                          { id: 'sink'          as const, label: 'Lavaplatos', active: project.kitchenEquipment?.includeSink !== false },
                        ]).map(({ id, label, active }) => (
                          <button
                            key={id}
                            onClick={() => handleAssignToModule(id, selectedModule.id)}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                              active
                                ? 'bg-slate-700 hover:bg-blue-600 text-white border-slate-500'
                                : 'bg-slate-800/60 hover:bg-emerald-700 text-slate-400 hover:text-white border-slate-600 border-dashed'
                            }`}
                            title={active ? `Mover ${label} aquí` : `Agregar ${label}`}
                          >
                            {active ? label : `+ ${label}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sección: Alacena */}
                  {matchingWallCabId && (
                    <div>
                      <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Alacena superior</p>
                      <button onClick={handleToggleWallCabinet} className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold rounded-lg border transition-all ${hiddenModules.has(matchingWallCabId) ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-500 text-white' : 'bg-slate-700 hover:bg-slate-600 border-slate-500 text-slate-200'}`}>
                        <Layers className="w-3.5 h-3.5" />
                        {hiddenModules.has(matchingWallCabId) ? 'Agregar Alacena' : 'Quitar Alacena'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

      </div>

      {/* ══════════════════════════════════════════════════════════════
           PRINT REPORT MODAL
      ══════════════════════════════════════════════════════════════ */}
      {showPrintReport && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/70 backdrop-blur-md">
          <div className="relative w-full sm:max-w-3xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden sm:my-8 flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-250">
            {/* Drag handle — mobile only */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0 print:hidden">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800 shrink-0 print:hidden">
              <span className="font-semibold text-sm">Ficha Técnica e Informe de Diseño Ergonómico DGLA</span>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer">
                  Imprimir / Guardar PDF
                </button>
                <button onClick={() => setShowPrintReport(false)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-all cursor-pointer">
                  Cerrar
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-8 bg-white text-slate-800 overflow-y-auto flex-1 min-h-0" id="dgla_proposal_dossier_print">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase font-sans">Design Group Latinamerica</h1>
                  <span className="text-xs font-mono tracking-widest text-blue-700 font-bold block">PLATAFORMA DE VISUALIZACIÓN ERGONÓMICA</span>
                </div>
                <div className="text-right text-xs text-slate-400 font-mono">
                  <p className="flex items-center gap-1 justify-end"><User className="w-3 h-3" /> Cliente: <strong className="text-slate-800">{clientName}</strong></p>
                  <p className="flex items-center gap-1 justify-end mt-1"><Calendar className="w-3 h-3" /> {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-200 pb-1">1. Diagnóstico Contextual</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  {[
                    { label: 'Ambiente', value: project.spaceType.replace('_', ' ') },
                    { label: 'Largo × Ancho', value: `${project.dimensions.length} × ${project.dimensions.width} cm` },
                    { label: 'Altura Techo', value: `${project.dimensions.height} cm` },
                    { label: 'Distribución', value: (project.newLayout !== 'none' ? project.newLayout : project.currentLayout).replace('_', ' ') },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[9px] uppercase">{label}</span>
                      <strong className="text-slate-800 capitalize">{value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-200 pb-1">2. Acabados Seleccionados</h3>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  {[
                    { label: 'Muebles', mat: project.materials.furniture, color: project.materials.furnitureColor },
                    { label: 'Encimera', mat: project.materials.countertop, color: project.materials.countertopColor },
                    { label: 'Salpicadero', mat: project.materials.backsplash, color: project.materials.backsplashColor },
                  ].map(({ label, mat, color }) => (
                    <div key={label} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-slate-400 text-[9px] font-mono uppercase block">{label}</span>
                      <strong className="text-slate-800 capitalize block mt-0.5">{mat.replace('_', ' ')}</strong>
                      <div className="flex items-center gap-1.5 mt-1.5 bg-white px-2 py-1 rounded border border-slate-100">
                        <span className="w-3 h-3 rounded-full border border-slate-200 shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-[9px] text-slate-500 font-mono">{color}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-200 pb-1">3. Dictamen Ergonómico</h3>
                <div className="space-y-2">
                  {validations.map(v => (
                    <div key={v.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        {v.status === 'success' ? '✓' : '⚠'} {v.name}
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1">{v.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-end pt-8 border-t border-slate-100 text-[10px] font-mono text-slate-400">
                <div><p>Design Group Latinamerica S.A.</p><p className="mt-0.5">Metodología de cocinas integradas</p></div>
                <div className="text-right border-t border-slate-400 w-40 pt-2">
                  <p className="text-slate-500 font-bold">Firma del Diseñador DGLA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <OnboardingTour currentStep={activeSection === 0 ? 1 : activeSection} setStep={(n) => setActiveSection(n as 1|2|3)} onClose={handleResetFull} />

      {/* ── Ergonomic Audit Modal ── */}
      {showAuditModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setShowAuditModal(false)}
        >
          <div
            className="relative w-full sm:max-w-md bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-700 overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle — mobile only */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
            </div>
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-700/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-600/20 rounded-lg border border-blue-500/30">
                  <ShieldAlert className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white tracking-tight">Auditoría Ergonómica</p>
                  <p className="text-[10px] text-slate-400 font-mono">Metodología DGLA · {validations.length} parámetros</p>
                </div>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status summary strip */}
            {(() => {
              const errors   = validations.filter(v => v.status === 'error').length;
              const warnings = validations.filter(v => v.status === 'warning').length;
              const ok       = validations.filter(v => v.status === 'success').length;
              return (
                <div className="grid grid-cols-3 divide-x divide-slate-700 border-b border-slate-700/80">
                  {[
                    { count: ok,       label: 'Correctos',  color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { count: warnings, label: 'Avisos',     color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
                    { count: errors,   label: 'Errores',    color: 'text-red-400',     bg: 'bg-red-500/10'     },
                  ].map(({ count, label, color, bg }) => (
                    <div key={label} className={`flex flex-col items-center py-3 ${bg}`}>
                      <span className={`text-xl font-black font-mono ${color}`}>{count}</span>
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">{label}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Validation list */}
            <div className="p-4 space-y-2 max-h-[55vh] overflow-y-auto">
              {validations.map(v => (
                <div
                  key={v.id}
                  className={`p-3 rounded-xl border text-[11px] flex items-start gap-2.5 ${
                    v.status === 'success'
                      ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200'
                      : v.status === 'warning'
                      ? 'bg-amber-950/40 border-amber-700/50 text-amber-200'
                      : 'bg-red-950/40 border-red-800/50 text-red-200'
                  }`}
                >
                  {getStatusIcon(v.status)}
                  <div>
                    <span className="font-bold block leading-tight text-white">{v.name}</span>
                    <span className="text-[10px] opacity-75 leading-snug block mt-0.5">{v.recommendation}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-700/80 flex items-center justify-between">
              <p className="text-[9px] text-slate-500 font-mono">© 2026 Design Group Latinamerica</p>
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
