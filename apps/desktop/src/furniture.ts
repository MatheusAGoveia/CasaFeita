// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
// Meshes and thumbnails: Kenney Furniture Kit, CC0. See public/models/kenney/License.txt.
import {
  CatalogPieceOfFurniture,
  HomeMaterial,
  HomePieceOfFurniture,
  type Content,
} from "@sweethomejs/core";

export type FurnitureCategory = "Sala" | "Quarto" | "Cozinha" | "Banheiro" | "Decoração";

export interface FurnitureDefinition {
  id: string;
  name: string;
  category: FurnitureCategory;
  model: string;
  width: number;
  depth: number;
  height: number;
}

// Dimensions in centimeters; users can change them after placing a piece.
export const furnitureCatalog: FurnitureDefinition[] = [
  { id: "sofa", name: "Sofá", category: "Sala", model: "loungeSofa", width: 200, depth: 88, height: 86 },
  { id: "poltrona", name: "Poltrona", category: "Sala", model: "loungeDesignChair", width: 82, depth: 84, height: 84 },
  { id: "mesa-centro", name: "Mesa de centro", category: "Sala", model: "tableCoffee", width: 110, depth: 62, height: 42 },
  { id: "rack", name: "Rack de TV", category: "Sala", model: "cabinetTelevision", width: 180, depth: 45, height: 62 },
  { id: "cama-casal", name: "Cama de casal", category: "Quarto", model: "bedDouble", width: 190, depth: 210, height: 68 },
  { id: "cama-solteiro", name: "Cama de solteiro", category: "Quarto", model: "bedSingle", width: 100, depth: 200, height: 68 },
  { id: "criado-mudo", name: "Mesa de cabeceira", category: "Quarto", model: "cabinetBed", width: 50, depth: 43, height: 52 },
  { id: "estante", name: "Estante", category: "Quarto", model: "bookcaseOpen", width: 90, depth: 35, height: 185 },
  { id: "mesa", name: "Mesa de jantar", category: "Cozinha", model: "table", width: 160, depth: 85, height: 76 },
  { id: "cadeira", name: "Cadeira", category: "Cozinha", model: "chair", width: 48, depth: 51, height: 86 },
  { id: "geladeira", name: "Geladeira", category: "Cozinha", model: "kitchenFridge", width: 70, depth: 70, height: 190 },
  { id: "fogao", name: "Fogão", category: "Cozinha", model: "kitchenStove", width: 60, depth: 60, height: 90 },
  { id: "pia", name: "Pia", category: "Banheiro", model: "bathroomSink", width: 65, depth: 48, height: 82 },
  { id: "vaso", name: "Vaso sanitário", category: "Banheiro", model: "toilet", width: 42, depth: 70, height: 78 },
  { id: "banheira", name: "Banheira", category: "Banheiro", model: "bathtub", width: 170, depth: 78, height: 54 },
  { id: "planta", name: "Planta em vaso", category: "Decoração", model: "pottedPlant", width: 55, depth: 55, height: 120 },
];

export const furnitureCategories: FurnitureCategory[] = ["Sala", "Quarto", "Cozinha", "Banheiro", "Decoração"];

// Material names are preserved by OBJLoader and saved as HomeMaterial in .sh3d.
// These muted colors keep the models readable alongside the CasaFeita palette.
const materialColors: Record<string, number> = {
  carpet: 0xc58374,
  carpetBlue: 0x7798a5,
  carpetWhite: 0xeeeae2,
  wood: 0xc69f79,
  woodDark: 0x86664e,
  metal: 0xb8c3c2,
  metalLight: 0xe5eae5,
  metalDark: 0x596663,
  glass: 0xb4cec6,
  plant: 0x5a9c77,
  _defaultMat: 0xf4f3ed,
};

export const furnitureFinishes = [
  { id: "original", name: "Original", swatch: "#c69f79", colors: { wood: 0xc69f79, woodDark: 0x86664e, carpet: 0xc58374, carpetBlue: 0x7798a5 } },
  { id: "areia", name: "Areia", swatch: "#d8c8ac", colors: { wood: 0xd8c8ac, woodDark: 0xab9476, carpet: 0xd6beaa, carpetBlue: 0xb4c4bc } },
  { id: "grafite", name: "Grafite", swatch: "#626b68", colors: { wood: 0x74716c, woodDark: 0x4e504d, carpet: 0x696d6b, carpetBlue: 0x61747a } },
  { id: "verde", name: "Verde", swatch: "#718e72", colors: { wood: 0xa48364, woodDark: 0x6f5844, carpet: 0x718e72, carpetBlue: 0x5d8380 } },
] as const;

export type FurnitureFinish = (typeof furnitureFinishes)[number]["id"];
const finishableIds = new Set(["sofa", "poltrona", "mesa-centro", "rack", "cama-casal", "cama-solteiro", "criado-mudo", "estante", "mesa", "cadeira"]);

export function canChangeFurnitureFinish(piece: HomePieceOfFurniture): boolean {
  const id = piece.getCatalogId();
  return id !== null && id.startsWith("casafeita-") && finishableIds.has(id.slice("casafeita-".length));
}

export function getFurnitureFinish(piece: HomePieceOfFurniture): FurnitureFinish {
  const saved = piece.getProperty("casafeita.finish");
  return furnitureFinishes.find((finish) => finish.id === saved)?.id ?? "original";
}

export function setFurnitureFinish(piece: HomePieceOfFurniture, finishId: FurnitureFinish): void {
  if (!canChangeFurnitureFinish(piece)) return;
  const finish = furnitureFinishes.find((item) => item.id === finishId);
  if (!finish) return;
  const existing = piece.getModelMaterials() ?? [];
  piece.setModelMaterials(existing.map((material) => {
    const color = finish.colors[material.getName() as keyof typeof finish.colors] ?? material.getColor();
    return new HomeMaterial(material.getName(), material.getKey(), color, material.getTexture(), material.getShininess());
  }));
  piece.setProperty("casafeita.finish", finish.id);
}

class BundledModelContent implements Content {
  constructor(private readonly model: string) {}

  getURL(): string {
    return new URL(`models/kenney/${this.model}.obj`, document.baseURI).href;
  }

  async openStream(): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(this.getURL());
    if (!response.ok) throw new Error(`Modelo não encontrado: ${this.model}`);
    return response.body ?? new Blob([await response.arrayBuffer()]).stream();
  }
}

export function furnitureThumbnail(item: FurnitureDefinition): string {
  return new URL(`models/kenney/${item.model}.png`, document.baseURI).href;
}

export function makeFurniture(item: FurnitureDefinition): HomePieceOfFurniture {
  const catalogPiece = new CatalogPieceOfFurniture(
    `casafeita-${item.id}`, item.name, null, null, "CC0", null, null, null,
    null, null, new BundledModelContent(item.model),
    item.width, item.depth, item.height, 0, 1, true, null, null, 0, null,
    "Kenney", true, true, true, true, null, null, null,
  );
  const piece = new HomePieceOfFurniture(catalogPiece);
  piece.setModelMaterials(Object.entries(materialColors).map(([name, color]) => new HomeMaterial(name, color, null, null)));
  return piece;
}
