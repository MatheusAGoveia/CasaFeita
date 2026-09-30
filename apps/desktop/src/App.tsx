// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Box,
  ChevronDown,
  DoorOpen,
  DraftingCompass,
  FolderOpen,
  Hand,
  House,
  Maximize2,
  Minimize2,
  MousePointer2,
  Plus,
  Redo2,
  Ruler,
  Save,
  Shapes,
  Undo2,
} from "lucide-react";
import {
  Home,
  HomeFileRecorder,
  HomePieceOfFurniture,
  PlanController,
  Room,
  RoomController,
  Wall,
  WallController,
} from "@sweethomejs/core";
import { PlanCanvas, RoomDialog, View3DCanvas, WallDialog } from "@sweethomejs/ui";
import "@sweethomejs/ui/theme.css";
import { createSession, createStarterHome, type Session } from "./session";
import { canChangeFurnitureFinish, furnitureCatalog, furnitureCategories, furnitureFinishes, furnitureThumbnail, getFurnitureFinish, makeFurniture, setFurnitureFinish, type FurnitureCategory, type FurnitureDefinition } from "./furniture";
import { nearestWalkable, planBounds } from "./navigation";
import { Walkthrough } from "./Walkthrough";
import { ProjectLibrary } from "./ProjectLibrary";

type Dialog = { kind: "wall"; controller: WallController } | { kind: "room"; controller: RoomController } | null;

const tools = [
  { label: "Selecionar", mode: PlanController.Mode.SELECTION, icon: MousePointer2, shortcut: "V" },
  { label: "Paredes", mode: PlanController.Mode.WALL_CREATION, icon: DoorOpen, shortcut: "P" },
  { label: "Cômodos", mode: PlanController.Mode.ROOM_CREATION, icon: Shapes, shortcut: "C" },
  { label: "Medidas", mode: PlanController.Mode.DIMENSION_LINE_CREATION, icon: Ruler, shortcut: "M" },
  { label: "Mover tela", mode: PlanController.Mode.PANNING, icon: Hand, shortcut: "H" },
] as const;

export function App(): React.JSX.Element {
  const [session, setSession] = useState<Session>(() => createSession(createStarterHome()));
  const [sessionEpoch, setSessionEpoch] = useState(0);
  const [mode, setMode] = useState(session.controller.getPlanController().getMode().toString());
  const [selected, setSelected] = useState(() => session.home.getSelectedItems());
  const [counts, setCounts] = useState(() => ({ rooms: session.home.getRooms().length, walls: session.home.getWalls().length, furniture: session.home.getFurniture().length }));
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [threeExpanded, setThreeExpanded] = useState(false);
  const [walkthrough, setWalkthrough] = useState(false);
  const [pillOpen, setPillOpen] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<"Planta" | "Mobiliar">("Planta");
  const [furnitureCategory, setFurnitureCategory] = useState<"Todos" | FurnitureCategory>("Todos");
  const [furnitureSearch, setFurnitureSearch] = useState("");
  const [, setFurnitureRevision] = useState(0);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [notice, setNotice] = useState("");
  const [libraryMode, setLibraryMode] = useState<"browse" | "save" | null>(null);
  const [libraryProjects, setLibraryProjects] = useState<ManagedProject[]>([]);
  const [libraryId, setLibraryId] = useState<string | null>(null);
  const [libraryBusy, setLibraryBusy] = useState(false);
  const saveInProgress = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    const { home, preferences, controller } = session;
    const plan = controller.getPlanController();
    const syncCounts = (): void => setCounts({ rooms: home.getRooms().length, walls: home.getWalls().length, furniture: home.getFurniture().length });
    const syncSelection = (): void => setSelected(home.getSelectedItems());
    const syncUndo = (): void => {
      setCanUndo(controller.isUndoEnabled());
      setCanRedo(controller.isRedoEnabled());
    };
    const modeListener = {
      propertyChange(event: { newValue?: unknown }): void {
        setMode(event.newValue?.toString() ?? plan.getMode().toString());
      },
    };
    const collectionListener = { collectionChanged: syncCounts };
    home.addWallsListener(collectionListener);
    home.addRoomsListener(collectionListener);
    home.addFurnitureListener(collectionListener);
    home.addSelectionListener(syncSelection);
    controller.addUndoStateListener(syncUndo);
    plan.addPropertyChangeListener(PlanController.Property.MODE, modeListener);
    plan.setModifyItemCallback(() => {
      const current = home.getSelectedItems();
      if (current.length !== 1) return;
      if (current[0] instanceof Wall) {
        setDialog({ kind: "wall", controller: new WallController(home, preferences, {} as never, null) });
      } else if (current[0] instanceof Room) {
        setDialog({ kind: "room", controller: new RoomController(home, preferences, {} as never, null) });
      }
    });
    syncCounts();
    syncSelection();
    syncUndo();
    setMode(plan.getMode().toString());
    return () => {
      home.removeWallsListener(collectionListener);
      home.removeRoomsListener(collectionListener);
      home.removeFurnitureListener(collectionListener);
      home.removeSelectionListener(syncSelection);
      controller.removeUndoStateListener(syncUndo);
      plan.removePropertyChangeListener(PlanController.Property.MODE, modeListener);
    };
  }, [session]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (walkthrough) return;
      if (libraryMode || dialog) {
        if (event.key === "Escape") {
          if (!libraryBusy) setLibraryMode(null);
          setDialog(null);
        }
        return;
      }
      const active = document.activeElement;
      const editing = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveProject();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "o") {
        event.preventDefault();
        void showLibrary("browse");
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) sessionRef.current.controller.redo();
        else sessionRef.current.controller.undo();
      } else if (!editing && event.key === "Escape") {
        sessionRef.current.controller.getPlanController().setMode(PlanController.Mode.SELECTION);
      } else if (!editing && !event.altKey && !event.ctrlKey && !event.metaKey) {
        const tool = tools.find((item) => item.shortcut.toLowerCase() === event.key.toLowerCase());
        if (tool) sessionRef.current.controller.getPlanController().setMode(tool.mode);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const replaceHome = (home: Home, projectId: string | null = null): void => {
    setDialog(null);
    setThreeExpanded(false);
    setWalkthrough(false);
    setWorkspaceMode("Planta");
    setLibraryMode(null);
    setLibraryId(projectId);
    setSession(createSession(home));
    setSessionEpoch((epoch) => epoch + 1);
  };

  const newProject = (): void => {
    if (saveInProgress.current) return;
    if (session.home.isModified() && !window.confirm("Criar outro projeto? Salve as alterações antes de continuar.")) return;
    const home = new Home();
    home.setName("Novo projeto");
    home.getEnvironment().setGroundColor(0xd7ded6);
    home.setModified(false);
    replaceHome(home);
    setNotice("Projeto em branco criado");
  };

  const loadBytes = async (bytes: Uint8Array, projectId: string | null = null): Promise<void> => {
    try {
      const result = await new HomeFileRecorder().readHomeFromZip(bytes);
      replaceHome(result.home, projectId);
      setNotice("Projeto aberto");
    } catch (error) {
      setNotice(`Não foi possível abrir o projeto: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const openFile = async (): Promise<void> => {
    if (saveInProgress.current) return;
    if (window.casaDesktop) {
      try {
        const file = await window.casaDesktop.openFile();
        if (file) {
          if (sessionRef.current.home.isModified() && !window.confirm("Abrir outro projeto? Salve as alterações antes de continuar.")) return;
          await loadBytes(file.bytes);
        }
      } catch (error) {
        setNotice(`Não foi possível abrir o projeto: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      fileInput.current?.click();
    }
  };

  const showLibrary = async (mode: "browse" | "save"): Promise<void> => {
    if (saveInProgress.current) return;
    if (!window.casaDesktop) {
      if (mode === "browse") fileInput.current?.click();
      else void exportProject();
      return;
    }
    try {
      setLibraryProjects(await window.casaDesktop.listProjects());
      setLibraryMode(mode);
    } catch (error) {
      setNotice(`Não foi possível abrir a biblioteca: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const saveManaged = async (targetId: string | null, name: string): Promise<void> => {
    if (!window.casaDesktop || saveInProgress.current) return;
    saveInProgress.current = true;
    const home = sessionRef.current.home;
    const previousName = home.getName();
    setLibraryBusy(true);
    try {
      home.setName(name.trim());
      const bytes = await new HomeFileRecorder().writeHome(home);
      const saved = await window.casaDesktop.saveProject(targetId, name.trim(), bytes);
      setLibraryId(saved.id);
      home.setModified(false);
      setLibraryMode(null);
      setNotice("Projeto salvo na biblioteca local");
    } catch (error) {
      home.setName(previousName);
      setNotice(`Não foi possível salvar: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLibraryBusy(false);
      saveInProgress.current = false;
    }
  };

  const saveProject = async (): Promise<void> => {
    if (saveInProgress.current) return;
    if (libraryId) await saveManaged(libraryId, sessionRef.current.home.getName() || "Projeto sem título");
    else await showLibrary("save");
  };

  const exportProject = async (): Promise<void> => {
    try {
      const home = sessionRef.current.home;
      const bytes = await new HomeFileRecorder().writeHome(home);
      const name = `${home.getName() || "CasaFeita"}.sh3d`;
      if (window.casaDesktop) {
        if (!await window.casaDesktop.exportFile(name, bytes)) return;
      } else {
        const url = URL.createObjectURL(new Blob([Uint8Array.from(bytes)], { type: "application/octet-stream" }));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = name;
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setNotice("Cópia .sh3d exportada");
    } catch (error) {
      setNotice(`Não foi possível exportar: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const openManaged = async (id: string): Promise<void> => {
    if (!window.casaDesktop || saveInProgress.current) return;
    if (sessionRef.current.home.isModified() && !window.confirm("Abrir outro projeto? Salve as alterações antes de continuar.")) return;
    setLibraryBusy(true);
    try {
      const project = await window.casaDesktop.openProject(id);
      await loadBytes(project.bytes, project.id);
    } catch (error) {
      setNotice(`Não foi possível abrir o projeto: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLibraryBusy(false);
    }
  };

  const deleteManaged = async (id: string): Promise<void> => {
    if (!window.casaDesktop || saveInProgress.current) return;
    if (!window.confirm("Excluir este projeto da biblioteca local? Exporte uma cópia antes, se desejar guardá-lo.")) return;
    setLibraryBusy(true);
    try {
      const deleted = await window.casaDesktop.deleteProject(id);
      setLibraryProjects(await window.casaDesktop.listProjects());
      if (libraryId === id) setLibraryId(null);
      setNotice(deleted ? "Projeto excluído da biblioteca" : "Projeto já não estava na biblioteca");
    } catch (error) {
      setNotice(`Não foi possível excluir: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLibraryBusy(false);
    }
  };

  const enterWalkthrough = (): void => {
    const home = session.home;
    const bounds = planBounds(home);
    if (!bounds) {
      setNotice("Desenhe uma planta antes de iniciar o passeio.");
      return;
    }
    const firstRoom = home.getRooms()[0];
    const center = firstRoom ? {
      x: (Math.min(...firstRoom.getPoints().map((point) => point[0]!)) + Math.max(...firstRoom.getPoints().map((point) => point[0]!))) / 2,
      y: (Math.min(...firstRoom.getPoints().map((point) => point[1]!)) + Math.max(...firstRoom.getPoints().map((point) => point[1]!))) / 2,
    } : { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
    const start = nearestWalkable(home, center);
    if (!start) {
      setNotice("Não há espaço livre para começar o passeio.");
      return;
    }
    const camera = home.getObserverCamera();
    camera.setX(start.x);
    camera.setY(start.y);
    camera.setZ(160);
    camera.setYaw(Math.PI / 2);
    camera.setPitch(0.12);
    camera.setFieldOfView(Math.PI * 72 / 180);
    session.controller.getHomeController3D().viewFromObserver();
    setPillOpen(false);
    setThreeExpanded(false);
    setWalkthrough(true);
  };

  const selectedItem = selected.length === 1 ? selected[0] : null;
  const selectedLabel = selectedItem instanceof Wall ? "Parede selecionada" : selectedItem instanceof Room ? "Cômodo selecionado" : null;
  const selectedFurniture = selectedItem instanceof HomePieceOfFurniture ? selectedItem : null;
  const visibleFurniture = furnitureCatalog.filter((item) =>
    (furnitureCategory === "Todos" || item.category === furnitureCategory) &&
    item.name.toLocaleLowerCase("pt-BR").includes(furnitureSearch.toLocaleLowerCase("pt-BR")),
  );

  const addFurniture = (item: FurnitureDefinition): void => {
    const piece = makeFurniture(item);
    const target = selectedItem instanceof Room ? selectedItem : session.home.getRooms()[0];
    if (target) {
      const points = target.getPoints();
      const centerX = (Math.min(...points.map((p) => p[0]!)) + Math.max(...points.map((p) => p[0]!))) / 2;
      const centerY = (Math.min(...points.map((p) => p[1]!)) + Math.max(...points.map((p) => p[1]!))) / 2;
      const offset = (session.home.getFurniture().length % 3 - 1) * 45;
      piece.setX(centerX + offset);
      piece.setY(centerY + offset);
    } else {
      piece.setX(200);
      piece.setY(200);
    }
    session.controller.getPlanController().setMode(PlanController.Mode.SELECTION);
    session.controller.getFurnitureController().addFurniture([piece]);
    setNotice(`${item.name} adicionado. Arraste na planta para posicionar.`);
  };

  const setFurnitureSize = (piece: HomePieceOfFurniture, dimension: "width" | "depth" | "height", value: string): void => {
    const centimeters = Number(value);
    if (!Number.isFinite(centimeters) || centimeters < 10 || centimeters > 1500) return;
    if (dimension === "width") piece.setWidth(centimeters);
    if (dimension === "depth") piece.setDepth(centimeters);
    if (dimension === "height") piece.setHeight(centimeters);
    session.home.setModified(true);
    setFurnitureRevision((revision) => revision + 1);
  };

  const duplicateFurniture = (piece: HomePieceOfFurniture): void => {
    const copy = piece.duplicate();
    copy.setX(piece.getX() + Math.max(35, piece.getWidth() / 3));
    copy.setY(piece.getY() + Math.max(35, piece.getDepth() / 3));
    session.controller.getFurnitureController().addFurniture([copy]);
    setNotice(`${piece.getName()} duplicado. Arraste a cópia para posicionar.`);
  };

  const furnitureInspector = selectedFurniture && <div className="furniture-inspector">
    <span className="section-eyebrow">MÓVEL SELECIONADO</span>
    <strong>{selectedFurniture.getName()}</strong>
    <p>Medidas em centímetros</p>
    <div className="furniture-measures">
      {([ ["width", "Largura", selectedFurniture.getWidth()], ["depth", "Profundidade", selectedFurniture.getDepth()], ["height", "Altura", selectedFurniture.getHeight()] ] as const).map(([dimension, label, value]) =>
        <label key={dimension}>{label}<input type="number" min="10" max="1500" step="1" aria-label={label} value={Math.round(value)} onChange={(event) => setFurnitureSize(selectedFurniture, dimension, event.target.value)} /></label>,
      )}
    </div>
    {canChangeFurnitureFinish(selectedFurniture) && <div className="furniture-finishes"><span>Acabamento</span><div>{furnitureFinishes.map((finish) => <button key={finish.id} title={finish.name} aria-label={finish.name} aria-pressed={getFurnitureFinish(selectedFurniture) === finish.id} onClick={() => { setFurnitureFinish(selectedFurniture, finish.id); session.home.setModified(true); setFurnitureRevision((revision) => revision + 1); }}><i style={{ backgroundColor: finish.swatch }} /></button>)}</div></div>}
    <div className="furniture-actions"><button onClick={() => { selectedFurniture.setAngle(selectedFurniture.getAngle() + Math.PI / 4); session.home.setModified(true); setFurnitureRevision((revision) => revision + 1); }}>Girar 45°</button><button onClick={() => duplicateFurniture(selectedFurniture)}>Duplicar</button><button onClick={() => session.controller.getFurnitureController().deleteSelection()}>Excluir</button></div>
  </div>;

  if (walkthrough) return <Walkthrough session={session} onExit={(targetMode) => { setWorkspaceMode(targetMode); setWalkthrough(false); }} />;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <span className="brand-mark"><House size={19} strokeWidth={2.2} /></span>
          <div className="brand-text"><strong>CasaFeita</strong><span>Seu espaço, do seu jeito</span></div>
          <span className="brand-divider" />
          <div className="project-identity"><span>PROJETO ATUAL</span><strong>{session.home.getName() || "Sem título"}</strong></div>
        </div>

        <div className="mode-wrap">
          <div className={`mode-pill ${pillOpen ? "open" : ""}`}>
            <button className="mode-current" onClick={() => setPillOpen(!pillOpen)} aria-expanded={pillOpen} aria-label="Alternar modo">
              <DraftingCompass size={17} /><span>{workspaceMode}</span><ChevronDown size={15} className={pillOpen ? "turned" : ""} />
            </button>
            {pillOpen && <div className="mode-extra">
              <span className="mode-line" />
              {workspaceMode !== "Planta" && <button onClick={() => { setPillOpen(false); setWorkspaceMode("Planta"); }}><DraftingCompass size={17} /><span>Planta</span></button>}
              <button onClick={() => { setPillOpen(false); setThreeExpanded(true); }}><Box size={17} /><span>Visualizar 3D</span></button>
              <button onClick={enterWalkthrough}><span className="mode-symbol">↗</span><span>Passear</span></button>
              {workspaceMode !== "Mobiliar" && <button onClick={() => { setPillOpen(false); setThreeExpanded(false); setWorkspaceMode("Mobiliar"); }}><Shapes size={16} /><span>Mobiliar</span></button>}
            </div>}
          </div>
        </div>

        <div className="header-actions">
          <button className="header-icon" title="Novo projeto" aria-label="Novo projeto" disabled={libraryBusy} onClick={newProject}><Plus size={19} /></button>
          <button className="header-icon" title="Meus projetos" aria-label="Meus projetos" disabled={libraryBusy} onClick={() => void showLibrary("browse")}><FolderOpen size={19} /></button>
          <button className="save-button" disabled={libraryBusy} onClick={() => void saveProject()}><Save size={17} /><span>Salvar</span></button>
        </div>
      </header>

      <main className="workspace">
        <aside className="tool-rail" aria-label="Ferramentas da planta">
          <span className="rail-kicker">DESENHAR</span>
          {tools.map(({ label, mode: toolMode, icon: Icon, shortcut }) => (
            <button key={label} className={`tool-button ${mode === toolMode.toString() ? "active" : ""}`} title={`${label} (${shortcut})`} aria-label={label} aria-pressed={mode === toolMode.toString()} onClick={() => session.controller.getPlanController().setMode(toolMode)}>
              <Icon size={21} strokeWidth={1.8} />
            </button>
          ))}
          <div className="rail-spacer" />
          <button className="tool-button" title="Desfazer (Ctrl+Z)" aria-label="Desfazer" disabled={!canUndo} onClick={() => session.controller.undo()}><Undo2 size={20} /></button>
          <button className="tool-button" title="Refazer (Ctrl+Shift+Z)" aria-label="Refazer" disabled={!canRedo} onClick={() => session.controller.redo()}><Redo2 size={20} /></button>
        </aside>

        <section className="plan-panel" aria-label="Planta editável">
          <div className="canvas-heading"><span className="section-eyebrow">EDITOR DE PLANTA</span><strong>Desenhe sua casa</strong><span>Arraste para ajustar · Clique duas vezes para concluir</span></div>
          <div className="plan-canvas" data-testid="plan-surface">
            <PlanCanvas key={sessionEpoch} home={session.home} preferences={session.preferences} controller={session.controller.getPlanController()} />
            {counts.walls === 0 && <div className="empty-tip"><span className="empty-icon"><DraftingCompass size={24} /></span><strong>Comece pela planta</strong><p>Desenhe as paredes para ver seu espaço ganhar forma.</p><button onClick={() => session.controller.getPlanController().setMode(PlanController.Mode.WALL_CREATION)}>Desenhar paredes <ArrowUpRight size={16} /></button></div>}
          </div>
          <div className="canvas-footer"><span className="grid-dot" />Escala em centímetros <span className="footer-sep">·</span> {counts.walls} paredes <span className="footer-sep">·</span> {counts.rooms} cômodos <span className="footer-sep">·</span> {counts.furniture} {counts.furniture === 1 ? "móvel" : "móveis"} <span className="footer-push" /> Ferramenta: {tools.find((item) => item.mode.toString() === mode)?.label ?? "Selecionar"}</div>
        </section>

        <aside className={`side-panel ${threeExpanded ? "expanded" : ""} ${workspaceMode === "Mobiliar" ? "furnishing" : ""}`}>
          <div className="side-heading"><div><span className="section-eyebrow">VISUALIZAÇÃO</span><strong>Seu projeto em 3D</strong></div><button className="expand-button" title={threeExpanded ? "Reduzir 3D" : "Ampliar 3D"} aria-label={threeExpanded ? "Reduzir 3D" : "Ampliar 3D"} onClick={() => setThreeExpanded(!threeExpanded)}>{threeExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button></div>
          <div className="three-view" data-testid="three-view"><View3DCanvas home={session.home} preferences={session.preferences} homeController3D={session.controller.getHomeController3D()} style="design" /><div className="three-label"><span className="live-dot" /> Prévia em tempo real</div></div>
          <div className="side-content">
            {workspaceMode === "Mobiliar" ? <>
              <div className="side-section-title"><span>Mobiliar</span><small>{furnitureCatalog.length.toString().padStart(2, "0")}</small></div>
              <p className="catalog-intro">Peças com medidas padrão. Escolha uma e ajuste diretamente na planta.</p>
              {furnitureInspector}
              <input className="catalog-search" type="search" aria-label="Buscar móveis" placeholder="Buscar móvel" value={furnitureSearch} onChange={(event) => setFurnitureSearch(event.target.value)} />
              <div className="catalog-categories"><button className={furnitureCategory === "Todos" ? "selected" : ""} onClick={() => setFurnitureCategory("Todos")}>Todos</button>{furnitureCategories.map((category) => <button key={category} className={furnitureCategory === category ? "selected" : ""} onClick={() => setFurnitureCategory(category)}>{category}</button>)}</div>
              <div className="catalog-grid">{visibleFurniture.map((item) => <button className="catalog-card" key={item.id} onClick={() => addFurniture(item)}><span className="catalog-image"><img src={furnitureThumbnail(item)} alt="" loading="lazy" /></span><strong>{item.name}</strong><small>{item.width} × {item.depth} cm</small></button>)}</div>
              {visibleFurniture.length === 0 && <p className="side-muted">Nenhum móvel encontrado.</p>}
            </> : <>
            <div className="side-section-title"><span>Cômodos</span><small>{counts.rooms.toString().padStart(2, "0")}</small></div>
            {counts.rooms === 0 ? <p className="side-muted">Os ambientes aparecerão aqui depois de desenhados.</p> : <div className="room-list">{session.home.getRooms().map((room, index) => <div className="room-row" key={room.getId() ?? index}><span className="room-symbol"><House size={16} /></span><span className="room-copy"><strong>{room.getName() || `Cômodo ${index + 1}`}</strong><small>{(room.getArea() / 10000).toFixed(1)} m²</small></span><ArrowUpRight size={15} /></div>)}</div>}
            {selectedLabel && <div className="selection-card"><div><span className="section-eyebrow">SELEÇÃO</span><strong>{selectedLabel}</strong></div><button onClick={() => {
              if (selectedItem instanceof Wall) setDialog({ kind: "wall", controller: new WallController(session.home, session.preferences, {} as never, null) });
              if (selectedItem instanceof Room) setDialog({ kind: "room", controller: new RoomController(session.home, session.preferences, {} as never, null) });
            }}>Editar <ArrowUpRight size={14} /></button></div>}
            {furnitureInspector}
            </>}
          </div>
          <div className="side-foot"><span className="side-foot-icon"><Box size={17} /></span><p>{workspaceMode === "Mobiliar" ? "Modelos livres de Kenney. Arraste o móvel na planta e ajuste suas medidas." : "A estrutura que você desenha aparece automaticamente na vista 3D."}</p></div>
        </aside>
      </main>

      {dialog && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}><div className="dialog-container" role="dialog" aria-modal="true" aria-label={dialog.kind === "wall" ? "Editar parede" : "Editar cômodo"}>{dialog.kind === "wall" ? <WallDialog controller={dialog.controller} preferences={session.preferences} onClose={() => setDialog(null)} /> : <RoomDialog controller={dialog.controller} onClose={() => setDialog(null)} />}</div></div>}
      {libraryMode && <ProjectLibrary mode={libraryMode} projects={libraryProjects} currentId={libraryId} currentName={session.home.getName() || "Projeto sem título"} busy={libraryBusy} onClose={() => setLibraryMode(null)} onOpen={(id) => void openManaged(id)} onSave={(id, name) => {
        if (id && !window.confirm("Substituir este projeto pelo trabalho atual?")) return;
        void saveManaged(id, name);
      }} onDelete={(id) => void deleteManaged(id)} onImport={() => void openFile()} onExport={() => void exportProject()} />}
      {notice && <div className="notice" role="status">{notice}</div>}
      <input ref={fileInput} type="file" accept=".sh3d" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file && (!sessionRef.current.home.isModified() || window.confirm("Abrir outro projeto? Salve as alterações antes de continuar."))) void file.arrayBuffer().then((buffer) => loadBytes(new Uint8Array(buffer))); event.target.value = ""; }} />
    </div>
  );
}
