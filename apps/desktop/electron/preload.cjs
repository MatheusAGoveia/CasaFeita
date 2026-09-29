// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("casaDesktop", {
  openFile: () => ipcRenderer.invoke("project:open"),
  exportFile: (name, bytes) => ipcRenderer.invoke("project:save", name, Uint8Array.from(bytes)),
  listProjects: () => ipcRenderer.invoke("library:list"),
  openProject: (id) => ipcRenderer.invoke("library:open", id),
  saveProject: (id, name, bytes) => ipcRenderer.invoke("library:save", id, name, Uint8Array.from(bytes)),
  deleteProject: (id) => ipcRenderer.invoke("library:delete", id),
});
