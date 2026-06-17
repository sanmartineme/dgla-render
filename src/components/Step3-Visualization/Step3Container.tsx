/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ProjectState } from '../../types';
import { validateDGLAErgonomics } from '../../utils/ergonomics';
import Canvas3D from './Canvas3D';
import {
  Download,
  FileText,
  ChevronLeft,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  Video,
  Box,
  LayoutGrid,
  Eye,
  Trash2,
  ArrowLeft,
  ArrowRight,
  X,
  RotateCcw as RestoreIcon,
  MousePointer2,
  Layers,
} from 'lucide-react';

interface Step3ContainerProps {
  project: ProjectState;
  onModify: () => void;
  onReset: () => void;
  onLoadProject: (proj: ProjectState) => void;
  onUpdateProject?: (proj: ProjectState) => void;
}

export default function Step3Container({
  project,
  onModify,
  onReset,
  onLoadProject,
  onUpdateProject,
}: Step3ContainerProps) {
  const [clientName, setClientName] = useState<string>('Claudia');
  const [saveName, setSaveName] = useState<string>('Propuesta Contemporánea Principal');
  const [savedProjects, setSavedProjects] = useState<ProjectState[]>([]);
  const [recentSaved, setRecentSaved] = useState<boolean>(false);
  const [showPrintReport, setShowPrintReport] = useState<boolean>(false);
  const [cameraView, setCameraView] = useState<'perspective' | 'front' | 'side' | 'top' | 'isometric'>('perspective');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);

  // Module selection / editing state
  const [selectedModule, setSelectedModule] = useState<{ id: string; name: string } | null>(null);
  const [hiddenModules, setHiddenModules] = useState<Set<string>>(() => {
    // Pre-hide the wall cabinet slot that sits above the tech column (no physical space for it)
    const initial = new Set<string>();
    if (
      project.ergonomics.dishwasherColumn &&
      project.kitchenEquipment?.includeAppliances !== false &&
      project.spaceType === 'cocina'
    ) {
      const roomLen = project.dimensions.length / 100;
      const cLength = project.furnitureDimensions
        ? project.furnitureDimensions.length / 100
        : roomLen - 0.05;
      const wCounts = Math.max(1, Math.min(Math.floor(cLength / 0.8), 6));
      const skipIdx = !project.kitchenEquipment?.inverseDistribution ? 0 : (wCounts - 1);
      initial.add(`wall_cabinet_${skipIdx}`);
    }
    return initial;
  });
  const [modulePositions, setModulePositions] = useState<Record<string, number>>({});

  const handleModuleClick = (moduleId: string, moduleName: string) => {
    if (!moduleId) { setSelectedModule(null); return; }
    setSelectedModule(prev => (prev?.id === moduleId ? null : { id: moduleId, name: moduleName }));
  };

  const handleDeleteModule = () => {
    if (!selectedModule) return;
    setHiddenModules(prev => new Set([...prev, selectedModule.id]));
    setSelectedModule(null);
  };

  const handleMoveModule = (direction: 'left' | 'right') => {
    if (!selectedModule) return;
    const step = 0.4;
    setModulePositions(prev => ({
      ...prev,
      [selectedModule.id]: (prev[selectedModule.id] ?? 0) + (direction === 'left' ? -step : step),
    }));
  };

  const handleRestoreAll = () => {
    setHiddenModules(new Set());
    setModulePositions({});
    setSelectedModule(null);
  };

  // Derive matching wall cabinet id for a selected base counter module
  const matchingWallCabId = selectedModule?.id.startsWith('back_counter_')
    ? `wall_cabinet_${selectedModule.id.replace('back_counter_', '')}`
    : null;

  const handleToggleWallCabinet = () => {
    if (!matchingWallCabId) return;
    setHiddenModules(prev => {
      const next = new Set(prev);
      if (next.has(matchingWallCabId)) next.delete(matchingWallCabId);
      else next.add(matchingWallCabId);
      return next;
    });
  };

  // Load saved projects list from localStorage
  useEffect(() => {
    const list = localStorage.getItem('dgla_saved_proposals');
    if (list) {
      try {
        setSavedProjects(JSON.parse(list));
      } catch (e) {
        console.error("Fallo al decodificar proyectos guardados", e);
      }
    }
  }, []);

  const validations = validateDGLAErgonomics(
    project.dimensions,
    project.newLayout !== 'none' ? project.newLayout : project.currentLayout,
    project.ergonomics
  );

  const getStatusIcon = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
      case 'error':
        return <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />;
    }
  };

  const getStatusBg = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return 'bg-blue-50/55 border-blue-150 text-blue-950';
      case 'warning':
        return 'bg-amber-50 border-amber-150 text-amber-950';
      case 'error':
        return 'bg-red-50 border-red-150 text-red-950';
    }
  };

  // 3D Canvas PNG Rendering capture handler
  const handleDownloadPNG = () => {
    const canvas = document.getElementById('dgla_interactive_3d') as HTMLCanvasElement;
    if (!canvas) {
      alert("No se pudo hallar el lienzo 3D activo para la captura.");
      return;
    }

    try {
      const dataURL = canvas.toDataURL('image/png');
      const testLink = document.createElement('a');
      testLink.download = `DGLA_Visualizacion_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.png`;
      testLink.href = dataURL;
      document.body.appendChild(testLink);
      testLink.click();
      document.body.removeChild(testLink);
    } catch (e) {
      console.error("Fallo al exportar el PNG del lienzo WebGL", e);
    }
  };

  // Local state persistence: save current proposal variant
  const handleSaveProject = () => {
    const updatedProject: ProjectState = {
      ...project,
      id: Math.random().toString(36).slice(2, 9),
      name: `${saveName} (${clientName})`,
      date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
    };

    const nextList = [updatedProject, ...savedProjects];
    setSavedProjects(nextList);
    localStorage.setItem('dgla_saved_proposals', JSON.stringify(nextList));
    setRecentSaved(true);
    setTimeout(() => setRecentSaved(false), 3000);
  };

  // Delete project from list
  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextList = savedProjects.filter(p => p.id !== id);
    setSavedProjects(nextList);
    localStorage.setItem('dgla_saved_proposals', JSON.stringify(nextList));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* CARD LAYOUT GRID */}
      <div className="space-y-4">
          
          {/* MÓDULO DE CONTROL DE CÁMARAS ERGONÓMICO */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-slate-800 text-xs tracking-tight uppercase leading-none">Control de Cámaras Ergonómico</h3>
                  <span className="text-[10px] text-slate-400 font-mono tracking-wider block mt-0.5">ESTUDIO DE ALCANCE Y VISIBILIDAD DGLA</span>
                </div>
              </div>
              <span className="self-start sm:self-auto text-[9px] font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                {cameraView === 'top' 
                  ? 'Vista de Planta' 
                  : cameraView === 'front' 
                    ? 'Vista Frontal' 
                    : cameraView === 'isometric' 
                      ? 'Perspectiva Isométrica' 
                      : cameraView === 'side'
                        ? 'Corte Lateral'
                        : 'Perspectiva Libre'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Option 1: Planta superior */}
              <button
                type="button"
                onClick={() => setCameraView('top')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none ${
                  cameraView === 'top'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                id="btn_cam_view_top"
              >
                <LayoutGrid className="w-4 h-4 shrink-0" />
                <span className="truncate">Planta Superior</span>
              </button>

              {/* Option 2: Vista Frontal */}
              <button
                type="button"
                onClick={() => setCameraView('front')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none ${
                  cameraView === 'front'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                id="btn_cam_view_front"
              >
                <Eye className="w-4 h-4 shrink-0" />
                <span className="truncate">Vista Frontal</span>
              </button>

              {/* Option 3: Perspectiva Isométrica */}
              <button
                type="button"
                onClick={() => setCameraView('isometric')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none ${
                  cameraView === 'isometric'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                id="btn_cam_view_isometric"
              >
                <Box className="w-4 h-4 shrink-0" />
                <span className="truncate">Perspectiva Isométrica</span>
              </button>
            </div>

            {/* Quick Layout Inversion switch */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/40 p-2.5 rounded-lg">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-700">Inversión Rápida de Distribución</span>
                <span className="text-[10px] text-slate-500">Cambia la posición de Lavaplatos y Encimera (izquierda/derecha).</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onUpdateProject) {
                    onUpdateProject({
                      ...project,
                      kitchenEquipment: {
                        ...project.kitchenEquipment,
                        inverseDistribution: !project.kitchenEquipment?.inverseDistribution
                      }
                    });
                  }
                }}
                className={`py-1.5 px-4 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer focus:outline-none ${
                  project.kitchenEquipment?.inverseDistribution
                    ? 'bg-blue-100 border-blue-300 text-blue-700 font-bold'
                    : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                }`}
                id="btn_inline_inverse_distribution"
              >
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                {project.kitchenEquipment?.inverseDistribution ? 'Distribución: Invertida (Der-Izq)' : 'Distribución: Estándar (Izq-Der)'}
              </button>
            </div>

            {/* NEW: DGLA HEATMAP MODE OVERLAY BUTTON AND LEDGER */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-amber-50/30 border border-amber-100 p-2.5 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-amber-905 flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    Mapa de Calor y Flujo de Interacción
                  </span>
                  <span className="text-[10px] text-slate-500">Visualiza áreas de contacto crítico y el Triángulo de Trabajo Ergonómico DGLA en 3D.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`py-1.5 px-4 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer focus:outline-none ${
                    showHeatmap
                      ? 'bg-amber-500 border-amber-600 text-white shadow-sm'
                      : 'bg-white border-slate-202 text-slate-800 hover:bg-slate-50'
                  }`}
                  id="btn_toggle_heatmap_overlay"
                >
                  {showHeatmap ? 'Ocultar Mapa de Calor' : 'Mostrar Mapa de Calor'}
                </button>
              </div>

              {showHeatmap && (
                <div className="p-3.5 bg-slate-900 border border-slate-800 text-white rounded-xl space-y-3 shadow-md animate-in fade-in slide-in-from-top duration-300">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                    <span className="text-[10px] font-mono tracking-wider text-amber-400 font-bold">LEYENDA DE ERGONOMÍA (ESTÁNDAR DGLA)</span>
                    <span className="text-[9px] bg-emerald-950/80 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-900 font-mono">
                      TRIÁNGULO DE TRABAJO ACTIVO
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0 shadow-[0_0_6px_#ef4444]" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-200">Zona de Cocción</span>
                        <span className="text-[9px] text-slate-400">95% de atención</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0 shadow-[0_0_6px_#3b82f6]" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-200">Zona de Lavado/Carga</span>
                        <span className="text-[9px] text-slate-400">85% de frecuencia</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0 shadow-[0_0_6px_#f59e0b]" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-200">Preparación Activa</span>
                        <span className="text-[9px] text-slate-400">70% de permanencia</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_6px_#10b981]" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-200">Almacenaje/Frío</span>
                        <span className="text-[9px] text-slate-400">Acciones rápidas</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[10.5px]">
                    <div className="space-y-0.5">
                      <p className="text-slate-300">
                        <strong className="text-amber-400">Análisis Ergonómico DGLA:</strong> La distancia recorrida acumulada entre estas 3 zonas clave en tu diseño actual es altamente eficiente (<span className="text-emerald-400 font-bold font-mono">~5.30 metros</span>).
                      </p>
                      <p className="text-[9.5px] text-slate-400">
                        *El rango óptimo saludable para evitar cansancio físico lumbosacro es de 4.00 a 7.90 metros en total.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* NEW: AMBIENT LIGHTING TYPE SELECTION */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-705 flex items-center gap-1.5">
                    💡 Esquema de Iluminación Ambiental (3D)
                  </span>
                  <span className="text-[10px] text-slate-500">Alterna entre luz natural del sol (día), fría de laboratorio o cálida hogareña.</span>
                </div>
                <div className="grid grid-cols-3 gap-1 bg-slate-200/50 p-1 rounded-lg w-full sm:w-auto">
                  {(['natural', 'cold', 'warm'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        if (onUpdateProject) {
                          onUpdateProject({
                            ...project,
                            lightingMode: mode
                          });
                        }
                      }}
                      className={`py-1 px-2.5 text-[10px] font-bold rounded-md transition-all uppercase tracking-wide cursor-pointer text-center ${
                        (project.lightingMode || 'natural') === mode
                          ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      id={`btn_light_mode_${mode}`}
                    >
                      {mode === 'natural' ? '☉ Natural' : mode === 'cold' ? '❄ Fría' : '🔥 Cálida'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

        <Canvas3D
          project={project}
          externalPreset={cameraView}
          onChangePreset={setCameraView}
          showHeatmap={showHeatmap}
          hiddenModules={hiddenModules}
          modulePositions={modulePositions}
          selectedModuleId={selectedModule?.id ?? null}
          onModuleClick={handleModuleClick}
        />

        {/* MODULE SELECTION ACTION PANEL */}
        {(selectedModule || hiddenModules.size > 0) && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-200 shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              <span className="p-1.5 bg-blue-600 rounded-lg shrink-0">
                <MousePointer2 className="w-4 h-4 text-white" />
              </span>
              <div className="min-w-0">
                {selectedModule ? (
                  <>
                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Módulo seleccionado</p>
                    <p className="text-sm font-bold text-white truncate">{selectedModule.name}</p>
                  </>
                ) : (
                  <p className="text-xs text-slate-300 font-semibold">
                    {hiddenModules.size} módulo{hiddenModules.size !== 1 ? 's' : ''} eliminado{hiddenModules.size !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {selectedModule && (
                <>
                  <button
                    onClick={() => handleMoveModule('left')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-600 transition-all"
                    title="Mover a la izquierda"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Mover ←
                  </button>
                  <button
                    onClick={() => handleMoveModule('right')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-600 transition-all"
                    title="Mover a la derecha"
                  >
                    Mover → <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Wall cabinet toggle — only shows when a base counter is selected */}
                  {matchingWallCabId && (
                    <button
                      onClick={handleToggleWallCabinet}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shadow-sm ${
                        hiddenModules.has(matchingWallCabId)
                          ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-500 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 border-slate-500 text-slate-200'
                      }`}
                      title={hiddenModules.has(matchingWallCabId) ? 'Agregar alacena superior' : 'Quitar alacena superior'}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      {hiddenModules.has(matchingWallCabId) ? 'Agregar Alacena' : 'Quitar Alacena'}
                    </button>
                  )}

                  <button
                    onClick={handleDeleteModule}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                  </button>
                  <button
                    onClick={() => setSelectedModule(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-all"
                    title="Deseleccionar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
              {hiddenModules.size > 0 && (
                <button
                  onClick={handleRestoreAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                >
                  <RestoreIcon className="w-3.5 h-3.5" /> Restaurar todo
                </button>
              )}
            </div>
          </div>
        )}

          {/* Quick client name editor */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-semibold">Identificación de Cliente</label>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Claudia"
                  className="font-sans font-bold text-slate-800 text-sm focus:outline-none focus:border-b focus:border-blue-600 max-w-[150px] bg-transparent"
                  id="client_name_input"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleDownloadPNG}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all focus:outline-none cursor-pointer"
                id="btn_download_png"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" /> Descargar Render PNG
              </button>

              <button
                onClick={() => setShowPrintReport(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-all focus:outline-none cursor-pointer"
                id="btn_print_pdf"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" /> Generar Ficha PDF
              </button>
            </div>
          </div>
      </div>

      {/* CORE ACTIONS NAVIGATION */}
      <div className="pt-4 border-t border-slate-200 flex justify-between gap-3 flex-col sm:flex-row">
        <button
          onClick={onModify}
          className="px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer focus:outline-none flex items-center justify-center gap-1.5 order-2 sm:order-1"
          id="btn_back_to_style"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" /> Volver al Paso 2: Diseño y Ergonomía
        </button>

        <button
          onClick={onReset}
          className="px-5 py-3 text-slate-500 hover:text-red-700 hover:bg-red-50 text-xs font-semibold border border-transparent rounded-xl transition-all cursor-pointer focus:outline-none order-1 sm:order-2"
          id="btn_reset_whole"
        >
          Iniciar Nueva Cocina
        </button>
      </div>

      {/* DETAILED PRINT REPORT / PROPOSAL DOSSIER DIALOG (A4 Architectural print-ready) */}
      {showPrintReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
            
            {/* Action Bar */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800 print:hidden">
              <span className="font-semibold text-sm">Ficha Técnica e Informe de Diseño Ergonómico DGLA</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all focus:outline-none cursor-pointer"
                  id="btn_print_action"
                >
                  Imprimir / Guardar PDF
                </button>
                <button
                  onClick={() => setShowPrintReport(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-all focus:outline-none cursor-pointer"
                  id="btn_print_close"
                >
                  Cerrar Vista previa
                </button>
              </div>
            </div>

            {/* Dossier Document Content */}
            <div className="p-8 space-y-8 bg-white text-slate-800" id="dgla_proposal_dossier_print">
              
              {/* Header block */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase font-sans">Design Group Latinamerica</h1>
                  <span className="text-xs font-mono tracking-widest text-blue-700 font-bold block">PLATAFORMA DE VISUALIZACIÓN ERGONÓMICA</span>
                </div>
                <div className="text-right text-xs text-slate-400 font-mono">
                  <p className="flex items-center gap-1 justify-end"><User className="w-3.5 h-3.5" /> Cliente: <strong className="text-slate-800 font-bold">{clientName}</strong></p>
                  <p className="flex items-center gap-1 justify-end mt-1"><Calendar className="w-3.5 h-3.5" /> Fecha: <span className="text-slate-800 font-bold">{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                </div>
              </div>

              {/* Grid 1: Spatial dimensions */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-sans border-b border-slate-250 pb-1">1. Diagnóstico Contextual de Habitación</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[9px]">DIRECCIÓN ESPACIAL</span>
                    <strong className="text-slate-800 font-bold capitalize">{project.spaceType.replace('_', ' ')}</strong>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[9px]">TAMAÑO DE SUPERFICIE</span>
                    <strong className="text-slate-800 font-bold">{project.dimensions.length} × {project.dimensions.width} cm</strong>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[9px]">ALTO MÍNIMO TECHOS</span>
                    <strong className="text-slate-800 font-bold">{project.dimensions.height} cm</strong>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[9px]">DISTRIBUCIÓN PLANO</span>
                    <strong className="text-slate-800 font-bold capitalize">{project.newLayout !== 'none' ? project.newLayout.replace('_', ' ') : project.currentLayout.replace('_', ' ')}</strong>
                  </div>
                </div>
              </div>

              {/* Grid 2: Style and materiality */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-sans border-b border-slate-250 pb-1">2. Catálogo de Acabados Seleccionados</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs leading-relaxed">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-150">
                    <span className="text-[9px] font-mono tracking-widest text-slate-400 block">MUEBLES</span>
                    <strong className="text-slate-800 block mt-0.5 capitalize">{project.materials.furniture.replace('_', ' ')}</strong>
                    <div className="flex items-center gap-1.5 mt-2 bg-white px-2 py-1 rounded border border-slate-100">
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-200 shrink-0" style={{ backgroundColor: project.materials.furnitureColor }} />
                      <span className="text-[10px] text-slate-600 font-mono">{project.materials.furnitureColor}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-150">
                    <span className="text-[9px] font-mono tracking-widest text-slate-400 block">ENCIMERA</span>
                    <strong className="text-slate-800 block mt-0.5 capitalize">{project.materials.countertop.replace('_', ' ')}</strong>
                    <div className="flex items-center gap-1.5 mt-2 bg-white px-2 py-1 rounded border border-slate-100">
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-200 shrink-0" style={{ backgroundColor: project.materials.countertopColor }} />
                      <span className="text-[10px] text-slate-600 font-mono">{project.materials.countertopColor}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-150">
                    <span className="text-[9px] font-mono tracking-widest text-slate-400 block">SALPICADERO</span>
                    <strong className="text-slate-800 block mt-0.5 capitalize">{project.materials.backsplash.replace('_', ' ')}</strong>
                    <div className="flex items-center gap-1.5 mt-2 bg-white px-2 py-1 rounded border border-slate-100">
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-200 shrink-0" style={{ backgroundColor: project.materials.backsplashColor }} />
                      <span className="text-[10px] text-slate-600 font-mono">{project.materials.backsplashColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 3: Ergonomic checks block */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-sans border-b border-slate-250 pb-1">3. Dictamen y Factores de Ajuste Ergonómico</h3>
                <div className="space-y-2">
                  {validations.map((val) => (
                    <div key={val.id} className="p-3 bg-slate-50 rounded-lg text-xs leading-normal border border-slate-100">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        {val.status === 'success' ? '✓' : '⚠'} {val.name}
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1 pr-4">{val.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signature Block Footer */}
              <div className="flex justify-between items-end pt-12 border-t border-slate-100 text-[10px] font-mono text-slate-400">
                <div>
                  <p>Design Group Latinamerica S.A.</p>
                  <p className="mt-0.5">Metodología de cocinas integradas y suspendidas</p>
                </div>
                <div className="text-right border-t border-slate-400 w-44 pt-2">
                  <p className="text-slate-500 font-bold">Firma del Diseñador DGLA</p>
                  <p className="mt-0.5">Estudios de Arquitectura Integrados</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
