/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SpaceType = 'cocina' | 'bano' | 'sala' | 'dormitorio' | 'comedor' | 'bodega' | 'otro';

export type LayoutType = 'L_shaped' | 'U_shaped' | 'parallel' | 'linear' | 'with_island' | 'penisula' | 'none';

export type StyleType = 'contemporary' | 'rustic_traditional' | 'classic' | 'industrial' | 'japandi';

export interface Dimensions {
  length: number; // 100 - 500 cm
  width: number;  // 100 - 500 cm
  height: number; // 200 - 400 cm
  counterDepth?: number; // cm
}

export interface FurnitureDimensions {
  length: number; // in cm (e.g. 100 - 500 cm)
  height: number; // in cm (e.g. 70 - 200 cm)
  depth: number;  // in cm (e.g. 30 - 100 cm)
}

export interface KitchenEquipment {
  includeSink: boolean;          // lavaplatos
  includeAppliances: boolean;    // electrodomésticos
  includeStove: boolean;         // cocina o encimeras
  includeBuiltInOven?: boolean;  // horno empotrado bajo encimera
  includeHighCabinets?: boolean;   // muebles en altura contemplados o no
  includeIsland?: boolean;         // mesa tipo isla central
  includeRefrigerator?: boolean;   // refrigerador independiente
  includeDishwasher?: boolean;     // lavavajillas integrado
  wallCabinetType?: 'open_shelf' | 'closed_door' | 'glass_door' | 'lift_door';
  doorCloseType?: 'soft_close' | 'push_open' | 'handle' | 'rail_handle';
  inverseDistribution?: boolean;   // invertir distribución izquierda/derecha
  stovePlates?: number;          // número de platos/hornallas: 2, 3, 4 o 5
  sinkColorAndMaterial?: 'stainless' | 'black_granite' | 'white_ceramic' | 'copper';
  sinkType?: 'simple' | 'double';
  applianceBrand?: 'midea' | 'teka' | 'bosch' | 'miele';
  energyEfficiency?: 'A' | 'A_plus' | 'A_triple_plus';
}

export interface MaterialsConfig {
  furniture: 'wood' | 'lacquered_melamine' | 'lacquered_3d';
  furnitureColor: string; // key of the actual selected wood/color
  countertop: 'granite' | 'quartz' | 'laminated' | 'stainless_steel' | 'marble';
  countertopColor: string;
  backsplash: 'ceramic_tile' | 'tempered_glass' | 'stainless_steel' | 'mirror';
  backsplashColor: string;
}

export interface ErgonomicsConfig {
  counterDepth: 60 | 80; // 80cm is DGLA standard with equipped back section
  userHeight: number; // in cm
  calculatedCounterHeight: number; // in cm
  doorType: 'traditional' | 'balanced_lift'; // DGLA balanced lift is highly recommended
  dishwasherColumn: boolean; // DGLA elevated column
  includeIsland: boolean;
}

export interface ProjectState {
  id: string;
  name: string;
  date: string;
  spaceType: SpaceType;
  uploadedImage: string | null;
  dimensions: Dimensions;
  furnitureDimensions: FurnitureDimensions;
  kitchenEquipment: KitchenEquipment;
  currentLayout: LayoutType;
  selectedStyle: StyleType;
  materials: MaterialsConfig;
  newLayout: LayoutType;
  ergonomics: ErgonomicsConfig;
  lightingMode?: 'natural' | 'cold' | 'warm';
}

export interface PresetMaterial {
  id: string;
  name: string;
  hex: string;
  textureType?: string;
}

export interface MaterialCategory {
  id: string;
  name: string;
  options: PresetMaterial[];
}
