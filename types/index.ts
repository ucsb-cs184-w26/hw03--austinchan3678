export interface FurnitureItem {
  id: string;
  key: string; 
  label: string;
  category: string;
  color: string;
  w: number;
  h: number;
  x: number;
  y: number;
  rotation: number;
}

export interface Room {
  '@attributes': { id: string };
  position: {
    '@attributes': { x: string; y: string; width: string; height: string };
  };
  adjacentTo: string | string[];
}

export interface Door {
  x: number;
  y: number;
}