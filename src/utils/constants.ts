/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PresetMaterial, SpaceType, LayoutType, StyleType } from '../types';

export const SPACE_TYPES: { id: SpaceType; name: string; description: string }[] = [
  {
    id: 'cocina',
    name: 'Cocina',
    description: 'Espacio dedicado a la cocción, lavado y almacenamiento de alimentos.',
  },
  {
    id: 'bano',
    name: 'Baño',
    description: 'Espacio de higiene personal optimizado para flujos de humedad y herrajes.',
  },
  {
    id: 'sala',
    name: 'Sala',
    description: 'Espacio social y de descanso libre para la continuidad del amoblado.',
  },
  {
    id: 'dormitorio',
    name: 'Dormitorio',
    description: 'Zona de confort personal con alta demanda de organización de armarios.',
  },
  {
    id: 'comedor',
    name: 'Comedor',
    description: 'Área para reunión social y vajilla con confort lumbar integrado.',
  },
  {
    id: 'bodega',
    name: 'Bodega',
    description: 'Área de almacenamiento y guardado con alta densidad de repisas.',
  },
  {
    id: 'otro',
    name: 'Otro',
    description: 'Espacio de libre configuración, personalizable a cualquier necesidad.',
  },
];

export const LAYOUTS: { id: LayoutType; name: string; description: string }[] = [
  {
    id: 'L_shaped',
    name: 'Distribución en L',
    description: 'Excelente para esquinas, facilita un triángulo de trabajo muy cómodo y flujo abierto.',
  },
  {
    id: 'U_shaped',
    name: 'Distribución en U',
    description: 'Envolvente y altamente ergonómica. Distribuye las áreas de lavado, cocción y guardado en 3 frentes.',
  },
  {
    id: 'parallel',
    name: 'Distribución Paralela / Dos frentes',
    description: 'Ideal para pasillos anchos o cocinas profesionales, optimiza los desplazamientos.',
  },
  {
    id: 'linear',
    name: 'Distribución en Línea',
    description: 'Compacta y práctica. Concentra todo en un solo plano. Ideal para espacios estrechos.',
  },
  {
    id: 'with_island',
    name: 'Distribución con Isla Central',
    description: 'El sumun de la ergonomía social DGLA. Requiere al menos 320 cm de ancho total.',
  },
  {
    id: 'penisula',
    name: 'Distribución con Península',
    description: 'Conecta un ala de desayuno o herraje técnico con una de las paredes de apoyo.',
  },
  {
    id: 'none',
    name: 'Sin distribución definida',
    description: 'Para espacios vacíos para remodelación de raíz.',
  },
];

export const STYLES: { id: StyleType; name: string; tag: string; description: string; colors: string[] }[] = [
  {
    id: 'contemporary',
    name: 'Contemporáneo',
    tag: 'DGLA Signature',
    description: 'Líneas puras, herrajes ocultos, e integración fotorrealista de electrodomésticos.',
    colors: ['#FFFFFF', '#D1D5DB', '#1F2937', '#9CA3AF'],
  },
  {
    id: 'japandi',
    name: 'Japandi',
    tag: 'Calidez Minimalista',
    description: 'Fusión de estética zen japonesa y calidez escandinava con maderas claras e iluminación suave.',
    colors: ['#F3F4F6', '#E9D5C5', '#F5E6D3', '#78350F'],
  },
  {
    id: 'industrial',
    name: 'Industrial',
    tag: 'Carácter y Estilo',
    description: 'Contraste audaz de acero inoxidable, maderas rústicas oscuras, negros profundos y ladrillo visto.',
    colors: ['#4B5563', '#111827', '#B45309', '#D1D5DB'],
  },
  {
    id: 'rustic_traditional',
    name: 'Rústico Tradicional',
    tag: 'Hogar Cálido',
    description: 'Molduras suaves, maderas rústicas con veta marcada, herrajes de forja y encimeras de piedra natural.',
    colors: ['#78350F', '#FEF3C7', '#B45309', '#F59E0B'],
  },
  {
    id: 'classic',
    name: 'Clásico Europeo',
    tag: 'Elegancia Eterna',
    description: 'Marfil laqueado, molduras distinguidas, mármoles nobles de vetas grises e iluminación señorial.',
    colors: ['#FFFBEB', '#9CA3AF', '#D1D5DB', '#EFEFEF'],
  },
];

export const FURNITURE_MATERIALS = {
  wood: {
    name: 'Madera Natural Maciza / Enchapado',
    description: 'Veta natural, calidez y solidez extrema con protección hidrófuga.',
    options: [
      { id: 'roble', name: 'Roble Dorado', hex: '#cfb591', textureType: 'wood' },
      { id: 'haya', name: 'Haya Nórdica', hex: '#ebd2b0', textureType: 'wood' },
      { id: 'pino', name: 'Pino Rústico', hex: '#dfca9b', textureType: 'wood' },
      { id: 'nogal', name: 'Nogal Americano', hex: '#6b543b', textureType: 'wood' },
      { id: 'wengue', name: 'Wengué Africano', hex: '#30261c', textureType: 'wood' },
    ],
  },
  lacquered_melamine: {
    name: 'Melamina Laqueada Premium',
    description: 'Acabado suave, fácil limpieza, terminación mate o brillante espejo.',
    options: [
      { id: 'blanco_brillante', name: 'Blanco Puro Alto Brillo', hex: '#fbfbfb', textureType: 'matte' },
      { id: 'gris_tormenta', name: 'Gris Tormenta', hex: '#63666b', textureType: 'matte' },
      { id: 'marfil', name: 'Marfil Texturizado', hex: '#ede6dd', textureType: 'matte' },
      { id: 'antracita', name: 'Antracita Oscuro', hex: '#2c2e36', textureType: 'matte' },
    ],
  },
  lacquered_3d: {
    name: 'Lacado 3D Termoformado',
    description: 'Frentes sin cantos pegados, sellado hermético perimetral de resistencia máxima.',
    options: [
      { id: 'frambuesa', name: 'Frambuesa Arcilla', hex: '#8a3335', textureType: 'lacquered' },
      { id: 'aguamarina', name: 'Aguamarina Salvia', hex: '#607971', textureType: 'lacquered' },
      { id: 'grafito', name: 'Grafito Sedoso', hex: '#3d4045', textureType: 'lacquered' },
      { id: 'crema', name: 'Crema de Trigo', hex: '#f0e3cc', textureType: 'lacquered' },
    ],
  },
};

export const COUNTERTOP_MATERIALS = {
  quartz: {
    name: 'Cuarzo Tecnológico (Silestone / Neolith)',
    description: 'Nula porosidad, resistencia extrema a las manchas y gran ductilidad de tallado.',
    options: [
      { id: 'blanco_stellar', name: 'Blanco Stellar', hex: '#f8f8f8', textureType: 'polished' },
      { id: 'gris_pulido', name: 'Gris Pulido Concrete', hex: '#a6a29d', textureType: 'polished' },
      { id: 'negro_galaxy', name: 'Negro Galaxy Crystalline', hex: '#16171b', textureType: 'polished' },
    ],
  },
  granite: {
    name: 'Granito Natural Importado',
    description: 'Piedra volcánica eterna de altísima resistencia al calor directo.',
    options: [
      { id: 'nero_assoluto', name: 'Nero Assoluto Satinado', hex: '#212224', textureType: 'stone' },
      { id: 'blanco_ancho', name: 'Blanco Ancho Alvear', hex: '#e3e4e6', textureType: 'stone' },
      { id: 'manzanita', name: 'Rojo Manzanita Imperial', hex: '#6e4a41', textureType: 'stone' },
    ],
  },
  marble: {
    name: 'Mármol Noble de Cantera',
    description: 'Veteado dramático de belleza suntuosa e irrepetible para acentos sutiles.',
    options: [
      { id: 'carrara', name: 'Blanco Carrara Clásico', hex: '#eceff1', textureType: 'marble' },
      { id: 'calacata', name: 'Calacata Gold & Grey', hex: '#f1ebd9', textureType: 'marble' },
    ],
  },
  laminated: {
    name: 'Laminado Estructurado Antihumedad',
    description: 'Núcleo fenólico hidrófugo con textura texturada símil madera real.',
    options: [
      { id: 'roble_rustico', name: 'Laminado Roble Rústico', hex: '#dca973', textureType: 'wood' },
      { id: 'nogal_elegante', name: 'Laminado Nogal Elegante', hex: '#815e3f', textureType: 'wood' },
    ],
  },
  stainless_steel: {
    name: 'Acero Inoxidable AISI 304',
    description: 'Higiénico, profesional y de estética industrial quirúrgica eterna.',
    options: [
      { id: 'acero', name: 'Acero Cepillado Mate', hex: '#b0b5bc', textureType: 'metal' },
    ],
  },
};

export const BACKSPLASH_MATERIALS = {
  ceramic_tile: {
    name: 'Azulejo Cerámico Esmaltado',
    description: 'Clásico de fácil reemplazo con juntas selladas antihongos.',
    options: [
      { id: 'blanco', name: 'Azulejo Subway Blanco', hex: '#ffffff', textureType: 'pattern' },
      { id: 'gris', name: 'Azulejo Subway Gris', hex: '#bdbdbd', textureType: 'pattern' },
      { id: 'negro', name: 'Azulejo Subway Negro', hex: '#212121', textureType: 'pattern' },
    ],
  },
  tempered_glass: {
    name: 'Vidrio Templado Extraclaro (Coverglas)',
    description: 'Sin juntas, plano monolítico continuo, refleja la luz sutilmente.',
    options: [
      { id: 'vidrio_blanco', name: 'Vidrio Blanco Pureza', hex: '#fafbfc', textureType: 'glass' },
      { id: 'vidrio_gris', name: 'Vidrio Gris Humo', hex: '#525b61', textureType: 'glass' },
    ],
  },
  stainless_steel: {
    name: 'Acero Inoxidable Continuo',
    description: 'Brinda alineación perfecta con la encimera profesional del mismo material.',
    options: [
      { id: 'acero_back', name: 'Acero Inox Satinado', hex: '#b6babf', textureType: 'metal' },
    ],
  },
  mirror: {
    name: 'Espejo Tecnológico de Seguridad',
    description: 'Amplía los límites del espacio duplicando la profundidad de la encimera.',
    options: [
      { id: 'espejo_claro', name: 'Espejo Plata Cristal', hex: '#e0f2f1', textureType: 'mirror' },
      { id: 'espejo_bronce', name: 'Espejo Bronce Cálido', hex: '#d7ccc8', textureType: 'mirror' },
    ],
  },
};

export const SAMPLE_SPACE_IMAGES = [
  {
    id: 'sample_kitchen_1',
    name: 'Cocina Antigua Desordenada (Muestra)',
    url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=800',
    description: 'Muebles desgastados en pino, azulejos rotos de 15x15 e iluminación tenue unilateral.'
  },
  {
    id: 'sample_kitchen_2',
    name: 'Espacio Vacío Obra Nueva (Muestra)',
    url: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&q=80&w=800',
    description: 'Paredes de hormigón crudo, conexiones preparadas, ventanas altas y caños de desagüe vistos.'
  },
  {
    id: 'sample_kitchen_3',
    name: 'Cocina Estilo 90s Departamental (Muestra)',
    url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=800',
    description: 'Melamina blanca con perfiles de madera, encimera de formica beige y espacio reducido.'
  }
];
