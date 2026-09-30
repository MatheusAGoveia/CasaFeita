// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
import { _electron as electron, expect, test } from "@playwright/test";
import path from "node:path";

test("falha ao atualizar listagem não transforma gravação concluída em erro", async () => {
  const app = await electron.launch({
    executablePath: path.resolve("node_modules/electron/dist/electron.exe"),
    args: [path.resolve("apps/desktop")],
    env: { ...process.env, CASAFEITA_TEST_USER_DATA: path.resolve("test-results", "save-recovery-profile") },
  });
  try {
    const page = await app.firstWindow();
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Salvar projeto" })).toBeVisible();
    await app.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler("library:list");
      ipcMain.handle("library:list", () => { throw new Error("falha simulada ao listar"); });
    });
    await page.getByRole("button", { name: "Salvar novo" }).click();
    await expect(page.getByText("Projeto salvo na biblioteca local")).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Salvar projeto" })).toBeHidden();
  } finally {
    await app.close();
  }
});
