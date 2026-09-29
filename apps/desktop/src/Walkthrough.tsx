// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { ArrowLeft, ChevronDown, Footprints, House, MapPin, MousePointer2 } from "lucide-react";
import { View3DCanvas } from "@sweethomejs/ui";
import type { Room } from "@sweethomejs/core";
import type { Session } from "./session";
import { findWalkPath, isWalkable, nearestWalkable, planBounds, segmentIsWalkable, type PlanPoint } from "./navigation";

interface WalkthroughProps {
  session: Session;
  onExit(mode: "Planta" | "Mobiliar"): void;
}

function roomCenter(room: Room): PlanPoint {
  const points = room.getPoints();
  return {
    x: (Math.min(...points.map((point) => point[0]!)) + Math.max(...points.map((point) => point[0]!))) / 2,
    y: (Math.min(...points.map((point) => point[1]!)) + Math.max(...points.map((point) => point[1]!))) / 2,
  };
}

export function Walkthrough({ session, onExit }: WalkthroughProps): React.JSX.Element {
  const home = session.home;
  const observer = home.getObserverCamera();
  const [pose, setPose] = useState(() => ({ x: observer.getX(), y: observer.getY(), yaw: observer.getYaw() }));
  const [speed, setSpeed] = useState(1.2);
  const [route, setRoute] = useState<PlanPoint[]>([]);
  const [notice, setNotice] = useState("Clique no mapa para caminhar. Dois cliques mudam de lugar na hora.");
  const [menuOpen, setMenuOpen] = useState(false);
  const mapRef = useRef<SVGSVGElement>(null);
  const routeRef = useRef<PlanPoint[]>([]);
  const keysRef = useRef(new Set<string>());
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const bounds = planBounds(home);

  const cancelRoute = (): void => {
    routeRef.current = [];
    setRoute([]);
  };

  const navigate = (target: PlanPoint, instant: boolean): void => {
    if (!isWalkable(home, target)) {
      setNotice("Escolha um ponto livre dentro da planta.");
      return;
    }
    if (instant) {
      cancelRoute();
      observer.setX(target.x);
      observer.setY(target.y);
      setNotice("Destino alcançado.");
      return;
    }
    const start = { x: observer.getX(), y: observer.getY() };
    const path = findWalkPath(home, start, target);
    if (!path) {
      setNotice("Não há caminho livre até esse ponto.");
      return;
    }
    routeRef.current = path.slice(1);
    setRoute(path);
    setNotice("Caminhando até o destino · WASD interrompe a rota.");
  };

  const mapPoint = (event: MouseEvent<SVGSVGElement>): PlanPoint | null => {
    const svg = mapRef.current;
    const transform = svg?.getScreenCTM();
    if (!svg || !transform) return null;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const mapped = point.matrixTransform(transform.inverse());
    return { x: mapped.x, y: mapped.y };
  };

  const onMapClick = (event: MouseEvent<SVGSVGElement>): void => {
    if (event.detail > 1) return;
    const point = mapPoint(event);
    if (!point) return;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => { navigate(point, false); clickTimer.current = null; }, 220);
  };

  const onMapDoubleClick = (event: MouseEvent<SVGSVGElement>): void => {
    event.preventDefault();
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = null;
    const point = mapPoint(event);
    if (point) navigate(point, true);
  };

  useEffect(() => {
    const syncPose = (): void => setPose({ x: observer.getX(), y: observer.getY(), yaw: observer.getYaw() });
    observer.addPropertyChangeListener(syncPose);
    return () => {
      observer.removePropertyChangeListener(syncPose);
      if (clickTimer.current) clearTimeout(clickTimer.current);
    };
  }, [observer]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") { onExit("Planta"); return; }
      if ((event.target as HTMLElement)?.tagName === "INPUT") return;
      const key = event.key.toLowerCase();
      if (["w", "a", "s", "d"].includes(key)) {
        event.preventDefault();
        if (!keysRef.current.has(key)) cancelRoute();
        keysRef.current.add(key);
      }
    };
    const onKeyUp = (event: KeyboardEvent): void => { keysRef.current.delete(event.key.toLowerCase()); };
    const onBlur = (): void => keysRef.current.clear();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    let last = performance.now();
    let frame = 0;
    const tick = (now: number): void => {
      const seconds = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      let remaining = speed * 100 * seconds;
      if (keysRef.current.size > 0) {
        const keys = keysRef.current;
        const forward = Number(keys.has("w")) - Number(keys.has("s"));
        const sideways = Number(keys.has("d")) - Number(keys.has("a"));
        const yaw = observer.getYaw();
        const dx = Math.sin(yaw) * forward + Math.cos(yaw) * sideways;
        const dy = Math.cos(yaw) * forward - Math.sin(yaw) * sideways;
        const length = Math.hypot(dx, dy);
        if (length > 0) {
          const from = { x: observer.getX(), y: observer.getY() };
          const next = { x: from.x + dx / length * remaining, y: from.y + dy / length * remaining };
          if (segmentIsWalkable(home, from, next)) {
            observer.setX(next.x); observer.setY(next.y);
          } else {
            const slideX = { x: next.x, y: from.y };
            const slideY = { x: from.x, y: next.y };
            if (segmentIsWalkable(home, from, slideX)) observer.setX(slideX.x);
            if (segmentIsWalkable(home, { x: observer.getX(), y: from.y }, slideY)) observer.setY(slideY.y);
          }
        }
      } else if (routeRef.current.length > 0) {
        while (remaining > 0 && routeRef.current.length > 0) {
          const next = routeRef.current[0]!;
          const from = { x: observer.getX(), y: observer.getY() };
          const dx = next.x - from.x;
          const dy = next.y - from.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 0.1) { routeRef.current.shift(); continue; }
          const step = Math.min(remaining, distance);
          const candidate = { x: from.x + dx / distance * step, y: from.y + dy / distance * step };
          if (!segmentIsWalkable(home, from, candidate)) {
            cancelRoute();
            setNotice("A rota foi interrompida por um obstáculo.");
            break;
          }
          observer.setYaw(Math.atan2(dx, dy));
          observer.setX(candidate.x);
          observer.setY(candidate.y);
          remaining -= step;
          if (step >= distance - 0.1) routeRef.current.shift();
        }
        if (routeRef.current.length === 0) setRoute([]);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [home, observer, onExit, speed]);

  const onLookMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current = { x: event.clientX, y: event.clientY };
    observer.setYaw(observer.getYaw() + dx * 0.004);
    observer.setPitch(Math.max(-1.1, Math.min(1.1, observer.getPitch() + dy * 0.003)));
  };

  return <div className="walk-shell" data-testid="walkthrough">
    <div className="walk-scene" onPointerDown={(event) => { if (event.button === 0) { dragRef.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); } }} onPointerMove={onLookMove} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }}>
      <View3DCanvas home={home} preferences={session.preferences} homeController3D={session.controller.getHomeController3D()} style="design" walkthrough />
    </div>
    <div className="walk-top-left"><span className="brand-mark"><House size={18} /></span><strong>CasaFeita</strong></div>
    <div className="walk-mode-wrap"><div className={`mode-pill ${menuOpen ? "open" : ""}`}><button className="mode-current" aria-label="Modo passeio" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Footprints size={17} /><span>Passear</span><ChevronDown size={15} /></button>{menuOpen && <div className="mode-extra"><span className="mode-line" /><button onClick={() => onExit("Planta")}>Planta</button><button onClick={() => onExit("Mobiliar")}>Mobiliar</button></div>}</div></div>
    <button className="walk-back" onClick={() => onExit("Planta")}><ArrowLeft size={17} /> Voltar ao editor</button>
    <div className="walk-crosshair" aria-hidden="true">+</div>
    {home.getRooms().length > 0 && <nav className="walk-room-rail" aria-label="Ir para cômodo"><span>CÔMODOS</span>{home.getRooms().map((room, index) => <button key={room.getId() ?? index} title={room.getName() ?? `Cômodo ${index + 1}`} onClick={() => { const point = nearestWalkable(home, roomCenter(room)); if (point) navigate(point, false); }} onDoubleClick={() => { const point = nearestWalkable(home, roomCenter(room)); if (point) navigate(point, true); }}><MapPin size={16} /><small>{room.getName() ?? `Cômodo ${index + 1}`}</small></button>)}</nav>}
    <div className="walk-minimap"><div className="walk-map-title"><strong>Mapa da planta</strong><span>1 clique: caminhar · 2 cliques: ir agora</span></div>{bounds ? <svg ref={mapRef} data-testid="minimap" role="img" aria-label="Minimapa da planta" viewBox={`${bounds.minX - 45} ${bounds.minY - 45} ${bounds.maxX - bounds.minX + 90} ${bounds.maxY - bounds.minY + 90}`} preserveAspectRatio="xMidYMid meet" onClick={onMapClick} onDoubleClick={onMapDoubleClick}>
      <rect x={bounds.minX - 45} y={bounds.minY - 45} width={bounds.maxX - bounds.minX + 90} height={bounds.maxY - bounds.minY + 90} fill="#f7f7f0" />
      {home.getRooms().map((room, index) => <polygon key={room.getId() ?? index} points={room.getPoints().map((point) => `${point[0]},${point[1]}`).join(" ")} fill={index % 2 === 0 ? "#e2cfb9" : "#eadbc9"} />)}
      {home.getWalls().map((wall, index) => <line key={wall.getId() ?? index} x1={wall.getXStart()} y1={wall.getYStart()} x2={wall.getXEnd()} y2={wall.getYEnd()} stroke="#597366" strokeWidth={wall.getThickness()} strokeLinecap="round" />)}
      {home.getFurniture().filter((piece) => piece.isVisible() && !piece.isDoorOrWindow()).map((piece, index) => <rect key={piece.getId() ?? index} x={piece.getX() - piece.getWidth() / 2} y={piece.getY() - piece.getDepth() / 2} width={piece.getWidth()} height={piece.getDepth()} rx="5" fill="#a6856b" transform={`rotate(${piece.getAngle() * 180 / Math.PI} ${piece.getX()} ${piece.getY()})`} />)}
      {route.length > 1 && <polyline points={route.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke="#267e5e" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="14 9" />}
      <line x1={pose.x} y1={pose.y} x2={pose.x + Math.sin(pose.yaw) * 38} y2={pose.y + Math.cos(pose.yaw) * 38} stroke="#225b45" strokeWidth="9" strokeLinecap="round" />
      <circle cx={pose.x} cy={pose.y} r="16" fill="#fff" stroke="#225b45" strokeWidth="8" />
    </svg> : <p>Desenhe uma planta para usar o mapa.</p>}</div>
    <div className="walk-controls"><div><MousePointer2 size={15} /><span>Arraste para olhar · WASD para andar</span></div><label><Footprints size={15} /><span>Velocidade</span><input type="range" min="0.5" max="2.5" step="0.1" value={speed} aria-label="Velocidade do passeio" onChange={(event) => setSpeed(Number(event.target.value))} /><strong>{speed.toFixed(1)} m/s</strong></label></div>
    <div className="walk-notice" role="status">{notice}</div>
  </div>;
}
