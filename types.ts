export interface NodeData {
  id: string;
  name: string;
  layer: "Top" | "Mid" | "Base";
  season: "SP" | "SU" | "AU" | "WI";
  long: number;
  sill: number;
}

export interface Recipe {
  id: number;
  ids: string[];
  rawSelected: NodeData[];
  primarySeason: string;
}

export interface Ingredient {
  name: string;
  pct: string;
  gram: string;
  isAlcohol?: boolean;
}

export interface PerformanceMetrics {
  longevity: string;
  distance: string;
}

export type Season = "SP" | "SU" | "AU" | "WI";
export type SkinType = "DRY" | "OIL" | "COM";
