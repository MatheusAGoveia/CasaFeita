interface DesktopProject {
  name: string;
  bytes: number[];
}

interface CasaDesktopBridge {
  openProject(): Promise<DesktopProject | null>;
  saveProject(name: string, bytes: Uint8Array): Promise<boolean>;
}

interface Window {
  casaDesktop?: CasaDesktopBridge;
}
