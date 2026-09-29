// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
import { useState } from "react";
import { Download, FolderOpen, Plus, Trash2, X } from "lucide-react";

interface ProjectLibraryProps {
  mode: "browse" | "save";
  projects: ManagedProject[];
  currentId: string | null;
  currentName: string;
  busy: boolean;
  onClose(): void;
  onOpen(id: string): void;
  onSave(id: string | null, name: string): void;
  onDelete(id: string): void;
  onImport(): void;
  onExport(): void;
}

export function ProjectLibrary(props: ProjectLibraryProps): React.JSX.Element {
  const [name, setName] = useState(props.currentName);
  const saving = props.mode === "save";

  return <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) props.onClose(); }}>
    <section className="library-dialog" role="dialog" aria-modal="true" aria-label={saving ? "Salvar projeto" : "Meus projetos"}>
      <div className="library-heading"><div><span className="section-eyebrow">CASAFEITA</span><h2>{saving ? "Salvar projeto" : "Meus projetos"}</h2><p>Até três projetos no aplicativo, guardados neste perfil do Windows.</p></div><button className="library-close" aria-label="Fechar" onClick={props.onClose}><X size={18} /></button></div>
      {saving && <div className="library-save-form"><label htmlFor="project-name">Nome do projeto</label><div><input id="project-name" aria-label="Nome do projeto" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} /><button disabled={props.busy || props.projects.length >= 3 || !name.trim()} onClick={() => props.onSave(null, name)}><Plus size={15} /> Salvar novo</button></div>{props.projects.length >= 3 && <p>Os três espaços estão ocupados. Escolha um para substituir ou exclua um projeto.</p>}</div>}
      <div className="library-list-heading"><strong>Biblioteca</strong><small>{props.projects.length}/3</small></div>
      <div className="library-projects">
        {props.projects.length === 0 && <p className="library-empty">Nenhum projeto salvo aqui ainda.</p>}
        {props.projects.map((project) => <div className="library-project" key={project.id}><span className="library-project-icon"><FolderOpen size={18} /></span><div className="library-project-copy"><strong>{project.name}{project.id === props.currentId ? " · atual" : ""}</strong><small>Atualizado em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(project.updatedAt))}</small></div><button className="library-project-action" disabled={props.busy || !name.trim()} onClick={() => saving ? props.onSave(project.id, name) : props.onOpen(project.id)}>{saving ? "Substituir" : "Abrir"}</button><button className="library-delete" aria-label={`Excluir ${project.name}`} title="Excluir projeto" disabled={props.busy} onClick={() => props.onDelete(project.id)}><Trash2 size={15} /></button></div>)}
      </div>
      <div className="library-footer"><button onClick={props.onImport} disabled={props.busy}><FolderOpen size={16} /> Importar .sh3d</button><button onClick={props.onExport} disabled={props.busy}><Download size={16} /> Exportar .sh3d</button></div>
    </section>
  </div>;
}
