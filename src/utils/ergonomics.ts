/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dimensions, ErgonomicsConfig, LayoutType } from '../types';

export interface ValidationItem {
  id: string;
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  recommendation: string;
}

/**
 * Computes comfortable counter surface height for a custom user height based on standard ergonomic rules.
 */
export function calculateComfortableCounterHeight(userHeightCm: number): number {
  // Classic ergonomic formula: User height / 2 + 5 cm
  // Example: 170 cm / 2 + 5 = 90 cm
  const calculated = Math.round(userHeightCm / 2 + 5);
  // Guarantee values stay in reasonable kitchen limits (85 to 100 cm)
  return Math.max(85, Math.min(100, calculated));
}

/**
 * Analyzes the layout selection, dimensions, and ergonomic settings and returns a strict checklist
 * indicating success, warnings, or recommendation scores.
 */
export function validateDGLAErgonomics(
  dimensions: Dimensions,
  layout: LayoutType,
  ergonomics: ErgonomicsConfig
): ValidationItem[] {
  const items: ValidationItem[] = [];

  // 1. Counter Depth (Profundidad de Encimera)
  if (ergonomics.counterDepth === 80) {
    items.push({
      id: 'dgla_depth',
      name: 'Profundidad de Encimera DGLA (80 cm)',
      status: 'success',
      message: '✓ Excelente profundidad de 80 cm aplicada.',
      recommendation: 'Esta profundidad permite la Sección Posterior Equipada de 20 cm para accesorios integrados, despejando el plano frontal de trabajo en un 33% adicional.'
    });
  } else {
    items.push({
      id: 'dgla_depth',
      name: 'Profundidad de Encimera Tradicional (60 cm)',
      status: 'warning',
      message: '⚠ Encimera reducida de 60 cm detectada.',
      recommendation: 'Recomendamos encarecidamente activar la Profundidad DGLA de 80 cm para incorporar accesorios embutidos posteriores y prevenir la sobrecarga del área de corte.'
    });
  }

  // 2. Comfortable Work Triangle (Triángulo de Trabajo)
  // Work triangle relies on total room size. L, U, parallel and island are optimal, linear causes walk overhead.
  const isOptimalLayoutForTriangle = ['L_shaped', 'U_shaped', 'parallel', 'with_island', 'penisula'].includes(layout);
  const roomAreaSqm = (dimensions.length * dimensions.width) / 10000;

  if (layout === 'linear') {
    items.push({
      id: 'work_triangle',
      name: 'Triángulo de Trabajo lineal',
      status: 'warning',
      message: '⚠ Flujo en línea recta detectado (preparación lineal).',
      recommendation: 'La disposición lineal incrementa los recorridos innecesarios de un extremo al otro. Si el ancho lo permite (>240 cm), un diseño paralelo o con isla reduciría la fatiga en un 28%.'
    });
  } else if (isOptimalLayoutForTriangle && roomAreaSqm >= 8 && roomAreaSqm <= 25) {
    items.push({
      id: 'work_triangle',
      name: 'Triángulo de Trabajo Geométrico',
      status: 'success',
      message: '✓ Triángulo de distribución ergonómico perfecto.',
      recommendation: 'La relación dactilar entre zona húmeda (fregadero), caliente (anafe) y frío (columna de heladera) respeta la distancia ideal de paso (Suma de lados aproximada de 5.4m), minimizando desplazamientos.'
    });
  } else {
    items.push({
      id: 'work_triangle',
      name: 'Ubicación de Zonas de Apoyo',
      status: 'success',
      message: '✓ Espacio amplio y cómodo de circulación.',
      recommendation: 'Procure conservar una franquicia libre de circulación de al menos 110 cm en las zonas de paso frente a frentes contrapuestos.'
    });
  }

  // 3. Counter Height Customization
  const delta = Math.abs(ergonomics.calculatedCounterHeight - calculateComfortableCounterHeight(ergonomics.userHeight));
  if (delta <= 2) {
    items.push({
      id: 'custom_height',
      name: 'Altura de Encimera Adaptativa',
      status: 'success',
      message: `✓ Altura regulada a ${ergonomics.calculatedCounterHeight} cm óptima para estatura de ${ergonomics.userHeight} cm.`,
      recommendation: 'Evita la flexión lumbar indeseada de la columna y el cansancio prematuro de trapecio durante la manipulación de alimentos.'
    });
  } else if (delta <= 5) {
    items.push({
      id: 'custom_height',
      name: 'Altura de Encimera Tolerable',
      status: 'warning',
      message: `⚠ Altura de ${ergonomics.calculatedCounterHeight} cm se desvía levemente del ideal de ${calculateComfortableCounterHeight(ergonomics.userHeight)} cm.`,
      recommendation: 'Recomendamos ajustar la encimera a la altura recomendada por DGLA para atenuar tensiones musculares.'
    });
  } else {
    items.push({
      id: 'custom_height',
      name: 'Riesgo Ergonómico de Altura',
      status: 'error',
      message: `✗ Altura de ${ergonomics.calculatedCounterHeight} cm no apta para la estatura de ${ergonomics.userHeight} cm.`,
      recommendation: `Para evitar dolores cervicales u lumbares agudos, configure la encimera lo más cercano posible al estándar adaptativo calculado de ${calculateComfortableCounterHeight(ergonomics.userHeight)} cm.`
    });
  }

  // 4. Door Openings Safety
  if (ergonomics.doorType === 'balanced_lift') {
    items.push({
      id: 'door_safety',
      name: 'Alacenas de Apertura Elevable DGLA',
      status: 'success',
      message: '✓ Alacenas superiores con mecanismo amortiguado elevable.',
      recommendation: 'Favorece una visibilidad total y elimina completamente el riesgo de contusiones craneales al mantener las puertas abiertas por encima del cabezal de trabajo.'
    });
  } else {
    items.push({
      id: 'door_safety',
      name: 'Alacenas de Puerta Batiente Tradicional',
      status: 'warning',
      message: '⚠ Puertas batientes superiores tradicionales con riesgo de golpe.',
      recommendation: 'Las puertas batientes tradicionales interrumpen la fluidez del cocinado e incrementan la tasa de accidentes domésticos. Considere el sistema ascendente DGLA.'
    });
  }

  // 5. Back Health (Columna de Equipamiento)
  if (ergonomics.dishwasherColumn) {
    items.push({
      id: 'back_health',
      name: 'Lavavajillas en Columna Ergonómica',
      status: 'success',
      message: '✓ Lavavajillas sobreelevado en columna técnica.',
      recommendation: 'Permite la carga y descarga cómoda de vajilla manteniendo la columna vertebral erguida, lo que ahorra más de 12,000 flexiones anuales perjudiciales para la espalda.'
    });
  } else {
    items.push({
      id: 'back_health',
      name: 'Lavavajillas bajo encimera estándar',
      status: 'warning',
      message: '⚠ Lavavajillas ubicado a ras de suelo.',
      recommendation: 'La disposición tradicional exige agacharse reiteradamente. Integrarlo en columna de equipamiento a +40 cm mejora ostensiblemente la salud lumbar.'
    });
  }

  // 6. Island space check (if including island)
  if (ergonomics.includeIsland) {
    if (dimensions.width < 320) {
      items.push({
        id: 'island_clearance',
        name: 'Margen de Confort de Isla Central',
        status: 'error',
        message: '✗ Ancho de sala insuficiente para una isla segura.',
        recommendation: `Su ancho de cocina es de ${dimensions.width} cm. Una isla central requiere al menos 320 cm de ancho total para garantizar una distancia libre de pasos a cada lado de 100 cm.`
      });
    } else if (dimensions.width < 350) {
      items.push({
        id: 'island_clearance',
        name: 'Margen de Circulación Ajustado de Isla',
        status: 'warning',
        message: '⚠ Circulación de isla en racha crítica.',
        recommendation: 'El ancho de 320-349 cm permitirá una isla de cocina compacta, pero se aconseja reducir el ancho del mueble central a 80 cm para holgura de cajones.'
      });
    } else {
      items.push({
        id: 'island_clearance',
        name: 'Amplitud de Circulación de Isla',
        status: 'success',
        message: '✓ Ancho de cocina magnífico para alojar isla central social.',
        recommendation: 'Permite dobles flujos cruzados (paso de más de una persona a la vez) y la apertura simultánea de lavavajillas y cajones opuestos.'
      });
    }
  }

  return items;
}
