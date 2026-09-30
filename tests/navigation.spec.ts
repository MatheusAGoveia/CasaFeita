// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
import { expect, test } from "@playwright/test";
import { Home, Wall } from "@sweethomejs/core";
import { furnitureCatalog, makeFurniture } from "../apps/desktop/src/furniture";
import { findWalkPath, isWalkable, nearestWalkable, segmentIsWalkable } from "../apps/desktop/src/navigation";

function homeWithDoorway(): Home {
  const home = new Home();
  const add = (x1: number, y1: number, x2: number, y2: number) => home.addWall(new Wall(x1, y1, x2, y2, 18, 265));
  add(0, 0, 860, 0);
  add(860, 0, 860, 560);
  add(860, 560, 0, 560);
  add(0, 560, 0, 0);
  add(360, 0, 360, 240);
  add(360, 330, 360, 560);
  return home;
}

test("encontra o vão da porta e mantém toda a rota fora das paredes", () => {
  const home = homeWithDoorway();
  const route = findWalkPath(home, { x: 180, y: 100 }, { x: 630, y: 100 });
  expect(route).not.toBeNull();
  expect(route!.length).toBeGreaterThan(2);
  for (let index = 1; index < route!.length; index++) {
    expect(segmentIsWalkable(home, route![index - 1]!, route![index]!)).toBe(true);
  }
  expect(isWalkable(home, { x: 360, y: 100 })).toBe(false);
  expect(isWalkable(home, { x: 360, y: 285 })).toBe(true);
});

test("desvia de móveis e recusa destino sobre um obstáculo", () => {
  const home = homeWithDoorway();
  const sofa = makeFurniture(furnitureCatalog[0]!);
  sofa.setX(180);
  sofa.setY(280);
  home.addPieceOfFurniture(sofa);
  expect(findWalkPath(home, { x: 90, y: 100 }, { x: 180, y: 280 })).toBeNull();
  expect(nearestWalkable(home, { x: 180, y: 280 })).not.toBeNull();
  const route = findWalkPath(home, { x: 90, y: 100 }, { x: 630, y: 460 });
  expect(route).not.toBeNull();
  for (let index = 1; index < route!.length; index++) {
    expect(segmentIsWalkable(home, route![index - 1]!, route![index]!)).toBe(true);
  }
});

test("coordenadas inválidas nunca são caminháveis", () => {
  const home = homeWithDoorway();
  expect(isWalkable(home, { x: NaN, y: 100 })).toBe(false);
  expect(isWalkable(home, { x: 100, y: 100 }, -1)).toBe(false);
  expect(segmentIsWalkable(home, { x: 100, y: 100 }, { x: Infinity, y: 100 })).toBe(false);
  expect(findWalkPath(home, { x: 100, y: 100 }, { x: NaN, y: 100 })).toBeNull();
});
