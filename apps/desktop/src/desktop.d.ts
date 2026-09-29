interface DesktopProject {
  name: string;
  bytes: Uint8Array;
}

interface ManagedProject {
  id: string;
  name: string;
  updatedAt: string;
}

interface CasaDesktopBridge {
  openFile(): Promise<DesktopProject | null>;
  exportFile(name: string, bytes: Uint8Array): Promise<boolean>;
  listProjects(): Promise<ManagedProject[]>;
  openProject(id: string): Promise<ManagedProject & DesktopProject>;
  saveProject(id: string | null, name: string, bytes: Uint8Array): Promise<ManagedProject>;
  deleteProject(id: string): Promise<boolean>;
}

interface Window {
  casaDesktop?: CasaDesktopBridge;
}
