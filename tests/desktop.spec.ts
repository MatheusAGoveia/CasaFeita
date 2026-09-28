// Copyright (c) 2026 CasaFeita contributors. GPL-2.0-or-later.
import { _electron as electron, expect, test } from "@playwright/test";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

test("abre o editor instalado e conserva uma planta ao salvar e reabrir", async () => {
  const app = await electron.launch({
    executablePath: path.resolve("node_modules/electron/dist/electron.exe"),
    args: [path.resolve("apps/desktop")],
    timeout: 60000,
  });
  try {
    const page = await app.firstWindow();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("dialog", (dialog) => void dialog.accept());
    await expect(page.getByText("CasaFeita", { exact: true })).toBeVisible();
    await expect(page.getByTestId("plan-surface").locator("canvas")).toBeVisible();
    await expect(page.getByText("6 paredes")).toBeVisible();
    await expect(page.getByText("2 cômodos")).toBeVisible();
    const exportPath = path.resolve("test-results", "casa-de-exemplo.sh3d");
    mkdirSync(path.dirname(exportPath), { recursive: true });
    await page.screenshot({ path: "test-results/editor.png" });
    await app.evaluate(({ dialog }, savePath) => {
      dialog.showSaveDialog = () => Promise.resolve({ canceled: false, filePath: savePath });
    }, exportPath);
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Projeto salvo em arquivo editável")).toBeVisible();
    expect(existsSync(exportPath)).toBe(true);

    await page.getByRole("button", { name: "Novo projeto" }).click();
    await expect(page.getByText("0 paredes")).toBeVisible();
    await page.getByRole("button", { name: "Paredes", exact: true }).click();
    const plan = page.getByTestId("plan-surface").locator("canvas");
    const bounds = await plan.boundingBox();
    if (!bounds) throw new Error("A área de desenho não foi montada");
    await plan.click({ position: { x: bounds.width * 0.25, y: bounds.height * 0.35 } });
    await plan.dblclick({ position: { x: bounds.width * 0.45, y: bounds.height * 0.35 } });
    await expect(page.getByText(/[1-9] paredes/)).toBeVisible();
    await app.evaluate(({ dialog }, filePath) => {
      dialog.showOpenDialog = () => Promise.resolve({ canceled: false, filePaths: [filePath] });
    }, exportPath);
    await page.getByRole("button", { name: "Abrir projeto" }).click();
    await expect(page.getByText("6 paredes")).toBeVisible();
    await expect(page.getByText("2 cômodos")).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    await app.close();
  }
});
