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
  PlanController,
  Room,
  RoomController,
  Wall,
  WallController,
} from "@sweethomejs/core";
import { PlanCanvas, RoomDialog, View3DCanvas, WallDialog } from "@sweethomejs/ui";
import "@sweethomejs/ui/theme.css";
import { createSession, createStarterHome, type Session } from "./session";

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
  const [mode, setMode] = useState(session.controller.getPlanController().getMode().toString());
  const [selected, setSelected] = useState(() => session.home.getSelectedItems());
  const [counts, setCounts] = useState(() => ({ rooms: session.home.getRooms().length, walls: session.home.getWalls().length }));
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [threeExpanded, setThreeExpanded] = useState(false);
  const [pillOpen, setPillOpen] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [notice, setNotice] = useState("");
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
    const syncCounts = (): void => setCounts({ rooms: home.getRooms().length, walls: home.getWalls().length });
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
      home.removeSelectionListener(syncSelection);
      controller.removeUndoStateListener(syncUndo);
      plan.removePropertyChangeListener(PlanController.Property.MODE, modeListener);
    };
  }, [session]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const active = document.activeElement;
      const editing = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveProject();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "o") {
        event.preventDefault();
        void openProject();
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

  const replaceHome = (home: Home): void => {
    setDialog(null);
    setThreeExpanded(false);
    setSession(createSession(home));
  };

  const newProject = (): void => {
    if (session.home.isModified() && !window.confirm("Criar outro projeto? Salve as alterações antes de continuar.")) return;
    const home = new Home();
    home.setName("Novo projeto");
    home.setModified(false);
    replaceHome(home);
    setNotice("Projeto em branco criado");
  };

  const loadBytes = async (bytes: Uint8Array): Promise<void> => {
    try {
      const result = await new HomeFileRecorder().readHomeFromZip(bytes);
      replaceHome(result.home);
      setNotice("Projeto aberto");
    } catch (error) {
      setNotice(`Não foi possível abrir o projeto: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const openProject = async (): Promise<void> => {
    if (sessionRef.current.home.isModified() && !window.confirm("Abrir outro projeto? Salve as alterações antes de continuar.")) return;
    if (window.casaDesktop) {
      try {
        const file = await window.casaDesktop.openProject();
        if (file) await loadBytes(Uint8Array.from(file.bytes));
      } catch (error) {
        setNotice(`Não foi possível abrir o projeto: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      fileInput.current?.click();
    }
  };

  const saveProject = async (): Promise<void> => {
    try {
      const home = sessionRef.current.home;
      const bytes = await new HomeFileRecorder().writeHome(home);
      const name = `${home.getName() || "CasaFeita"}.sh3d`;
      if (window.casaDesktop) {
        const saved = await window.casaDesktop.saveProject(name, bytes);
        if (!saved) return;
      } else {
        const url = URL.createObjectURL(new Blob([Uint8Array.from(bytes)], { type: "application/octet-stream" }));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = name;
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      home.setModified(false);
      setNotice("Projeto salvo em arquivo editável");
    } catch (error) {
      setNotice(`Não foi possível salvar: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const selectedItem = selected.length === 1 ? selected[0] : null;
  const selectedLabel = selectedItem instanceof Wall ? "Parede selecionada" : selectedItem instanceof Room ? "Cômodo selecionado" : null;

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
              <DraftingCompass size={17} /><span>Planta</span><ChevronDown size={15} className={pillOpen ? "turned" : ""} />
            </button>
            {pillOpen && <div className="mode-extra">
              <span className="mode-line" />
              <button onClick={() => { setPillOpen(false); setThreeExpanded(true); }}><Box size={17} /><span>Visualizar 3D</span></button>
              <button disabled title="Passeio em desenvolvimento"><span className="mode-symbol">↗</span><span>Passear</span></button>
              <button disabled title="Catálogo de móveis em desenvolvimento"><Shapes size={16} /><span>Mobiliar</span></button>
            </div>}
          </div>
        </div>

        <div className="header-actions">
          <button className="header-icon" title="Novo projeto" aria-label="Novo projeto" onClick={newProject}><Plus size={19} /></button>
          <button className="header-icon" title="Abrir projeto" aria-label="Abrir projeto" onClick={() => void openProject()}><FolderOpen size={19} /></button>
          <button className="save-button" onClick={() => void saveProject()}><Save size={17} /><span>Salvar</span></button>
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
            <PlanCanvas key={session.home.getName() ?? "novo"} home={session.home} preferences={session.preferences} controller={session.controller.getPlanController()} />
            {counts.walls === 0 && <div className="empty-tip"><span className="empty-icon"><DraftingCompass size={24} /></span><strong>Comece pela planta</strong><p>Desenhe as paredes para ver seu espaço ganhar forma.</p><button onClick={() => session.controller.getPlanController().setMode(PlanController.Mode.WALL_CREATION)}>Desenhar paredes <ArrowUpRight size={16} /></button></div>}
          </div>
          <div className="canvas-footer"><span className="grid-dot" />Escala em centímetros <span className="footer-sep">·</span> {counts.walls} paredes <span className="footer-sep">·</span> {counts.rooms} cômodos <span className="footer-push" /> Ferramenta: {tools.find((item) => item.mode.toString() === mode)?.label ?? "Selecionar"}</div>
        </section>

        <aside className={`side-panel ${threeExpanded ? "expanded" : ""}`}>
          <div className="side-heading"><div><span className="section-eyebrow">VISUALIZAÇÃO</span><strong>Seu projeto em 3D</strong></div><button className="expand-button" title={threeExpanded ? "Reduzir 3D" : "Ampliar 3D"} aria-label={threeExpanded ? "Reduzir 3D" : "Ampliar 3D"} onClick={() => setThreeExpanded(!threeExpanded)}>{threeExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button></div>
          <div className="three-view" data-testid="three-view"><View3DCanvas home={session.home} preferences={session.preferences} homeController3D={session.controller.getHomeController3D()} style="design" /><div className="three-label"><span className="live-dot" /> Prévia em tempo real</div></div>
          <div className="side-content">
            <div className="side-section-title"><span>Cômodos</span><small>{counts.rooms.toString().padStart(2, "0")}</small></div>
            {counts.rooms === 0 ? <p className="side-muted">Os ambientes aparecerão aqui depois de desenhados.</p> : <div className="room-list">{session.home.getRooms().map((room, index) => <div className="room-row" key={room.getId() ?? index}><span className="room-symbol"><House size={16} /></span><span className="room-copy"><strong>{room.getName() || `Cômodo ${index + 1}`}</strong><small>{(room.getArea() / 10000).toFixed(1)} m²</small></span><ArrowUpRight size={15} /></div>)}</div>}
            {selectedLabel && <div className="selection-card"><div><span className="section-eyebrow">SELEÇÃO</span><strong>{selectedLabel}</strong></div><button onClick={() => {
              if (selectedItem instanceof Wall) setDialog({ kind: "wall", controller: new WallController(session.home, session.preferences, {} as never, null) });
              if (selectedItem instanceof Room) setDialog({ kind: "room", controller: new RoomController(session.home, session.preferences, {} as never, null) });
            }}>Editar <ArrowUpRight size={14} /></button></div>}
          </div>
          <div className="side-foot"><span className="side-foot-icon"><Box size={17} /></span><p>A estrutura que você desenha aparece automaticamente na vista 3D.</p></div>
        </aside>
      </main>

      {dialog && <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}><div className="dialog-container" role="dialog" aria-modal="true" aria-label={dialog.kind === "wall" ? "Editar parede" : "Editar cômodo"}>{dialog.kind === "wall" ? <WallDialog controller={dialog.controller} preferences={session.preferences} onClose={() => setDialog(null)} /> : <RoomDialog controller={dialog.controller} onClose={() => setDialog(null)} />}</div></div>}
      {notice && <div className="notice" role="status">{notice}</div>}
      <input ref={fileInput} type="file" accept=".sh3d" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void file.arrayBuffer().then((buffer) => loadBytes(new Uint8Array(buffer))); event.target.value = ""; }} />
    </div>
  );
}
