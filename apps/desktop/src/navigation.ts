// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
import type { Home } from "@sweethomejs/core";

export interface PlanPoint { x: number; y: number }
export interface PlanBounds { minX: number; minY: number; maxX: number; maxY: number }

export const WALKER_RADIUS = 18; // cm, clearance from walls and furniture

export function planBounds(home: Home): PlanBounds | null {
  const points: PlanPoint[] = [];
  for (const wall of home.getWalls()) {
    points.push({ x: wall.getXStart(), y: wall.getYStart() }, { x: wall.getXEnd(), y: wall.getYEnd() });
  }
  for (const room of home.getRooms()) {
    for (const [x, y] of room.getPoints()) points.push({ x: x!, y: y! });
  }
  if (points.length === 0) return null;
  return {
    minX: Math.min(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxX: Math.max(...points.map((point) => point.x)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
}

function distanceToSegment(point: PlanPoint, a: PlanPoint, b: PlanPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (a.x + dx * t), point.y - (a.y + dy * t));
}

export function isWalkable(home: Home, point: PlanPoint, radius = WALKER_RADIUS): boolean {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(radius) || radius < 0) return false;
  const bounds = planBounds(home);
  if (!bounds || point.x < bounds.minX || point.x > bounds.maxX || point.y < bounds.minY || point.y > bounds.maxY) return false;
  for (const wall of home.getWalls()) {
    const distance = distanceToSegment(point,
      { x: wall.getXStart(), y: wall.getYStart() },
      { x: wall.getXEnd(), y: wall.getYEnd() });
    if (distance < wall.getThickness() / 2 + radius) return false;
  }
  for (const piece of home.getFurniture()) {
    if (!piece.isVisible() || piece.isDoorOrWindow()) continue;
    const dx = point.x - piece.getX();
    const dy = point.y - piece.getY();
    const cos = Math.cos(piece.getAngle());
    const sin = Math.sin(piece.getAngle());
    const localX = dx * cos + dy * sin;
    const localY = -dx * sin + dy * cos;
    if (Math.abs(localX) < piece.getWidth() / 2 + radius && Math.abs(localY) < piece.getDepth() / 2 + radius) return false;
  }
  return true;
}

export function segmentIsWalkable(home: Home, from: PlanPoint, to: PlanPoint): boolean {
  if (![from.x, from.y, to.x, to.y].every(Number.isFinite)) return false;
  const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 9));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (!isWalkable(home, { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t })) return false;
  }
  return true;
}

export function nearestWalkable(home: Home, target: PlanPoint): PlanPoint | null {
  if (isWalkable(home, target)) return target;
  for (let radius = 20; radius <= 180; radius += 20) {
    for (let index = 0; index < 24; index++) {
      const angle = index * Math.PI / 12;
      const candidate = { x: target.x + Math.cos(angle) * radius, y: target.y + Math.sin(angle) * radius };
      if (isWalkable(home, candidate)) return candidate;
    }
  }
  return null;
}

interface HeapItem { index: number; score: number }

class MinHeap {
  private readonly items: HeapItem[] = [];

  get size(): number { return this.items.length; }

  push(item: HeapItem): void {
    const items = this.items;
    items.push(item);
    let index = items.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (items[parent]!.score <= item.score) break;
      items[index] = items[parent]!;
      index = parent;
    }
    items[index] = item;
  }

  pop(): HeapItem | undefined {
    const items = this.items;
    const first = items[0];
    const last = items.pop();
    if (items.length === 0 || !last) return first;
    let index = 0;
    while (index * 2 + 1 < items.length) {
      let child = index * 2 + 1;
      if (child + 1 < items.length && items[child + 1]!.score < items[child]!.score) child++;
      if (items[child]!.score >= last.score) break;
      items[index] = items[child]!;
      index = child;
    }
    items[index] = last;
    return first;
  }
}

/** Finds a collision-free route in centimeters, or null for unreachable points. */
export function findWalkPath(home: Home, start: PlanPoint, target: PlanPoint): PlanPoint[] | null {
  const bounds = planBounds(home);
  if (!bounds || !isWalkable(home, start) || !isWalkable(home, target)) return null;
  if (segmentIsWalkable(home, start, target)) return [start, target];

  const step = Math.max(20, Math.ceil(Math.sqrt((bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY) / 50000)));
  const minX = bounds.minX - step;
  const minY = bounds.minY - step;
  const columns = Math.ceil((bounds.maxX - bounds.minX) / step) + 3;
  const rows = Math.ceil((bounds.maxY - bounds.minY) / step) + 3;
  const total = columns * rows;
  const pointOf = (index: number): PlanPoint => ({ x: minX + (index % columns) * step, y: minY + Math.floor(index / columns) * step });
  const indexOf = (x: number, y: number): number => y * columns + x;
  const cellX = (x: number): number => Math.round((x - minX) / step);
  const cellY = (y: number): number => Math.round((y - minY) / step);
  const nearestCell = (point: PlanPoint): number | null => {
    const baseX = cellX(point.x);
    const baseY = cellY(point.y);
    let best: number | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let ring = 0; ring <= 3; ring++) {
      for (let dy = -ring; dy <= ring; dy++) for (let dx = -ring; dx <= ring; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
        const x = baseX + dx;
        const y = baseY + dy;
        if (x < 0 || y < 0 || x >= columns || y >= rows) continue;
        const candidate = pointOf(indexOf(x, y));
        const distance = Math.hypot(candidate.x - point.x, candidate.y - point.y);
        if (distance < bestDistance && segmentIsWalkable(home, point, candidate)) {
          best = indexOf(x, y);
          bestDistance = distance;
        }
      }
      if (best !== null) return best;
    }
    return null;
  };
  const source = nearestCell(start);
  const goal = nearestCell(target);
  if (source === null || goal === null) return null;

  const costs = new Float64Array(total);
  costs.fill(Number.POSITIVE_INFINITY);
  const previous = new Int32Array(total);
  previous.fill(-1);
  const closed = new Uint8Array(total);
  const walkable = new Int8Array(total);
  const open = new MinHeap();
  costs[source] = 0;
  open.push({ index: source, score: Math.hypot(pointOf(source).x - target.x, pointOf(source).y - target.y) });
  const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

  while (open.size > 0) {
    const current = open.pop()!.index;
    if (closed[current]) continue;
    if (current === goal) {
      const raw: PlanPoint[] = [target];
      for (let index = goal; index !== -1; index = previous[index]!) raw.push(pointOf(index));
      raw.push(start);
      raw.reverse();
      const simplified: PlanPoint[] = [raw[0]!];
      for (let anchor = 0; anchor < raw.length - 1;) {
        let next = raw.length - 1;
        while (next > anchor + 1 && !segmentIsWalkable(home, raw[anchor]!, raw[next]!)) next--;
        simplified.push(raw[next]!);
        anchor = next;
      }
      return simplified;
    }
    closed[current] = 1;
    const x = current % columns;
    const y = Math.floor(current / columns);
    const from = pointOf(current);
    for (const [dx, dy] of neighbors) {
      const nx = x + dx!;
      const ny = y + dy!;
      if (nx < 0 || ny < 0 || nx >= columns || ny >= rows) continue;
      const next = indexOf(nx, ny);
      if (closed[next]) continue;
      const to = pointOf(next);
      if (walkable[next] === 0) walkable[next] = isWalkable(home, to) ? 1 : -1;
      if (walkable[next]! < 0 || !segmentIsWalkable(home, from, to)) continue;
      const cost = costs[current]! + Math.hypot(dx! * step, dy! * step);
      if (cost >= costs[next]!) continue;
      costs[next] = cost;
      previous[next] = current;
      open.push({ index: next, score: cost + Math.hypot(to.x - target.x, to.y - target.y) });
    }
  }
  return null;
}
