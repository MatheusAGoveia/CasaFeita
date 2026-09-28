// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
const { app, BrowserWindow, dialog, ipcMain, net, protocol } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

protocol.registerSchemesAsPrivileged([
  { scheme: "casafeita", privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

let mainWindow;

function assertMainWindow(event) {
  if (!mainWindow || event.sender !== mainWindow.webContents) {
    throw new Error("Origem da operação não autorizada");
  }
}

function registerLocalProtocol() {
  const distRoot = path.resolve(__dirname, "../dist");
  protocol.handle("casafeita", (request) => {
    const url = new URL(request.url);
    const requested = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
    const filePath = path.resolve(distRoot, requested);
    const relative = path.relative(distRoot, filePath);
    if (url.host !== "app" || relative.startsWith("..") || path.isAbsolute(relative)) {
      return new Response("Arquivo não encontrado", { status: 404 });
    }
    return net.fetch(pathToFileURL(filePath).toString());
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1050,
    minHeight: 680,
    title: "CasaFeita",
    backgroundColor: "#f7f6f2",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event, destination) => {
    if (!destination.startsWith("casafeita://app/")) event.preventDefault();
  });
  void mainWindow.loadURL("casafeita://app/index.html");
}

app.whenReady().then(() => {
  registerLocalProtocol();

  ipcMain.handle("project:open", async (event) => {
    assertMainWindow(event);
    const chosen = await dialog.showOpenDialog(mainWindow, {
      title: "Abrir projeto",
      properties: ["openFile"],
      filters: [{ name: "Projeto editável", extensions: ["sh3d"] }],
    });
    if (chosen.canceled || chosen.filePaths.length === 0) return null;
    const filePath = chosen.filePaths[0];
    const stat = await fs.stat(filePath);
    if (stat.size > 200 * 1024 * 1024) throw new Error("Arquivo maior que 200 MB");
    const bytes = await fs.readFile(filePath);
    return { name: path.basename(filePath), bytes: Array.from(bytes) };
  });

  ipcMain.handle("project:save", async (event, suggestedName, data) => {
    assertMainWindow(event);
    if (typeof suggestedName !== "string" || !Array.isArray(data) || data.length > 200 * 1024 * 1024) {
      throw new Error("Projeto inválido");
    }
    const bytes = Uint8Array.from(data);
    const defaultName = (path.basename(suggestedName).replace(/[^\p{L}\p{N} _.-]/gu, "") || "CasaFeita")
      .replace(/\.sh3d$/i, "") + ".sh3d";
    const chosen = await dialog.showSaveDialog(mainWindow, {
      title: "Salvar projeto",
      defaultPath: defaultName,
      filters: [{ name: "Projeto editável", extensions: ["sh3d"] }],
    });
    if (chosen.canceled || !chosen.filePath) return false;
    await fs.writeFile(chosen.filePath, bytes);
    return true;
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => app.quit());
