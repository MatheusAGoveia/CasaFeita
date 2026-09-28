// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("casaDesktop", {
  openProject: () => ipcRenderer.invoke("project:open"),
  saveProject: (name, bytes) => ipcRenderer.invoke("project:save", name, Array.from(bytes)),
});
