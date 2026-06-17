/**
 * Space-type aware configuration for equipment, labels and Canvas rendering
 */

import { SpaceType } from '../types';

export type SpaceField = {
  key: 'includeSink' | 'includeStove' | 'includeAppliances' | 'includeBuiltInOven' | 'includeHighCabinets' | 'includeIsland' | 'includeRefrigerator' | 'includeDishwasher' | 'inverseDistribution';
  label: string;
  hint: string;
  invert?: boolean; // true when default is false (inverseDistribution)
  blue?: boolean;
};

export type SpaceEquipmentConfig = {
  sectionTitle: string;
  sectionDesc: string;
  fields: SpaceField[];
};

export const SPACE_EQUIPMENT: Record<SpaceType, SpaceEquipmentConfig> = {
  cocina: {
    sectionTitle: 'Equipamiento técnico de cocina',
    sectionDesc: 'Personaliza los accesorios y zonas funcionales integradas en el mueble.',
    fields: [
      { key: 'includeSink',         label: 'Lavaplatos',             hint: 'Grifería cuello alto' },
      { key: 'includeStove',        label: 'Encimera / Cocina',      hint: 'Placa de inducción' },
      { key: 'includeAppliances',   label: 'Columna técnica',        hint: 'Torre horno + lavadora' },
      { key: 'includeBuiltInOven',  label: 'Horno empotrado',        hint: 'Bajo encimera' },
      { key: 'includeHighCabinets', label: 'Muebles de altura',      hint: 'Alacenas aéreas' },
      { key: 'includeIsland',       label: 'Mesa tipo isla',          hint: 'Isla central social' },
      { key: 'includeRefrigerator', label: 'Refrigerador',            hint: 'Frigorífico independiente' },
      { key: 'includeDishwasher',   label: 'Lavavajillas',            hint: 'Integrado bajo encimera' },
    ],
  },
  bano: {
    sectionTitle: 'Equipamiento sanitario de baño',
    sectionDesc: 'Define los elementos sanitarios y accesorios a visualizar en el render.',
    fields: [
      { key: 'includeSink',         label: 'Lavamanos / Vanity',     hint: 'Mueble bajo encimera' },
      { key: 'includeAppliances',   label: 'Espejo / Botiquín',      hint: 'Mueble espejo empotrado' },
      { key: 'includeStove',        label: 'Ducha',                  hint: 'Cabina con mampara' },
      { key: 'includeBuiltInOven',  label: 'Bañera',                 hint: 'Bañera encastrada' },
      { key: 'includeHighCabinets', label: 'Muebles auxiliares',     hint: 'Cajonera / toallero' },
      { key: 'inverseDistribution', label: 'Invertir distribución',  hint: 'Izq ⇄ Der', invert: true, blue: true },
    ],
  },
  sala: {
    sectionTitle: 'Elementos de sala de estar',
    sectionDesc: 'Define los muebles y accesorios a incluir en la visualización.',
    fields: [
      { key: 'includeAppliances',   label: 'Módulo de TV / Rack',    hint: 'Panel y credenza TV' },
      { key: 'includeSink',         label: 'Sofá principal',         hint: 'Módulo tapizado' },
      { key: 'includeStove',        label: 'Mesa de centro',         hint: 'Coffee table' },
      { key: 'includeHighCabinets', label: 'Biblioteca / Estante',   hint: 'Mueble en altura' },
      { key: 'inverseDistribution', label: 'Invertir distribución',  hint: 'Izq ⇄ Der', invert: true, blue: true },
    ],
  },
  dormitorio: {
    sectionTitle: 'Elementos del dormitorio',
    sectionDesc: 'Selecciona los muebles de descanso a incluir en el renderizado.',
    fields: [
      { key: 'includeSink',         label: 'Cama principal',         hint: 'Plataforma + cabecera' },
      { key: 'includeAppliances',   label: 'Veladores (×2)',         hint: 'Mesas de noche' },
      { key: 'includeHighCabinets', label: 'Closet / Vestidor',      hint: 'Armario empotrado' },
      { key: 'includeStove',        label: 'Cómoda / Tocador',       hint: 'Módulo bajo con espejo' },
      { key: 'inverseDistribution', label: 'Cama lado izquierdo',    hint: 'Posición cabecera', invert: true, blue: true },
    ],
  },
  comedor: {
    sectionTitle: 'Elementos del comedor',
    sectionDesc: 'Define los muebles a visualizar en la sala de comedor.',
    fields: [
      { key: 'includeSink',         label: 'Mesa de comedor',        hint: 'Mesa rectangular central' },
      { key: 'includeAppliances',   label: 'Sillas (set)',           hint: 'Set completo de sillas' },
      { key: 'includeHighCabinets', label: 'Vitrina / Vajillero',    hint: 'Mueble en altura' },
      { key: 'includeStove',        label: 'Aparador / Bufet',       hint: 'Mueble aparador bajo' },
      { key: 'inverseDistribution', label: 'Invertir distribución',  hint: 'Izq ⇄ Der', invert: true, blue: true },
    ],
  },
  bodega: {
    sectionTitle: 'Equipamiento de bodega',
    sectionDesc: 'Configura los sistemas de almacenamiento a incluir.',
    fields: [
      { key: 'includeHighCabinets', label: 'Estantería metálica',    hint: 'Sistema Rack industrial' },
      { key: 'includeSink',         label: 'Zona de lavado',         hint: 'Tarja utilitaria' },
      { key: 'includeAppliances',   label: 'Gabinete herramientas',  hint: 'Armario cerrado' },
      { key: 'includeStove',        label: 'Escalera / Plataforma',  hint: 'Zona acceso altura' },
      { key: 'inverseDistribution', label: 'Invertir distribución',  hint: 'Izq ⇄ Der', invert: true, blue: true },
    ],
  },
  otro: {
    sectionTitle: 'Elementos del espacio',
    sectionDesc: 'Selecciona los elementos a incluir en la visualización.',
    fields: [
      { key: 'includeHighCabinets', label: 'Muebles en altura',      hint: 'Mueble superior' },
      { key: 'includeSink',         label: 'Módulo base principal',  hint: 'Mueble bajo' },
      { key: 'includeAppliances',   label: 'Módulo auxiliar',        hint: 'Accesorio complementario' },
      { key: 'inverseDistribution', label: 'Invertir distribución',  hint: 'Izq ⇄ Der', invert: true, blue: true },
    ],
  },
};

// ── Labels for Step2Form Tab 3 per space ──────────────────────────────────────
export type Step2EquipmentItem = {
  id: string;
  label: string;
  sub: string;
  valueKey: 'includeSink' | 'includeStove' | 'includeAppliances' | 'includeBuiltInOven' | 'includeHighCabinets';
};

export type Step2SpaceEquipment = {
  tabLabel: string;
  primaryLabel: string;   // e.g. "Tipo de mueble base"
  items: Step2EquipmentItem[];
};

export const STEP2_SPACE_EQUIPMENT: Partial<Record<SpaceType, Step2SpaceEquipment>> = {
  bano: {
    tabLabel: 'Baño',
    primaryLabel: 'Tipo de lavamanos',
    items: [
      { id: 'vessel',   label: 'Sobre encimera (vessel)', sub: 'Lavamanos sobre cubierta',    valueKey: 'includeSink' },
      { id: 'undermt',  label: 'Bajo encimera',           sub: 'Integrado bajo cubierta',     valueKey: 'includeStove' },
    ],
  },
  sala: {
    tabLabel: 'Sala',
    primaryLabel: 'Estilo de sofá',
    items: [
      { id: 'sofa_l',   label: 'Sofá en L',               sub: 'Sectional con chaise',       valueKey: 'includeSink' },
      { id: 'sofa_2',   label: 'Sofá lineal 2+3',         sub: 'Módulos independientes',      valueKey: 'includeStove' },
    ],
  },
  dormitorio: {
    tabLabel: 'Dormitorio',
    primaryLabel: 'Tamaño de cama',
    items: [
      { id: 'king',     label: 'King Size (200×200)',      sub: 'Máximo confort',              valueKey: 'includeSink' },
      { id: 'queen',    label: 'Queen Size (160×200)',     sub: 'Tamaño estándar',             valueKey: 'includeStove' },
    ],
  },
  comedor: {
    tabLabel: 'Comedor',
    primaryLabel: 'Capacidad de mesa',
    items: [
      { id: 't4',       label: 'Mesa 4 personas',          sub: '120×80 cm',                  valueKey: 'includeSink' },
      { id: 't6',       label: 'Mesa 6 personas',          sub: '180×90 cm',                  valueKey: 'includeStove' },
      { id: 't8',       label: 'Mesa 8 personas',          sub: '240×100 cm',                 valueKey: 'includeAppliances' },
    ],
  },
  bodega: {
    tabLabel: 'Bodega',
    primaryLabel: 'Tipo de estantería',
    items: [
      { id: 'light',    label: 'Liviana (100 kg/nivel)',   sub: 'Doméstica / taller',         valueKey: 'includeSink' },
      { id: 'medium',   label: 'Media (300 kg/nivel)',     sub: 'Semi-industrial',             valueKey: 'includeStove' },
      { id: 'heavy',    label: 'Pesada (600 kg/nivel)',    sub: 'Industrial certificada',      valueKey: 'includeAppliances' },
    ],
  },
};
